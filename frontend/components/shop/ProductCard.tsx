'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Product } from '@/types';
import { cn, formatJOD, getImageUrl } from '@/lib/utils';
import { WishlistButton } from './WishlistButton';

export function ProductCard({ product }: { product: Product }) {
  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const colorCount = new Set(product.variants.map((v) => v.colorName)).size;
  const hasDiscount =
    product.discountPrice != null && Number(product.discountPrice) < Number(product.basePrice);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.discountPrice) / Number(product.basePrice)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="card-surface overflow-hidden">
          <div className="relative aspect-[3/4] overflow-hidden bg-brand-50">
            {primaryImage ? (
              <Image
                src={getImageUrl(primaryImage.imageUrl)}
                alt={primaryImage.altText || product.nameAr}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-900/20">
                لا توجد صورة
              </div>
            )}

            <div className="absolute right-3 top-3 flex flex-col items-start gap-1.5">
              {product.isFeatured && (
                <span className="animate-scale-in rounded-full bg-ink-900 px-3 py-1 text-[10px] font-bold text-white">
                  مميز
                </span>
              )}
              {hasDiscount && (
                <span className="animate-scale-in rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold text-white">
                  خصم {discountPercent}%
                </span>
              )}
            </div>
            <WishlistButton productId={product.id} size="sm" className="absolute left-3 top-3" />
            {totalStock === 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink-900/50 text-sm font-bold text-white">
                نفدت الكمية
              </span>
            )}
          </div>

          <div className="space-y-1 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600">
              {product.category}
            </p>
            <h3 className="font-cairo text-sm font-semibold text-ink-900 line-clamp-1">
              {product.nameAr}
            </h3>
            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-2">
                <span className={cn('text-sm font-bold', hasDiscount ? 'text-red-600' : 'text-ink-900')}>
                  {formatJOD(hasDiscount ? product.discountPrice! : product.basePrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-ink-900/40 line-through">
                    {formatJOD(product.basePrice)}
                  </span>
                )}
              </span>
              {colorCount > 1 && (
                <span className="text-[11px] text-ink-900/50">{colorCount} ألوان</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
