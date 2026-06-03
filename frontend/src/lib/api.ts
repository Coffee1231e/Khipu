// ============================================================
//  lib/api.ts — Instancia de Axios configurada
// ============================================================

import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request interceptor (ya no usa JWT en Header) ───────────
// Ahora las cookies viajan automáticamente gracias a withCredentials: true
api.interceptors.request.use((config) => {
  return config;
});

// ─── Response interceptor — manejo global de errores ─────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ mensaje?: string; codigo?: string }>) => {
    const mensaje = error.response?.data?.mensaje ?? 'Error de conexión con el servidor.';
    const codigo = error.response?.data?.codigo;
    const status = error.response?.status;

    // Sesión expirada → redirigir al login
    if (status === 401 && codigo === 'UNAUTHORIZED') {
      localStorage.removeItem('khipu_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Cuenta desactivada
    if (codigo === 'ACCOUNT_DISABLED') {
      toast.error('Tu cuenta ha sido desactivada. Contacta al administrador.');
    }

    return Promise.reject({ ...error, mensajeUI: mensaje, codigo });
  },
);

export type ApiError = AxiosError<{ mensaje?: string; codigo?: string }> & {
  mensajeUI: string;
  codigo: string;
};
