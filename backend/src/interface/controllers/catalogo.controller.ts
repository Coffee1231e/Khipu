// ============================================================
//  interface/controllers/catalogo.controller.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.client';
import { registrarAudit } from '../../infrastructure/database/auditLog.service';
import { NotFoundError } from '../../shared/errors/AppError';

export const catalogoController = {
  // ─── Naves ──────────────────────────────────────────────
  async listarNaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rol, naveIds } = req.usuario;
      const where = rol === 'coordinador'
        ? { id: { in: naveIds }, activo: true }
        : { activo: true };

      const naves = await prisma.nave.findMany({
        where,
        orderBy: { nombre: 'asc' },
        include: {
          _count: { select: { ambientes: true } },
          usuariosNave: { include: { usuario: { select: { id: true, nombre: true } } } },
        },
      });
      res.json({ ok: true, naves });
    } catch (err) { next(err); }
  },

  async crearNave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nave = await prisma.nave.create({ data: req.body as { nombre: string; descripcion?: string } });
      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'nave', entidadId: String(nave.id), accion: 'creacion',
        area: 'naves_ambientes', camposDespues: req.body as Record<string, unknown>, ip: req.ip,
      });
      res.status(201).json({ ok: true, nave });
    } catch (err) { next(err); }
  },

  async editarNave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const antes = await prisma.nave.findUnique({ where: { id } });
      if (!antes) throw new NotFoundError('Nave');
      const nave = await prisma.nave.update({ where: { id }, data: req.body as { nombre?: string; descripcion?: string } });
      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'nave', entidadId: id, accion: 'edicion',
        area: 'naves_ambientes',
        camposAntes: { nombre: antes.nombre },
        camposDespues: req.body as Record<string, unknown>,
        ip: req.ip,
      });
      res.json({ ok: true, nave });
    } catch (err) { next(err); }
  },

  // ─── Ambientes ──────────────────────────────────────────
  async listarAmbientes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { naveId } = req.query as Record<string, string>;
      const { rol, ambienteIds, naveIds } = req.usuario;

      let where: Record<string, unknown> = { activo: true };
      if (naveId) where['naveId'] = naveId;
      if (rol === 'coordinador') where['naveId'] = { in: naveIds };
      if (rol === 'encargado' || rol === 'instructor') where['id'] = { in: ambienteIds };

      const ambientes = await prisma.ambiente.findMany({
        where,
        orderBy: [{ nave: { nombre: 'asc' } }, { nombre: 'asc' }],
        include: {
          nave: { select: { id: true, nombre: true } },
          _count: { select: { items: true } },
          usuariosAmbiente: {
            include: { usuario: { select: { id: true, nombre: true, rol: true } } },
            where: { usuario: { rol: { in: ['encargado', 'instructor'] } } },
          },
        },
      });
      res.json({ ok: true, ambientes });
    } catch (err) { next(err); }
  },

  async crearAmbiente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ambiente = await prisma.ambiente.create({ data: req.body as { nombre: string; descripcion?: string; naveId: string } });
      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'ambiente', entidadId: String(ambiente.id), accion: 'creacion',
        area: 'naves_ambientes', camposDespues: req.body as Record<string, unknown>, ip: req.ip,
      });
      res.status(201).json({ ok: true, ambiente });
    } catch (err) { next(err); }
  },

  async editarAmbiente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const antes = await prisma.ambiente.findUnique({ where: { id } });
      if (!antes) throw new NotFoundError('Ambiente');
      const ambiente = await prisma.ambiente.update({ where: { id }, data: req.body as { nombre?: string; descripcion?: string } });
      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'ambiente', entidadId: id, accion: 'edicion',
        area: 'naves_ambientes',
        camposAntes: { nombre: antes.nombre },
        camposDespues: req.body as Record<string, unknown>,
        ip: req.ip,
      });
      res.json({ ok: true, ambiente });
    } catch (err) { next(err); }
  },

  // ─── Fichas ─────────────────────────────────────────────
  async listarFichas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ambienteId } = req.query as Record<string, string>;
      const fichas = await prisma.ficha.findMany({
        where: { ...(ambienteId && { ambienteId }), activo: true },
        orderBy: { numero: 'asc' },
        include: { ambiente: { select: { id: true, nombre: true } } },
      });
      res.json({ ok: true, fichas });
    } catch (err) { next(err); }
  },

  async crearFicha(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ficha = await prisma.ficha.create({ data: req.body as { numero: string; nombre: string; ambienteId: string } });
      res.status(201).json({ ok: true, ficha });
    } catch (err) { next(err); }
  },

  // ─── Stats ──────────────────────────────────────────────
  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rol, naveIds, ambienteIds } = req.usuario;

      const itemFilter: Record<string, unknown> = { activo: true };
      const ambienteFilter: Record<string, unknown> = { activo: true };
      const naveFilter: Record<string, unknown> = { activo: true };
      const movFilter: Record<string, unknown> = {};

      if (rol === 'coordinador') {
        itemFilter['naveId'] = { in: naveIds };
        ambienteFilter['naveId'] = { in: naveIds };
        naveFilter['id'] = { in: naveIds };
        movFilter['OR'] = [
          { ambienteOrigen: { naveId: { in: naveIds } } },
          { ambienteDestino: { naveId: { in: naveIds } } }
        ];
      } else if (rol === 'encargado' || rol === 'instructor') {
        itemFilter['ambienteId'] = { in: ambienteIds };
        ambienteFilter['id'] = { in: ambienteIds };
        naveFilter['ambientes'] = { some: { id: { in: ambienteIds } } };
        movFilter['OR'] = [
          { ambienteOrigenId: { in: ambienteIds } },
          { ambienteDestinoId: { in: ambienteIds } }
        ];
      } else if (rol === 'almacen') {
        movFilter['tipo'] = { not: 'traslado' };
      }

      const [naves, ambientes, itemsPorEstado, totalItems, movimientosRecientes, itemsPorCategoriaRaw, categoriasTodas] = await Promise.all([
        prisma.nave.count({ where: naveFilter }),
        prisma.ambiente.count({ where: ambienteFilter }),
        prisma.item.groupBy({ by: ['estado'], where: itemFilter, _count: true }),
        prisma.item.count({ where: itemFilter }),
        prisma.movimiento.findMany({
          take: 10, orderBy: { fecha: 'desc' },
          where: movFilter,
          include: {
            item: { select: { nombre: true, numeroInventario: true } },
            usuario: { select: { nombre: true, rol: true } },
          },
        }),
        prisma.item.groupBy({ by: ['categoriaId'], where: itemFilter, _count: true }),
        prisma.categoriaItem.findMany({ select: { id: true, nombre: true } }),
      ]);

      let alertasCriticas = 0;
      let trasladosPendientes = 0;
      let mantenimientosPendientes = 0;

      if (rol === 'servicio' || rol === 'administrador') {
        mantenimientosPendientes = await prisma.solicitudMantenimiento.count({ where: { estado: 'pendiente' } });
      }
      
      if (['administrador', 'almacen', 'coordinador'].includes(rol)) {
        const trFilter: Record<string, unknown> = { estado: 'pendiente' };
        if (rol === 'coordinador') {
           trFilter['OR'] = [
             { ambienteOrigen: { naveId: { in: naveIds } } },
             { ambienteDestino: { naveId: { in: naveIds } } }
           ];
        }
        trasladosPendientes = await prisma.solicitudTraslado.count({ where: trFilter });
      }

      const estadosMap = itemsPorEstado.reduce<Record<string, number>>((acc, e) => {
        acc[e.estado] = e._count;
        return acc;
      }, {});
      
      const itemsDanados = estadosMap['danado'] ?? 0;
      alertasCriticas = mantenimientosPendientes + trasladosPendientes + itemsDanados;

      const categorias = itemsPorCategoriaRaw.map(ic => {
        const cat = categoriasTodas.find(c => c.id === ic.categoriaId);
        return {
          nombre: cat?.nombre ?? 'Desconocida',
          cantidad: ic._count
        };
      }).sort((a, b) => b.cantidad - a.cantidad);

      res.json({
        ok: true,
        stats: {
          naves, ambientes, totalItems,
          items: {
            activos: estadosMap['activo'] ?? 0,
            inactivos: estadosMap['inactivo'] ?? 0,
            danados: itemsDanados,
            enMantenimiento: estadosMap['en_mantenimiento'] ?? 0,
            baja: estadosMap['baja'] ?? 0,
          },
          categorias,
          movimientosRecientes,
          alertasCriticas,
          trasladosPendientes,
          mantenimientosPendientes
        },
      });
    } catch (err) { next(err); }
  },

  async statsPublicas(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [naves, ambientes] = await Promise.all([
        prisma.nave.count({ where: { activo: true } }),
        prisma.ambiente.count({ where: { activo: true } }),
      ]);
      res.json({ ok: true, naves, ambientes });
    } catch (err) { next(err); }
  },
};
