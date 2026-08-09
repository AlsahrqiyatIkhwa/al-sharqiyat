'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlistStore } from '@/lib/wishlist-store';
import { cn } from '@/lib/utils';

export function WishlistButton({
  productId,
  size = 'md',
  className,
}: {
  productId: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const loaded = useWishlistStore((s) => s.loaded);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const isWishlisted = useWishlistStore((s) => s.productIds.has(productId));
  // Shared across every instance of this product's button (grid card +
  // detail page), so a click on one disables the other instead of allowing
  // a second overlapping request for the same product.
  const isPending = useWishlistStore((s) => s.pendingIds.has(productId));
  const toggle = useWishlistStore((s) => s.toggle);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loaded) fetchWishlist();
  }, [loaded, fetchWishlist]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || isPending) return;
    setBusy(true);
    try {
      await toggle(productId);
    } catch {
      toast.error('تعذر تحديث المفضلة، حاولي مرة أخرى');
    } finally {
      setBusy(false);
    }
  }

  const dims = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  const iconDims = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || isPending}
      aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-60',
        dims,
        className
      )}
    >
      <Heart
        className={cn(iconDims, isWishlisted ? 'fill-red-500 text-red-500' : 'text-ink-900/60')}
      />
    </button>
  );
}
