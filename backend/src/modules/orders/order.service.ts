import { OrderStatus } from '@prisma/client';
import { orderRepository } from './order.repository';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../utils/logger';
import { whatsappService } from '../notifications/whatsapp.service';
import { emailService } from '../notifications/email.service';
import { CreateOrderInput, ListOrdersQuery } from './order.validators';

export const orderService = {
  async create(input: CreateOrderInput) {
    const order = await orderRepository.createOrder(input);

    logger.info('Order created', {
      orderId: order.id,
      orderCode: order.orderCode,
      paymentMethod: order.paymentMethod,
      total: order.total.toString(),
    });
    if (order.depositAmount) {
      logger.info('Deposit payment submitted, pending admin verification', {
        orderId: order.id,
        orderCode: order.orderCode,
        depositAmount: order.depositAmount.toString(),
      });
    }

    // Fire-and-forget: notifications must never delay the HTTP response or
    // fail the order that was already committed to the DB.
    whatsappService.notifyNewOrder(order).catch((err) => {
      logger.error('Unexpected error while sending WhatsApp notifications', err);
    });
    emailService.notifyNewOrder(order).catch((err) => {
      logger.error('Unexpected error while sending email notification', err);
    });

    return order;
  },

  async getByCode(orderCode: string) {
    const order = await orderRepository.findByCode(orderCode);
    if (!order) throw ApiError.notFound('لم يتم العثور على الطلب');
    return order;
  },

  // ---- Admin ----

  async listAdmin(query: ListOrdersQuery) {
    return orderRepository.findManyAdmin(query);
  },

  async getByIdAdmin(id: number) {
    const order = await orderRepository.findByIdAdmin(id);
    if (!order) throw ApiError.notFound('الطلب غير موجود');
    return order;
  },

  async updateStatus(id: number, status: OrderStatus) {
    await this.getByIdAdmin(id);

    // Cancelling restores stock atomically; other transitions are a plain status update
    if (status === 'CANCELLED') {
      return orderRepository.restoreStockForCancelledOrder(id);
    }

    const order = await orderRepository.updateStatus(id, status);

    if (status === 'CONFIRMED') {
      // Fire-and-forget: notification failure must never fail the status
      // update that already committed to the DB.
      whatsappService.notifyOrderConfirmed(order).catch((err) => {
        logger.error('Unexpected error while sending order-confirmed WhatsApp notification', err);
      });
    }

    return order;
  },

  /** Admin confirms the customer's Orange Money 20% deposit was received. */
  async verifyDeposit(id: number, adminId: number | undefined) {
    const order = await orderRepository.verifyDeposit(id, adminId);
    logger.info('Admin confirmed deposit payment', {
      orderId: order.id,
      orderCode: order.orderCode,
      adminId,
    });
    return order;
  },
};
