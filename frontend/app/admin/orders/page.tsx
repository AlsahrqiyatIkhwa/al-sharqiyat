'use client';

import { useEffect, useState } from 'react';
import { Order, OrderStatus, Governorate } from '@/types';
import { api } from '@/lib/api';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { GOVERNORATES } from '@/lib/governorates';

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'الكل' },
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'CONFIRMED', label: 'مؤكد' },
  { value: 'PROCESSING', label: 'قيد المعالجة' },
  { value: 'SHIPPED', label: 'تم الشحن' },
  { value: 'DELIVERED', label: 'تم التسليم' },
  { value: 'CANCELLED', label: 'ملغى' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [governorateFilter, setGovernorateFilter] = useState<Governorate | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Debounce the free-text search (tracking code / name / phone) so we
  // don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/orders', {
        params: {
          status: statusFilter || undefined,
          governorate: governorateFilter || undefined,
          search: search || undefined,
          limit: 100,
        },
      })
      .then((res) => {
        setOrders(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, governorateFilter, search]);

  function handleStatusChange(orderId: number, newStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }

  function handleDepositVerified(orderId: number, updatedOrder: Order) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-cairo text-2xl font-bold text-ink-900">إدارة الطلبات</h1>
          <p className="mt-1 text-sm text-ink-900/50">متابعة ومعالجة طلبات العملاء</p>
        </div>
        <p className="text-sm text-ink-900/40">{total} طلب</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-semibold transition-colors',
              statusFilter === tab.value
                ? 'bg-ink-900 text-white'
                : 'bg-white text-ink-900/60 hover:bg-ink-900/5'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={governorateFilter}
          onChange={(e) => setGovernorateFilter(e.target.value as Governorate | '')}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="">كل المحافظات</option>
          {GOVERNORATES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>

        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="بحث برقم التتبع أو الاسم أو الهاتف..."
          className="input-field mr-auto max-w-xs"
        />
      </div>

      <div className="card-surface p-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-900/40">لا توجد طلبات مطابقة</p>
        ) : (
          <OrdersTable
            orders={orders}
            onStatusChange={handleStatusChange}
            onDepositVerified={handleDepositVerified}
          />
        )}
      </div>
    </div>
  );
}
