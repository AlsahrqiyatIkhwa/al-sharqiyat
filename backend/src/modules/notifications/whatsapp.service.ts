import axios from 'axios';
import { Order, OrderItem } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { GOVERNORATE_LABELS_AR } from '../../constants/governorates';

type OrderWithItems = Order & { items: OrderItem[] };

const PAYMENT_LABEL: Record<string, string> = {
  COD: 'الدفع عند الاستلام',
  ORANGE_MONEY: 'أورنج موني - دفع كامل',
  MANUAL_TRANSFER: 'تحويل يدوي (ويسترن يونيون / بنكي)',
};

/** Orange Money transfer details the customer entered (full payment for ORANGE_MONEY only — COD no longer has a deposit). */
function transferInfoLines(order: OrderWithItems): string[] {
  if (!order.depositPhoneNumber && !order.depositTransactionRef) return [];
  return [
    `💰 معلومات التحويل:`,
    order.depositPhoneNumber ? `   رقم هاتف أورنج موني: ${order.depositPhoneNumber}` : null,
    order.depositTransactionRef ? `   رقم مرجع العملية: ${order.depositTransactionRef}` : null,
  ].filter((line): line is string => line !== null);
}

function fullAddress(order: OrderWithItems): string {
  const parts = [
    GOVERNORATE_LABELS_AR[order.governorate],
    order.area,
    order.street,
    `مبنى/شقة ${order.buildingNumber}`,
    order.landmark ? `(بالقرب من ${order.landmark})` : null,
  ].filter(Boolean);
  return parts.join('، ');
}

function trackingLink(order: Pick<Order, 'orderCode'>): string {
  return `${env.clientUrl}/track?code=${encodeURIComponent(order.orderCode)}`;
}

function adminOrderLink(order: OrderWithItems): string {
  return `${env.adminPanelUrl}/orders?highlight=${order.id}`;
}

/** Converts a stored Jordanian local number (07XXXXXXXX) to E.164 digits (9627XXXXXXXX) for the WhatsApp API. */
export function toJordanE164(localPhone: string): string {
  const digits = localPhone.replace(/\D/g, '');
  return digits.startsWith('0') ? `962${digits.slice(1)}` : digits;
}

function buildOrderConfirmedMessage(order: Pick<Order, 'orderCode' | 'firstName'>): string {
  return [
    `مرحباً ${order.firstName} 🌙`,
    `تم تأكيد وقبول طلبك رقم ${order.orderCode} من متجر شرقيات الإخوة ✅`,
    `سنتواصل معك قريباً لتنسيق التوصيل.`,
    ``,
    `تابعي حالة طلبك من هنا:`,
    trackingLink(order),
  ].join('\n');
}

function buildClientMessage(order: OrderWithItems): string {
  const itemsLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} — ${item.size}/${item.colorName} × ${item.quantity}`
    )
    .join('\n');

  return [
    `مرحباً ${order.firstName} 🌙`,
    `تم استلام طلبك من متجر شرقيات الإخوة بنجاح!`,
    ``,
    `🔖 رقم التتبع: ${order.orderCode}`,
    `👤 الاسم: ${order.firstName} ${order.lastName}`,
    `📱 الهاتف: ${order.customerPhone}`,
    `📦 المنتجات:`,
    itemsLines,
    ``,
    `💰 الإجمالي الكلي: ${order.total} د.أ`,
    `📍 عنوان التوصيل: ${fullAddress(order)}`,
    order.notes ? `📝 ملاحظات: ${order.notes}` : null,
    `💳 طريقة الدفع: ${PAYMENT_LABEL[order.paymentMethod]}`,
    ...transferInfoLines(order),
    ``,
    `تابعي حالة طلبك في أي وقت من هنا:`,
    trackingLink(order),
    ``,
    `يرجى الرد على هذه الرسالة لتأكيد الطلب، وسنتواصل معك قريباً لتنسيق التوصيل 🙏`,
    `📎 الرجاء إرفاق صورة الإيصال (Receipt) هنا في هذه المحادثة لتأكيد طلبك بنجاح.`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

function buildAdminMessage(order: OrderWithItems): string {
  const itemsLines = order.items
    .map((item, idx) => `${idx + 1}. ${item.productName} × ${item.quantity} = ${item.lineTotal} د.أ`)
    .join('\n');

  return [
    `🛎️ طلب جديد من الأردن — شرقيات الإخوة`,
    ``,
    `🔖 رقم التتبع: ${order.orderCode}`,
    `👤 العميل: ${order.firstName} ${order.lastName}`,
    `📱 الهاتف: ${order.customerPhone}`,
    `📍 المحافظة: ${GOVERNORATE_LABELS_AR[order.governorate]}`,
    `🏠 العنوان الكامل: ${fullAddress(order)}`,
    order.notes ? `📝 ملاحظات: ${order.notes}` : null,
    `💳 الدفع: ${PAYMENT_LABEL[order.paymentMethod]}`,
    ...transferInfoLines(order),
    ``,
    `🛍️ المنتجات:`,
    itemsLines,
    ``,
    `💰 الإجمالي: ${order.total} د.أ`,
    ``,
    `افتحي الطلب في لوحة التحكم:`,
    adminOrderLink(order),
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

async function sendTextMessage(toE164Digits: string, body: string, label: string): Promise<void> {
  const { apiToken, phoneNumberId, apiVersion } = env.whatsapp;

  // Dry-run fallback: no credentials configured (e.g. local dev) — log only,
  // never throw, so a missing WhatsApp integration can never break checkout.
  if (!apiToken || !phoneNumberId) {
    logger.info(`[WhatsApp:DRY-RUN] Would send "${label}" to ${toE164Digits}:\n${body}`);
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toE164Digits,
        type: 'text',
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );
    logger.info(`[WhatsApp] "${label}" sent to ${toE164Digits}`);
  } catch (err) {
    // Never let a WhatsApp/network failure fail the surrounding order flow —
    // just log it loudly so it shows up in monitoring/alerts.
    logger.error(`[WhatsApp] Failed to send "${label}" to ${toE164Digits}`, err);
  }
}

export const whatsappService = {
  /**
   * Fires the admin/store-owner WhatsApp alert for a freshly created order.
   *
   * The customer is NOT messaged here on order creation — only once the
   * admin actually confirms the order (see notifyOrderConfirmed below).
   * See also notifications/email.service.ts, which emails the admin the
   * same new-order alert as a second channel.
   */
  async notifyNewOrder(order: OrderWithItems): Promise<void> {
    const adminE164 = env.adminWhatsappNumber.replace(/\D/g, '');

    if (!adminE164) {
      logger.warn('[WhatsApp] ADMIN_WHATSAPP_NUMBER is not set — skipping admin alert');
      return;
    }
    await sendTextMessage(adminE164, buildAdminMessage(order), 'admin-new-order-alert');
  },

  /**
   * Sends the customer a WhatsApp message once the admin accepts/confirms
   * their order (status -> CONFIRMED). This is the automated "order
   * accepted" notice — separate from notifyNewOrder above, which only
   * alerts the store admin when the order first comes in.
   */
  async notifyOrderConfirmed(order: Pick<Order, 'orderCode' | 'firstName' | 'customerPhone'>): Promise<void> {
    const customerE164 = toJordanE164(order.customerPhone);
    await sendTextMessage(customerE164, buildOrderConfirmedMessage(order), 'customer-order-confirmed');
  },
};
