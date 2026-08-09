'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartLine } from '@/types';
import { useCartStore } from '@/lib/cart-store';
import { formatJOD } from '@/lib/utils';

export function CartItemRow({ line }: { line: CartLine }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="animate-fade-in-up flex gap-4 border-b border-ink-900/5 py-5 last:border-0">
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50">
        {line.imageUrl ? (
          <Image src={line.imageUrl} alt={line.productName} fill className="object-cover" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-cairo text-sm font-semibold text-ink-900">{line.productName}</h3>
          <p className="mt-0.5 text-xs text-ink-900/50">
            {line.colorName} · مقاس {line.size}
          </p>
          {line.customColorNote && (
            <p className="mt-0.5 text-xs text-brand-600">
              لون مطلوب: {line.customColorNote}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-full border border-ink-900/15 px-1.5 py-1">
            <button
              onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:bg-ink-900/5 active:scale-75"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-xs font-bold">{line.quantity}</span>
            <button
              onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
              disabled={line.quantity >= line.maxStock}
              className="flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:bg-ink-900/5 active:scale-75 disabled:opacity-30"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <span className="text-sm font-bold text-ink-900">
            {formatJOD(line.unitPrice * line.quantity)}
          </span>
        </div>
      </div>

      <button
        onClick={() => removeItem(line.variantId)}
        className="h-fit self-start text-ink-900/30 transition-colors hover:text-red-500"
        aria-label="إزالة"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
