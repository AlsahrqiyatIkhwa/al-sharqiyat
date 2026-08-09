'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';

export default function CartPage() {
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <ShoppingBag className="h-14 w-14 text-ink-900/15" />
        <h1 className="font-cairo text-xl font-bold text-ink-900">سلتك فارغة</h1>
        <p className="text-sm text-ink-900/50">لم تقومي بإضافة أي منتجات بعد</p>
        <Link href="/products" className="btn-primary mt-2">
          تصفحي المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="card-surface p-6 md:col-span-2">
        <h1 className="mb-2 font-cairo text-xl font-bold text-ink-900">
          سلة المشتريات ({lines.length})
        </h1>
        <div>
          {lines.map((line) => (
            <CartItemRow key={line.variantId} line={line} />
          ))}
        </div>
      </div>

      <div>
        <CartSummary subtotal={subtotal} />
      </div>
    </div>
  );
}
