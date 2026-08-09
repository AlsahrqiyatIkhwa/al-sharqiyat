import Image from 'next/image';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { AddToCartPanel } from '@/components/shop/AddToCartPanel';
import { WishlistButton } from '@/components/shop/WishlistButton';
import { ReviewsSection } from '@/components/shop/ReviewsSection';
import { getImageUrl } from '@/lib/utils';

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await api.get(`/products/${slug}`);
    return res.data.product;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const images = product.images.length > 0 ? product.images : [];

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      {/* Gallery */}
      <div className="space-y-3">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-brand-50">
          {images[0] ? (
            <Image
              src={getImageUrl(images[0].imageUrl)}
              alt={images[0].altText || product.nameAr}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-900/20">
              لا توجد صورة
            </div>
          )}
          <WishlistButton productId={product.id} className="absolute left-3 top-3" />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.slice(1).map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-brand-50">
                <Image
                  src={getImageUrl(img.imageUrl)}
                  alt={img.altText || product.nameAr}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {product.category}
          </p>
          <h1 className="font-cairo text-3xl font-bold text-ink-900">{product.nameAr}</h1>
        </div>

        {product.descriptionAr && (
          <p className="leading-relaxed text-ink-900/70">{product.descriptionAr}</p>
        )}

        <AddToCartPanel product={product} />
      </div>

      {/* Reviews (spans both columns) */}
      <div className="md:col-span-2">
        <ReviewsSection productId={product.id} />
      </div>
    </div>
  );
}
