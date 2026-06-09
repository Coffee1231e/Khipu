// ============================================================
//  shared/types/index.ts — Tipos globales del frontend
// ============================================================

export type Rol =
  | 'administrador'
  | 'almacen'
  | 'coordinador'
  | 'encargado'
  | 'instructor'
  | 'servicio';

export type EstadoItem =
  | 'inactivo'
  | 'activo'
  | 'danado'
  | 'en_mantenimiento'
  | 'baja';

export type TipoMovimiento =
  | 'entrada'
  | 'asignacion'
  | 'traslado'
  | 'mantenimiento'
  | 'devolucion'
  | 'baja';

export type EstadoSolicitud = 'pendiente' | 'aceptado' | 'rechazado';

export type TipoNotificacion =
  | 'traslado_solicitado'
  | 'traslado_aceptado'
  | 'traslado_rechazado'
  | 'verificacion_enviada'
  | 'item_danado_reportado'
  | 'servicio_solicitado'
  | 'item_en_mantenimiento'
  | 'item_devuelto'
  | 'item_baja'
  | 'cuenta_creada'
  | 'contrasena_cambiada'
  | 'mantenimiento_completado';

// ─── Entidades ───────────────────────────────────────────────

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
  dosFA?: { activado: boolean; metodo: string | null };
  naves?: { nave: { id: string; nombre: string } }[];
  ambientes?: { ambiente: { id: string; nombre: string; naveId: string } }[];
}

export interface UsuarioAuth {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  tiene2FAActivo: boolean;
  naveIds: string[];
  ambienteIds: string[];
}

export interface Nave {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  creadoEn: string;
  _count?: { ambientes: number };
}

export interface Ambiente {
  id: string;
  nombre: string;
  descripcion?: string;
  naveId: string;
  activo: boolean;
  nave?: { id: string; nombre: string };
  _count?: { items: number };
}

export interface CategoriaItem {
  id: number;
  nombre: string;
  activo: boolean;
  _count?: { items: number };
}

export interface Item {
  id: number;
  numeroInventario: string;
  nombre: string;
  descripcion?: string;
  categoriaId: number;
  categoria?: CategoriaItem;
  naveId?: string;
  nave?: { id: string; nombre: string };
  ambienteId?: string;
  ambiente?: { id: string; nombre: string };
  estado: EstadoItem;
  activo: boolean;
  observaciones?: string;
  imagenUrl?: string;
  creadoEn: string;
  actualizadoEn: string;
  asignadoEn?: string;
  movimientos?: Movimiento[];
  creadoPor?: { id: string; nombre: string; rol: Rol };
}

export interface Movimiento {
  id: string;
  itemId: number;
  item?: { nombre: string; numeroInventario: string };
  usuarioId: string;
  usuario?: { nombre: string; rol: Rol };
  tipo: TipoMovimiento;
  ambienteOrigenId?: string;
  ambienteOrigen?: { nombre: string };
  ambienteDestinoId?: string;
  ambienteDestino?: { nombre: string };
  observaciones?: string;
  fecha: string;
}

export interface SolicitudTraslado {
  id: string;
  itemId: number;
  item?: { id: number; nombre: string; numeroInventario: string; imagenUrl?: string };
  solicitanteId: string;
  solicitante?: { nombre: string; rol: Rol };
  resolvedorId?: string;
  resolvedor?: { nombre: string };
  ambienteOrigenId: string;
  ambienteOrigen?: { nombre: string; nave?: { nombre: string } };
  ambienteDestinoId: string;
  ambienteDestino?: { nombre: string; nave?: { nombre: string } };
  estado: EstadoSolicitud;
  observaciones?: string;
  motivoRechazo?: string;
  esInterNave: boolean;
  creadoEn: string;
  resolvedoEn?: string;
}

export interface VerificacionInventario {
  id: string;
  usuarioId: string;
  usuario?: { nombre: string; rol: Rol };
  ambienteId: string;
  tipo: 'entrada' | 'salida';
  observaciones?: string;
  danosReportados?: boolean;
  creadoEn: string;
  detalles?: DetalleVerificacion[];
  _count?: { detalles: number };
}

export interface DetalleVerificacion {
  id: string;
  itemId: number;
  item?: { id: number; nombre: string; numeroInventario: string; imagenUrl?: string };
  estado: 'presente' | 'ausente' | 'danado';
}

export interface SolicitudMantenimiento {
  id: string;
  itemId: number;
  item?: { id: number; nombre: string; numeroInventario: string; imagenUrl?: string; nave?: { nombre: string }; ambiente?: { nombre: string } };
  solicitanteId: string;
  solicitante?: { nombre: string; rol: Rol };
  estado: EstadoSolicitud;
  descripcionFalla: string;
  observaciones?: string;
  creadoEn: string;
  completadoEn?: string;
  resultadoFinal?: string;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  urlDestino?: string;
  metadatos?: Record<string, unknown>;
  creadoEn: string;
  leidaEn?: string;
}

export interface AuditLog {
  id: string;
  usuarioId: string;
  usuario?: { nombre: string; email: string; rol: Rol };
  rolUsuario: Rol;
  entidad: string;
  entidadId: string;
  accion: string;
  area: string;
  camposAntes?: Record<string, unknown>;
  camposDespues?: Record<string, unknown>;
  ip?: string;
  creadoEn: string;
}

export interface ConfiguracionSistema {
  limiteAdministrador: number;
  limiteAlmacen: number;
  limiteCoordinador: number;
  limiteEncargado: number;
  limiteInstructor: number;
  limiteServicio: number;
}

// ─── Respuestas de API ───────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  mensaje?: string;
  data?: T;
}

export interface PaginacionMeta {
  total: number;
  pagina: number;
  limite: number;
  paginas?: number;
}

// ─── Labels de UI ────────────────────────────────────────────

export const ROL_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  almacen: 'Almacén',
  coordinador: 'Coordinador',
  encargado: 'Encargado',
  instructor: 'Instructor',
  servicio: 'Servicio',
};

export const ESTADO_ITEM_LABELS: Record<EstadoItem, string> = {
  inactivo: 'En Bodega',
  activo: 'Activo',
  danado: 'Dañado',
  en_mantenimiento: 'En Mantenimiento',
  baja: 'Baja',
};

export const ESTADO_ITEM_COLORS: Record<EstadoItem, string> = {
  inactivo: 'badge-slate',
  activo: 'badge-green',
  danado: 'badge-red',
  en_mantenimiento: 'badge-yellow',
  baja: 'badge-blue',
};

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  entrada: 'Entrada',
  asignacion: 'Asignación',
  traslado: 'Traslado',
  mantenimiento: 'Mantenimiento',
  devolucion: 'Devolución',
  baja: 'Baja',
};
