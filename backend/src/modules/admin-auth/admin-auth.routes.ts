import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../utils/logger';
import { validate } from '../../middlewares/validate.middleware';
import { loginRateLimiter } from '../../middlewares/rateLimit.middleware';
import { requireAdminAuth } from '../../middlewares/auth.middleware';
import { requireCsrf, issueCsrfCookie, clearCsrfCookie } from '../../middlewares/csrf.middleware';
import { auditService } from '../audit/audit.service';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  AdminJwtPayload,
} from './token.util';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const REFRESH_COOKIE = 'refresh_token';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    // The frontend (Vercel) and backend (Railway) live on different
    // domains, so this cookie is cross-site by definition. SameSite=Strict
    // (or Lax) is NEVER sent on cross-site requests — that silently broke
    // /admin/auth/refresh in production, bouncing the admin straight back
    // to /admin/login right after a successful login. 'none' is required
    // for it to actually cross domains; it's safe here because /refresh is
    // already protected by the double-submit CSRF check below. Dev stays
    // 'lax' since SameSite=None requires Secure, and local dev runs on
    // plain http.
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/api/admin/auth',
    maxAge: env.jwtRefreshExpiresInMs,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/admin/auth' });
}

async function issueTokenPair(res: Response, admin: { id: number; username: string; role: string }, req: Request) {
  const payload: AdminJwtPayload = { adminId: admin.id, username: admin.username, role: admin.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      adminId: admin.id,
      expiresAt: new Date(Date.now() + env.jwtRefreshExpiresInMs),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']?.slice(0, 255),
    },
  });

  setRefreshCookie(res, refreshToken);
  issueCsrfCookie(res);
  return accessToken;
}

// POST /api/admin/auth/login
router.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const admin = await prisma.adminUser.findUnique({ where: { username } });

    // Same generic message whether the username exists or not, to avoid
    // leaking which usernames are valid via response differences.
    const invalidCredsError = () => ApiError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');

    if (!admin) {
      await auditService.log({ action: 'LOGIN_FAILED', entityType: 'AdminUser', entityId: username, req });
      throw invalidCredsError();
    }

    // ---- Brute-force lock check ----
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
      throw ApiError.forbidden(
        `الحساب مقفل مؤقتاً بسبب محاولات دخول فاشلة متكررة. حاولي مجدداً بعد ${minutesLeft} دقيقة`
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const shouldLock = attempts >= env.loginMaxAttempts;

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + env.loginLockMinutes * 60 * 1000)
            : null,
        },
      });

      await auditService.log({
        adminId: admin.id,
        action: shouldLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        entityType: 'AdminUser',
        entityId: admin.id,
        meta: { attempts },
        req,
      });

      if (shouldLock) {
        throw ApiError.forbidden(
          `تم قفل الحساب مؤقتاً لمدة ${env.loginLockMinutes} دقيقة بسبب محاولات دخول فاشلة متكررة`
        );
      }
      throw invalidCredsError();
    }

    // ---- Success: reset lockout counters, issue tokens ----
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const accessToken = await issueTokenPair(res, admin, req);
    await auditService.log({ adminId: admin.id, action: 'LOGIN_SUCCESS', entityType: 'AdminUser', entityId: admin.id, req });

    res.json({
      success: true,
      token: accessToken,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  })
);

// POST /api/admin/auth/refresh — rotates the refresh token on every use.
// CSRF-protected because it relies on the httpOnly cookie, not a header.
router.post(
  '/refresh',
  requireCsrf,
  asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.refresh_token;
    if (!rawToken) throw ApiError.unauthorized('لا توجد جلسة نشطة');

    let payload: AdminJwtPayload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      clearRefreshCookie(res);
      throw ApiError.unauthorized('جلسة منتهية، يرجى تسجيل الدخول مجدداً');
    }

    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    // Reuse of an already-revoked token is a strong signal of theft — if it
    // happens, revoke every session for this admin as a precaution.
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored?.revokedAt) {
        await prisma.refreshToken.updateMany({
          where: { adminId: payload.adminId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        logger.warn('Refresh token reuse detected — all sessions revoked', { adminId: payload.adminId });
      }
      clearRefreshCookie(res);
      throw ApiError.unauthorized('جلسة غير صالحة، يرجى تسجيل الدخول مجدداً');
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: payload.adminId } });
    if (!admin) throw ApiError.unauthorized('المستخدم غير موجود');

    // Rotate: revoke the presented token, issue a brand new pair.
    const newRefreshToken = signRefreshToken(payload);
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date(), replacedByHash: hashToken(newRefreshToken) },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          adminId: admin.id,
          expiresAt: new Date(Date.now() + env.jwtRefreshExpiresInMs),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']?.slice(0, 255),
        },
      }),
    ]);

    setRefreshCookie(res, newRefreshToken);
    issueCsrfCookie(res);
    const accessToken = signAccessToken({ adminId: admin.id, username: admin.username, role: admin.role });

    await auditService.log({ adminId: admin.id, action: 'TOKEN_REFRESH', entityType: 'AdminUser', entityId: admin.id, req });

    res.json({ success: true, token: accessToken });
  })
);

// POST /api/admin/auth/logout
router.post(
  '/logout',
  requireCsrf,
  asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.refresh_token;
    if (rawToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(rawToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearRefreshCookie(res);
    clearCsrfCookie(res);
    if (req.admin) {
      await auditService.log({ adminId: req.admin.adminId, action: 'LOGOUT', entityType: 'AdminUser', entityId: req.admin.adminId, req });
    }
    res.json({ success: true, message: 'تم تسجيل الخروج' });
  })
);

// GET /api/admin/auth/me — verifies current access token & returns admin profile
router.get(
  '/me',
  requireAdminAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, admin: req.admin });
  })
);

export default router;
