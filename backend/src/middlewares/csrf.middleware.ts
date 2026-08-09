import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Our admin API is otherwise CSRF-immune by design (the access token is a
 * Bearer header, which browsers never attach automatically cross-site).
 * The one exception is the refresh-token flow, which necessarily relies on
 * an httpOnly cookie so client-side JS can never read the refresh token
 * itself. That cookie *is* auto-attached cross-site, so /refresh and
 * /logout are protected with a classic double-submit token: a second,
 * non-httpOnly cookie whose value must be echoed back in a custom header.
 * A cross-site attacker can trigger the request but can't read the cookie
 * to put its value in the header (same-origin policy blocks that read).
 */
export function issueCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: env.isProd,
    // Same cross-site reasoning as the refresh cookie above — the frontend
    // and backend are on different domains in production.
    sameSite: env.isProd ? 'none' : 'lax',
    // Must be readable via document.cookie from any frontend page (e.g.
    // /admin/dashboard on the Next.js app), not just backend API paths —
    // a cookie's path is matched against the *current document's* path
    // when JS reads document.cookie, not the target request URL. Scoping
    // this to '/api/admin/auth' meant the frontend could never see it,
    // so the CSRF check on /refresh always failed after login.
    path: '/',
    maxAge: env.jwtRefreshExpiresInMs,
  });
  return token;
}

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(ApiError.forbidden('فشل التحقق من CSRF — يرجى إعادة تسجيل الدخول'));
  }
  next();
}
