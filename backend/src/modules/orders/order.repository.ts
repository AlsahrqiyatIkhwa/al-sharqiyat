import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { generateNextOrderCode } from './orderCode.util';
import { CreateOrderInput, ListOrdersQuery } from './order.validators';

const orderInclude = { items: true };

// Cash-on-delivery no longer requires an upfront deposit — the customer
// pays the full amount in cash on delivery. Paying the FULL amount via
// Orange Money (paymentMethod ORANGE_MONEY) remains a separate, non-deposit
// flow — the customer transfers the whole total and an admin manually
// confirms the order after verifying the transfer.
const DEPOSIT_REQUIRED_METHODS = new Set<string>([]);

export const orderRepository = {
  /**
   * Creates an order atomically:
   *  1. Loads all requested variants + their product + governorate shipping fee
   *  2. Validates stock availability for every line
   *  3. Decrements stock conditionally (stockQuantity >= quantity) to guard
   *     against race conditions from concurrent checkouts
   *  4. Generates the sequential SHRQ-YYYYMM-XXXX tracking code
   *  5. Persists the order + order_items snapshot
   *
   * The whole flow runs inside a single Prisma interactive transaction —
   * if ANY step fails (e.g. insufficient stock on item #3), everything
   * rolls back and no partial order/stock-decrement is left behind.
   */
  async createOrder(input: CreateOrderInput) {
    return prisma.$transaction(async (tx) => {
      const zone = await tx.shippingZone.findUnique({
        where: { governorate: input.governorate },
      });
      if (!zone) throw ApiError.badRequest('المحافظة المختارة غير مدعومة للشحن حالياً');

      const variantIds = input.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      if (variants.length !== variantIds.length) {
        throw ApiError.badRequest('أحد المنتجات المختارة لم يعد متوفراً');
      }

      let subtotal = new Prisma.Decimal(0);
      const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const requested of input.items) {
        const variant = variants.find((v) => v.id === requested.variantId)!;

        if (!variant.product.isActive) {
          throw ApiError.badRequest(`المنتج "${variant.product.nameAr}" لم يعد متاحاً`);
        }
        if (variant.stockQuantity < requested.quantity) {
          throw ApiError.conflict(
            `الكمية المطلوبة من "${variant.product.nameAr}" (${variant.size}/${variant.colorName}) غير متوفرة حالياً. المتبقي: ${variant.stockQuantity}`
          );
        }

        // Conditional decrement — atomically fails if stock changed concurrently
        const updateResult = await tx.productVariant.updateMany({
          where: { id: variant.id, stockQuantity: { gte: requested.quantity } },
          data: { stockQuantity: { decrement: requested.quantity } },
        });
        if (updateResult.count === 0) {
          throw ApiError.conflict(
            `تعذر حجز الكمية من "${variant.product.nameAr}" — تم شراؤها للتو من عميل آخر`
          );
        }

        // Precedence: an explicit per-variant priceOverride is the most
        // specific price and always wins; otherwise a product-level sale
        // price applies; otherwise the regular base price.
        const unitPrice =
          variant.priceOverride ?? variant.product.discountPrice ?? variant.product.basePrice;
        const lineTotal = unitPrice.mul(requested.quantity);
        subtotal = subtotal.add(lineTotal);

        orderItemsData.push({
          variantId: variant.id,
          productName: variant.product.nameAr,
          size: variant.size,
          colorName: variant.colorName,
          quantity: requested.quantity,
          unitPrice,
          lineTotal,
        });
      }

      const total = subtotal.add(zone.shippingFee);
      const orderCode = await generateNextOrderCode(tx);

      const requiresDeposit = DEPOSIT_REQUIRED_METHODS.has(input.paymentMethod);
      const depositAmount = requiresDeposit
        ? total.mul(env.orangeMoney.depositRate).toDecimalPlaces(2)
        : null;

      const order = await tx.order.create({
        data: {
          orderCode,
          firstName: input.firstName,
          lastName: input.lastName,
          customerPhone: input.customerPhone,
          governorate: input.governorate,
          area: input.area,
          street: input.street,
          buildingNumber: input.buildingNumber,
          landmark: input.landmark || null,
          subtotal,
          shippingFee: zone.shippingFee,
          total,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          // Deposit stays PENDING until an admin manually verifies the
          // Orange Money transaction — see orderService.verifyDeposit
          paymentStatus: 'PENDING',
          depositAmount,
          depositTransactionRef: requiresDeposit ? input.depositTransactionRef || null : null,
          depositPhoneNumber: requiresDeposit ? input.depositPhoneNumber || null : null,
          items: { createMany: { data: orderItemsData } },
        },
        include: orderInclude,
      });

      return order;
    });
  },

  async findByCode(orderCode: string) {
    return prisma.order.findUnique({ where: { orderCode }, include: orderInclude });
  },

  // ---- Admin ----

  async findByIdAdmin(id: number) {
    return prisma.order.findUnique({ where: { id }, include: orderInclude });
  },

  async findManyAdmin(query: ListOrdersQuery) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.governorate ? { governorate: query.governorate } : {}),
      ...(query.search
        ? {
            OR: [
              { orderCode: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { customerPhone: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page: query.page, limit: query.limit };
  },

  async updateStatus(id: number, status: OrderStatus) {
    return prisma.order.update({ where: { id }, data: { status } });
  },

  /**
   * Admin manually confirms an Orange Money deposit was received.
   * Marks payment as DEPOSIT_PAID and, if the order is still PENDING,
   * automatically advances it to PROCESSING — matching the required flow:
   * deposit verified → order moves into processing.
   */
  async verifyDeposit(id: number, adminId: number | undefined) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw ApiError.notFound('الطلب غير موجود');
    if (!order.depositAmount) {
      throw ApiError.badRequest('هذا الطلب لا يتطلب دفعة مقدمة عبر أورنج موني');
    }
    if (order.paymentStatus === 'DEPOSIT_PAID' || order.paymentStatus === 'FULLY_PAID') {
      throw ApiError.conflict('تم التحقق من هذه الدفعة مسبقاً');
    }

    return prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'DEPOSIT_PAID' as PaymentStatus,
        depositVerifiedAt: new Date(),
        depositVerifiedByAdminId: adminId ?? null,
        status: order.status === 'PENDING' ? 'PROCESSING' : order.status,
      },
      include: orderInclude,
    });
  },

  /** Restores stock when an order is cancelled by admin */
  async restoreStockForCancelledOrder(orderId: number) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
      if (!order) throw ApiError.notFound('الطلب غير موجود');
      if (order.status === 'CANCELLED') return order; // already restored, avoid double-credit

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      return tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
    });
  },
};
