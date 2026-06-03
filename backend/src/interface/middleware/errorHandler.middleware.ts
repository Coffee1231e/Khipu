// ============================================================
//  interface/middleware/errorHandler.middleware.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger/logger';
import { captureError } from '../../shared/config/sentry';
import { env } from '../../shared/config/env';

interface ErrorResponse {
  ok: false;
  codigo: string;
  mensaje: string;
  errores?: { campo: string; mensaje: string }[];
  stack?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ─── Zod ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const errores = err.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));
    res.status(422).json({
      ok: false,
      codigo: 'VALIDATION_ERROR',
      mensaje: 'Los datos enviados no son válidos.',
      errores,
    } satisfies ErrorResponse);
    return;
  }

  // ─── Prisma ──────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const e = handlePrismaError(err);
    res.status(e.status).json({ ok: false, codigo: e.codigo, mensaje: e.mensaje } satisfies ErrorResponse);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      ok: false, codigo: 'DATABASE_VALIDATION_ERROR',
      mensaje: 'Error en los datos enviados a la base de datos.',
    } satisfies ErrorResponse);
    return;
  }

  // ─── AppError (operacional) ──────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      ok: false, codigo: err.codigo, mensaje: err.message,
    } satisfies ErrorResponse);
    return;
  }

  // ─── Error inesperado ────────────────────────────────────
  logger.error('Error inesperado:', { message: err.message, stack: err.stack, url: req.url, method: req.method });

  captureError(err, {
    url: req.url,
    method: req.method,
    userId: (req as Request & { usuario?: { id: string } }).usuario?.id,
  });

  res.status(500).json({
    ok: false,
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error interno del servidor. El equipo técnico ha sido notificado.',
    // isDev está exportado como constante separada en env.ts
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  } satisfies ErrorResponse);
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  status: number; codigo: string; mensaje: string;
} {
  switch (err.code) {
    case 'P2002': {
      const fields = (err.meta?.['target'] as string[])?.join(', ') ?? 'campo';
      return { status: 409, codigo: 'DUPLICATE_FIELD', mensaje: `Ya existe un registro con ese valor en: ${fields}.` };
    }
    case 'P2025':
      return { status: 404, codigo: 'NOT_FOUND', mensaje: 'El registro solicitado no existe.' };
    case 'P2003':
      return { status: 409, codigo: 'FOREIGN_KEY_CONSTRAINT', mensaje: 'No se puede realizar la operación: el registro está relacionado con otros datos.' };
    case 'P2014':
      return { status: 409, codigo: 'RELATION_VIOLATION', mensaje: 'La operación viola las relaciones entre los datos.' };
    default:
      logger.error(`Prisma error no manejado: ${err.code}`, err);
      return { status: 500, codigo: 'DATABASE_ERROR', mensaje: 'Error al procesar la operación en la base de datos.' };
  }
}
