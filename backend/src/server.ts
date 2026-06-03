// ============================================================
//  server.ts — Punto de entrada del servidor Khipu API
// ============================================================

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env, corsOrigins } from './shared/config/env';
import { initSentry, Sentry } from './shared/config/sentry';
import { logger, morganStream } from './shared/logger/logger';
import { generalRateLimit } from './interface/middleware/rateLimit.middleware';
import { errorHandler } from './interface/middleware/errorHandler.middleware';
import router from './interface/routes/index';

// ─── Inicializar Sentry ──────────────────────────────────────
initSentry();

const app = express();

// ─── Seguridad HTTP ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─── Logging HTTP ────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));

// ─── Rate limiting global ────────────────────────────────────
app.use('/api', generalRateLimit);

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, version: '2.0.0', timestamp: new Date().toISOString() });
});

// ─── Rutas ───────────────────────────────────────────────────
app.use('/api', router);

// ─── 404 ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, codigo: 'NOT_FOUND', mensaje: 'Ruta no encontrada.' });
});

// ─── Sentry error handler (v10: setupExpressErrorHandler) ────
// expressRequestHandler / expressErrorHandler ya no existen en @sentry/node v8+
if (env.SENTRY_ENABLED && env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ─── Error handler global ────────────────────────────────────
app.use(errorHandler);

// ─── Iniciar servidor ────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Khipu API corriendo en http://localhost:${env.PORT}`);
  logger.info(`   Entorno: ${env.NODE_ENV}`);
  logger.info(`   CORS: ${corsOrigins.join(', ')}`);
});

// ─── Graceful shutdown ───────────────────────────────────────
const shutdown = (signal: string) => {
  logger.info(`${signal} — cerrando servidor...`);
  server.close(async () => {
    const { prisma } = await import('./infrastructure/database/prisma.client');
    await prisma.$disconnect();
    logger.info('Servidor cerrado.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('unhandledRejection:', reason));
process.on('uncaughtException',  (err)    => { logger.error('uncaughtException:', err); process.exit(1); });
