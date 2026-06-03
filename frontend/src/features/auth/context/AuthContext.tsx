// ============================================================
//  features/auth/context/AuthContext.tsx
// ============================================================

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import { api } from '@lib/api';
import type { UsuarioAuth, Rol } from '@shared/types';

interface AuthState {
  user: UsuarioAuth | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: UsuarioAuth) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // Helpers de permisos
  puedeVerBodega: boolean;
  puedeEditarBodega: boolean;
  puedeGestionarUsuarios: boolean;
  puedeVerLogs: boolean;
  esAdmin: boolean;
  esAlmacen: boolean;
  esCoordinador: boolean;
  esEncargado: boolean;
  esInstructor: boolean;
  esServicio: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ usuario: UsuarioAuth }>('/auth/me');
      setState({ user: data.usuario, loading: false });
    } catch {
      localStorage.removeItem('khipu_user');
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((user: UsuarioAuth) => {
    setState({ user, loading: false });
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* silent */ }
    setState({ user: null, loading: false });
    window.location.href = '/login';
  }, []);

  const rol = state.user?.rol as Rol | undefined;

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
    esAdmin: rol === 'administrador',
    esAlmacen: rol === 'almacen',
    esCoordinador: rol === 'coordinador',
    esEncargado: rol === 'encargado',
    esInstructor: rol === 'instructor',
    esServicio: rol === 'servicio',
    puedeVerBodega: rol === 'administrador' || rol === 'almacen',
    puedeEditarBodega: rol === 'administrador' || rol === 'almacen',
    puedeGestionarUsuarios: rol === 'administrador',
    puedeVerLogs: rol === 'administrador',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
