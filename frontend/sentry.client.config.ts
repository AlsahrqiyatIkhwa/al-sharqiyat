import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    // Never capture request/response bodies from the browser session replay
    // or breadcrumbs — checkout forms carry customer names/phones/addresses.
    sendDefaultPii: false,
  });
}
