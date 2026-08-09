import { z } from 'zod';

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const variantSchema = z.object({
  size: z.string().min(1).max(20),
  colorName: z.string().min(1).max(50),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  sku: z.string().min(1).max(60),
  stockQuantity: z.coerce.number().int().min(0),
  priceOverride: z.coerce.number().positive().optional(),
});

export const createProductSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي أحرف لاتينية صغيرة وأرقام وشرطات فقط'),
  // Optional — if left empty, the service fills in a default name so every
  // product still has something to display and search by.
  nameAr: z.string().min(2).max(200).optional(),
  nameEn: z.string().max(200).optional(),
  descriptionAr: z.string().max(5000).optional(),
  category: z.string().min(2).max(60),
  basePrice: z.coerce.number().positive('السعر يجب أن يكون أكبر من صفر'),
  // Optional sale price shown instead of basePrice; validated against
  // basePrice in the service layer since that comparison needs both values
  // together (relevant on partial updates too).
  discountPrice: z.coerce.number().positive('سعر الخصم يجب أن يكون أكبر من صفر').optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  variants: z.array(variantSchema).min(1, 'يجب إضافة متغير واحد على الأقل (مقاس/لون)'),
});

export const updateProductSchema = createProductSchema.partial().extend({
  variants: z.array(variantSchema).optional(),
  // Allow explicitly clearing a discount (distinct from "not provided").
  discountPrice: z.coerce
    .number()
    .positive('سعر الخصم يجب أن يكون أكبر من صفر')
    .nullable()
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
