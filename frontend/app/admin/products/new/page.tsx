import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cairo text-2xl font-bold text-ink-900">إضافة منتج جديد</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          أدخلي بيانات المنتج، ثم احفظي أولاً لتتمكني من رفع الصور
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
