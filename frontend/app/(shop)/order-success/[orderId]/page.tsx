import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { WhatsAppButton } from '@/components/checkout/WhatsAppButton';
import { PaymentInstructions } from '@/components/checkout/PaymentInstructions';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatJOD, formatShippingFee } from '@/lib/utils';
import { GOVERNORATE_LABELS } from '@/lib/governorates';

async function getOrder(orderCode: string): Promise<Order | null> {
  try {
    const res = await api.get(`/orders/${orderCode}`);
    return res.data.order;
  } catch {
    return null;
  }
}

export default async function OrderSuccessPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await getOrder(params.orderId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="font-cairo text-2xl font-bold text-ink-900">تم استلام طلبك بنجاح!</h1>
        <p className="text-sm text-ink-900/60">
          رقم الطلب: <span className="font-bold text-ink-900">{order.orderCode}</span>
        </p>
        <StatusBadge status={order.status} />
      </div>

      <div className="card-surface space-y-4 p-6">
        <div className="space-y-2 border-b border-ink-900/10 pb-4 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-ink-900/70">
              <span>
                {item.productName} ({item.colorName} / {item.size}) × {item.quantity}
              </span>
              <span className="font-semibold text-ink-900">{formatJOD(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-900/60">
            <span>المجموع الفرعي</span>
            <span>{formatJOD(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-900/60">
            <span>الشحن ({GOVERNORATE_LABELS[order.governorate]})</span>
            <span>{formatShippingFee(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-900/10 pt-2 font-cairo text-base font-bold text-ink-900">
            <span>الإجمالي</span>
            <span>{formatJOD(order.total)}</span>
          </div>
        </div>
      </div>

      {order.paymentMethod === 'MANUAL_TRANSFER' && (
        <PaymentInstructions orderCode={order.orderCode} />
      )}

      {order.depositAmount && (
        <div className="card-surface space-y-2 p-6">
          <h3 className="font-cairo text-base font-bold text-ink-900">الدفعة المقدمة (20%)</h3>
          <p className="text-sm text-ink-900/70">
            المبلغ: <span className="font-semibold text-ink-900">{formatJOD(order.depositAmount)}</span>
          </p>
          <p className="text-xs text-ink-900/50">
            {order.paymentStatus === 'PENDING'
              ? 'استلمنا بيانات التحويل وسيتم التحقق منها يدوياً خلال وقت قصير.'
              : 'تم التحقق من الدفعة المقدمة، جاري تجهيز طلبك.'}
          </p>
        </div>
      )}

      <div className="card-surface space-y-3 p-6 text-center">
        <p className="text-sm font-semibold text-ink-900">
          الخطوة الأخيرة: أكدي طلبك عبر واتساب
        </p>
        <p className="text-xs text-ink-900/50">
          {order.paymentMethod === 'MANUAL_TRANSFER'
            ? 'أرسلي إيصال التحويل عبر واتساب وسنؤكد طلبك فوراً'
            : 'سنتواصل معك لتأكيد التفاصيل وموعد التوصيل بعد استلام رسالتك'}
        </p>
        <WhatsAppButton order={order} />
      </div>
    </div>
  );
}
