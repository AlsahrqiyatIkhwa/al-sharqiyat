'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { getImageUrl } from '@/lib/utils';
import { COLOR_PALETTE } from '@/lib/colors';

interface VariantForm {
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  stockQuantity: number;
  priceOverride: string;
}

interface ProductFormProps {
  initialProduct?: Product;
}

interface StagedImage {
  id: string;
  file: File;
  previewUrl: string;
}

const emptyVariant: VariantForm = {
  size: '',
  colorName: '',
  colorHex: '#000000',
  sku: '',
  stockQuantity: 0,
  priceOverride: '',
};

export function ProductForm({ initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);

  const [form, setForm] = useState({
    slug: initialProduct?.slug || '',
    nameAr: initialProduct?.nameAr || '',
    nameEn: initialProduct?.nameEn || '',
    descriptionAr: initialProduct?.descriptionAr || '',
    category: initialProduct?.category || '',
    basePrice: initialProduct?.basePrice || '',
    discountPrice: initialProduct?.discountPrice || '',
    isActive: initialProduct?.isActive ?? true,
    isFeatured: initialProduct?.isFeatured ?? false,
  });

  const [variants, setVariants] = useState<VariantForm[]>(
    initialProduct?.variants.map((v) => ({
      size: v.size,
      colorName: v.colorName,
      colorHex: v.colorHex || '#000000',
      sku: v.sku,
      stockQuantity: v.stockQuantity,
      priceOverride: v.priceOverride || '',
    })) || [{ ...emptyVariant }]
  );

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  // Images already saved on the server (edit mode only — populated from initialProduct).
  const [existingImages, setExistingImages] = useState(initialProduct?.images || []);
  // Images picked before the product exists yet (create mode). Uploaded
  // automatically right after the product record is created.
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  // Size used by the "إضافة كل الألوان" bulk action below.
  const [bulkColorSize, setBulkColorSize] = useState('');

  function updateVariant(index: number, key: keyof VariantForm, value: string | number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: value } : v))
    );
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...emptyVariant }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  // Lets the customer choose their preferred color: adds one variant per
  // color in the shared palette (frontend/lib/colors.ts) for the given size
  // in a single click, instead of the admin typing each color by hand.
  // Skips colors that already exist for that size, and drops the leftover
  // blank starter row if it's still empty.
  function addAllColors() {
    const size = bulkColorSize.trim();
    if (!size) {
      toast.error('يرجى إدخال المقاس أولاً لإضافة كل الألوان له');
      return;
    }

    setVariants((prev) => {
      const withoutBlankStarter = prev.filter(
        (v) => !(v.size === '' && v.colorName === '' && v.sku === '')
      );
      const existingColorsForSize = new Set(
        withoutBlankStarter.filter((v) => v.size === size).map((v) => v.colorName)
      );
      const skuPrefix = (form.slug || 'PRD').toUpperCase();
      const newVariants: VariantForm[] = COLOR_PALETTE.filter(
        (c) => !existingColorsForSize.has(c.name)
      ).map((c, i) => ({
        size,
        colorName: c.name,
        colorHex: c.hex,
        sku: `${skuPrefix}-${size}-${existingColorsForSize.size + i + 1}`.toUpperCase(),
        stockQuantity: 5,
        priceOverride: '',
      }));

      if (newVariants.length === 0) {
        toast('كل الألوان مضافة مسبقاً لهذا المقاس');
        return withoutBlankStarter.length > 0 ? withoutBlankStarter : prev;
      }

      toast.success(`تمت إضافة ${newVariants.length} لون لمقاس ${size}`);
      return [...withoutBlankStarter, ...newVariants];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (variants.length === 0) {
      toast.error('أضف متغيراً واحداً على الأقل (مقاس/لون)');
      return;
    }

    const basePriceNum = parseFloat(form.basePrice as string);
    const discountPriceNum = form.discountPrice ? parseFloat(form.discountPrice as string) : null;
    if (discountPriceNum !== null && discountPriceNum >= basePriceNum) {
      toast.error('سعر الخصم يجب أن يكون أقل من السعر الأساسي');
      return;
    }

    setSubmitting(true);
    try {
      const { discountPrice: _discountPriceStr, ...restForm } = form;
      const payload = {
        ...restForm,
        basePrice: basePriceNum,
        // undefined on create (field simply omitted); explicit null on edit
        // so an admin can clear a previously-set discount.
        discountPrice: discountPriceNum ?? (isEdit ? null : undefined),
        variants: variants.map((v) => ({
          size: v.size,
          colorName: v.colorName,
          colorHex: v.colorHex,
          sku: v.sku,
          stockQuantity: Number(v.stockQuantity),
          ...(v.priceOverride ? { priceOverride: parseFloat(v.priceOverride) } : {}),
        })),
      };

      if (isEdit) {
        await api.put(`/admin/products/${initialProduct!.id}`, payload);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const res = await api.post('/admin/products', payload);
        const newProductId = res.data.product.id;

        // Upload any images the admin picked while filling out the form,
        // now that the product record (and its id) actually exists.
        if (stagedImages.length > 0) {
          let uploadFailures = 0;
          for (let i = 0; i < stagedImages.length; i++) {
            const formData = new FormData();
            formData.append('image', stagedImages[i].file);
            formData.append('isPrimary', String(i === 0));
            formData.append('sortOrder', String(i));
            try {
              await api.post(`/admin/products/${newProductId}/images`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
            } catch {
              uploadFailures++;
            }
          }
          if (uploadFailures > 0) {
            toast.error(
              `تم إنشاء المنتج، لكن تعذر رفع ${uploadFailures} من الصور — يمكنك إعادة المحاولة من صفحة التعديل`
            );
          }
        }

        toast.success('تم إنشاء المنتج بنجاح');
        router.push(`/admin/products/${newProductId}/edit`);
        return;
      }
      router.push('/admin/products');
    } catch (err) {
      toast.error(getErrorMessage(err, 'تعذر حفظ المنتج'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleStageImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setStagedImages((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = '';
  }

  function removeStagedImage(id: string) {
    setStagedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!initialProduct) {
      toast.error('يرجى حفظ المنتج أولاً قبل رفع الصور');
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    let uploadFailures = 0;
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        try {
          const res = await api.post(`/admin/products/${initialProduct.id}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          setExistingImages((prev) => [...prev, res.data.image]);
        } catch {
          uploadFailures++;
        }
      }
      if (uploadFailures === 0) {
        toast.success(files.length > 1 ? 'تم رفع الصور بنجاح' : 'تم رفع الصورة بنجاح');
      } else {
        toast.error(`تعذر رفع ${uploadFailures} من الصور`);
      }
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  async function handleDeleteImage(imageId: number) {
    setDeletingImageId(imageId);
    try {
      await api.delete(`/admin/products/images/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('تم حذف الصورة');
    } catch (err) {
      toast.error(getErrorMessage(err, 'تعذر حذف الصورة'));
    } finally {
      setDeletingImageId(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="card-surface space-y-4 p-6">
        <h2 className="font-cairo text-lg font-bold text-ink-900">معلومات المنتج</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              الاسم (عربي)
            </label>
            <input
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              placeholder="اختياري — سيُعطى اسم افتراضي إن تُرك فارغاً"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              الاسم (إنجليزي)
            </label>
            <input
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              الرابط (slug) *
            </label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="abaya-royal-noir"
              dir="ltr"
              className="input-field text-right"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              الفئة *
            </label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="عباية / قفطان"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              السعر الأساسي (د.أ) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.basePrice}
              onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              سعر الخصم (د.أ)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="اتركه فارغاً لعدم وجود خصم"
              value={form.discountPrice}
              onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-900/40">
              إن تم تعبئته، سيظهر كسعر بيع بدلاً من السعر الأساسي (يجب أن يكون أقل منه)
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-900">الوصف</label>
          <textarea
            value={form.descriptionAr}
            onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
            rows={4}
            className="input-field"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            نشط (ظاهر في المتجر)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            منتج مميز
          </label>
        </div>
      </div>

      <div className="card-surface space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-cairo text-lg font-bold text-ink-900">المقاسات والألوان</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              placeholder="المقاس (مثال: M)"
              value={bulkColorSize}
              onChange={(e) => setBulkColorSize(e.target.value)}
              className="input-field !w-32 !py-2 text-sm"
            />
            <button
              type="button"
              onClick={addAllColors}
              className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 hover:underline"
            >
              <Plus className="h-4 w-4" /> إضافة كل الألوان
            </button>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 hover:underline"
            >
              <Plus className="h-4 w-4" /> إضافة متغير
            </button>
          </div>
        </div>
        <p className="-mt-2 text-xs text-ink-900/40">
          &ldquo;إضافة كل الألوان&rdquo; تضيف متغيراً لكل لون من لوحة الألوان الجاهزة للمقاس المدخل،
          حتى تتمكن الزبونة من اختيار اللون الذي تفضله.
        </p>

        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-3 rounded-xl border border-ink-900/10 p-4 md:grid-cols-6"
            >
              <input
                placeholder="المقاس"
                value={variant.size}
                onChange={(e) => updateVariant(index, 'size', e.target.value)}
                className="input-field !py-2 text-sm"
              />
              <input
                placeholder="اللون"
                value={variant.colorName}
                onChange={(e) => updateVariant(index, 'colorName', e.target.value)}
                className="input-field !py-2 text-sm"
              />
              <input
                type="color"
                value={variant.colorHex}
                onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                className="h-[42px] w-full rounded-lg border border-ink-900/10"
              />
              <input
                placeholder="SKU"
                value={variant.sku}
                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                dir="ltr"
                className="input-field !py-2 text-sm text-right"
              />
              <input
                type="number"
                placeholder="المخزون"
                min="0"
                value={variant.stockQuantity}
                onChange={(e) => updateVariant(index, 'stockQuantity', Number(e.target.value))}
                className="input-field !py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="سعر مخصص (اختياري)"
                  value={variant.priceOverride}
                  onChange={(e) => updateVariant(index, 'priceOverride', e.target.value)}
                  className="input-field !py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="shrink-0 text-ink-900/30 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface space-y-4 p-6">
        <h2 className="font-cairo text-lg font-bold text-ink-900">صور المنتج</h2>

        {isEdit ? (
          <>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative h-24 w-20 overflow-hidden rounded-lg bg-brand-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(img.imageUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={deletingImageId === img.id}
                    aria-label="حذف الصورة"
                    className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {existingImages.length === 0 && (
                <p className="text-sm text-ink-900/40">لا توجد صور بعد</p>
              )}
            </div>
            <label className="btn-secondary w-fit cursor-pointer">
              {uploadingImage ? 'جاري الرفع...' : 'رفع صورة جديدة'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
                multiple
              />
            </label>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              {stagedImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative h-24 w-20 overflow-hidden rounded-lg bg-brand-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeStagedImage(img.id)}
                    aria-label="إزالة الصورة"
                    className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {stagedImages.length === 0 && (
                <p className="text-sm text-ink-900/40">لم يتم اختيار صور بعد</p>
              )}
            </div>
            <label className="btn-secondary w-fit cursor-pointer">
              اختيار صور
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleStageImages}
                className="hidden"
                multiple
              />
            </label>
            <p className="text-xs text-ink-900/40">
              سيتم رفع الصور المختارة تلقائياً بعد إنشاء المنتج مباشرة
            </p>
          </>
        )}
        <p className="text-xs text-ink-900/40">JPEG, PNG أو WEBP — حتى 5MB لكل صورة</p>
      </div>

      <Button type="submit" loading={submitting}>
        {isEdit ? 'حفظ التغييرات' : 'إنشاء المنتج'}
      </Button>
    </form>
  );
}
