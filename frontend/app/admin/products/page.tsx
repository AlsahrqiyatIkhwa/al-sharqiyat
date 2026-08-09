'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatJOD, getImageUrl } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  function loadProducts() {
    setLoading(true);
    api
      .get('/admin/products')
      .then((res) => setProducts(res.data.items))
      .finally(() => setLoading(false));
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`هل أنتِ متأكدة من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

    setDeletingId(id);
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('تم حذف المنتج بنجاح');
    } catch (err) {
      toast.error(getErrorMessage(err, 'تعذر حذف المنتج'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cairo text-2xl font-bold text-ink-900">إدارة المنتجات</h1>
          <p className="mt-1 text-sm text-ink-900/50">{products.length} منتج</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          منتج جديد
        </Link>
      </div>

      <div className="card-surface p-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-900/40">لا توجد منتجات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-900/10 text-right text-xs text-ink-900/40">
                  <th className="pb-3 font-medium">المنتج</th>
                  <th className="pb-3 font-medium">الفئة</th>
                  <th className="pb-3 font-medium">السعر</th>
                  <th className="pb-3 font-medium">المخزون</th>
                  <th className="pb-3 font-medium">الحالة</th>
                  <th className="pb-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];
                  const totalStock = product.variants.reduce((s, v) => s + v.stockQuantity, 0);

                  return (
                    <tr key={product.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                            {primaryImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getImageUrl(primaryImage.imageUrl)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <span className="font-semibold text-ink-900">{product.nameAr}</span>
                        </div>
                      </td>
                      <td className="py-3 text-ink-900/70">{product.category}</td>
                      <td className="py-3 text-ink-900/70">
                        {product.discountPrice &&
                        Number(product.discountPrice) < Number(product.basePrice) ? (
                          <span className="flex items-center gap-1.5">
                            <span className="font-semibold text-red-600">
                              {formatJOD(product.discountPrice)}
                            </span>
                            <span className="text-xs text-ink-900/40 line-through">
                              {formatJOD(product.basePrice)}
                            </span>
                          </span>
                        ) : (
                          formatJOD(product.basePrice)
                        )}
                      </td>
                      <td className="py-3 text-ink-900/70">{totalStock}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {product.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="text-ink-900/40 hover:text-brand-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.nameAr)}
                            disabled={deletingId === product.id}
                            className="text-ink-900/40 hover:text-red-500 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
