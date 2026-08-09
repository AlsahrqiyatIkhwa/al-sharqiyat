import { z } from 'zod';

// Client generates this once (crypto.randomUUID()) and persists it in
// localStorage. It's an anonymous device identifier, not PII — no accounts
// exist in this storefront.
const deviceIdSchema = z
  .string()
  .trim()
  .min(8, 'معرف الجهاز غير صالح')
  .max(64, 'معرف الجهاز غير صالح');

export const listWishlistQuerySchema = z.object({
  deviceId: deviceIdSchema,
});

export const addWishlistSchema = z.object({
  deviceId: deviceIdSchema,
  productId: z.number().int().positive(),
});

export const removeWishlistParamsSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const removeWishlistQuerySchema = z.object({
  deviceId: deviceIdSchema,
});

export type AddWishlistInput = z.infer<typeof addWishlistSchema>;
