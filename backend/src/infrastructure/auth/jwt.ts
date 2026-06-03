// ============================================================
//  infrastructure/auth/jwt.ts
// ============================================================

import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../shared/config/env';
import { UnauthorizedError } from '../../shared/errors/AppError';

export interface JWTPayload {
  sub: string;
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  // expiresIn accepts string values like '8h', '1d' at runtime.
  // The @types/jsonwebtoken StringValue branded type causes TS strict errors,
  // so we cast through SignOptions to satisfy the compiler.
  const options = {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'khipu-api',
    audience: 'khipu-app',
  } as SignOptions;

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'khipu-api',
      audience: 'khipu-app',
    }) as JWTPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    }
    throw new UnauthorizedError('Token de autenticación inválido.');
  }
}
