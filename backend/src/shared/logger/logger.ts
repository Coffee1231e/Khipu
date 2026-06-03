// ============================================================
//  shared/logger/logger.ts
//  Logger centralizado con Winston.
//  En desarrollo: output legible en consola
//  En producción: JSON estructurado (compatible con Railway logs)
// ============================================================

import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return stack
      ? `[${ts}] ${level}: ${message}\n${stack}`
      : `[${ts}] ${level}: ${message}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
  // No crashear el proceso si el logger falla
  exitOnError: false,
});

// Stream para Morgan (HTTP request logging)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
