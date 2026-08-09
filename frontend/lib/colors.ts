// Shared color palette for the admin product form's "إضافة كل الألوان"
// (add all colors) bulk action. Names/hex values are drawn from the colors
// already used across the real product catalog (see backend/prisma/seed.ts)
// plus a few common additions, so the palette matches the brand's existing
// color language.
export interface CatalogColor {
  name: string;
  hex: string;
}

export const COLOR_PALETTE: CatalogColor[] = [
  { name: 'أسود', hex: '#0A0A0A' },
  { name: 'أبيض', hex: '#F5F1E8' },
  { name: 'كريمي', hex: '#EFE6D8' },
  { name: 'بيج', hex: '#D9C9A3' },
  { name: 'ذهبي', hex: '#C9A227' },
  { name: 'فضي', hex: '#B8B8B8' },
  { name: 'أحمر', hex: '#7A1F2B' },
  { name: 'نبيتي', hex: '#7A1B3D' },
  { name: 'وردي', hex: '#D98BA5' },
  { name: 'بنفسجي', hex: '#4B1E3F' },
  { name: 'ليلكي', hex: '#C9A6CE' },
  { name: 'أزرق', hex: '#2E4A73' },
  { name: 'أزرق ملكي', hex: '#1A3A8F' },
  { name: 'فيروزي', hex: '#2FA6A0' },
  { name: 'أخضر', hex: '#0F4C36' },
  { name: 'أخضر زيتي', hex: '#5C6B3F' },
  { name: 'رمادي', hex: '#6B6B6B' },
  { name: 'بني', hex: '#5A3B22' },
];
