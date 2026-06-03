// ============================================================
//  interface/middleware/rateLimit.middleware.ts
// ============================================================

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../../shared/config/env';
import { TooManyRequestsError } from '../../shared/errors/AppError';

/**
 * Rate limit general para todas las rutas de la API.
 */
export const generalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError());
  },
  keyGenerator: (req) => {
    // Usa el ID de usuario si está autenticado, si no usa la IP
    return (req as Express.Request & { usuario?: { id: string } }).usuario?.id
    ?? ipKeyGenerator(req.ip ?? '');
  },
});

/**
 * Rate limit estricto para autenticación (evitar fuerza bruta).
 * Máx. 10 intentos por 15 minutos por IP.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError(
      `Demasiados intentos de inicio de sesión. Espera 15 minutos antes de intentar de nuevo.`,
    ));
  },
  skipSuccessfulRequests: true, // No contar los logins exitosos
});

/**
 * Rate limit para carga de archivos (fotos de ítems).
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError(
      'Límite de subida de archivos alcanzado. Espera un momento.',
    ));
  },
});

/**
 * Rate limit para envío de emails (2FA, bienvenida, etc).
 */
export const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError(
      'Límite de envío de correos alcanzado. Espera 1 hora.',
    ));
  },
});
