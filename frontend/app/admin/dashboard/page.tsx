'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, Clock, AlertTriangle, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatJOD } from '@/lib/utils';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  totalRevenue: number;
  lowStockVariants: number;
}

interface RecentOrder {
  id: number;
  orderCode: string;
  firstName: string;
  lastName: string;
  total: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => {
        setStats(res.data.stats);
        setRecentOrders(res.data.recentOrders);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
        { label: 'قيد الانتظار', value: stats.pendingOrders, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
        { label: 'إجمالي الإيرادات', value: formatJOD(stats.totalRevenue), icon: Wallet, color: 'text-green-600 bg-green-50' },
        { label: 'المنتجات النشطة', value: stats.totalProducts, icon: Package, color: 'text-brand-700 bg-brand-50' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cairo text-2xl font-bold text-ink-900">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-ink-900/50">نظرة عامة على أداء المتجر</p>
      </div>

      {stats?.lowStockVariants ? (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            يوجد {stats.lowStockVariants} متغيرات منتجات بكمية مخزون منخفضة (3 قطع أو أقل)
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : cards.map((card) => (
              <div key={card.label} className="card-surface p-5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="font-cairo text-2xl font-bold text-ink-900">{card.value}</p>
                <p className="mt-1 text-xs text-ink-900/50">{card.label}</p>
              </div>
            ))}
      </div>

      <div className="card-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-cairo text-lg font-bold text-ink-900">أحدث الطلبات</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">
            عرض الكل
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/10 text-right text-xs text-ink-900/40">
                <th className="pb-3 font-medium">رقم الطلب</th>
                <th className="pb-3 font-medium">العميل</th>
                <th className="pb-3 font-medium">المبلغ</th>
                <th className="pb-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="py-3 font-semibold text-ink-900">{order.orderCode}</td>
                  <td className="py-3 text-ink-900/70">
                    {order.firstName} {order.lastName}
                  </td>
                  <td className="py-3 text-ink-900/70">{formatJOD(order.total)}</td>
                  <td className="py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
