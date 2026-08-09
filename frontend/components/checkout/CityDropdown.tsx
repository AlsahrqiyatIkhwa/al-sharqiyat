'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import { ShippingZone, Governorate } from '@/types';
import { GOVERNORATES } from '@/lib/governorates';
import { formatShippingFee, cn } from '@/lib/utils';

interface CityDropdownProps {
  zones: ShippingZone[];
  value: Governorate | '';
  onChange: (governorate: Governorate) => void;
  error?: string;
}

/**
 * Searchable governorate dropdown. The underlying list of the 12 Jordanian
 * governorates is fixed (no free-text input possible) — the search box
 * only filters that fixed list, it never accepts an arbitrary city name.
 */
export function CityDropdown({ zones, value, onChange, error }: CityDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const zoneByGovernorate = useMemo(
    () => new Map(zones.map((z) => [z.governorate, z])),
    [zones]
  );

  const filtered = useMemo(
    () => GOVERNORATES.filter((g) => g.label.includes(query.trim())),
    [query]
  );

  const selected = GOVERNORATES.find((g) => g.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-semibold text-ink-900">
        المحافظة <span className="text-red-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'input-field flex w-full items-center justify-between gap-2 text-right',
          !selected && 'text-ink-900/40'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
          {selected
            ? `${selected.label}${
                zoneByGovernorate.get(selected.value)
                  ? ` — شحن ${formatShippingFee(zoneByGovernorate.get(selected.value)!.shippingFee)}`
                  : ''
              }`
            : 'اختاري المحافظة'}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-soft">
          <div className="flex items-center gap-2 border-b border-ink-900/10 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-ink-900/30" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحثي عن محافظتك..."
              className="w-full border-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-900/30"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-center text-xs text-ink-900/40">لا توجد نتائج</li>
            )}
            {filtered.map((g) => {
              const zone = zoneByGovernorate.get(g.value);
              return (
                <li key={g.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(g.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-right text-sm transition-colors hover:bg-brand-50',
                      value === g.value && 'bg-brand-50 font-semibold text-brand-700'
                    )}
                  >
                    <span>{g.label}</span>
                    {zone && (
                      <span className="text-xs text-ink-900/40">
                        {formatShippingFee(zone.shippingFee)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
