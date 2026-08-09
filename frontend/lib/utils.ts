import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatJOD(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toFixed(2)} د.أ`;
}

// Delivery is free across all of Jordan — show "مجاني" instead of "0.00 د.أ"
// wherever a shipping fee is displayed.
export function formatShippingFee(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num === 0 ? 'مجاني' : formatJOD(num);
}

export function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(
    '/api',
    ''
  );
  return `${apiBase}${path}`;
}

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  CONFIRMED: { label: 'مؤكد', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  PROCESSING: { label: 'قيد المعالجة', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  SHIPPED: { label: 'تم الشحن', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  DELIVERED: { label: 'تم التسليم', color: 'bg-green-100 text-green-800 border-green-300' },
  CANCELLED: { label: 'ملغى', color: 'bg-red-100 text-red-800 border-red-300' },
};
