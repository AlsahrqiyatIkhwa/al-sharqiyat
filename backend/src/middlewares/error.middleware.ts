import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { Sentry } from '../config/sentry';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `المسار غير موجود: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  // Known Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'القيمة موجودة مسبقاً (تعارض في بيانات فريدة)',
        field: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'العنصر غير موجود' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'مرجع بيانات غير صالح' });
    }
  }

  // Our own ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // Unknown errors — never leak stack traces in production
  logger.error('Unhandled error', err);
  Sentry.captureException(err, { extra: { path: req.originalUrl, method: req.method } });
  return res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع في الخادم',
    ...(env.isProd ? {} : { debug: err instanceof Error ? err.stack : err }),
  });
}
