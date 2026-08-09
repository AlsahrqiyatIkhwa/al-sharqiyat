import rateLimit from 'express-rate-limit';

/** Strict limiter for admin login — brute-force protection */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'محاولات دخول كثيرة جداً، يرجى المحاولة لاحقاً بعد 15 دقيقة',
  },
});

/** Prevents order-spam / abuse of the public checkout endpoint */
export const orderCreationRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'عدد كبير من الطلبات خلال وقت قصير، يرجى المحاولة لاحقاً',
  },
});

/** Prevents brute-force scanning of tracking codes on the public tracking endpoint */
export const orderTrackingRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'عدد كبير من محاولات البحث، يرجى المحاولة لاحقاً',
  },
});

/** General API limiter as a baseline safety net */
export const generalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Prevents review spam on the public review submission endpoint */
export const reviewCreationRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'عدد كبير من التقييمات خلال وقت قصير، يرجى المحاولة لاحقاً',
  },
});

/** Prevents wishlist add/remove abuse from a single device/IP */
export const wishlistRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
