// ============================================================
//  infrastructure/database/auditLog.service.ts
//  Registra automáticamente cambios importantes en la BD.
//  Se llama desde los use-cases después de cada operación.
// ============================================================

import { Prisma, Rol } from '@prisma/client';
import { prisma } from './prisma.client';
import { logger } from '../../shared/logger/logger';

export interface AuditLogParams {
  usuarioId: string;
  rolUsuario: Rol;
  entidad: 'item' | 'categoria' | 'usuario' | 'nave' | 'ambiente' | 'ficha' | 'traslado' | 'mantenimiento' | 'configuracion';
  entidadId: string;
  accion: 'creacion' | 'edicion' | 'baja' | 'activacion' | 'desactivacion' | 'asignacion' | 'traslado' | 'mantenimiento' | 'devolucion';
  area: 'bodega' | 'ambiente' | 'mantenimiento' | 'usuarios' | 'configuracion' | 'naves_ambientes';
  camposAntes?: Record<string, unknown> | null;
  camposDespues?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
  itemId?: number;
}

/**
 * Registra un evento de auditoría en la base de datos.
 * No lanza errores — un fallo en el log no debe interrumpir
 * la operación principal.
 */
export async function registrarAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: params.usuarioId,
        rolUsuario: params.rolUsuario,
        entidad: params.entidad,
        entidadId: params.entidadId,
        accion: params.accion,
        area: params.area,
        camposAntes: params.camposAntes as Prisma.InputJsonValue | undefined,
        camposDespues: params.camposDespues as Prisma.InputJsonValue | undefined,
        ip: params.ip,
        userAgent: params.userAgent,
        itemId: params.itemId,
      },
    });
  } catch (err) {
    // Log del error pero no propagarlo
    logger.error('Error al registrar audit log:', err);
  }
}

/**
 * Calcula la diferencia entre dos objetos para mostrar qué cambió.
 * Solo retorna los campos que son diferentes.
 */
export function calcularDiff(
  antes: Record<string, unknown>,
  despues: Record<string, unknown>,
): { antes: Record<string, unknown>; despues: Record<string, unknown> } {
  const camposAntes: Record<string, unknown> = {};
  const camposDespues: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(antes), ...Object.keys(despues)]);

  for (const key of allKeys) {
    // Ignorar campos internos y timestamps
    if (['actualizadoEn', 'passwordHash', 'creadoEn'].includes(key)) continue;

    const valorAntes = antes[key];
    const valorDespues = despues[key];

    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDespues)) {
      camposAntes[key] = valorAntes;
      camposDespues[key] = valorDespues;
    }
  }

  return { antes: camposAntes, despues: camposDespues };
}