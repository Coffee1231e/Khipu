// ============================================================
//  shared/components/layout/Navbar.tsx
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useNotificaciones } from '@features/notificaciones/context/NotificacionesContext';
import { NotificacionesPanel } from '@features/notificaciones/components/NotificacionesPanel';



interface Props {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: Props) {
  const { totalNoLeidas } = useNotificaciones();
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);



  return (
    <header className="flex-shrink-0 h-16 bg-gradient-to-r from-sena-950 to-sena-900 border-b border-sena-800/60 flex items-center px-4 lg:px-6 gap-4 z-50">
      
      {/* Logo & Toggle (Left Side) */}
      <div className="flex items-center gap-3 w-auto lg:w-56 shrink-0">
        {/* Botón Menú (Mobile) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-sena-300 hover:text-white transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <img src="/Khipu_Logo.webp" alt="Khipu Logo" className="w-8 h-8 object-contain rounded-lg hidden sm:block" />
        <div className="hidden sm:block">
          <p className="font-display font-bold text-white text-lg leading-none">Khipu</p>
        </div>
      </div>

      <div className="flex-1" />

      {/* Acciones derecha */}
      <div className="flex items-center gap-2 relative" ref={containerRef}>
        {/* Campanita de notificaciones */}
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="relative p-2 text-sena-300 hover:text-white hover:bg-sena-800/50 rounded-lg transition-colors"
          aria-label="Notificaciones"
        >
          <Bell size={19} />
          {totalNoLeidas > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {totalNoLeidas > 9 ? '9+' : totalNoLeidas}
            </span>
          )}
        </button>

        <NotificacionesPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      </div>
    </header>
  );
}
