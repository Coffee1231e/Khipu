// ============================================================
//  features/notificaciones/context/NotificacionesContext.tsx
// ============================================================

import {
  createContext, useContext, useState, useEffect, useCallback,
  useRef, type ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@lib/supabase';
import { api } from '@lib/api';
import { useAuth } from '@features/auth/context/AuthContext';
import type { Notificacion } from '@shared/types';
import { NotificacionToast } from '../components/NotificacionToast';

interface NotificacionesContextValue {
  notificaciones: Notificacion[];
  totalNoLeidas: number;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  loading: boolean;
}

const NotificacionesContext = createContext<NotificacionesContextValue | null>(null);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get<{
        notificaciones: Notificacion[];
        totalNoLeidas: number;
      }>('/notificaciones?limite=30');
      setNotificaciones(data?.notificaciones ?? []);
      setTotalNoLeidas(data?.totalNoLeidas ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  // ─── Supabase Realtime ────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    cargar();

    // Suscribirse a nuevas notificaciones del usuario
    const channel = supabase
      .channel(`notificaciones:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          const nueva = payload.new as Notificacion;
          setNotificaciones((prev) => [nueva, ...prev]);
          setTotalNoLeidas((prev) => prev + 1);

          // Mostrar toast emergente (auto-cierra en 3s)
          toast.custom(
            (t) => <NotificacionToast notificacion={nueva} toastInstance={t} />,
            { duration: 3000, position: 'bottom-right' },
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user, cargar]);

  const marcarLeida = useCallback(async (id: string) => {
    await api.patch(`/notificaciones/${id}/leer`);
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    setTotalNoLeidas((prev) => Math.max(0, prev - 1));
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    await api.patch('/notificaciones/leer-todas');
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setTotalNoLeidas(0);
  }, []);

  return (
    <NotificacionesContext.Provider
      value={{ notificaciones, totalNoLeidas, marcarLeida, marcarTodasLeidas, loading }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones(): NotificacionesContextValue {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error('useNotificaciones must be used within NotificacionesProvider');
  return ctx;
}
