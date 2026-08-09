'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FiltersProps {
  categories: string[];
}

export function Filters({ categories }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('category') || '';
  const activeSort = searchParams.get('sort') || 'newest';
  const [search, setSearch] = useState(searchParams.get('search') || '');

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.get('search') || '')) {
        updateParam('search', search);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-900/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحثي عن منتج..."
          className="input-field pr-11"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => updateParam('category', '')}
          className={cn(
            'rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-90',
            activeCategory === ''
              ? 'bg-ink-900 text-white'
              : 'bg-white text-ink-900/60 hover:bg-ink-900/5'
          )}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => updateParam('category', cat)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-90',
              activeCategory === cat
                ? 'bg-ink-900 text-white'
                : 'bg-white text-ink-900/60 hover:bg-ink-900/5'
            )}
          >
            {cat}
          </button>
        ))}

        <select
          value={activeSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="mr-auto rounded-full border border-ink-900/10 bg-white px-4 py-2 text-xs font-semibold text-ink-900/70 focus:outline-none"
        >
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر: من الأقل للأعلى</option>
          <option value="price_desc">السعر: من الأعلى للأقل</option>
        </select>
      </div>
    </div>
  );
}
