import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Human-friendly console output in dev, structured JSON in prod (so log
// aggregators like Railway/Datadog/CloudWatch can parse & index fields).
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${stack || message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const winstonLogger = winston.createLogger({
  level: env.logLevel,
  format: env.isProd ? prodFormat : devFormat,
  defaultMeta: { service: 'al-sharqiyat-api' },
  transports: [
    new winston.transports.Console(),
    // Persisted files for post-incident review; rotate externally via the
    // platform's log retention (Railway/PaaS) rather than an in-process
    // rotator, to keep the container filesystem lean.
    ...(env.isProd
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  exitOnError: false,
});

// Thin wrapper so every existing call site (`logger.info(...)`, etc.) keeps
// working unchanged — only the implementation underneath moved to Winston.
export const logger = {
  info: (msg: string, meta?: unknown) => winstonLogger.info(msg, meta ? { meta } : undefined),
  warn: (msg: string, meta?: unknown) => winstonLogger.warn(msg, meta ? { meta } : undefined),
  error: (msg: string, meta?: unknown) => winstonLogger.error(msg, meta ? { meta } : undefined),
  debug: (msg: string, meta?: unknown) => winstonLogger.debug(msg, meta ? { meta } : undefined),
};

// Morgan HTTP request logging streams through Winston too, so all logs share
// one format/output pipeline.
export const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};
