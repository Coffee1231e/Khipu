// ============================================================
//  config/env.ts
//  Valida y exporta todas las variables de entorno al arrancar.
//  Si falta alguna variable obligatoria, el proceso falla
//  inmediatamente con un mensaje claro.
// ============================================================

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  DIRECT_URL: z.string().url('DIRECT_URL debe ser una URL válida'),

  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY requerida'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  EMAIL_USER: z.string().email().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  SENTRY_ENABLED: z.string().default('false').transform((v) => v === 'true'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌  Variables de entorno inválidas o faltantes:\n');
  parsed.error.issues.forEach((issue) => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nRevisa tu archivo .env y asegúrate de que todas las variables estén definidas.\n');
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
