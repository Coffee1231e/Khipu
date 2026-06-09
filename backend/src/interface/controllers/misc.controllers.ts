// ============================================================
//  interface/controllers/misc.controllers.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { type Rol } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.client';
import { registrarAudit } from '../../infrastructure/database/auditLog.service';
import { subirImagenItem } from '../../infrastructure/storage/storage.service';
import {
  notificarTrasladoSolicitado,
  crearNotificacion,
} from '../../infrastructure/realtime/notification.service';
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError';
import { TipoNotificacion } from '@prisma/client';

// ============================================================
//  Traslados
// ============================================================

export const trasladosController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { estado, pagina = '1', limite = '20' } = req.query as Record<string, string>;
      // usuarioId no se usa en traslados listar — solo rol/ambienteIds/naveIds
      const { rol, ambienteIds, naveIds } = req.usuario;
      const skip = (Number(pagina) - 1) * Number(limite);

      let whereExtra: Record<string, unknown> = {};

      if (rol === 'encargado' || rol === 'instructor') {
        whereExtra = {
          OR: [
            { ambienteOrigenId: { in: ambienteIds } },
            { ambienteDestinoId: { in: ambienteIds } },
          ],
        };
      } else if (rol === 'coordinador') {
        const ambientesDeLasNaves = await prisma.ambiente.findMany({
          where: { naveId: { in: naveIds } },
          select: { id: true },
        });
        const ids = ambientesDeLasNaves.map((a) => a.id);
        whereExtra = {
          OR: [
            { ambienteOrigenId: { in: ids } },
            { ambienteDestinoId: { in: ids } },
          ],
        };
      } else if (rol === 'almacen') {
        whereExtra = { esInterNave: false };
      }

      const where = {
        ...(estado && { estado: estado as 'pendiente' | 'aceptado' | 'rechazado' }),
        ...whereExtra,
      };

      const [solicitudes, total] = await Promise.all([
        prisma.solicitudTraslado.findMany({
          where, skip, take: Number(limite), orderBy: { creadoEn: 'desc' },
          include: {
            item: { select: { id: true, nombre: true, numeroInventario: true, imagenUrl: true } },
            solicitante: { select: { nombre: true, rol: true } },
            resolvedor: { select: { nombre: true } },
            ambienteOrigen: { select: { nombre: true, nave: { select: { nombre: true } } } },
            ambienteDestino: { select: { nombre: true, nave: { select: { nombre: true } } } },
          },
        }),
        prisma.solicitudTraslado.count({ where }),
      ]);

      res.json({
        ok: true, solicitudes,
        paginacion: { total, pagina: Number(pagina), limite: Number(limite) },
      });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId, ambienteDestinoId, usuarioDestinoId, esDevolucion, observaciones } = req.body as {
        itemId: number; ambienteDestinoId: string; usuarioDestinoId?: string; esDevolucion?: boolean; observaciones?: string;
      };
      const solicitanteId = req.usuario.id;

      const item = await prisma.item.findFirst({ where: { id: Number(itemId), activo: true } });
      if (!item?.ambienteId) throw new NotFoundError('Ítem en ambiente');

      const ambienteOrigen  = await prisma.ambiente.findUnique({ where: { id: item.ambienteId } });
      const ambienteDestino = await prisma.ambiente.findUnique({ where: { id: ambienteDestinoId } });
      if (!ambienteOrigen || !ambienteDestino) throw new NotFoundError('Ambiente');

      const esInterNave = ambienteOrigen.naveId !== ambienteDestino.naveId;

      if (req.usuario.rol === 'instructor' && esInterNave) {
        throw new ForbiddenError('Los instructores no pueden solicitar traslados entre naves.');
      }

      const solicitud = await prisma.solicitudTraslado.create({
        data: {
          itemId: Number(itemId), solicitanteId,
          ambienteOrigenId: item.ambienteId, ambienteDestinoId,
          usuarioDestinoId, esDevolucion: esDevolucion ?? false,
          observaciones, esInterNave,
        },
      });

      let destinatarios: string[] = [];
      if (esInterNave) {
        const coordinadores = await prisma.usuarioNave.findMany({
          where: { naveId: ambienteOrigen.naveId },
          select: { usuarioId: true },
        });
        destinatarios = coordinadores.map((c) => c.usuarioId);
      } else {
        const encargados = await prisma.usuarioAmbiente.findMany({
          where: { ambienteId: item.ambienteId },
          include: { usuario: { select: { rol: true } } },
        });
        destinatarios = encargados
          .filter((e) => e.usuario.rol === 'encargado')
          .map((e) => e.usuarioId);
      }

      await notificarTrasladoSolicitado({
        encargadoId: destinatarios[0] ?? '',
        coordinadorIds: destinatarios,
        solicitanteNombre: req.usuario.nombre,
        itemNombre: item.nombre,
        ambienteDestinoNombre: ambienteDestino.nombre,
        solicitudId: solicitud.id,
        esInterNave,
      });

      res.status(201).json({ ok: true, solicitud });
    } catch (err) { next(err); }
  },

  async resolver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Express v5: req.params devuelve string | string[] → castear con String()
      const id = String(req.params['id']);
      const { accion, motivoRechazo } = req.body as {
        accion: 'aceptar' | 'rechazar'; motivoRechazo?: string;
      };

      const solicitud = await prisma.solicitudTraslado.findUnique({
        where: { id },
        include: {
          item: true,
          ambienteOrigen: { include: { nave: true } },
          ambienteDestino: { include: { nave: true } },
          solicitante: { select: { id: true } },
        },
      });
      if (!solicitud) throw new NotFoundError('Solicitud de traslado');
      if (solicitud.estado !== 'pendiente') throw new ForbiddenError('Esta solicitud ya fue procesada.');

      const estado = accion === 'aceptar' ? 'aceptado' : 'rechazado';

      await prisma.$transaction(async (tx) => {
        await tx.solicitudTraslado.update({
          where: { id },
          data: { estado, resolvedorId: req.usuario.id, resolvedoEn: new Date(), motivoRechazo },
        });

        if (accion === 'aceptar') {
          await tx.item.update({
            where: { id: solicitud.itemId },
            data: {
              ambienteId: solicitud.ambienteDestinoId,
              naveId: solicitud.ambienteDestino.naveId,
              ambienteOrigenOriginalId: solicitud.esDevolucion ? null : solicitud.ambienteOrigenId,
            },
          });
          await tx.movimiento.create({
            data: {
              itemId: solicitud.itemId,
              usuarioId: req.usuario.id,
              tipo: 'traslado',
              ambienteOrigenId: solicitud.ambienteOrigenId,
              ambienteDestinoId: solicitud.ambienteDestinoId,
            },
          });
        }
      });

      await crearNotificacion({
        usuarioId: solicitud.solicitante.id,
        tipo: accion === 'aceptar' ? TipoNotificacion.traslado_aceptado : TipoNotificacion.traslado_rechazado,
        titulo: accion === 'aceptar' ? 'Traslado aprobado' : 'Traslado rechazado',
        mensaje: accion === 'aceptar'
          ? `Tu solicitud de traslado fue aprobada por ${req.usuario.nombre}.`
          : `Tu solicitud fue rechazada. Motivo: ${motivoRechazo ?? ''}`,
        urlDestino: `/traslados/${id}`,
      });

      if (accion === 'aceptar') {
        const coordinadores = await prisma.usuarioNave.findMany({
          where: { naveId: solicitud.ambienteDestino.naveId },
          select: { usuarioId: true }
        });
        await Promise.all(coordinadores.map(c => crearNotificacion({
          usuarioId: c.usuarioId,
          tipo: TipoNotificacion.traslado_aceptado,
          titulo: 'Nuevo Traslado Completado',
          mensaje: `Traslado aceptado por ${req.usuario.nombre}, ambiente de origen ${solicitud.ambienteOrigen.nombre}, ambiente destino ${solicitud.ambienteDestino.nombre}.`,
        })));
      }

      res.json({ ok: true, mensaje: accion === 'aceptar' ? 'Traslado aprobado.' : 'Traslado rechazado.' });
    } catch (err) { next(err); }
  },

  async devolver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const itemId = Number(req.params['id']);
      const item = await prisma.item.findUnique({ where: { id: itemId, activo: true } });
      if (!item) throw new NotFoundError('Ítem');
      if (!item.ambienteOrigenOriginalId) throw new ForbiddenError('Este ítem no tiene un origen registrado para devolver.');

      const ambienteOrigenOriginal = await prisma.ambiente.findUnique({ where: { id: item.ambienteOrigenOriginalId } });
      if (!ambienteOrigenOriginal) throw new NotFoundError('Ambiente origen');

      await prisma.$transaction(async (tx) => {
        await tx.item.update({
          where: { id: itemId },
          data: {
            ambienteId: ambienteOrigenOriginal.id,
            naveId: ambienteOrigenOriginal.naveId,
            ambienteOrigenOriginalId: null,
          },
        });
        await tx.movimiento.create({
          data: {
            itemId,
            usuarioId: req.usuario.id,
            tipo: 'devolucion',
            ambienteOrigenId: item.ambienteId,
            ambienteDestinoId: ambienteOrigenOriginal.id,
          },
        });
      });

      res.json({ ok: true, mensaje: 'Ítem devuelto instantáneamente al ambiente original.' });
    } catch (err) { next(err); }
  },
};

// ============================================================
//  Verificaciones
// ============================================================

export const verificacionesController = {
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ambienteId, tipo, observaciones, detalles } = req.body as {
        ambienteId: string; tipo: 'entrada' | 'salida'; observaciones?: string;
        detalles: { itemId: number; estado: 'presente' | 'ausente' | 'danado' }[];
      };

      const verificacion = await prisma.verificacionInventario.create({
        data: {
          usuarioId: req.usuario.id, ambienteId, tipo, observaciones,
          detalles: { create: detalles.map((d) => ({ itemId: d.itemId, estado: d.estado })) },
        },
        include: { detalles: true },
      });

      const ambiente  = await prisma.ambiente.findUnique({ where: { id: ambienteId } });
      const encargados = await prisma.usuarioAmbiente.findMany({
        where: { ambienteId, usuario: { rol: 'encargado' } },
        select: { usuarioId: true },
      });

      const danosCount = detalles.filter((d) => d.estado === 'danado').length;
      const extraMsg = danosCount > 0 ? ` Se marcaron ${danosCount} ítem(s) como dañados.` : '';

      for (const enc of encargados) {
        await crearNotificacion({
          usuarioId: enc.usuarioId,
          tipo: TipoNotificacion.verificacion_enviada,
          titulo: 'Verificación de inventario recibida',
          mensaje: `${req.usuario.nombre} envió una verificación de ${tipo} del ambiente ${ambiente?.nombre ?? ''}.${extraMsg}`,
          urlDestino: `/verificaciones/${verificacion.id}`,
        });
      }

      res.status(201).json({ ok: true, verificacion });
    } catch (err) { next(err); }
  },

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ambienteId, pagina = '1', limite = '20' } = req.query as Record<string, string>;
      const { rol, ambienteIds, id: usuarioId } = req.usuario;
      const skip = (Number(pagina) - 1) * Number(limite);

      let where: Record<string, unknown> = {};
      if (rol === 'instructor')  where = { usuarioId };
      else if (rol === 'encargado') where = { ambienteId: { in: ambienteIds } };
      else if (ambienteId) where = { ambienteId };

      const [verificaciones, total] = await Promise.all([
        prisma.verificacionInventario.findMany({
          where, skip, take: Number(limite), orderBy: { creadoEn: 'desc' },
          include: {
            usuario: { select: { nombre: true, rol: true } },
            _count: { select: { detalles: true } },
          },
        }),
        prisma.verificacionInventario.count({ where }),
      ]);

      res.json({ ok: true, verificaciones, paginacion: { total, pagina: Number(pagina), limite: Number(limite) } });
    } catch (err) { next(err); }
  },

  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Express v5: castear req.params
      const id = String(req.params['id']);
      const verificacion = await prisma.verificacionInventario.findUnique({
        where: { id },
        include: {
          usuario: { select: { nombre: true, rol: true } },
          detalles: {
            include: {
              item: { select: { id: true, nombre: true, numeroInventario: true, imagenUrl: true } },
            },
          },
        },
      });
      if (!verificacion) throw new NotFoundError('Verificación');
      res.json({ ok: true, verificacion });
    } catch (err) { next(err); }
  },

  async confirmarDanos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const verificacion = await prisma.verificacionInventario.findUnique({
        where: { id },
        include: {
          detalles: {
            where: { estado: 'danado' },
            include: { item: { select: { id: true, nombre: true, numeroInventario: true, ambiente: { select: { nombre: true } }, nave: { select: { nombre: true } } } } }
          },
        },
      });

      if (!verificacion) throw new NotFoundError('Verificación');
      if (verificacion.danosReportados) throw new ForbiddenError('Los daños de esta verificación ya fueron reportados.');
      if (verificacion.detalles.length === 0) throw new ForbiddenError('No hay ítems dañados en esta verificación.');

      const itemIds = verificacion.detalles.map((d) => d.itemId);

      await prisma.$transaction([
        prisma.verificacionInventario.update({
          where: { id },
          data: { danosReportados: true }
        }),
        prisma.item.updateMany({
          where: { id: { in: itemIds } },
          data: { estado: 'danado' }
        })
      ]);

      const usuariosServicio = await prisma.usuario.findMany({ where: { rol: 'servicio', activo: true }, select: { id: true } });
      const servicioIds = usuariosServicio.map((u) => u.id);

      if (servicioIds.length > 0) {
        const itemsDanadosMetadata = verificacion.detalles.map((d) => ({
          id: d.item.id,
          nombre: d.item.nombre,
          numeroInventario: d.item.numeroInventario,
          ambiente: d.item.ambiente?.nombre || '',
          nave: d.item.nave?.nombre || ''
        }));
        const ambienteNombre = verificacion.detalles[0]?.item.ambiente?.nombre || '';

        await Promise.all(servicioIds.map(id => 
          crearNotificacion({
            usuarioId: id,
            tipo: TipoNotificacion.item_danado_reportado,
            titulo: 'Ítems dañados reportados',
            mensaje: `Se han reportado ${itemIds.length} ítem(s) dañado(s) en el ambiente ${ambienteNombre} por ${req.usuario.nombre}.`,
            urlDestino: `/notificaciones`,
            metadatos: { items: itemsDanadosMetadata }
          })
        ));
      }

      res.json({ ok: true, mensaje: 'Daños confirmados y reportados exitosamente.' });
    } catch (err) { next(err); }
  },
};

// ============================================================
//  Mantenimiento
// ============================================================

export const mantenimientoController = {
  async solicitarMantenimiento(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId, descripcionFalla, observaciones } = req.body as {
        itemId: number; descripcionFalla: string; observaciones?: string;
      };

      const item = await prisma.item.findFirst({ where: { id: Number(itemId), activo: true } });
      if (!item) throw new NotFoundError('Ítem');
      if (item.estado !== 'danado') throw new ForbiddenError('Solo se pueden enviar a mantenimiento ítems marcados como dañados.');

      const solicitud = await prisma.solicitudMantenimiento.create({
        data: { itemId: Number(itemId), solicitanteId: req.usuario.id, descripcionFalla, observaciones },
      });

      const servicio = await prisma.usuario.findMany({ where: { rol: 'servicio', activo: true }, select: { id: true } });
      for (const s of servicio) {
        await crearNotificacion({
          usuarioId: s.id,
          tipo: TipoNotificacion.item_en_mantenimiento,
          titulo: 'Ítem reportado para mantenimiento',
          mensaje: `El ítem "${item.nombre}" (${item.numeroInventario}) requiere mantenimiento. Falla: ${descripcionFalla}`,
          urlDestino: `/mantenimiento`,
        });
      }

      res.status(201).json({ ok: true, solicitud });
    } catch (err) { next(err); }
  },

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { estado } = req.query as Record<string, string>;
      const solicitudes = await prisma.solicitudMantenimiento.findMany({
        where: estado ? { estado: estado as 'pendiente' | 'aceptado' | 'rechazado' } : {},
        orderBy: { creadoEn: 'desc' },
        include: {
          item: {
            select: {
              id: true, nombre: true, numeroInventario: true, imagenUrl: true,
              nave: { select: { nombre: true } },
              ambiente: { select: { nombre: true } },
            },
          },
          solicitante: { select: { nombre: true, rol: true } },
        },
      });
      res.json({ ok: true, solicitudes });
    } catch (err) { next(err); }
  },

  async reclamar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      // Encontrar la solicitud activa más reciente para el item, o buscar por ID de item si mandamos el itemId en la URL
      // Espera, el endpoint es /mantenimiento/:id/reclamar donde :id es el itemId
      const itemId = Number(id);
      const solicitud = await prisma.solicitudMantenimiento.findFirst({
        where: { itemId, estado: 'pendiente' },
        orderBy: { creadoEn: 'desc' },
        include: { solicitante: true, item: true },
      });

      if (!solicitud) throw new NotFoundError('Solicitud de mantenimiento activa');
      if (solicitud.servicioId) throw new ForbiddenError('Esta solicitud ya ha sido reclamada por alguien más.');

      // Actualizar la solicitud con el ID de quien la reclamó y la fecha (no cambia estado hasta que se resuelva)
      await prisma.solicitudMantenimiento.update({
        where: { id: solicitud.id },
        data: { servicioId: req.usuario.id, aceptadoEn: new Date() },
      });

      // Notificar al encargado
      await crearNotificacion({
        usuarioId: solicitud.solicitanteId,
        tipo: TipoNotificacion.servicio_solicitado, // Usando un enum genérico
        titulo: 'Mantenimiento en curso',
        mensaje: `Tu solicitud de mantenimiento para "${solicitud.item.nombre}" ha sido aceptada por ${req.usuario.nombre}. Cuando tu ítem esté listo o se vaya a dar de baja, se te informará.`,
      });

      res.json({ ok: true, mensaje: 'Solicitud reclamada exitosamente. Esperando aprobación.' });
    } catch (err) { next(err); }
  },

  async aprobar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const itemId = Number(id);
      const solicitud = await prisma.solicitudMantenimiento.findFirst({
        where: { itemId, estado: 'pendiente' },
        orderBy: { creadoEn: 'desc' },
        include: { solicitante: true, item: true },
      });

      if (!solicitud) throw new NotFoundError('Solicitud de mantenimiento activa');
      if (!solicitud.servicioId) throw new ForbiddenError('Nadie ha reclamado esta solicitud todavía.');

      await prisma.solicitudMantenimiento.update({
        where: { id: solicitud.id },
        data: { aprobadoPorEncargado: true },
      });

      await crearNotificacion({
        usuarioId: solicitud.servicioId,
        tipo: TipoNotificacion.servicio_solicitado, // enum reutilizado
        titulo: 'Mantenimiento aprobado',
        mensaje: `El encargado ha aprobado que vayas por el ítem "${solicitud.item.nombre}". Por favor, recógelo e inicia el mantenimiento en el sistema.`,
      });

      res.json({ ok: true, mensaje: 'Has aprobado que el técnico vaya por el ítem.' });
    } catch (err) { next(err); }
  },

  async iniciar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']); // es la solicitudId en este caso o itemId? Usaremos solicitud.id directamente
      // Wait, MantenimientoPage tiene el solicitud.id, usémoslo.
      const solicitud = await prisma.solicitudMantenimiento.findUnique({
        where: { id },
        include: { item: true },
      });

      if (!solicitud) throw new NotFoundError('Solicitud de mantenimiento');
      if (!solicitud.aprobadoPorEncargado) throw new ForbiddenError('El encargado aún no ha aprobado esta solicitud.');
      if (solicitud.iniciadoEn) throw new ForbiddenError('El mantenimiento ya fue iniciado.');

      if (!req.file) throw new ForbiddenError('Es obligatorio adjuntar una foto del estado inicial del ítem.');

      const url = await subirImagenItem(solicitud.itemId, req.file.buffer, req.file.mimetype);

      await prisma.$transaction([
        prisma.solicitudMantenimiento.update({
          where: { id },
          data: { iniciadoEn: new Date(), observaciones: req.body.observaciones ? `${solicitud.observaciones || ''}\nIngreso: ${req.body.observaciones}` : solicitud.observaciones },
        }),
        prisma.item.update({
          where: { id: solicitud.itemId },
          data: { estado: 'en_mantenimiento', imagenUrl: url },
        }),
      ]);

      res.json({ ok: true, mensaje: 'Mantenimiento iniciado correctamente.' });
    } catch (err) { next(err); }
  },

  async resolver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Express v5: castear req.params
      const id = String(req.params['id']);
      const { resultado, observaciones } = req.body as {
        resultado: 'devuelto' | 'baja'; observaciones?: string;
      };

      const solicitud = await prisma.solicitudMantenimiento.findUnique({
        where: { id },
        include: {
          item: true,
          solicitante: { select: { id: true } },
        },
      });
      if (!solicitud) throw new NotFoundError('Solicitud de mantenimiento');

      const nuevoEstado = resultado === 'devuelto' ? 'activo' : 'baja';
      let updateData: any = { estado: nuevoEstado };

      if (resultado === 'devuelto') {
        if (!req.file) throw new ForbiddenError('Es obligatorio subir una foto del ítem reparado.');
        const url = await subirImagenItem(solicitud.itemId, req.file.buffer, req.file.mimetype);
        updateData.imagenUrl = url;
      }

      await prisma.$transaction([
        prisma.solicitudMantenimiento.update({
          where: { id },
          data: { estado: 'aceptado', completadoEn: new Date(), resultadoFinal: resultado, observaciones },
        }),
        prisma.item.update({ where: { id: solicitud.itemId }, data: updateData }),
        prisma.movimiento.create({
          data: {
            itemId: solicitud.itemId,
            usuarioId: req.usuario.id,
            tipo: resultado === 'devuelto' ? 'devolucion' : 'baja',
            observaciones,
          },
        }),
      ]);

      await crearNotificacion({
        usuarioId: solicitud.solicitante.id,
        tipo: resultado === 'devuelto' ? TipoNotificacion.item_devuelto : TipoNotificacion.item_baja,
        titulo: resultado === 'devuelto' ? 'Ítem devuelto de mantenimiento' : 'Ítem dado de baja',
        mensaje: resultado === 'devuelto'
          ? `El ítem "${solicitud.item.nombre}" fue reparado y devuelto.`
          : `El ítem "${solicitud.item.nombre}" fue dado de baja tras mantenimiento.`,
        urlDestino: `/bodega/items/${solicitud.itemId}`,
      });

      res.json({ ok: true, mensaje: resultado === 'devuelto' ? 'Ítem marcado como devuelto.' : 'Ítem dado de baja.' });
    } catch (err) { next(err); }
  },
};

// ============================================================
//  Categorías
// ============================================================

export const categoriasController = {
  async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categorias = await prisma.categoriaItem.findMany({
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { items: true } } },
      });
      res.json({ ok: true, categorias });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nombre } = req.body as { nombre: string };
      const categoria = await prisma.categoriaItem.create({ data: { nombre } });
      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'categoria', entidadId: String(categoria.id), accion: 'creacion',
        area: 'bodega', camposDespues: { nombre }, ip: req.ip,
      });
      res.status(201).json({ ok: true, categoria });
    } catch (err) { next(err); }
  },

  async editar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const antes = await prisma.categoriaItem.findUnique({ where: { id } });
      if (!antes) throw new NotFoundError('Categoría');
      const categoria = await prisma.categoriaItem.update({ where: { id }, data: req.body as { nombre: string } });
      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'categoria', entidadId: String(id), accion: 'edicion',
        area: 'bodega',
        camposAntes: { nombre: antes.nombre }, camposDespues: req.body as Record<string, unknown>,
        ip: req.ip,
      });
      res.json({ ok: true, categoria });
    } catch (err) { next(err); }
  },

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const itemsConCategoria = await prisma.item.count({ where: { categoriaId: id, activo: true } });
      if (itemsConCategoria > 0) throw new ForbiddenError(`No se puede eliminar: hay ${itemsConCategoria} ítem(s) con esta categoría.`);
      await prisma.categoriaItem.delete({ where: { id } });
      res.json({ ok: true, mensaje: 'Categoría eliminada.' });
    } catch (err) { next(err); }
  },
};

// ============================================================
//  Logs
// ============================================================

export const logsController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        q, entidad, accion, area, rolUsuario, desde, hasta,
        pagina = '1', limite = '20',
      } = req.query as Record<string, string>;
      const skip = (Number(pagina) - 1) * Number(limite);

      const where = {
        ...(entidad && { entidad }),
        ...(accion  && { accion }),
        ...(area    && { area }),
        // Express v5 / Prisma: rolUsuario debe ser Rol enum
        ...(rolUsuario && { rolUsuario: rolUsuario as Rol }),
        ...(desde && { creadoEn: { gte: new Date(desde) } }),
        ...(hasta && { creadoEn: { lte: new Date(hasta) } }),
        ...(q && {
          OR: [
            { usuario: { nombre: { contains: q, mode: 'insensitive' as const } } },
            { entidadId: { contains: q } },
          ],
        }),
      };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where, skip, take: Number(limite), orderBy: { creadoEn: 'desc' },
          include: { usuario: { select: { nombre: true, email: true, rol: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({ ok: true, logs, paginacion: { total, pagina: Number(pagina), limite: Number(limite) } });
    } catch (err) { next(err); }
  },
};

// ============================================================
//  Notificaciones
// ============================================================

export const notificacionesController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pagina = '1', limite = '30' } = req.query as Record<string, string>;
      const skip = (Number(pagina) - 1) * Number(limite);

      const [notificaciones, totalNoLeidas] = await Promise.all([
        prisma.notificacion.findMany({
          where: { usuarioId: req.usuario.id },
          skip, take: Number(limite), orderBy: { creadoEn: 'desc' },
        }),
        prisma.notificacion.count({ where: { usuarioId: req.usuario.id, leida: false } }),
      ]);

      res.json({ ok: true, notificaciones, totalNoLeidas });
    } catch (err) { next(err); }
  },

  async marcarLeida(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Express v5: castear req.params
      const id = String(req.params['id']);
      await prisma.notificacion.updateMany({
        where: { id, usuarioId: req.usuario.id },
        data: { leida: true, leidaEn: new Date() },
      });
      res.json({ ok: true });
    } catch (err) { next(err); }
  },

  async marcarTodasLeidas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.notificacion.updateMany({
        where: { usuarioId: req.usuario.id, leida: false },
        data: { leida: true, leidaEn: new Date() },
      });
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};

// ============================================================
//  Configuración
// ============================================================

export const configuracionController = {
  async obtener(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await prisma.configuracionSistema.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton' },
        update: {},
      });
      res.json({ ok: true, config });
    } catch (err) { next(err); }
  },

  async editar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await prisma.configuracionSistema.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', ...req.body as Record<string, unknown> },
        update: req.body as Record<string, unknown>,
      });
      res.json({ ok: true, config });
    } catch (err) { next(err); }
  },
};
