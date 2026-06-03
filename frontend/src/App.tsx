import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@features/auth/context/AuthContext';
import { NotificacionesProvider } from '@features/notificaciones/context/NotificacionesContext';
import { DashboardLayout } from '@shared/components/layout/DashboardLayout';
import { ProtectedRoute } from '@shared/components/common/ProtectedRoute';
import { RealtimeSync } from '@shared/components/common/RealtimeSync';
import { PageLoader } from '@shared/components/ui';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BodegaPage = lazy(() => import('./features/bodega/pages/BodegaPage'));
const BodegaItemPage = lazy(() => import('./features/bodega/pages/BodegaItemPage'));
const InventarioPage = lazy(() => import('./features/inventario/pages/InventarioPage'));
const TrasladosPage = lazy(() => import('./features/traslados/pages/TrasladosPage'));
const VerificacionesPage = lazy(() => import('./features/verificaciones/pages/VerificacionesPage'));
const VerificacionFormPage = lazy(() => import('./features/verificaciones/pages/VerificacionFormPage'));
const MantenimientoPage = lazy(() => import('./features/mantenimiento/pages/MantenimientoPage'));
const CategoriasPage = lazy(() => import('./features/categorias/pages/CategoriasPage'));
const NavesPage = lazy(() => import('./features/naves/pages/NavesPage'));
const AmbientesPage = lazy(() => import('./features/ambientes/pages/AmbientesPage'));
const FichasPage = lazy(() => import('./features/fichas/pages/FichasPage'));
const UsuariosPage = lazy(() => import('./features/usuarios/pages/UsuariosPage'));
const LogsPage = lazy(() => import('./features/logs/pages/LogsPage'));
const ConfiguracionPage = lazy(() => import('./features/configuracion/pages/ConfiguracionPage'));
const MiPerfilPage = lazy(() => import('./features/configuracion/pages/MiPerfilPage'));
const Setup2FAPage = lazy(() => import('./features/configuracion/pages/Setup2FAPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 2FA setup — autenticado pero sin layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/configuracion/2fa" element={<Setup2FAPage />} />
            </Route>

            {/* Rutas con layout */}
            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <NotificacionesProvider>
                    <DashboardLayout />
                  </NotificacionesProvider>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Bodega — admin y almacen */}
                <Route element={<ProtectedRoute roles={['administrador', 'almacen']} />}>
                  <Route path="/bodega" element={<BodegaPage />} />
                  <Route path="/bodega/:id" element={<BodegaItemPage />} />
                </Route>

                {/* Inventario — todos menos admin/almacen */}
                <Route element={<ProtectedRoute roles={['coordinador', 'encargado', 'instructor', 'servicio']} />}>
                  <Route path="/inventario" element={<InventarioPage />} />
                </Route>

                {/* Traslados — todos menos servicio */}
                <Route element={<ProtectedRoute roles={['administrador', 'almacen', 'coordinador', 'encargado', 'instructor']} />}>
                  <Route path="/traslados" element={<TrasladosPage />} />
                </Route>

                {/* Verificaciones — encargado e instructor */}
                <Route element={<ProtectedRoute roles={['encargado', 'instructor']} />}>
                  <Route path="/verificaciones" element={<VerificacionesPage />} />
                  <Route path="/verificaciones/nueva" element={<VerificacionFormPage />} />
                  <Route path="/verificaciones/:id" element={<VerificacionFormPage />} />
                </Route>

                {/* Mantenimiento — admin, encargado, servicio */}
                <Route element={<ProtectedRoute roles={['administrador', 'encargado', 'servicio']} />}>
                  <Route path="/mantenimiento" element={<MantenimientoPage />} />
                </Route>

                {/* Categorías — admin y almacen */}
                <Route element={<ProtectedRoute roles={['administrador', 'almacen']} />}>
                  <Route path="/categorias" element={<CategoriasPage />} />
                </Route>

                {/* Solo admin */}
                <Route element={<ProtectedRoute roles={['administrador']} />}>
                  <Route path="/naves" element={<NavesPage />} />
                  <Route path="/ambientes" element={<AmbientesPage />} />
                  <Route path="/fichas" element={<FichasPage />} />
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/logs" element={<LogsPage />} />
                  <Route path="/configuracion" element={<ConfiguracionPage />} />
                </Route>

                {/* Mi Perfil — todos los roles */}
                <Route path="/perfil" element={<MiPerfilPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        <RealtimeSync />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#14532D',
              border: '1px solid #DCFCE7',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
            },
            success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
