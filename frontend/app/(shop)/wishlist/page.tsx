'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/lib/wishlist-store';
import { ProductCard } from '@/components/shop/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const loaded = useWishlistStore((s) => s.loaded);
  const loading = useWishlistStore((s) => s.loading);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded && loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (loaded && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Heart className="h-14 w-14 text-ink-900/15" />
        <h1 className="font-cairo text-xl font-bold text-ink-900">قائمة المفضلة فارغة</h1>
        <p className="text-sm text-ink-900/50">اضغطي على ❤️ في أي منتج لإضافته هنا</p>
        <Link href="/products" className="btn-primary mt-2">
          تصفحي المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-cairo text-2xl font-bold text-ink-900">المفضلة ({items.length})</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
}
