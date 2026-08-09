import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prevent multiple PrismaClient instances in dev (hot-reload) — standard singleton pattern
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (!env.isProd) {
  globalForPrisma.prisma = prisma;
}
