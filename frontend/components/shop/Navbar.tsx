'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ShoppingBag, Menu, X, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const totalItems = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.productIds.size);
  const wishlistLoaded = useWishlistStore((s) => s.loaded);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Avoid hydration mismatch: cart count comes from localStorage, only render after mount
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !wishlistLoaded) fetchWishlist();
  }, [mounted, wishlistLoaded, fetchWishlist]);

  const links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/products', label: 'كل المنتجات' },
    { href: '/products?category=عباية', label: 'عبايات' },
    { href: '/products?category=قفطان', label: 'قفاطين' },
    { href: '/track', label: 'تتبع الطلب' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/5 bg-[#faf8f5]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center" aria-label="شرقيات الإخوة">
          <Image
            src="/logo-mark.png"
            alt="شرقيات الإخوة"
            width={56}
            height={56}
            priority
            className="h-14 w-14 rounded-full object-cover"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-900/70 transition-colors hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/wishlist"
            className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-ink-900/5"
            aria-label="المفضلة"
          >
            <Heart className="h-5 w-5" />
            {mounted && wishlistCount > 0 && (
              <span className="animate-scale-in absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-ink-900/5"
            aria-label="سلة المشتريات"
          >
            <ShoppingBag className="h-5 w-5" />
            {mounted && totalItems > 0 && (
              <span className="animate-scale-in absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink-900/5 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="القائمة"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'grid overflow-hidden border-t border-ink-900/5 transition-all duration-300 md:hidden',
          menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-900/80 hover:bg-ink-900/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
