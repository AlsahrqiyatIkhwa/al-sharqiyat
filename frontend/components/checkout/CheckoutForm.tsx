'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ZodIssue } from 'zod';
import { api, getErrorMessage } from '@/lib/api';
import { checkoutSchema } from '@/lib/validators';
import { useCartStore } from '@/lib/cart-store';
import { ShippingZone, Governorate, PaymentInstructions as PaymentInstructionsType } from '@/types';
import { CityDropdown } from './CityDropdown';
import { Button } from '@/components/ui/Button';
import { formatJOD, formatShippingFee } from '@/lib/utils';

interface CheckoutFormState {
  firstName: string;
  lastName: string;
  customerPhone: string;
  governorate: Governorate | '';
  area: string;
  street: string;
  buildingNumber: string;
  landmark: string;
  paymentMethod: 'COD' | 'MANUAL_TRANSFER' | 'ORANGE_MONEY';
  depositTransactionRef: string;
  depositPhoneNumber: string;
  notes: string;
}

const INITIAL_STATE: CheckoutFormState = {
  firstName: '',
  lastName: '',
  customerPhone: '',
  governorate: '',
  area: '',
  street: '',
  buildingNumber: '',
  landmark: '',
  paymentMethod: 'COD',
  depositTransactionRef: '',
  depositPhoneNumber: '',
  notes: '',
};

// COD means the full amount is paid in cash on delivery, no upfront deposit.
// ORANGE_MONEY means the full amount is paid upfront via Orange Money and
// needs the Orange Money phone/reference fields filled in. Must match
// order.validators.ts on the backend.
const TRANSFER_FIELDS_REQUIRED_METHODS = new Set(['ORANGE_MONEY']);

export function CheckoutForm() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInstructionsType | null>(null);
  const [form, setForm] = useState<CheckoutFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/shipping-zones')
      .then((res) => setZones(res.data.zones))
      .catch(() => toast.error('تعذر تحميل قائمة المحافظات'));
    api
      .get('/settings/payment-instructions')
      .then((res) => setPaymentInfo(res.data.methods))
      .catch(() => setPaymentInfo(null));
  }, []);

  const selectedZone = zones.find((z) => z.governorate === form.governorate);
  const shippingFee = selectedZone ? parseFloat(selectedZone.shippingFee) : 0;
  const total = subtotal + shippingFee;
  const requiresTransferFields = TRANSFER_FIELDS_REQUIRED_METHODS.has(form.paymentMethod);

  function handleChange<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue: ZodIssue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error('يرجى مراجعة الحقول المطلوبة');
      return;
    }

    if (lines.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    // Fold any per-item custom color requests into the order notes, since
    // order items don't carry their own notes field on the backend.
    const colorRequests = lines
      .filter((l) => l.customColorNote)
      .map((l) => `${l.productName}: ${l.customColorNote}`)
      .join(' | ');
    const combinedNotes = [result.data.notes, colorRequests ? `طلبات ألوان مخصصة — ${colorRequests}` : '']
      .filter(Boolean)
      .join('\n')
      .slice(0, 500);

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        ...result.data,
        notes: combinedNotes || undefined,
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      });

      clearCart();
      router.push(`/order-success/${res.data.order.orderCode}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'تعذر إرسال الطلب، حاولي مرة أخرى'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="card-surface space-y-5 p-6 md:col-span-2">
        <h2 className="font-cairo text-lg font-bold text-ink-900">معلومات التوصيل</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              الاسم الأول <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="سارة"
              className="input-field"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              اسم العائلة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="أحمد"
              className="input-field"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-900">
            رقم الهاتف <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            dir="ltr"
            value={form.customerPhone}
            onChange={(e) => handleChange('customerPhone', e.target.value)}
            placeholder="07XXXXXXXX"
            className="input-field text-right"
          />
          {errors.customerPhone && (
            <p className="mt-1 text-xs text-red-500">{errors.customerPhone}</p>
          )}
        </div>

        <CityDropdown
          zones={zones}
          value={form.governorate}
          onChange={(v) => handleChange('governorate', v)}
          error={errors.governorate}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              الحي / المنطقة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.area}
              onChange={(e) => handleChange('area', e.target.value)}
              placeholder="مثال: الجبيهة"
              className="input-field"
            />
            {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              اسم الشارع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => handleChange('street', e.target.value)}
              placeholder="مثال: شارع الجامعة"
              className="input-field"
            />
            {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              رقم المبنى / الشقة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.buildingNumber}
              onChange={(e) => handleChange('buildingNumber', e.target.value)}
              placeholder="مبنى 12، طابق 2"
              className="input-field"
            />
            {errors.buildingNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.buildingNumber}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              أقرب معلم (اختياري)
            </label>
            <input
              type="text"
              value={form.landmark}
              onChange={(e) => handleChange('landmark', e.target.value)}
              placeholder="بالقرب من..."
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-900">
            طريقة الدفع <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleChange('paymentMethod', 'COD')}
              className={`rounded-xl border-2 p-3.5 text-right transition ${
                form.paymentMethod === 'COD'
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-ink-900/10 bg-white'
              }`}
            >
              <p className="text-sm font-bold text-ink-900">الدفع عند الاستلام</p>
              <p className="mt-0.5 text-xs text-ink-900/50">
                ادفعي المبلغ بالكامل نقداً عند استلام طلبك
              </p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('paymentMethod', 'ORANGE_MONEY')}
              className={`rounded-xl border-2 p-3.5 text-right transition ${
                form.paymentMethod === 'ORANGE_MONEY'
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-ink-900/10 bg-white'
              }`}
            >
              <p className="text-sm font-bold text-ink-900">أورنج موني</p>
              <p className="mt-0.5 text-xs text-ink-900/50">دفع المبلغ بالكامل مسبقاً عبر أورنج موني</p>
            </button>
          </div>
          {errors.paymentMethod && (
            <p className="mt-1 text-xs text-red-500">{errors.paymentMethod}</p>
          )}

          {requiresTransferFields && (
            <div className="mt-4 space-y-3 rounded-xl bg-amber-50 p-4">
              <p className="text-sm font-semibold text-ink-900">
                المبلغ الكامل عبر أورنج موني — {formatJOD(total)}
              </p>
              <p className="text-xs leading-relaxed text-ink-900/60">
                حوّلي المبلغ أعلاه إلى رقم أورنج موني{' '}
                <span dir="ltr" className="font-semibold text-ink-900">
                  {paymentInfo?.ORANGE_MONEY.merchantNumber || '—'}
                </span>{' '}
                ({paymentInfo?.ORANGE_MONEY.merchantName}) ثم أدخلي بيانات التحويل أدناه. سيتم
                التحقق منها يدوياً من قبل فريقنا.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-900">
                    رقم هاتف أورنج موني <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={form.depositPhoneNumber}
                    onChange={(e) => handleChange('depositPhoneNumber', e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="input-field bg-white text-right"
                  />
                  {errors.depositPhoneNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.depositPhoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-900">
                    رقم مرجع العملية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.depositTransactionRef}
                    onChange={(e) => handleChange('depositTransactionRef', e.target.value)}
                    placeholder="مثال: OM123456789"
                    className="input-field bg-white"
                  />
                  {errors.depositTransactionRef && (
                    <p className="mt-1 text-xs text-red-500">{errors.depositTransactionRef}</p>
                  )}
                </div>
              </div>
              <p className="rounded-lg bg-amber-100 p-2.5 text-xs font-semibold text-amber-800">
                عند تحويلك إلى الواتساب، يرجى إرسال صورة إيصال (Receipt) الدفع لتأكيد طلبك.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-900">
            ملاحظات (اختياري)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="أي تعليمات إضافية للتوصيل"
            rows={2}
            className="input-field"
          />
        </div>
      </div>

      <div className="card-surface sticky top-24 h-fit space-y-4 p-6">
        <h3 className="font-cairo text-lg font-bold text-ink-900">ملخص الطلب</h3>
        <div className="space-y-2 border-b border-ink-900/10 pb-4 text-sm">
          {lines.map((l) => (
            <div key={l.variantId} className="flex justify-between text-ink-900/70">
              <span className="line-clamp-1">
                {l.productName} × {l.quantity}
              </span>
              <span className="shrink-0 font-semibold text-ink-900">
                {formatJOD(l.unitPrice * l.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-ink-900/60">
            <span>المجموع الفرعي</span>
            <span className="font-semibold text-ink-900">{formatJOD(subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-900/60">
            <span>رسوم الشحن</span>
            <span className="font-semibold text-ink-900">
              {selectedZone ? formatShippingFee(shippingFee) : '—'}
            </span>
          </div>
          <div className="flex justify-between border-t border-ink-900/10 pt-2 font-cairo text-base font-bold text-ink-900">
            <span>الإجمالي</span>
            <span>{formatJOD(total)}</span>
          </div>
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          تأكيد الطلب
        </Button>
        <p className="text-center text-[11px] text-ink-900/40">
          سيتم تأكيد طلبك يدوياً عبر واتساب بعد الإرسال
        </p>
      </div>
    </form>
  );
}
