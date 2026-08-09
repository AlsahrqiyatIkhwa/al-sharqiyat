import * as Sentry from '@sentry/node';
import { env } from './env';

/**
 * Initializes Sentry error monitoring. Safe no-op when SENTRY_DSN is unset
 * (e.g. local dev) — the rest of the app never has to branch on whether
 * Sentry is configured.
 */
export function initSentry() {
  if (!env.sentryDsn) return;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.isProd ? 0.2 : 1.0,
    // Never send request bodies/cookies to Sentry — they can contain
    // passwords, JWTs, or customer PII (phone numbers, addresses).
    sendDefaultPii: false,
  });
}

export { Sentry };
