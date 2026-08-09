import { Order } from '@/types';
import { GOVERNORATE_LABELS } from './governorates';

/**
 * Builds a pre-filled wa.me link with a formatted, easy-to-read order
 * summary so the customer can confirm their order with the admin in one tap.
 * This is a client-side backup/confirmation channel — the backend also
 * fires an automated WhatsApp message to both the customer and the admin
 * the moment the order is created (see backend whatsapp.service.ts).
 */
export function buildWhatsAppConfirmationLink(order: Order): string {
  const adminNumber = (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '').replace(/\D/g, '');

  const itemsLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} — ${item.size} / ${item.colorName} × ${item.quantity} = ${item.lineTotal} د.أ`
    )
    .join('\n');

  const paymentLabel =
    order.paymentMethod === 'COD'
      ? 'الدفع عند الاستلام'
      : order.paymentMethod === 'ORANGE_MONEY'
        ? 'أورنج موني - دفع كامل'
        : 'تحويل يدوي (ويسترن يونيون)';

  const addressLine = [
    order.area,
    order.street,
    `مبنى/شقة ${order.buildingNumber}`,
    order.landmark ? `(بالقرب من ${order.landmark})` : null,
  ]
    .filter(Boolean)
    .join('، ');

  // Orange Money transfer details the customer entered in the payment form
  // (used only for the ORANGE_MONEY full-payment method).
  const transferLines: (string | null)[] =
    order.depositPhoneNumber || order.depositTransactionRef
      ? [
          `💰 معلومات التحويل:`,
          order.depositPhoneNumber ? `   رقم هاتف أورنج موني: ${order.depositPhoneNumber}` : null,
          order.depositTransactionRef ? `   رقم مرجع العملية: ${order.depositTransactionRef}` : null,
        ]
      : [];

  const message = [
    `مرحباً، أود تأكيد طلبي من متجر شرقيات الإخوة 🌙`,
    ``,
    `🔖 رقم الطلب: ${order.orderCode}`,
    `👤 الاسم: ${order.firstName} ${order.lastName}`,
    `📱 الهاتف: ${order.customerPhone}`,
    `📍 المحافظة: ${GOVERNORATE_LABELS[order.governorate]}`,
    `🏠 العنوان: ${addressLine}`,
    order.notes ? `📝 ملاحظات: ${order.notes}` : null,
    `💳 طريقة الدفع: ${paymentLabel}`,
    ...transferLines,
    ``,
    `🛍️ تفاصيل الطلب:`,
    itemsLines,
    ``,
    `المجموع الفرعي: ${order.subtotal} د.أ`,
    `رسوم الشحن: ${order.shippingFee} د.أ`,
    `الإجمالي الكلي: ${order.total} د.أ`,
    ``,
    `يرجى تأكيد الطلب. شكراً لكم 🙏`,
    `📎 الرجاء إرفاق صورة الإيصال (Receipt) هنا في هذه المحادثة لتأكيد طلبك بنجاح.`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${adminNumber}?text=${encoded}`;
}
