'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Review } from '@/types';
import { Button } from '@/components/ui/Button';

function StarRow({ rating, size = 'h-4 w-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-ink-900/15'}`}
        />
      ))}
    </div>
  );
}

interface ReviewFormState {
  orderCode: string;
  customerPhone: string;
  rating: number;
  comment: string;
}

const EMPTY_FORM: ReviewFormState = { orderCode: '', customerPhone: '', rating: 5, comment: '' };

export function ReviewsSection({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReviewFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/reviews', { params: { productId, limit: 20 } });
      setReviews(res.data.items);
      setAverageRating(res.data.averageRating);
      setReviewCount(res.data.reviewCount);
    } catch {
      // Silent — reviews are a nice-to-have, not critical path
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function handleChange<K extends keyof ReviewFormState>(key: K, value: ReviewFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.orderCode.trim()) next.orderCode = 'رقم الطلب مطلوب';
    if (!/^07[789]\d{7}$/.test(form.customerPhone.trim())) {
      next.customerPhone = 'رقم هاتف أردني غير صحيح، مثال: 0791234567';
    }
    if (form.rating < 1 || form.rating > 5) next.rating = 'يرجى اختيار تقييم';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        productId,
        orderCode: form.orderCode.trim(),
        customerPhone: form.customerPhone.trim(),
        rating: form.rating,
        comment: form.comment.trim() || undefined,
      });
      toast.success('شكراً لتقييمك!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'تعذر إرسال التقييم'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 border-t border-ink-900/10 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-cairo text-lg font-bold text-ink-900">التقييمات</h2>
          {averageRating !== null ? (
            <div className="mt-1 flex items-center gap-2">
              <StarRow rating={averageRating} />
              <span className="text-sm text-ink-900/60">
                {averageRating} ({reviewCount} تقييم)
              </span>
            </div>
          ) : (
            !loading && <p className="mt-1 text-sm text-ink-900/50">لا توجد تقييمات بعد</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          {showForm ? 'إلغاء' : 'أضيفي تقييمك'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-surface space-y-4 p-5">
          <p className="text-xs text-ink-900/50">
            التقييم متاح فقط لمن قامت بشراء هذا المنتج — أدخلي رقم الطلب ورقم الهاتف المستخدمين عند الشراء.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-900">
                رقم الطلب <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.orderCode}
                onChange={(e) => handleChange('orderCode', e.target.value)}
                placeholder="SHRQ-202607-0001"
                className="input-field text-right"
              />
              {errors.orderCode && <p className="mt-1 text-xs text-red-500">{errors.orderCode}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-900">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={form.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                placeholder="07XXXXXXXX"
                className="input-field text-right"
              />
              {errors.customerPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.customerPhone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">التقييم</label>
            <div className="flex items-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleChange('rating', n)}
                  aria-label={`${n} نجوم`}
                >
                  <Star
                    className={`h-7 w-7 ${n <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-900/15'}`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">
              تعليق (اختياري)
            </label>
            <textarea
              value={form.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="شاركينا تجربتك مع المنتج..."
              className="input-field"
            />
          </div>

          <Button type="submit" loading={submitting}>
            إرسال التقييم
          </Button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card-surface animate-pulse space-y-2 p-4">
              <div className="h-3 w-24 rounded bg-ink-900/10" />
              <div className="h-3 w-full rounded bg-ink-900/10" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card-surface space-y-1.5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{r.customerName}</p>
                <StarRow rating={r.rating} />
              </div>
              {r.comment && <p className="text-sm leading-relaxed text-ink-900/70">{r.comment}</p>}
              <p className="text-[11px] text-ink-900/40">
                {new Date(r.createdAt).toLocaleDateString('ar-JO')}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
