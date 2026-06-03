// ============================================================
//  infrastructure/realtime/notification.service.ts
//  Crea notificaciones en BD y las transmite por Supabase Realtime.
// ============================================================

import { Prisma, TipoNotificacion } from '@prisma/client';
import { prisma } from '../database/prisma.client';
import { logger } from '../../shared/logger/logger';

export interface CrearNotificacionParams {
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  urlDestino?: string;
  metadatos?: Record<string, unknown>;
}

/**
 * Crea una notificación para uno o más usuarios.
 * Supabase Realtime difunde el INSERT automáticamente
 * a los clientes suscritos.
 */
export async function crearNotificacion(
  params: CrearNotificacionParams,
): Promise<void> {
  try {
    await prisma.notificacion.create({
      data: {
        usuarioId: params.usuarioId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensaje: params.mensaje,
        urlDestino: params.urlDestino,
        metadatos: params.metadatos as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error('Error al crear notificación:', err);
  }
}

/**
 * Crea notificaciones para múltiples usuarios a la vez.
 */
export async function crearNotificacionMasiva(
  usuarioIds: string[],
  params: Omit<CrearNotificacionParams, 'usuarioId'>,
): Promise<void> {
  if (usuarioIds.length === 0) return;

  try {
    await prisma.notificacion.createMany({
      data: usuarioIds.map((usuarioId) => ({
        usuarioId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensaje: params.mensaje,
        urlDestino: params.urlDestino,
        metadatos: params.metadatos as Prisma.InputJsonValue | undefined,
      })),
    });
  } catch (err) {
    logger.error('Error al crear notificaciones masivas:', err);
  }
}

// ─── Helpers de notificaciones específicas ───────────────────

export async function notificarTrasladoSolicitado(params: {
  encargadoId: string;
  coordinadorIds: string[];
  solicitanteNombre: string;
  itemNombre: string;
  ambienteDestinoNombre: string;
  solicitudId: string;
  esInterNave: boolean;
}): Promise<void> {
  const destinatarios = params.esInterNave
    ? params.coordinadorIds
    : [params.encargadoId];

  await crearNotificacionMasiva(destinatarios, {
    tipo: TipoNotificacion.traslado_solicitado,
    titulo: 'Nueva solicitud de traslado',
    mensaje: `${params.solicitanteNombre} solicita trasladar "${params.itemNombre}" al ambiente ${params.ambienteDestinoNombre}.`,
    urlDestino: `/traslados/${params.solicitudId}`,
    metadatos: { solicitudId: params.solicitudId },
  });
}

export async function notificarItemDanado(params: {
  servicioIds: string[];
  itemNombre: string;
  itemNumero: string;
  naveNombre: string;
  ambienteNombre: string;
  itemId: number;
}): Promise<void> {
  await crearNotificacionMasiva(params.servicioIds, {
    tipo: TipoNotificacion.item_danado_reportado,
    titulo: 'Ítem dañado reportado',
    mensaje: `El ítem "${params.itemNombre}" (${params.itemNumero}) ha sido marcado como dañado en ${params.naveNombre} — ${params.ambienteNombre}.`,
    urlDestino: `/bodega/items/${params.itemId}`,
    metadatos: { itemId: params.itemId },
  });
}

export async function notificarVerificacionEnviada(params: {
  encargadoId: string;
  instructorNombre: string;
  ambienteNombre: string;
  verificacionId: string;
  tipo: 'entrada' | 'salida';
}): Promise<void> {
  await crearNotificacion({
    usuarioId: params.encargadoId,
    tipo: TipoNotificacion.verificacion_enviada,
    titulo: 'Verificación de inventario recibida',
    mensaje: `${params.instructorNombre} envió una verificación de ${params.tipo} del ambiente ${params.ambienteNombre}.`,
    urlDestino: `/verificaciones/${params.verificacionId}`,
    metadatos: { verificacionId: params.verificacionId },
  });
}