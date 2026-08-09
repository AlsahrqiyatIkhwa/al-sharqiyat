import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AdminJwtPayload {
  adminId: number;
  username: string;
  role: string;
}

export function signAccessToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtAccessExpiresIn } as jwt.SignOptions);
}

export function signRefreshToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): AdminJwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as AdminJwtPayload;
}

/** Refresh tokens are stored in the DB as SHA-256 hashes, never raw. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
