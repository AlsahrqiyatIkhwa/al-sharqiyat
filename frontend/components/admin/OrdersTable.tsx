'use client';

import { Fragment, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order, OrderStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api, getErrorMessage } from '@/lib/api';
import { formatJOD } from '@/lib/utils';
import { GOVERNORATE_LABELS } from '@/lib/governorates';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
const STATUS_OPTION_LABELS: Record<OrderStatus, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد المعالجة',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغى',
};

const PAYMENT_METHOD_LABELS: Record<Order['paymentMethod'], string> = {
  COD: 'عند الاستلام',
  ORANGE_MONEY: 'أورنج موني',
  MANUAL_TRANSFER: 'تحويل يدوي',
};

export function OrdersTable({
  orders,
  onStatusChange,
  onDepositVerified,
}: {
  orders: Order[];
  onStatusChange: (orderId: number, newStatus: OrderStatus) => void;
  onDepositVerified?: (orderId: number, order: Order) => void;
}) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function handleStatusChange(orderId: number, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      onStatusChange(orderId, status);
      toast.success('تم تحديث حالة الطلب');
    } catch (err) {
      toast.error(getErrorMessage(err, 'تعذر تحديث الحالة'));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleVerifyDeposit(orderId: number) {
    setVerifyingId(orderId);
    try {
      const res = await api.patch(`/admin/orders/${orderId}/verify-deposit`, {});
      onDepositVerified?.(orderId, res.data.order);
      toast.success('تم تأكيد الدفعة المقدمة، وانتقل الطلب لقيد المعالجة');
    } catch (err) {
      toast.error(getErrorMessage(err, 'تعذر تأكيد الدفعة'));
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-900/10 text-right text-xs text-ink-900/40">
            <th className="pb-3 font-medium">رقم التتبع</th>
            <th className="pb-3 font-medium">العميل</th>
            <th className="pb-3 font-medium">الهاتف</th>
            <th className="pb-3 font-medium">المحافظة</th>
            <th className="pb-3 font-medium">المبلغ</th>
            <th className="pb-3 font-medium">الدفع</th>
            <th className="pb-3 font-medium">الحالة</th>
            <th className="pb-3 font-medium">تحديث الحالة</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <Fragment key={order.id}>
              <tr
                className="cursor-pointer border-b border-ink-900/5 hover:bg-ink-900/[0.02]"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <td className="py-3 font-semibold text-ink-900" dir="ltr">
                  {order.orderCode}
                </td>
                <td className="py-3 text-ink-900/70">
                  {order.firstName} {order.lastName}
                </td>
                <td className="py-3 text-ink-900/70" dir="ltr">
                  {order.customerPhone}
                </td>
                <td className="py-3 text-ink-900/70">{GOVERNORATE_LABELS[order.governorate]}</td>
                <td className="py-3 font-semibold text-ink-900">{formatJOD(order.total)}</td>
                <td className="py-3">
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        order.paymentMethod === 'MANUAL_TRANSFER'
                          ? 'bg-amber-100 text-amber-700'
                          : order.paymentMethod === 'ORANGE_MONEY'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                    </span>
                    {order.depositAmount && (
                      <span
                        className={`text-[10px] font-semibold ${
                          order.paymentStatus === 'DEPOSIT_PAID' || order.paymentStatus === 'FULLY_PAID'
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }`}
                      >
                        عربون {formatJOD(order.depositAmount)} —{' '}
                        {order.paymentStatus === 'DEPOSIT_PAID' || order.paymentStatus === 'FULLY_PAID'
                          ? 'محقق'
                          : 'بانتظار التحقق'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-flex items-center">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="rounded-lg border border-ink-900/10 bg-white py-1.5 pl-2 pr-7 text-xs disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_OPTION_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    {updatingId === order.id && (
                      <Loader2 className="absolute left-2 h-3.5 w-3.5 animate-spin text-brand-600" />
                    )}
                  </div>
                </td>
              </tr>
              {expandedId === order.id && (
                <tr className="bg-ink-900/[0.02]">
                  <td colSpan={8} className="p-4">
                    <div className="space-y-2">
                      {order.depositAmount && (
                        <div className="mb-3 rounded-lg bg-orange-50 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-0.5 text-xs text-ink-900/70">
                              <p>
                                رقم هاتف أورنج موني:{' '}
                                <span dir="ltr" className="font-semibold text-ink-900">
                                  {order.depositPhoneNumber || '—'}
                                </span>
                              </p>
                              <p>
                                رقم مرجع العملية:{' '}
                                <span className="font-semibold text-ink-900">
                                  {order.depositTransactionRef || '—'}
                                </span>
                              </p>
                            </div>
                            {order.paymentStatus === 'PENDING' ? (
                              <button
                                type="button"
                                disabled={verifyingId === order.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyDeposit(order.id);
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                              >
                                {verifyingId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                )}
                                تأكيد استلام الدفعة
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                تم التحقق من الدفعة
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="text-xs font-semibold text-ink-900/60">العنوان:</p>
                      <p className="text-sm text-ink-900/80">
                        {order.area}، {order.street}، مبنى/شقة {order.buildingNumber}
                        {order.landmark ? ` — بالقرب من ${order.landmark}` : ''}
                      </p>
                      {order.notes && (
                        <>
                          <p className="text-xs font-semibold text-ink-900/60">ملاحظات:</p>
                          <p className="text-sm text-ink-900/80">{order.notes}</p>
                        </>
                      )}
                      <p className="text-xs font-semibold text-ink-900/60">المنتجات:</p>
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-sm text-ink-900/80">
                            {item.productName} — {item.colorName} / {item.size} × {item.quantity} ={' '}
                            {formatJOD(item.lineTotal)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
