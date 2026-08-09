import { z } from 'zod';

const JORDAN_PHONE_REGEX = /^07[789]\d{7}$/;

export const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  orderCode: z.string().trim().min(1, 'يرجى إدخال رقم الطلب'),
  customerPhone: z
    .string()
    .trim()
    .regex(JORDAN_PHONE_REGEX, 'رقم هاتف أردني غير صحيح (مثال: 0791234567)'),
  rating: z.number().int().min(1, 'التقييم من 1 إلى 5').max(5, 'التقييم من 1 إلى 5'),
  // Trimmed and length-capped here; the DB column is also capped as a second guard.
  comment: z.string().trim().max(1000, 'التعليق طويل جداً').optional().or(z.literal('')),
});

export const listReviewsQuerySchema = z.object({
  productId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
