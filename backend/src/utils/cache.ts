import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// A single process-local cache is enough here — this is a small catalog
// (dozens to low hundreds of products), not a multi-instance high-traffic
// deployment. If the app is later scaled horizontally, swap this for Redis
// without changing any call sites (same get/set/del/flush interface).
export const cache = new NodeCache({
  stdTTL: env.cacheTtlSeconds,
  checkperiod: Math.max(30, Math.floor(env.cacheTtlSeconds / 2)),
  useClones: false,
});

/**
 * Caches successful (2xx) JSON GET responses for `ttlSeconds`, keyed by full
 * URL (including query string). Only applied to public, unauthenticated
 * routes — admin routes always read fresh data.
 */
export function cacheResponse(ttlSeconds: number = env.cacheTtlSeconds) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `route:${req.originalUrl}`;
    const cached = cache.get<{ body: unknown; }>(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      return res.json(cached.body);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, { body }, ttlSeconds);
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      }
      return originalJson(body);
    };
    next();
  };
}

/** Clears every cached public GET response. Call after any admin write. */
export function invalidatePublicCache() {
  cache.flushAll();
}
