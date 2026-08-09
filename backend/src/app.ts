import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { generalApiRateLimiter } from './middlewares/rateLimit.middleware';
import { morganStream } from './utils/logger';

import productRoutes from './modules/products/product.routes';
import productAdminRoutes from './modules/products/product.admin.routes';
import orderRoutes from './modules/orders/order.routes';
import orderAdminRoutes from './modules/orders/order.admin.routes';
import shippingRoutes from './modules/shipping/shipping.routes';
import settingsRoutes from './modules/settings/settings.routes';
import adminAuthRoutes from './modules/admin-auth/admin-auth.routes';
import adminStatsRoutes from './modules/admin-stats/admin-stats.routes';
import auditRoutes from './modules/audit/audit.routes';
import reviewRoutes from './modules/reviews/review.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';

const app = express();

// Railway/most PaaS run behind a reverse proxy — needed so `req.ip` and
// `secure` cookie detection reflect the real client, not the proxy hop.
app.set('trust proxy', 1);

// ---- Core security & parsing middlewares ----
app.use(
  helmet({
    // API-only service (no HTML views), so a locked-down CSP is safe here —
    // it mainly protects the /uploads static file route from being abused
    // as an XSS vector if a malicious file type ever slips through.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        imgSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));
app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: morganStream }));
app.use(generalApiRateLimiter);

// ---- Static file serving for uploaded product images ----
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), env.uploadDir), {
    maxAge: '7d',
    immutable: true,
  })
);

// ---- Static file serving for seed-data placeholder product images ----
// The seed script references image paths like /products/<slug>-1.jpg;
// this mounts backend/public/products at that same URL path so those
// seeded records resolve instead of 404ing.
app.use(
  '/products',
  express.static(path.join(process.cwd(), 'public', 'products'), {
    maxAge: '7d',
  })
);

// ---- Health check ----
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'al-sharqiyat-api' }));

// ---- Public API ----
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping-zones', shippingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);

// ---- Admin API ----
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/products', productAdminRoutes);
app.use('/api/admin/orders', orderAdminRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/admin/audit-logs', auditRoutes);

// ---- 404 + centralized error handling (must be last) ----
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
