'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { ProductForm } from '@/components/admin/ProductForm';
import { Skeleton } from '@/components/ui/Skeleton';

export default function EditProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/admin/products/${params.id}`)
      .then((res) => setProduct(res.data.product))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return <p className="text-sm text-ink-900/50">المنتج غير موجود</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cairo text-2xl font-bold text-ink-900">تعديل: {product.nameAr}</h1>
        <p className="mt-1 text-sm text-ink-900/50">تحديث بيانات المنتج والمخزون والصور</p>
      </div>
      <ProductForm initialProduct={product} />
    </div>
  );
}
