// ============================================================
//  interface/validators/schemas.ts
// ============================================================

import { z } from 'zod';

const uuid = z.string().uuid('ID inválido');
const soloNumeros = z.string().regex(/^\d+$/, 'Este campo solo acepta números');
const nombreCorto = (campo: string) =>
  z.string().min(2, `${campo} debe tener al menos 2 caracteres`).max(100).trim();

// ─── Auth ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  codigo2FA: z.string().length(6, 'El código 2FA debe tener 6 dígitos').optional(),
});

// ─── Usuarios ─────────────────────────────────────────────────
export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200).trim(),
  email: z.string().email('Correo electrónico inválido'),
  rol: z.enum(['administrador', 'almacen', 'coordinador', 'encargado', 'instructor', 'servicio']),
  fichaId: uuid.optional().nullable(),
  naveIds: z.array(uuid).optional(),
  ambienteIds: z.array(uuid).optional(),
});

export const editarUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200).trim().optional(),
  rol: z.enum(['administrador', 'almacen', 'coordinador', 'encargado', 'instructor', 'servicio']).optional(),
  fichaId: uuid.optional().nullable(),
  naveIds: z.array(uuid).optional(),
  ambienteIds: z.array(uuid).optional(),
});

export const cambiarPasswordSchema = z.object({
  passwordNueva: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
});

// ─── Naves ────────────────────────────────────────────────────
export const crearNaveSchema = z.object({
  nombre: nombreCorto('El nombre de la nave'),
  descripcion: z.string().max(500).trim().optional(),
});
export const editarNaveSchema = crearNaveSchema.partial();

// ─── Ambientes ────────────────────────────────────────────────
export const crearAmbienteSchema = z.object({
  nombre: nombreCorto('El nombre del ambiente'),
  descripcion: z.string().max(500).trim().optional(),
  naveId: uuid,
});
export const editarAmbienteSchema = crearAmbienteSchema.partial().omit({ naveId: true });

// ─── Fichas ───────────────────────────────────────────────────
export const crearFichaSchema = z.object({
  numero: z.string().min(1).max(20).trim(),
  nombre: z.string().min(2).max(200).trim(),
  ambienteId: uuid,
});

// ─── Categorías ───────────────────────────────────────────────
export const crearCategoriaSchema = z.object({
  nombre: z.string().min(2).max(100).trim(),
});
export const editarCategoriaSchema = crearCategoriaSchema;

// ─── Ítems ───────────────────────────────────────────────────
export const crearItemSchema = z.object({
  numeroInventario: soloNumeros.min(1).max(50),
  nombre: z.string().min(2).max(200).trim(),
  descripcion: z.string().max(1000).trim().optional(),
  categoriaId: z.number().int().positive(),
  observaciones: z.string().max(1000).trim().optional(),
});

export const editarItemSchema = z.object({
  nombre: z.string().min(2).max(200).trim().optional(),
  descripcion: z.string().max(1000).trim().optional(),
  observaciones: z.string().max(1000).trim().optional(),
  categoriaId: z.number().int().positive().optional(),
});

export const asignarItemSchema = z.object({
  naveId: uuid,
  ambienteId: uuid,
  observaciones: z.string().max(500).trim().optional(),
});

// Mantenido por si se usa en el futuro (no borrar)
export const cambiarEstadoItemSchema = z.object({
  estado: z.enum(['inactivo', 'activo', 'danado', 'en_mantenimiento', 'baja']),
  observaciones: z.string().max(500).trim().optional(),
});

// ─── Traslados ────────────────────────────────────────────────
export const crearSolicitudTrasladoSchema = z.object({
  itemId: z.number().int().positive(),
  ambienteDestinoId: uuid,
  usuarioDestinoId: uuid.optional(),
  esDevolucion: z.boolean().optional().default(false),
  observaciones: z.string().max(500).trim().optional(),
});

export const resolverSolicitudTrasladoSchema = z.object({
  accion: z.enum(['aceptar', 'rechazar']),
  motivoRechazo: z.string().max(500).trim().optional(),
}).refine(
  (d) => d.accion === 'aceptar' || (d.accion === 'rechazar' && !!d.motivoRechazo),
  { message: 'Debes indicar el motivo del rechazo', path: ['motivoRechazo'] },
);

// ─── Verificaciones ──────────────────────────────────────────
export const crearVerificacionSchema = z.object({
  ambienteId: uuid,
  tipo: z.enum(['entrada', 'salida']),
  observaciones: z.string().max(500).trim().optional(),
  detalles: z.array(z.object({
    itemId: z.number().int().positive(),
    estado: z.enum(['presente', 'ausente', 'danado']),
  })).min(1, 'Debes verificar al menos un ítem'),
});

// ─── Mantenimiento ────────────────────────────────────────────
export const crearSolicitudMantenimientoSchema = z.object({
  itemId: z.number().int().positive(),
  descripcionFalla: z.string().min(10).max(500).trim(),
  observaciones: z.string().max(500).trim().optional(),
});

export const resolverMantenimientoSchema = z.object({
  resultado: z.enum(['devuelto', 'baja']),
  observaciones: z.string().max(500).trim().optional(),
});

// ─── Configuración ────────────────────────────────────────────
export const editarConfiguracionSchema = z.object({
  limiteAdministrador: z.number().int().min(1).max(100).optional(),
  limiteAlmacen:       z.number().int().min(1).max(100).optional(),
  limiteCoordinador:   z.number().int().min(1).max(200).optional(),
  limiteEncargado:     z.number().int().min(1).max(500).optional(),
  limiteInstructor:    z.number().int().min(1).max(1000).optional(),
  limiteServicio:      z.number().int().min(1).max(100).optional(),
});

// ─── 2FA ─────────────────────────────────────────────────────
export const verificar2FASchema = z.object({
  codigo: z.string().length(6).regex(/^\d{6}$/),
});
export const activar2FASchema = z.object({
  secreto: z.string().min(16),
  codigo: z.string().length(6).regex(/^\d{6}$/),
});

// ─── Filtros — Zod v4: NO usar .default({}) en objetos con campos requeridos
//  Cada campo ya tiene su propio .default(), con eso es suficiente.
// ─────────────────────────────────────────────────────────────

export const filtrosLogsSchema = z.object({
  pagina:     z.coerce.number().int().positive().default(1),
  limite:     z.coerce.number().int().min(10).max(100).default(20),
  q:          z.string().max(100).optional(),
  entidad:    z.string().optional(),
  accion:     z.string().optional(),
  area:       z.string().optional(),
  rolUsuario: z.string().optional(),
  desde:      z.string().optional(),
  hasta:      z.string().optional(),
});

export const paginacionSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

export const filtrosItemsSchema = z.object({
  q:          z.string().max(100).optional(),
  estado:     z.enum(['inactivo', 'activo', 'danado', 'en_mantenimiento', 'baja']).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  naveId:     uuid.optional(),
  ambienteId: uuid.optional(),
  pagina:     z.coerce.number().int().positive().default(1),
  limite:     z.coerce.number().int().min(1).max(100).default(20),
});
