import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { ProductCard } from '@/components/shop/ProductCard';
import { TrustBadges } from '@/components/ui/TrustBadges';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await api.get('/products', { params: { featured: 'true', limit: 8 } });
    return res.data.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-ink-950 via-ink-900 to-brand-900 px-6 py-20 text-center text-white md:px-16 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(203,168,118,0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl space-y-6">
          <p className="font-cairo text-sm font-medium tracking-widest text-brand-300">
            أناقة الشرق الأصيلة
          </p>
          <h1 className="font-cairo text-4xl font-bold leading-tight md:text-6xl">
            شرقيات الإخوة
          </h1>
          <p className="text-base text-white/70 md:text-lg">
            عبايات وقفاطين فاخرة، مطرزة بعناية، مستوحاة من التراث ومصممة للمرأة
            العصرية.
          </p>
          <Link href="/products" className="btn-primary mt-4 !bg-brand-400 hover:!bg-brand-300">
            تسوقي المجموعة
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <TrustBadges />

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="section-title">مختارات مميزة</h2>
            <Link href="/products" className="text-sm font-semibold text-brand-700 hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Categories teaser */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { label: 'عبايات', query: 'عباية' },
          { label: 'قفاطين', query: 'قفطان' },
        ].map((cat) => (
          <Link
            key={cat.query}
            href={`/products?category=${encodeURIComponent(cat.query)}`}
            className="group flex h-40 items-center justify-center rounded-2xl bg-brand-100/60 transition-colors hover:bg-brand-200/60"
          >
            <span className="font-cairo text-xl font-bold text-ink-900 transition-transform group-hover:scale-105">
              {cat.label}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
