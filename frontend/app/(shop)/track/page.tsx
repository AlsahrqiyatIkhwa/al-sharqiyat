'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, PackageSearch, ClipboardCheck, PackageCheck, Truck, XCircle, Copy, Check } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { Order } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatJOD } from '@/lib/utils';
import { GOVERNORATE_LABELS } from '@/lib/governorates';

const STEPS: { key: Order['status']; label: string; icon: typeof ClipboardCheck }[] = [
  { key: 'PENDING', label: 'تم الطلب', icon: ClipboardCheck },
  { key: 'CONFIRMED', label: 'تم التأكيد', icon: PackageCheck },
  { key: 'PROCESSING', label: 'قيد المعالجة', icon: PackageCheck },
  { key: 'SHIPPED', label: 'قيد التوصيل', icon: Truck },
  { key: 'DELIVERED', label: 'تم التوصيل', icon: PackageCheck },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  async function performSearch(code: string) {
    const trimmed = code.trim().replace(/^#/, '');
    if (!trimmed) {
      setError('يرجى إدخال رقم التتبع');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await api.get(`/orders/${trimmed}`);
      setOrder(res.data.order);
    } catch (err) {
      setOrder(null);
      setError(getErrorMessage(err, 'لم يتم العثور على طلب بهذا الرقم'));
    } finally {
      setLoading(false);
    }
  }

  // Auto-search when arriving from a WhatsApp tracking link (?code=SHRQ-...)
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setOrderCode(codeFromUrl);
      performSearch(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    performSearch(orderCode);
  }

  function handleCopyCode() {
    if (!order) return;
    navigator.clipboard.writeText(order.orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const activeStepIndex = order
    ? Math.max(0, STEPS.findIndex((s) => s.key === order.status))
    : -1;
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <PackageSearch className="mx-auto mb-3 h-10 w-10 text-brand-600" />
        <h1 className="font-cairo text-2xl font-bold text-ink-900">تتبع طلبك</h1>
        <p className="mt-1 text-sm text-ink-900/50">أدخلي رقم التتبع لمعرفة حالة طلبك الحالية</p>
      </div>

      <form onSubmit={handleSearch} className="card-surface flex items-center gap-2 p-3">
        <input
          type="text"
          value={orderCode}
          onChange={(e) => setOrderCode(e.target.value)}
          placeholder="مثال: SHRQ-202607-0001"
          dir="ltr"
          className="input-field flex-1 text-center"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:brightness-95 disabled:opacity-50"
          aria-label="بحث"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>

      {loading && (
        <div className="card-surface animate-pulse space-y-3 p-6">
          <div className="h-4 w-1/2 rounded bg-ink-900/10" />
          <div className="h-4 w-full rounded bg-ink-900/10" />
        </div>
      )}

      {!loading && error && (
        <div className="card-surface p-6 text-center text-sm text-red-500">{error}</div>
      )}

      {!loading && searched && order && (
        <div className="card-surface space-y-5 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 font-cairo text-lg font-bold text-ink-900"
            >
              {order.orderCode}
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-ink-900/30" />
              )}
            </button>
            <StatusBadge status={order.status} />
          </div>

          {order.depositAmount && (
            <div
              className={`flex items-center justify-between rounded-lg p-3 text-xs ${
                order.paymentStatus === 'DEPOSIT_PAID' || order.paymentStatus === 'FULLY_PAID'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <span>الدفعة المقدمة (20%)</span>
              <span className="font-semibold">
                {formatJOD(order.depositAmount)} —{' '}
                {order.paymentStatus === 'DEPOSIT_PAID' || order.paymentStatus === 'FULLY_PAID'
                  ? 'تم التحقق منها'
                  : 'قيد المراجعة'}
              </span>
            </div>
          )}

          {isCancelled ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
              <XCircle className="h-5 w-5 shrink-0" />
              تم إلغاء هذا الطلب
            </div>
          ) : (
            <div className="flex items-start justify-between">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                return (
                  <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div
                          className={`h-0.5 flex-1 origin-right transition-colors ${
                            idx <= activeStepIndex ? 'bg-brand-600 animate-bar-grow' : 'bg-ink-900/10'
                          }`}
                        />
                      )}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                          isDone
                            ? 'bg-brand-600 text-white'
                            : 'bg-ink-900/10 text-ink-900/40'
                        } ${isCurrent ? 'ring-4 ring-brand-100 animate-pulse-ring' : ''} ${
                          isDone ? 'animate-scale-in' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 origin-left transition-colors ${
                            idx < activeStepIndex ? 'bg-brand-600 animate-bar-grow' : 'bg-ink-900/10'
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-center text-[10px] ${
                        isDone ? 'font-semibold text-ink-900' : 'text-ink-900/40'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2 border-t border-ink-900/10 pt-4 text-sm">
            <div className="flex justify-between text-ink-900/60">
              <span>المحافظة</span>
              <span className="font-semibold text-ink-900">
                {GOVERNORATE_LABELS[order.governorate]}
              </span>
            </div>
            <div className="flex justify-between text-ink-900/60">
              <span>عدد القطع</span>
              <span className="font-semibold text-ink-900">
                {order.items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <div className="flex justify-between text-ink-900/60">
              <span>الإجمالي</span>
              <span className="font-semibold text-ink-900">{formatJOD(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderContent />
    </Suspense>
  );
}
