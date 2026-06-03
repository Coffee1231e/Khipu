// ============================================================
//  infrastructure/cache/cache.service.ts
// ============================================================

import NodeCache from 'node-cache';
import { type Rol } from '@prisma/client';

// Caché para sesiones de usuario. TTL: 5 minutos.
// Checkperiod: cada 1 minuto limpia los expirados.
export const sessionCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export interface CachedUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  tiene2FAActivo: boolean;
  naveIds: string[];
  ambienteIds: string[];
}

export const cacheService = {
  getUserSession(userId: string): CachedUser | undefined {
    return sessionCache.get<CachedUser>(`user_${userId}`);
  },

  setUserSession(userId: string, data: CachedUser): void {
    sessionCache.set(`user_${userId}`, data);
  },

  invalidateUserSession(userId: string): void {
    sessionCache.del(`user_${userId}`);
  },
};
