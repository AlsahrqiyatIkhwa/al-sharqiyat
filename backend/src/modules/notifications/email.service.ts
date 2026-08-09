import nodemailer from 'nodemailer';
import { Order, OrderItem } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { GOVERNORATE_LABELS_AR } from '../../constants/governorates';

type OrderWithItems = Order & { items: OrderItem[] };

const DEPOSIT_PERCENT = Math.round(env.orangeMoney.depositRate * 100);

const PAYMENT_LABEL: Record<string, string> = {
  COD: 'الدفع عند الاستلام',
  ORANGE_MONEY: 'تحويل كامل عبر أورنج موني',
  MANUAL_TRANSFER: 'تحويل يدوي (ويسترن يونيون / بنكي)',
};

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

function adminOrderLink(order: OrderWithItems): string {
  return `${env.adminPanelUrl}/orders?highlight=${order.id}`;
}

function buildEmailHtml(order: OrderWithItems): string {
  const itemsRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.productName}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.size} / ${item.colorName}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.quantity}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${item.lineTotal} د.أ</td>
        </tr>`
    )
    .join('');

  const depositRow = order.depositAmount
    ? `<tr><td style="padding:6px 10px;font-weight:bold;">العربون المطلوب (${DEPOSIT_PERCENT}%)</td><td style="padding:6px 10px;">${order.depositAmount} د.أ</td></tr>
       <tr><td style="padding:6px 10px;">رقم مرجع تحويل أورنج موني</td><td style="padding:6px 10px;">${order.depositTransactionRef ?? '—'}</td></tr>
       <tr><td style="padding:6px 10px;">رقم هاتف أورنج موني للمُرسل</td><td style="padding:6px 10px;">${order.depositPhoneNumber ?? '—'}</td></tr>`
    : '';

  return `
  <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:640px;margin:auto;color:#1a1a1a;">
    <h2 style="color:#8a6d3b;">🛎️ طلب جديد — شرقيات الإخوة</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr><td style="padding:6px 10px;font-weight:bold;">رقم التتبع</td><td style="padding:6px 10px;">${order.orderCode}</td></tr>
      <tr><td style="padding:6px 10px;font-weight:bold;">اسم العميل</td><td style="padding:6px 10px;">${order.firstName} ${order.lastName}</td></tr>
      <tr><td style="padding:6px 10px;font-weight:bold;">رقم الهاتف</td><td style="padding:6px 10px;">${order.customerPhone}</td></tr>
      <tr><td style="padding:6px 10px;font-weight:bold;">العنوان الكامل</td><td style="padding:6px 10px;">${fullAddress(order)}</td></tr>
      <tr><td style="padding:6px 10px;font-weight:bold;">طريقة الدفع</td><td style="padding:6px 10px;">${PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</td></tr>
      ${depositRow}
      <tr><td style="padding:6px 10px;font-weight:bold;">ملاحظات العميل</td><td style="padding:6px 10px;">${order.notes ?? '—'}</td></tr>
    </table>

    <h3>المنتجات المطلوبة</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#f5f0e6;">
          <th style="padding:6px 10px;text-align:right;">المنتج</th>
          <th style="padding:6px 10px;text-align:right;">المقاس/اللون</th>
          <th style="padding:6px 10px;text-align:right;">الكمية</th>
          <th style="padding:6px 10px;text-align:right;">السعر</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <p style="font-weight:bold;font-size:16px;">💰 الإجمالي الكلي: ${order.total} د.أ</p>

    <p>
      <a href="${adminOrderLink(order)}" style="display:inline-block;padding:10px 18px;background:#8a6d3b;color:#fff;text-decoration:none;border-radius:6px;">
        فتح الطلب في لوحة التحكم
      </a>
    </p>
  </div>`;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpPort === 465,
    auth: { user: env.email.smtpUser, pass: env.email.smtpPass },
  });
  return transporter;
}

export const emailService = {
  /**
   * Emails the shop's inbox (ADMIN_NOTIFICATION_EMAIL, defaults to
   * alsharqiyat.erbed@gmail.com) with the full details of a freshly placed
   * order — a second, independent channel alongside the WhatsApp admin
   * alert. Falls back to a dry-run log when SMTP isn't configured, so a
   * missing/misconfigured mailbox can never break checkout.
   */
  async notifyNewOrder(order: OrderWithItems): Promise<void> {
    const { smtpHost, smtpUser, smtpPass, adminNotificationEmail } = env.email;
    const subject = `طلب جديد #${order.orderCode} — ${order.firstName} ${order.lastName}`;
    const html = buildEmailHtml(order);

    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.info(
        `[Email:DRY-RUN] Would send "${subject}" to ${adminNotificationEmail}. Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to actually send it.`
      );
      return;
    }

    try {
      await getTransporter().sendMail({
        from: `"شرقيات الإخوة" <${smtpUser}>`,
        to: adminNotificationEmail,
        subject,
        html,
      });
      logger.info(`[Email] New-order alert sent to ${adminNotificationEmail}`, {
        orderCode: order.orderCode,
      });
    } catch (err) {
      // Never let an email failure fail the surrounding order flow — the
      // order is already committed to the DB and the WhatsApp alert is a
      // second channel. Just log it loudly so it shows up in monitoring.
      logger.error(`[Email] Failed to send new-order alert to ${adminNotificationEmail}`, err);
    }
  },
};
