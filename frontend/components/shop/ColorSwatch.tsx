'use client';

import { cn } from '@/lib/utils';

interface ColorOption {
  name: string;
  hex?: string | null;
}

interface ColorSwatchProps {
  colors: ColorOption[];
  selected: string | null;
  onSelect: (colorName: string) => void;
}

export function ColorSwatch({ colors, selected, onSelect }: ColorSwatchProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => onSelect(color.name)}
          title={color.name}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all active:scale-90',
            selected === color.name
              ? 'border-ink-900 ring-2 ring-ink-900/20 animate-scale-in'
              : 'border-ink-900/15 hover:border-brand-400 hover:-translate-y-0.5'
          )}
        >
          <span
            className="h-4 w-4 rounded-full border border-ink-900/10"
            style={{ backgroundColor: color.hex || '#ccc' }}
          />
          <span className="text-xs font-medium text-ink-900/80">{color.name}</span>
        </button>
      ))}
    </div>
  );
}
