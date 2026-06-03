// ============================================================
//  interface/middleware/auth.middleware.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../infrastructure/auth/jwt';
import { prisma } from '../../infrastructure/database/prisma.client';
import {
  UnauthorizedError,
  ForbiddenError,
  AccountDisabledError,
  Requires2FAError,
} from '../../shared/errors/AppError';
import {
  Accion,
  tienePermiso,
  requiere2FA,
} from '../../shared/config/permissions.config';
import { Rol } from '@prisma/client';
import { cacheService } from '../../infrastructure/cache/cache.service';

// Extender el tipo Request de Express
declare global {
  namespace Express {
    interface Request {
      usuario: {
        id: string;
        nombre: string;
        email: string;
        rol: Rol;
        tiene2FAActivo: boolean;
        ambienteIds: string[];
        naveIds: string[];
      };
    }
  }
}

/**
 * Middleware de autenticación.
 * Verifica el JWT y carga el usuario desde la base de datos.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Buscar en cookies primero, luego en Authorization header
    let token = req.cookies?.khipu_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      throw new UnauthorizedError('Token de autenticación no proporcionado.');
    }

    const payload = verifyToken(token);

    // Intentar leer desde caché
    let usuarioCached = cacheService.getUserSession(payload.sub);

    if (!usuarioCached) {
      // Cargar usuario completo desde BD si no está en caché
      const usuario = await prisma.usuario.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
          dosFA: { select: { activado: true } },
          naves: { select: { naveId: true } },
          ambientes: { select: { ambienteId: true } },
        },
      });

      if (!usuario) throw new UnauthorizedError('Usuario no encontrado.');
      if (!usuario.activo) throw new AccountDisabledError();

      usuarioCached = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
        tiene2FAActivo: usuario.dosFA?.activado ?? false,
        naveIds: usuario.naves.map((n) => n.naveId),
        ambienteIds: usuario.ambientes.map((a) => a.ambienteId),
      };

      // Guardar en caché por 5 minutos
      cacheService.setUserSession(usuario.id, usuarioCached);
    } else {
      if (!usuarioCached.activo) throw new AccountDisabledError();
    }

    req.usuario = {
      id: usuarioCached.id,
      nombre: usuarioCached.nombre,
      email: usuarioCached.email,
      rol: usuarioCached.rol,
      tiene2FAActivo: usuarioCached.tiene2FAActivo,
      naveIds: usuarioCached.naveIds,
      ambienteIds: usuarioCached.ambienteIds,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware de autorización por acción.
 * Verifica que el usuario tenga el permiso necesario.
 * Verifica 2FA si la acción lo requiere.
 *
 * @example
 * router.post('/items', authenticate, authorize(ACCIONES.BODEGA_CREAR_ITEM), ctrl.crear)
 */
export function authorize(accion: Accion) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const { rol, tiene2FAActivo } = _req.usuario;

    if (!tienePermiso(rol, accion)) {
      return next(new ForbiddenError(
        `Tu rol (${rolLabel(rol)}) no tiene permiso para realizar esta acción.`,
      ));
    }

    if (requiere2FA(accion) && !tiene2FAActivo) {
      return next(new Requires2FAError());
    }

    next();
  };
}

/**
 * Middleware para acciones que requieren uno de varios roles.
 * Útil para casos simples sin permiso granular.
 */
export function requireRoles(...roles: Rol[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (!roles.includes(_req.usuario.rol)) {
      return next(new ForbiddenError(
        `Esta sección está restringida. Rol requerido: ${roles.map(rolLabel).join(' o ')}.`,
      ));
    }
    next();
  };
}

// Helper interno
function rolLabel(rol: Rol): string {
  const labels: Record<Rol, string> = {
    administrador: 'Administrador',
    almacen: 'Almacén',
    coordinador: 'Coordinador',
    encargado: 'Encargado',
    instructor: 'Instructor',
    servicio: 'Servicio',
  };
  return labels[rol] ?? rol;
}
