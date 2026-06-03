import { useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@features/auth/context/AuthContext';

export function RealtimeSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Solo escuchar si el usuario está logueado

    // Escuchar todas las inserciones, actualizaciones y borrados en la base de datos pública
    const subscription = supabase
      .channel('khipu_global_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          // Despachar evento global para que useFetch recargue datos automáticamente (fluido)
          window.dispatchEvent(new Event('khipu_realtime_update'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Este componente no renderiza nada visible, solo vive en background
  return null;
}
