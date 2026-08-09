import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface AdminJwtPayload {
  adminId: number;
  username: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

/**
 * Protects admin-only routes. Expects `Authorization: Bearer <token>`.
 * This app has NO customer-facing auth by design — this middleware is
 * used exclusively for the /api/admin/* namespace.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('يرجى تسجيل الدخول للوصول إلى لوحة التحكم'));
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AdminJwtPayload;
    req.admin = payload;
    next();
  } catch {
    next(ApiError.unauthorized('جلسة الدخول منتهية أو غير صالحة'));
  }
}
