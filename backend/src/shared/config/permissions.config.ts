// ============================================================
//  config/permissions.config.ts
//  Matriz centralizada de permisos por rol.
//  PRINCIPIO: Los permisos de seguridad críticos están en código.
//  Para añadir un nuevo permiso: agregar aquí + en el middleware.
//  Para una futura migración a PBAC dinámico, este archivo
//  es el punto único de cambio.
// ============================================================

import { Rol } from '@prisma/client';

// ─── Definición de acciones disponibles ──────────────────────

export const ACCIONES = {
  // Bodega
  BODEGA_VER: 'bodega:ver',
  BODEGA_CREAR_ITEM: 'bodega:crear_item',
  BODEGA_EDITAR_ITEM: 'bodega:editar_item',
  BODEGA_ASIGNAR_ITEM: 'bodega:asignar_item',
  BODEGA_DAR_BAJA: 'bodega:dar_baja',          // Requiere 2FA

  // Categorías
  CATEGORIAS_VER: 'categorias:ver',
  CATEGORIAS_CREAR: 'categorias:crear',
  CATEGORIAS_EDITAR: 'categorias:editar',
  CATEGORIAS_ELIMINAR: 'categorias:eliminar',

  // Inventario (vista por nave/ambiente)
  INVENTARIO_VER_TODO: 'inventario:ver_todo',
  INVENTARIO_VER_NAVE: 'inventario:ver_nave',
  INVENTARIO_VER_AMBIENTE: 'inventario:ver_ambiente',
  INVENTARIO_VER_DANADOS: 'inventario:ver_danados',

  // Traslados
  TRASLADO_SOLICITAR: 'traslado:solicitar',
  TRASLADO_APROBAR_MISMA_NAVE: 'traslado:aprobar_misma_nave',
  TRASLADO_APROBAR_INTER_NAVE: 'traslado:aprobar_inter_nave',  // Requiere 2FA
  TRASLADO_VER_TODO: 'traslado:ver_todo',
  TRASLADO_VER_NAVE: 'traslado:ver_nave',
  TRASLADO_VER_AMBIENTE: 'traslado:ver_ambiente',
  TRASLADO_VER_BODEGA: 'traslado:ver_bodega',

  // Verificaciones
  VERIFICACION_CREAR: 'verificacion:crear',
  VERIFICACION_VER_TODO: 'verificacion:ver_todo',
  VERIFICACION_VER_NAVE: 'verificacion:ver_nave',
  VERIFICACION_VER_AMBIENTE: 'verificacion:ver_ambiente',
  VERIFICACION_VER_PROPIAS: 'verificacion:ver_propias',

  // Mantenimiento
  MANTENIMIENTO_SOLICITAR: 'mantenimiento:solicitar',
  MANTENIMIENTO_GESTIONAR: 'mantenimiento:gestionar',
  MANTENIMIENTO_VER: 'mantenimiento:ver',

  // Usuarios
  USUARIOS_VER: 'usuarios:ver',
  USUARIOS_CREAR: 'usuarios:crear',                // Requiere 2FA
  USUARIOS_EDITAR: 'usuarios:editar',              // Requiere 2FA
  USUARIOS_DESACTIVAR: 'usuarios:desactivar',      // Requiere 2FA

  // Naves y ambientes
  NAVES_GESTIONAR: 'naves:gestionar',              // Requiere 2FA
  AMBIENTES_GESTIONAR: 'ambientes:gestionar',      // Requiere 2FA

  // Logs de auditoría
  LOGS_VER: 'logs:ver',

  // Configuración del sistema
  CONFIG_VER: 'config:ver',
  CONFIG_EDITAR: 'config:editar',

  // Notificaciones (todos los roles)
  NOTIFICACIONES_VER: 'notificaciones:ver',
  NOTIFICACIONES_MARCAR_LEIDA: 'notificaciones:marcar_leida',

  // Dashboard
  DASHBOARD_VER: 'dashboard:ver',
} as const;

export type Accion = typeof ACCIONES[keyof typeof ACCIONES];

// ─── Acciones que requieren 2FA activo ───────────────────────

export const ACCIONES_REQUIEREN_2FA: Set<Accion> = new Set([
  ACCIONES.BODEGA_DAR_BAJA,
  ACCIONES.TRASLADO_APROBAR_INTER_NAVE,
  ACCIONES.USUARIOS_CREAR,
  ACCIONES.USUARIOS_EDITAR,
  ACCIONES.USUARIOS_DESACTIVAR,
  ACCIONES.NAVES_GESTIONAR,
  ACCIONES.AMBIENTES_GESTIONAR,
]);

// ─── Matriz de permisos por rol ──────────────────────────────

export const PERMISOS_POR_ROL: Record<Rol, Set<Accion>> = {
  administrador: new Set([
    // Acceso total
    ...Object.values(ACCIONES) as Accion[],
  ]),

  almacen: new Set([
    ACCIONES.BODEGA_VER,
    ACCIONES.BODEGA_CREAR_ITEM,
    ACCIONES.BODEGA_EDITAR_ITEM,
    ACCIONES.BODEGA_ASIGNAR_ITEM,
    ACCIONES.BODEGA_DAR_BAJA,
    ACCIONES.CATEGORIAS_VER,
    ACCIONES.CATEGORIAS_CREAR,
    ACCIONES.CATEGORIAS_EDITAR,
    ACCIONES.CATEGORIAS_ELIMINAR,
    ACCIONES.BODEGA_VER,
    ACCIONES.TRASLADO_SOLICITAR,
    ACCIONES.TRASLADO_VER_BODEGA,
    ACCIONES.DASHBOARD_VER,
    ACCIONES.LOGS_VER,
    ACCIONES.NOTIFICACIONES_VER,
    ACCIONES.NOTIFICACIONES_MARCAR_LEIDA,
  ]),

  coordinador: new Set([
    ACCIONES.BODEGA_VER,
    ACCIONES.CATEGORIAS_VER,
    ACCIONES.TRASLADO_SOLICITAR,
    ACCIONES.TRASLADO_APROBAR_INTER_NAVE,
    ACCIONES.TRASLADO_VER_NAVE,
    ACCIONES.VERIFICACION_VER_NAVE,
    ACCIONES.DASHBOARD_VER,
    ACCIONES.NOTIFICACIONES_VER,
    ACCIONES.NOTIFICACIONES_MARCAR_LEIDA,
  ]),

  encargado: new Set([
    ACCIONES.BODEGA_VER,
    ACCIONES.CATEGORIAS_VER,
    ACCIONES.TRASLADO_SOLICITAR,
    ACCIONES.TRASLADO_APROBAR_MISMA_NAVE,
    ACCIONES.TRASLADO_VER_AMBIENTE,
    ACCIONES.VERIFICACION_CREAR,
    ACCIONES.VERIFICACION_VER_AMBIENTE,
    ACCIONES.MANTENIMIENTO_SOLICITAR,
    ACCIONES.DASHBOARD_VER,
    ACCIONES.NOTIFICACIONES_VER,
    ACCIONES.NOTIFICACIONES_MARCAR_LEIDA,
  ]),

  instructor: new Set([
    ACCIONES.BODEGA_VER,
    ACCIONES.CATEGORIAS_VER,
    ACCIONES.TRASLADO_SOLICITAR,
    ACCIONES.TRASLADO_VER_AMBIENTE,
    ACCIONES.VERIFICACION_CREAR,
    ACCIONES.VERIFICACION_VER_PROPIAS,
    ACCIONES.DASHBOARD_VER,
    ACCIONES.NOTIFICACIONES_VER,
    ACCIONES.NOTIFICACIONES_MARCAR_LEIDA,
  ]),

  servicio: new Set([
    ACCIONES.BODEGA_VER,
    ACCIONES.CATEGORIAS_VER,
    ACCIONES.MANTENIMIENTO_GESTIONAR,
    ACCIONES.MANTENIMIENTO_VER,
    ACCIONES.TRASLADO_VER_BODEGA,
    ACCIONES.DASHBOARD_VER,
    ACCIONES.NOTIFICACIONES_VER,
    ACCIONES.NOTIFICACIONES_MARCAR_LEIDA,
  ]),
};

/**
 * Verifica si un rol tiene un permiso específico.
 */
export function tienePermiso(rol: Rol, accion: Accion): boolean {
  return PERMISOS_POR_ROL[rol]?.has(accion) ?? false;
}

/**
 * Verifica si una acción requiere 2FA activo.
 */
export function requiere2FA(accion: Accion): boolean {
  return ACCIONES_REQUIEREN_2FA.has(accion);
}
