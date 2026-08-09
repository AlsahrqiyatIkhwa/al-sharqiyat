import 'dotenv/config';

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

/** Converts simple duration strings ("30d", "15m", "8h", "45s") to milliseconds. */
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(d|h|m|s)$/.exec(duration.trim());
  if (!match) return 30 * 24 * 60 * 60 * 1000; // safe default: 30 days
  const value = Number(match[1]);
  const unitMs = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1_000 }[match[2] as 'd' | 'h' | 'm' | 's'];
  return value * unitMs;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  clientUrl: required('CLIENT_URL', 'http://localhost:3000'),
  databaseUrl: required('DATABASE_URL'),

  // ---- Auth: short-lived access token (Bearer header) + rotating refresh
  // token (httpOnly cookie). Three genuinely independent secrets (access
  // JWT, refresh JWT, cookie-signing) with no fallback between them, so a
  // leak of one can never cascade into compromising the others. required()
  // with no fallback also means startup fails loudly if any is unset,
  // rather than silently reusing JWT_SECRET everywhere.
  jwtSecret: required('JWT_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  jwtRefreshExpiresInMs: parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN || '30d'),
  cookieSecret: required('COOKIE_SECRET'),

  // ---- Login brute-force protection ----
  loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10),
  loginLockMinutes: parseInt(process.env.LOGIN_LOCK_MINUTES || '15', 10),

  // ---- Observability ----
  sentryDsn: process.env.SENTRY_DSN || '',
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // ---- Caching ----
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),

  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  // ---- File storage ----
  // "local" (default, unchanged behaviour) writes to disk under uploadDir —
  // fine for development, but Railway's filesystem does NOT persist across
  // redeploys, so production should switch to "s3" once a bucket exists.
  // "s3" works with AWS S3 or any S3-compatible provider (Cloudflare R2,
  // Backblaze B2, etc.) via S3_ENDPOINT.
  storage: {
    driver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
    s3Bucket: process.env.S3_BUCKET || '',
    s3Region: process.env.S3_REGION || 'auto',
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    // Leave empty for real AWS S3; set for S3-compatible providers (R2, B2).
    s3Endpoint: process.env.S3_ENDPOINT || '',
    // Public base URL used to build the imageUrl saved to the DB, e.g. a
    // CDN domain or the bucket's public endpoint. Falls back to a direct
    // S3-style URL derived from bucket+region if not set.
    s3PublicUrlBase: process.env.S3_PUBLIC_URL_BASE || '',
  },
  adminWhatsappNumber: process.env.ADMIN_WHATSAPP_NUMBER || '',
  adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:3000/admin',
  whatsapp: {
    // WhatsApp Business Cloud API (Meta) credentials. When either is
    // missing, the service falls back to a "dry-run" mode that only logs
    // the message instead of calling the API — so local/dev environments
    // never crash or silently fail order creation because of WhatsApp.
    apiToken: process.env.WHATSAPP_API_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
  },
  orangeMoney: {
    // Merchant Orange Money number customers send the deposit to. Display
    // string only — verification is manual by an admin, there is no
    // payment-gateway API integration.
    merchantNumber: process.env.ORANGE_MONEY_MERCHANT_NUMBER || '',
    merchantName: process.env.ORANGE_MONEY_MERCHANT_NAME || '',
    // Fraction of the order total required as an upfront deposit (0.20 = 20%)
    depositRate: parseFloat(process.env.ORANGE_MONEY_DEPOSIT_RATE || '0.25'),
  },
  manualPayment: {
    receiverName: process.env.MANUAL_PAYMENT_RECEIVER_NAME || '',
    country: process.env.MANUAL_PAYMENT_COUNTRY || '',
    instructions:
      process.env.MANUAL_PAYMENT_INSTRUCTIONS ||
      'يرجى إرسال المبلغ عبر ويسترن يونيون إلى الاسم والدولة الظاهرين أعلاه، ثم إرسال صورة إيصال التحويل عبر واتساب مع رقم الطلب لتأكيد الشحن.',
    bankTransferDetails: process.env.MANUAL_PAYMENT_BANK_DETAILS || '',
  },
  email: {
    // SMTP credentials for the admin new-order notification email. When
    // host/user/pass are missing, the email service falls back to a
    // "dry-run" mode that only logs the message — same pattern as WhatsApp
    // above — so a missing/misconfigured mailbox can never break checkout.
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    // Fixed recipient for new-order alerts — the shop's own inbox.
    adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'alsharqiyat.erbed@gmail.com',
  },
  isProd: process.env.NODE_ENV === 'production',
};
