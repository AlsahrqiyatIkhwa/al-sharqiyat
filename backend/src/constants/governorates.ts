import { Governorate } from '@prisma/client';

/**
 * Single source of truth mapping each of the 12 Jordanian governorates
 * (Prisma enum) to its Arabic display label. Used by the seed script,
 * WhatsApp message templates, and anywhere else a human-readable name
 * is needed on the backend.
 */
export const GOVERNORATE_LABELS_AR: Record<Governorate, string> = {
  AMMAN: 'عمان',
  ZARQA: 'الزرقاء',
  IRBID: 'إربد',
  AQABA: 'العقبة',
  BALQA: 'البلقاء',
  MADABA: 'مادبا',
  MAFRAQ: 'المفرق',
  JERASH: 'جرش',
  AJLOUN: 'عجلون',
  KARAK: 'الكرك',
  TAFILEH: 'الطفيلة',
  MAAN: 'معان',
};

export const ALL_GOVERNORATES = Object.keys(GOVERNORATE_LABELS_AR) as Governorate[];
