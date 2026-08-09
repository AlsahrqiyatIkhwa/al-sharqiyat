'use client';

import Link from 'next/link';
import { formatJOD } from '@/lib/utils';

export function CartSummary({
  subtotal,
  ctaHref = '/checkout',
  ctaLabel = 'إتمام الطلب',
}: {
  subtotal: number;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card-surface sticky top-24 space-y-4 p-6">
      <h3 className="font-cairo text-lg font-bold text-ink-900">ملخص الطلب</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-ink-900/60">
          <span>المجموع الفرعي</span>
          <span className="font-semibold text-ink-900">{formatJOD(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-900/60">
          <span>رسوم الشحن</span>
          <span className="text-xs text-ink-900/40">تُحسب عند اختيار المحافظة</span>
        </div>
      </div>

      <div className="border-t border-ink-900/10 pt-4">
        <Link href={ctaHref} className="btn-primary w-full">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
