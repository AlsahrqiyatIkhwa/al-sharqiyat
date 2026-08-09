'use client';

import { useEffect, useState } from 'react';
import { Landmark, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { PaymentInstructions as PaymentInstructionsType } from '@/types';

/**
 * Shown on the order-success page when the customer chose "Manual Transfer"
 * at checkout. Pulls receiver name / country / instructions from the
 * backend's /api/settings/payment-instructions endpoint so the business
 * details live in one place (env vars) instead of being hardcoded in the UI.
 *
 * There is no payment gateway involved — this only displays static text
 * telling the customer where to send a Western Union / bank transfer.
 */
export function PaymentInstructions({ orderCode }: { orderCode: string }) {
  const [data, setData] = useState<PaymentInstructionsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get('/settings/payment-instructions')
      .then((res) => setData(res.data.methods))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(
      `${data.MANUAL_TRANSFER.receiverName} — ${data.MANUAL_TRANSFER.country}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="card-surface animate-pulse space-y-3 p-6">
        <div className="h-4 w-1/2 rounded bg-ink-900/10" />
        <div className="h-4 w-full rounded bg-ink-900/10" />
        <div className="h-4 w-2/3 rounded bg-ink-900/10" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card-surface p-6 text-center text-sm text-ink-900/60">
        تعذر تحميل تعليمات الدفع، يرجى التواصل معنا عبر واتساب لإتمام التحويل.
      </div>
    );
  }

  const wu = data.MANUAL_TRANSFER;

  return (
    <div className="card-surface space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5 text-amber-600" />
        <h3 className="font-cairo text-base font-bold text-ink-900">تعليمات التحويل اليدوي</h3>
      </div>

      <div className="space-y-3 rounded-xl bg-amber-50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-900/50">اسم المستلم</p>
            <p className="font-semibold text-ink-900">{wu.receiverName || '—'}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'تم النسخ' : 'نسخ'}
          </button>
        </div>
        <div>
          <p className="text-xs text-ink-900/50">الدولة</p>
          <p className="font-semibold text-ink-900">{wu.country || '—'}</p>
        </div>
        {wu.bankTransferDetails && (
          <div>
            <p className="text-xs text-ink-900/50">تحويل بنكي (اختياري)</p>
            <p className="font-semibold text-ink-900" dir="ltr">
              {wu.bankTransferDetails}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-900/60">{wu.instructions}</p>

      <p className="rounded-lg bg-ink-900/[0.03] p-3 text-xs text-ink-900/50">
        بعد إتمام التحويل، أرسلي صورة الإيصال عبر واتساب مع رقم الطلب{' '}
        <span className="font-semibold text-ink-900">{orderCode}</span> لتأكيد الشحن.
      </p>
    </div>
  );
}
