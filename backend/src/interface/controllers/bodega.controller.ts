// ============================================================
//  interface/controllers/bodega.controller.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.client';
import { subirImagenItem } from '../../infrastructure/storage/storage.service';
import { registrarAudit, calcularDiff } from '../../infrastructure/database/auditLog.service';
import { NotFoundError, ForbiddenError, DuplicateInventoryNumberError } from '../../shared/errors/AppError';

export const bodegaController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, estado, categoriaId, naveId, ambienteId, pagina = '1', limite = '20' } = req.query as Record<string, string>;
      const skip = (Number(pagina) - 1) * Number(limite);

      const isActive = estado !== 'baja';

      const { rol, naveIds: userNaveIds, ambienteIds: userAmbienteIds } = req.usuario;

      let finalNaveId: any = naveId;
      let finalAmbienteId: any = ambienteId;

      if (rol === 'coordinador') {
        if (naveId) finalNaveId = userNaveIds.includes(naveId as string) ? naveId : 'forbidden';
        else finalNaveId = { in: userNaveIds };
      } else if (rol === 'encargado' || rol === 'instructor') {
        if (ambienteId) finalAmbienteId = userAmbienteIds.includes(ambienteId as string) ? ambienteId : 'forbidden';
        else finalAmbienteId = { in: userAmbienteIds };
      }

      const where = {
        activo: isActive,
        ...(q && {
          OR: [
            { nombre: { contains: q, mode: 'insensitive' as const } },
            { numeroInventario: { contains: q } },
          ],
        }),
        ...(estado && { estado: estado as 'inactivo' | 'activo' | 'danado' | 'en_mantenimiento' | 'baja' }),
        ...(categoriaId && { categoriaId: Number(categoriaId) }),
        ...(finalNaveId && { naveId: finalNaveId }),
        ...(finalAmbienteId && { ambienteId: finalAmbienteId }),
      };

      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where, skip, take: Number(limite),
          orderBy: { creadoEn: 'desc' },
          include: {
            categoria: { select: { id: true, nombre: true } },
            nave: { select: { id: true, nombre: true } },
            ambiente: { select: { id: true, nombre: true } },
          },
        }),
        prisma.item.count({ where }),
      ]);

      res.json({
        ok: true, items,
        paginacion: {
          total, pagina: Number(pagina), limite: Number(limite),
          paginas: Math.ceil(total / Number(limite)),
        },
      });
    } catch (err) { next(err); }
  },

  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await prisma.item.findFirst({
        where: { id: Number(req.params['id']), activo: true },
        include: {
          categoria: true,
          nave: { select: { id: true, nombre: true } },
          ambiente: { select: { id: true, nombre: true } },
          creadoPor: { select: { id: true, nombre: true, rol: true } },
          movimientos: {
            take: 10, orderBy: { fecha: 'desc' },
            include: {
              usuario: { select: { nombre: true, rol: true } },
              ambienteOrigen: { select: { nombre: true } },
              ambienteDestino: { select: { nombre: true } },
            },
          },
          solicitudesMantenimiento: {
            where: { estado: 'pendiente' },
            orderBy: { creadoEn: 'desc' },
            take: 1,
            include: { solicitante: { select: { nombre: true, id: true } } },
          },
        },
      });
      if (!item) throw new NotFoundError('Ítem');
      res.json({ ok: true, item });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { numeroInventario, nombre, descripcion, categoriaId, observaciones } = req.body as {
        numeroInventario: string; nombre: string; descripcion?: string;
        categoriaId: number; observaciones?: string;
      };

      const existe = await prisma.item.findUnique({ where: { numeroInventario } });
      if (existe) throw new DuplicateInventoryNumberError(numeroInventario);

      const item = await prisma.item.create({
        data: { numeroInventario, nombre, descripcion, categoriaId, observaciones, estado: 'inactivo', creadoPorId: req.usuario.id },
        include: { categoria: true },
      });

      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'item', entidadId: String(item.id), accion: 'creacion',
        area: 'bodega', camposDespues: { numeroInventario, nombre, categoriaId },
        itemId: item.id, ip: req.ip,
      });

      res.status(201).json({ ok: true, item });
    } catch (err) { next(err); }
  },

  async editar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const itemAntes = await prisma.item.findFirst({ where: { id, activo: true } });
      if (!itemAntes) throw new NotFoundError('Ítem');

      const { nombre, descripcion, observaciones, categoriaId } = req.body as {
        nombre?: string; descripcion?: string; observaciones?: string; categoriaId?: number;
      };

      const itemDespues = await prisma.item.update({
        where: { id },
        data: { nombre, descripcion, observaciones, categoriaId },
        include: { categoria: true },
      });

      const { antes, despues } = calcularDiff(
        { nombre: itemAntes.nombre, descripcion: itemAntes.descripcion, observaciones: itemAntes.observaciones, categoriaId: itemAntes.categoriaId },
        { nombre: itemDespues.nombre, descripcion: itemDespues.descripcion, observaciones: itemDespues.observaciones, categoriaId: itemDespues.categoriaId },
      );

      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'item', entidadId: String(id), accion: 'edicion',
        area: itemAntes.ambienteId ? 'ambiente' : 'bodega',
        camposAntes: antes, camposDespues: despues,
        itemId: id, ip: req.ip,
      });

      res.json({ ok: true, item: itemDespues });
    } catch (err) { next(err); }
  },

  async subirImagen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const item = await prisma.item.findFirst({ where: { id, activo: true } });
      if (!item) throw new NotFoundError('Ítem');
      if (!req.file) throw new Error('No se recibió ninguna imagen.');
      const url = await subirImagenItem(id, req.file.buffer, req.file.mimetype);
      await prisma.item.update({ where: { id }, data: { imagenUrl: url } });
      res.json({ ok: true, imagenUrl: url });
    } catch (err) { next(err); }
  },

  async asignar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { naveId, ambienteId, observaciones } = req.body as {
        naveId: string; ambienteId: string; observaciones?: string;
      };

      const item = await prisma.item.findFirst({ where: { id, activo: true } });
      if (!item) throw new NotFoundError('Ítem');
      if (item.estado === 'baja') throw new ForbiddenError('No se puede asignar un ítem dado de baja.');

      const ambiente = await prisma.ambiente.findUnique({ where: { id: ambienteId } });
      if (!ambiente || ambiente.naveId !== naveId) {
        throw new Error('El ambiente no pertenece a la nave seleccionada.');
      }

      await prisma.$transaction([
        prisma.item.update({
          where: { id },
          data: { naveId, ambienteId, estado: 'activo', asignadoEn: new Date() },
        }),
        prisma.movimiento.create({
          data: { itemId: id, usuarioId: req.usuario.id, tipo: 'asignacion', ambienteDestinoId: ambienteId, observaciones },
        }),
      ]);

      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'item', entidadId: String(id), accion: 'asignacion',
        area: 'bodega',
        camposAntes: { naveId: item.naveId, ambienteId: item.ambienteId, estado: item.estado },
        camposDespues: { naveId, ambienteId, estado: 'activo' },
        itemId: id, ip: req.ip,
      });

      res.json({ ok: true, mensaje: 'Ítem asignado correctamente.' });
    } catch (err) { next(err); }
  },

  async darBaja(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { observaciones } = req.body as { observaciones?: string };

      const item = await prisma.item.findFirst({ where: { id, activo: true } });
      if (!item) throw new NotFoundError('Ítem');

      await prisma.$transaction([
        prisma.item.update({ where: { id }, data: { estado: 'baja', activo: false } }),
        prisma.movimiento.create({
          data: { itemId: id, usuarioId: req.usuario.id, tipo: 'baja', observaciones },
        }),
      ]);

      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'item', entidadId: String(id), accion: 'baja',
        area: item.ambienteId ? 'ambiente' : 'bodega',
        camposAntes: { estado: item.estado }, camposDespues: { estado: 'baja' },
        itemId: id, ip: req.ip,
      });

      res.json({ ok: true, mensaje: 'Ítem dado de baja correctamente.' });
    } catch (err) { next(err); }
  },
};
