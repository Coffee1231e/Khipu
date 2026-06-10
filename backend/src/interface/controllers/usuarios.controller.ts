// ============================================================
//  interface/controllers/usuarios.controller.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { type Rol } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma.client';
import { emailService } from '../../infrastructure/email/email.service';
import { registrarAudit } from '../../infrastructure/database/auditLog.service';
import { cacheService } from '../../infrastructure/cache/cache.service';
import { NotFoundError, ConflictError, RoleLimitReachedError } from '../../shared/errors/AppError';
import { generarPasswordSegura } from '../../shared/utils/password.util';

const ROL_LABELS: Record<Rol, string> = {
  administrador: 'Administrador', almacen: 'Almacén',
  coordinador: 'Coordinador', encargado: 'Encargado',
  instructor: 'Instructor', servicio: 'Servicio',
};

async function verificarLimiteRol(rol: Rol, excluirId?: string): Promise<void> {
  const config = await prisma.configuracionSistema.findUnique({ where: { id: 'singleton' } });
  if (!config) return;

  const limites: Record<Rol, number> = {
    administrador: config.limiteAdministrador,
    almacen:       config.limiteAlmacen,
    coordinador:   config.limiteCoordinador,
    encargado:     config.limiteEncargado,
    instructor:    config.limiteInstructor,
    servicio:      config.limiteServicio,
  };

  const count = await prisma.usuario.count({
    where: { rol, activo: true, ...(excluirId && { id: { not: excluirId } }) },
  });

  if (count >= limites[rol]) throw new RoleLimitReachedError(ROL_LABELS[rol]);
}

export const usuariosController = {
  // _req — el parámetro no se usa en listar, prefijado con _ para noUnusedParameters
  async listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarios = await prisma.usuario.findMany({
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true,
          dosFA: { select: { activado: true } },
          naves: { select: { nave: { select: { id: true, nombre: true } } } },
          ambientes: { select: { ambiente: { select: { id: true, nombre: true } } } },
        },
      });
      res.json({ ok: true, usuarios });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        nombre, email, rol, fichaId,
        naveIds = [], ambienteIds = [],
      } = req.body as {
        nombre: string; email: string; rol: Rol;
        fichaId?: string | null; naveIds?: string[]; ambienteIds?: string[];
      };

      const existe = await prisma.usuario.findUnique({ where: { email } });
      if (existe) throw new ConflictError('Ya existe un usuario con ese correo electrónico.');

      await verificarLimiteRol(rol);

      const passwordGenerada = generarPasswordSegura(12);
      const passwordHash = await bcrypt.hash(passwordGenerada, 12);

      const usuario = await prisma.usuario.create({
        data: {
          nombre, email, passwordHash, rol,
          fichaId: fichaId ?? null,
          naves:    { create: naveIds.map((naveId)    => ({ naveId })) },
          ambientes:{ create: ambienteIds.map((ambienteId) => ({ ambienteId })) },
        },
        select: { id: true, nombre: true, email: true, rol: true },
      });

      await prisma.configuracionSistema.upsert({
        where: { id: 'singleton' }, create: { id: 'singleton' }, update: {},
      });

      // Se ejecuta en segundo plano para no bloquear la respuesta HTTP en caso de que el servidor SMTP tarde o falle
      void emailService.enviarBienvenida({ nombre, email, password: passwordGenerada, rol: ROL_LABELS[rol] });

      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'usuario', entidadId: usuario.id, accion: 'creacion',
        area: 'usuarios', camposDespues: { nombre, email, rol }, ip: req.ip,
      });

      res.status(201).json({ ok: true, usuario });
    } catch (err) { next(err); }
  },

  async editar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Express v5: req.params devuelve string | string[] → usar String()
      const id = String(req.params['id']);
      const { nombre, rol, fichaId, naveIds, ambienteIds } = req.body as {
        nombre?: string; rol?: Rol; fichaId?: string | null;
        naveIds?: string[]; ambienteIds?: string[];
      };

      const usuarioAntes = await prisma.usuario.findUnique({ where: { id } });
      if (!usuarioAntes) throw new NotFoundError('Usuario');

      if (rol && rol !== usuarioAntes.rol) {
        await verificarLimiteRol(rol, id);
      }

      await prisma.$transaction(async (tx) => {
        await tx.usuario.update({ where: { id }, data: { nombre, rol, fichaId: fichaId ?? null } });

        if (naveIds !== undefined) {
          await tx.usuarioNave.deleteMany({ where: { usuarioId: id } });
          if (naveIds.length > 0) {
            await tx.usuarioNave.createMany({
              data: naveIds.map((naveId) => ({ usuarioId: id, naveId })),
            });
          }
        }

        if (ambienteIds !== undefined) {
          await tx.usuarioAmbiente.deleteMany({ where: { usuarioId: id } });
          if (ambienteIds.length > 0) {
            await tx.usuarioAmbiente.createMany({
              data: ambienteIds.map((ambienteId) => ({ usuarioId: id, ambienteId })),
            });
          }
        }
      });

      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'usuario', entidadId: id, accion: 'edicion', area: 'usuarios',
        camposAntes: { nombre: usuarioAntes.nombre, rol: usuarioAntes.rol },
        camposDespues: { nombre, rol }, ip: req.ip,
      });

      cacheService.invalidateUserSession(id);

      res.json({ ok: true, mensaje: 'Usuario actualizado.' });
    } catch (err) { next(err); }
  },

  async cambiarPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const { passwordNueva } = req.body as { passwordNueva: string };

      const usuario = await prisma.usuario.findUnique({ where: { id } });
      if (!usuario) throw new NotFoundError('Usuario');

      const hash = await bcrypt.hash(passwordNueva, 12);
      await prisma.usuario.update({ where: { id }, data: { passwordHash: hash } });

      // Se ejecuta en segundo plano para no bloquear la respuesta HTTP en caso de que el servidor SMTP tarde o falle
      void emailService.enviarCambioPassword({
        nombreUsuario: usuario.nombre,
        email: usuario.email,
        nombreAdmin: req.usuario.nombre,
        passwordNueva,
      });

      cacheService.invalidateUserSession(id);

      res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente.' });
    } catch (err) { next(err); }
  },

  async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      if (id === req.usuario.id) throw new Error('No puedes desactivar tu propia cuenta.');

      const usuario = await prisma.usuario.findUnique({ where: { id } });
      if (!usuario) throw new NotFoundError('Usuario');

      await prisma.usuario.update({ where: { id }, data: { activo: false } });

      await registrarAudit({
        usuarioId: req.usuario.id, rolUsuario: req.usuario.rol,
        entidad: 'usuario', entidadId: id, accion: 'desactivacion', area: 'usuarios',
        camposAntes: { activo: true }, camposDespues: { activo: false }, ip: req.ip,
      });

      cacheService.invalidateUserSession(id);

      res.json({ ok: true, mensaje: 'Cuenta desactivada. El usuario no podrá iniciar sesión.' });
    } catch (err) { next(err); }
  },

  async activar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      await prisma.usuario.update({ where: { id }, data: { activo: true } });
      cacheService.invalidateUserSession(id);
      res.json({ ok: true, mensaje: 'Cuenta reactivada.' });
    } catch (err) { next(err); }
  },
};
