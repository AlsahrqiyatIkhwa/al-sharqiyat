import { Governorate } from '@/types';

/**
 * The 12 Jordanian governorates, in the same order & Arabic labels used
 * by the backend (see backend/src/constants/governorates.ts). Kept as a
 * static list (rather than only the /shipping-zones API) so the checkout
 * dropdown and admin filters render instantly without waiting on a
 * network round-trip, then get enriched with live shipping fees.
 */
export const GOVERNORATES: { value: Governorate; label: string }[] = [
  { value: 'AMMAN', label: 'عمان' },
  { value: 'ZARQA', label: 'الزرقاء' },
  { value: 'IRBID', label: 'إربد' },
  { value: 'AQABA', label: 'العقبة' },
  { value: 'BALQA', label: 'البلقاء' },
  { value: 'MADABA', label: 'مادبا' },
  { value: 'MAFRAQ', label: 'المفرق' },
  { value: 'JERASH', label: 'جرش' },
  { value: 'AJLOUN', label: 'عجلون' },
  { value: 'KARAK', label: 'الكرك' },
  { value: 'TAFILEH', label: 'الطفيلة' },
  { value: 'MAAN', label: 'معان' },
];

export const GOVERNORATE_LABELS: Record<Governorate, string> = GOVERNORATES.reduce(
  (acc, g) => ({ ...acc, [g.value]: g.label }),
  {} as Record<Governorate, string>
);
