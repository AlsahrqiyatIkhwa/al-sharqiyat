import { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { logger } from '../../utils/logger';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'PRODUCT_IMAGE_UPLOAD'
  | 'PRODUCT_IMAGE_DELETE'
  | 'ORDER_STATUS_UPDATE';

interface AuditLogInput {
  adminId?: number | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | number;
  meta?: Record<string, unknown>;
  req?: Request;
}

function clientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? undefined;
}

export const auditService = {
  /**
   * Writes an audit log row. Never throws — a logging failure must never
   * break the admin action it's describing, so errors are swallowed and
   * reported to the app logger instead.
   */
  async log(input: AuditLogInput) {
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: input.adminId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId !== undefined ? String(input.entityId) : null,
          meta: input.meta ? (input.meta as Prisma.InputJsonValue) : undefined,
          ipAddress: clientIp(input.req),
          userAgent: input.req?.headers['user-agent']?.slice(0, 255),
        },
      });
    } catch (err) {
      logger.error('Failed to write audit log', err);
    }
  },

  async listForEntity(entityType: string, entityId: string | number) {
    return prisma.adminAuditLog.findMany({
      where: { entityType, entityId: String(entityId) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },

  async listRecent(limit = 100) {
    return prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
