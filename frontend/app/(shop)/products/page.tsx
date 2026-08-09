import { api } from '@/lib/api';
import { Product } from '@/types';
import { ProductCard } from '@/components/shop/ProductCard';
import { Filters } from '@/components/shop/Filters';

interface PageProps {
  searchParams: { category?: string; search?: string; sort?: string; page?: string };
}

async function getProducts(searchParams: PageProps['searchParams']) {
  try {
    const res = await api.get('/products', {
      params: {
        category: searchParams.category,
        search: searchParams.search,
        sort: searchParams.sort || 'newest',
        page: searchParams.page || 1,
        limit: 12,
      },
    });
    return res.data as { items: Product[]; total: number };
  } catch {
    return { items: [], total: 0 };
  }
}

async function getCategories(): Promise<string[]> {
  try {
    const res = await api.get('/products/categories');
    return res.data.categories;
  } catch {
    return [];
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [{ items, total }, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">كل المنتجات</h1>
        <p className="mt-1 text-sm text-ink-900/50">{total} منتج</p>
      </div>

      <Filters categories={categories} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-900/15 py-24 text-center">
          <p className="text-ink-900/50">لم يتم العثور على منتجات مطابقة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
