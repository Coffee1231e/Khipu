// ============================================================
//  interface/controllers/auth.controller.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../infrastructure/database/prisma.client';
import { signToken } from '../../infrastructure/auth/jwt';
import { verificar2FA } from '../../infrastructure/twofa/twofa.service';
import { UnauthorizedError, AccountDisabledError } from '../../shared/errors/AppError';
import { isProd } from '../../shared/config/env';
import { cacheService } from '../../infrastructure/cache/cache.service';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, codigo2FA } = req.body as {
        email: string;
        password: string;
        codigo2FA?: string;
      };

      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: {
          dosFA: true,
          naves: { select: { naveId: true } },
          ambientes: { select: { ambienteId: true } },
        },
      });

      if (!usuario) throw new UnauthorizedError('Credenciales incorrectas.');
      if (!usuario.activo) throw new AccountDisabledError();

      const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
      if (!passwordOk) throw new UnauthorizedError('Credenciales incorrectas.');

      if (usuario.dosFA?.activado) {
        if (!codigo2FA) {
          res.status(200).json({
            ok: true,
            requiere2FA: true,
            metodo2FA: usuario.dosFA.metodo,
            mensaje: 'Ingresa el código de tu app autenticadora.',
          });
          return;
        }
        const codigoValido = await verificar2FA(usuario.id, codigo2FA);
        if (!codigoValido) {
          throw new UnauthorizedError('Código 2FA inválido. Verifica tu app autenticadora.');
        }
      }

      const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol });

      res.cookie('khipu_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax', // Permite que funcione entre subdominios, en prod usarías 'none' si hay distinto origen
        maxAge: 8 * 60 * 60 * 1000, // 8 horas
      });

      res.json({
        ok: true,
        requiere2FA: false,
        // Eliminado `token` del response para mayor seguridad, ahora viaja en cookie
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          tiene2FAActivo: usuario.dosFA?.activado ?? false,
          naveIds: usuario.naves.map((n) => n.naveId),
          ambienteIds: usuario.ambientes.map((a) => a.ambienteId),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.usuario.id },
        select: {
          id: true, nombre: true, email: true, rol: true,
          dosFA: { select: { activado: true, metodo: true } },
          naves: { select: { naveId: true } },
          ambientes: { select: { ambienteId: true } },
        },
      });
      if (!usuario) throw new UnauthorizedError('Sesión inválida.');
      
      res.json({ 
        ok: true, 
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          tiene2FAActivo: usuario.dosFA?.activado ?? false,
          naveIds: usuario.naves.map((n) => n.naveId),
          ambienteIds: usuario.ambientes.map((a) => a.ambienteId),
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    if (req.usuario?.id) {
      cacheService.invalidateUserSession(req.usuario.id);
    }
    res.clearCookie('khipu_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
    });
    res.json({ ok: true, mensaje: 'Sesión cerrada correctamente.' });
  },
};
