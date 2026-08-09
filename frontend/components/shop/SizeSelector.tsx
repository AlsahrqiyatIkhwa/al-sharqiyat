'use client';

import { cn } from '@/lib/utils';

interface SizeSelectorProps {
  sizes: string[];
  selected: string | null;
  onSelect: (size: string) => void;
  disabledSizes?: string[];
}

export function SizeSelector({ sizes, selected, onSelect, disabledSizes = [] }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const isDisabled = disabledSizes.includes(size);
        return (
          <button
            key={size}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(size)}
            className={cn(
              'flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-all active:scale-90',
              selected === size
                ? 'border-ink-900 bg-ink-900 text-white animate-scale-in'
                : 'border-ink-900/15 bg-white text-ink-900 hover:border-brand-400 hover:-translate-y-0.5',
              isDisabled && 'cursor-not-allowed opacity-30 line-through'
            )}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
