import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/db';
import { initSentry } from './config/sentry';
import { Sentry } from './config/sentry';

initSentry();

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(env.port, () => {
      logger.info(`🚀 Al-Sharqiyat API running on http://localhost:${env.port}`);
      logger.info(`   Environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
  Sentry.captureException(reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — process will exit', err);
  Sentry.captureException(err);
  process.exit(1);
});

bootstrap();
