// ============================================================
//  shared/hooks/useFetch.ts
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@lib/api';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook simple para fetching de datos con estado de carga y error.
 * Re-fetcha cuando cambia la URL.
 */
export function useFetch<T>(url: string | null, options?: { skip?: boolean }) {
  const [state, setState] = useState<FetchState<T>>({
    data: null, loading: false, error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (targetUrl: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await api.get<T>(targetUrl, { signal: controller.signal });
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'ERR_CANCELED') return;
      const msg = (err as { mensajeUI?: string }).mensajeUI ?? 'Error al cargar datos';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
    }
  }, []);

  useEffect(() => {
    if (!url || options?.skip) return;
    fetchData(url);
    return () => abortRef.current?.abort();
  }, [url, options?.skip, fetchData]);

  const refetch = useCallback(() => {
    if (url) fetchData(url);
  }, [url, fetchData]);

  // Escuchar eventos en tiempo real globales
  useEffect(() => {
    const handleRealtime = () => {
      if (url && !options?.skip) refetch();
    };
    window.addEventListener('khipu_realtime_update', handleRealtime);
    return () => window.removeEventListener('khipu_realtime_update', handleRealtime);
  }, [url, options?.skip, refetch]);

  return { ...state, refetch };
}
