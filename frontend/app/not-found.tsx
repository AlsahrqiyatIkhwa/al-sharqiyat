import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-cairo text-6xl font-bold text-brand-300">404</h1>
      <p className="text-lg font-semibold text-ink-900">الصفحة غير موجودة</p>
      <p className="text-sm text-ink-900/50">قد يكون الرابط غير صحيح أو تم حذف المنتج</p>
      <Link href="/" className="btn-primary mt-2">
        العودة للرئيسية
      </Link>
    </div>
  );
}
