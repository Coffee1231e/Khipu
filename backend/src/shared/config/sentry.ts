// ============================================================
//  config/sentry.ts
//  Configuración de Sentry para monitoreo de errores.
//  Se activa/desactiva con SENTRY_ENABLED en .env
// ============================================================

import * as Sentry from '@sentry/node';
import { env } from './env';

export function initSentry(): void {
  if (!env.SENTRY_ENABLED || !env.SENTRY_DSN) {
    console.log('ℹ️  Sentry desactivado (SENTRY_ENABLED=false o SENTRY_DSN vacío)');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });

  console.log(`✅  Sentry activo — entorno: ${env.NODE_ENV}`);
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!env.SENTRY_ENABLED || !env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export { Sentry };
