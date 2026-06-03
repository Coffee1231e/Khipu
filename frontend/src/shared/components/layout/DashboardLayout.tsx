// ============================================================
//  shared/components/layout/DashboardLayout.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Modal2FAAdvertencia } from '@features/configuracion/components/Modal2FA';
import { useAuth } from '@features/auth/context/AuthContext';

const ALERTA_2FA_KEY = 'khipu_2fa_alerta_snooze';

export function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Mostrar advertencia 2FA si el usuario no lo tiene activo
  // y no ha pospuesto la alerta en esta sesión
  useEffect(() => {
    if (!user) return;
    const snoozed = sessionStorage.getItem(ALERTA_2FA_KEY);
    if (!user.tiene2FAActivo && !snoozed) {
      const timer = setTimeout(() => setShow2FAModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleLuego = () => {
    sessionStorage.setItem(ALERTA_2FA_KEY, '1');
    setShow2FAModal(false);
  };

  const handleActivar = () => {
    setShow2FAModal(false);
    navigate('/configuracion/2fa');
  };

  return (
    <div className="flex flex-col h-screen bg-sena-50 overflow-hidden">
      {/* Navbar Full Width */}
      <Navbar onMenuClick={() => setMobileOpen(true)} />

      {/* Contenedor Inferior */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 lg:ml-64 w-full">
          <Outlet />
        </main>
      </div>

      {/* Modal 2FA advertencia */}
      {show2FAModal && (
        <Modal2FAAdvertencia onActivar={handleActivar} onLuego={handleLuego} />
      )}
    </div>
  );
}
