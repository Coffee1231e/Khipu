// ============================================================
//  interface/routes/index.ts
// ============================================================

import { Router } from 'express';
import { authenticate, authorize, requireRoles } from '../middleware/auth.middleware';
import { authRateLimit, uploadRateLimit, emailRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadImagen } from '../middleware/upload.middleware';
import { ACCIONES } from '../../shared/config/permissions.config';

import { authController } from '../controllers/auth.controller';
import { usuariosController } from '../controllers/usuarios.controller';
import { bodegaController } from '../controllers/bodega.controller';
import { dosFAController } from '../controllers/twofa.controller';
import { catalogoController } from '../controllers/catalogo.controller';
import {
  trasladosController,
  verificacionesController,
  mantenimientoController,
  categoriasController,
  logsController,
  notificacionesController,
  configuracionController,
} from '../controllers/misc.controllers';

import {
  loginSchema,
  crearUsuarioSchema,
  editarUsuarioSchema,
  cambiarPasswordSchema,
  crearNaveSchema,
  editarNaveSchema,
  crearAmbienteSchema,
  editarAmbienteSchema,
  crearFichaSchema,
  crearCategoriaSchema,
  editarCategoriaSchema,
  crearItemSchema,
  editarItemSchema,
  asignarItemSchema,
  crearSolicitudTrasladoSchema,
  resolverSolicitudTrasladoSchema,
  crearVerificacionSchema,
  crearSolicitudMantenimientoSchema,
  resolverMantenimientoSchema,
  editarConfiguracionSchema,
  verificar2FASchema,
  activar2FASchema,
  filtrosItemsSchema,
  filtrosLogsSchema,
} from '../validators/schemas';

const router = Router();

// ─── Público ─────────────────────────────────────────────────
router.get('/public/stats', catalogoController.statsPublicas);
router.post('/auth/login', authRateLimit, validate(loginSchema), authController.login);

// ─── Auth ─────────────────────────────────────────────────────
router.get('/auth/me',     authenticate, authController.me);
router.post('/auth/logout', authenticate, authController.logout);

// ─── 2FA ──────────────────────────────────────────────────────
router.get('/2fa/estado',          authenticate, dosFAController.obtenerEstado);
router.post('/2fa/totp/iniciar',   authenticate, dosFAController.iniciarConfiguracionTOTP);
router.post('/2fa/totp/activar',   authenticate, validate(activar2FASchema), dosFAController.activarTOTP);
router.post('/2fa/email/enviar',   authenticate, emailRateLimit, dosFAController.enviarCodigoEmail);
router.post('/2fa/verificar',      authenticate, validate(verificar2FASchema), dosFAController.verificarCodigo);
router.post('/2fa/desactivar',     authenticate, validate(verificar2FASchema), dosFAController.desactivar);

// ─── Usuarios ────────────────────────────────────────────────
router.get('/usuarios',                      authenticate, authorize(ACCIONES.USUARIOS_VER),       usuariosController.listar);
router.post('/usuarios',                     authenticate, authorize(ACCIONES.USUARIOS_CREAR),     validate(crearUsuarioSchema), usuariosController.crear);
router.put('/usuarios/:id',                  authenticate, authorize(ACCIONES.USUARIOS_EDITAR),    validate(editarUsuarioSchema), usuariosController.editar);
router.patch('/usuarios/:id/password',       authenticate, authorize(ACCIONES.USUARIOS_EDITAR),   validate(cambiarPasswordSchema), usuariosController.cambiarPassword);
router.patch('/usuarios/:id/desactivar',     authenticate, authorize(ACCIONES.USUARIOS_DESACTIVAR), usuariosController.desactivar);
router.patch('/usuarios/:id/activar',        authenticate, authorize(ACCIONES.USUARIOS_DESACTIVAR), usuariosController.activar);

// ─── Bodega ───────────────────────────────────────────────────
router.get('/bodega',              authenticate, authorize(ACCIONES.BODEGA_VER),         validate(filtrosItemsSchema, 'query'), bodegaController.listar);
router.get('/bodega/:id',          authenticate, authorize(ACCIONES.BODEGA_VER),         bodegaController.obtener);
router.post('/bodega',             authenticate, authorize(ACCIONES.BODEGA_CREAR_ITEM),  validate(crearItemSchema), bodegaController.crear);
router.put('/bodega/:id',          authenticate, authorize(ACCIONES.BODEGA_EDITAR_ITEM), validate(editarItemSchema), bodegaController.editar);
router.post('/bodega/:id/imagen',  authenticate, authorize(ACCIONES.BODEGA_EDITAR_ITEM), uploadRateLimit, uploadImagen, bodegaController.subirImagen);
router.post('/bodega/:id/asignar', authenticate, authorize(ACCIONES.BODEGA_ASIGNAR_ITEM), validate(asignarItemSchema), bodegaController.asignar);
router.post('/bodega/:id/baja',    authenticate, authorize(ACCIONES.BODEGA_DAR_BAJA),   bodegaController.darBaja);

// ─── Categorías ───────────────────────────────────────────────
router.get('/categorias',      authenticate, authorize(ACCIONES.CATEGORIAS_VER),     categoriasController.listar);
router.post('/categorias',     authenticate, authorize(ACCIONES.CATEGORIAS_CREAR),   validate(crearCategoriaSchema), categoriasController.crear);
router.put('/categorias/:id',  authenticate, authorize(ACCIONES.CATEGORIAS_EDITAR),  validate(editarCategoriaSchema), categoriasController.editar);
router.delete('/categorias/:id', authenticate, authorize(ACCIONES.CATEGORIAS_ELIMINAR), categoriasController.eliminar);

// ─── Naves y Ambientes ────────────────────────────────────────
router.get('/naves',         authenticate, catalogoController.listarNaves);
router.post('/naves',        authenticate, authorize(ACCIONES.NAVES_GESTIONAR),     validate(crearNaveSchema), catalogoController.crearNave);
router.put('/naves/:id',     authenticate, authorize(ACCIONES.NAVES_GESTIONAR),     validate(editarNaveSchema), catalogoController.editarNave);

router.get('/ambientes',     authenticate, catalogoController.listarAmbientes);
router.post('/ambientes',    authenticate, authorize(ACCIONES.AMBIENTES_GESTIONAR), validate(crearAmbienteSchema), catalogoController.crearAmbiente);
router.put('/ambientes/:id', authenticate, authorize(ACCIONES.AMBIENTES_GESTIONAR), validate(editarAmbienteSchema), catalogoController.editarAmbiente);

router.get('/fichas',        authenticate, catalogoController.listarFichas);
router.post('/fichas',       authenticate, requireRoles('administrador'),            validate(crearFichaSchema), catalogoController.crearFicha);

// ─── Traslados ────────────────────────────────────────────────
router.get('/traslados',             authenticate, authorize(ACCIONES.TRASLADO_SOLICITAR), trasladosController.listar);
router.post('/traslados',            authenticate, authorize(ACCIONES.TRASLADO_SOLICITAR), validate(crearSolicitudTrasladoSchema), trasladosController.crear);
router.patch('/traslados/:id/resolver', authenticate, validate(resolverSolicitudTrasladoSchema), trasladosController.resolver);

// ─── Verificaciones ───────────────────────────────────────────
router.get('/verificaciones',     authenticate, authorize(ACCIONES.VERIFICACION_CREAR), verificacionesController.listar);
router.get('/verificaciones/:id', authenticate, authorize(ACCIONES.VERIFICACION_CREAR), verificacionesController.obtener);
router.post('/verificaciones',    authenticate, authorize(ACCIONES.VERIFICACION_CREAR), validate(crearVerificacionSchema), verificacionesController.crear);

// ─── Mantenimiento ────────────────────────────────────────────
router.get('/mantenimiento',              authenticate, authorize(ACCIONES.MANTENIMIENTO_VER),       mantenimientoController.listar);
router.post('/mantenimiento',             authenticate, authorize(ACCIONES.MANTENIMIENTO_SOLICITAR), validate(crearSolicitudMantenimientoSchema), mantenimientoController.solicitarMantenimiento);
router.patch('/mantenimiento/:id/resolver', authenticate, authorize(ACCIONES.MANTENIMIENTO_GESTIONAR), validate(resolverMantenimientoSchema), mantenimientoController.resolver);

// ─── Logs ────────────────────────────────────────────────────
router.get('/logs', authenticate, authorize(ACCIONES.LOGS_VER), validate(filtrosLogsSchema, 'query'), logsController.listar);

// ─── Notificaciones ───────────────────────────────────────────
router.get('/notificaciones',               authenticate, notificacionesController.listar);
router.patch('/notificaciones/leer-todas',  authenticate, notificacionesController.marcarTodasLeidas);
router.patch('/notificaciones/:id/leer',    authenticate, notificacionesController.marcarLeida);

// ─── Configuración ────────────────────────────────────────────
router.get('/configuracion', authenticate, authorize(ACCIONES.CONFIG_VER),   configuracionController.obtener);
router.put('/configuracion', authenticate, authorize(ACCIONES.CONFIG_EDITAR), validate(editarConfiguracionSchema), configuracionController.editar);

// ─── Stats ───────────────────────────────────────────────────
router.get('/stats', authenticate, authorize(ACCIONES.DASHBOARD_VER), catalogoController.stats);

export default router;
