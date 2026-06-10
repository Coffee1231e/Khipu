// ============================================================
//  shared/components/layout/Sidebar.tsx
// ============================================================

import { useState, type ReactElement } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Warehouse, ArrowLeftRight, ClipboardList,
  Wrench, Users, Map, Building2, BookOpen, Settings,
  FileText, Tags, LogOut, ChevronRight, User,
  ChevronsUpDown, ChevronsDownUp, Bell
} from 'lucide-react';
import { useAuth } from '@features/auth/context/AuthContext';
import { useNotificaciones } from '@features/notificaciones/context/NotificacionesContext';
import type { Rol } from '@shared/types';

interface NavItem {
  to: string;
  icon: ReactElement;
  label: string;
  roles: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['administrador', 'almacen', 'coordinador', 'encargado', 'instructor', 'servicio'] },
  { to: '/bodega', icon: <Warehouse size={18} />, label: 'Bodega', roles: ['administrador', 'almacen'] },
  { to: '/inventario', icon: <ClipboardList size={18} />, label: 'Inventario', roles: ['coordinador', 'encargado', 'instructor', 'servicio'] },
  { to: '/traslados', icon: <ArrowLeftRight size={18} />, label: 'Traslados', roles: ['administrador', 'almacen', 'coordinador', 'encargado'] },
  { to: '/verificaciones', icon: <ClipboardList size={18} />, label: 'Verificaciones', roles: ['encargado', 'instructor'] },
  { to: '/mantenimiento', icon: <Wrench size={18} />, label: 'Mantenimiento', roles: ['administrador', 'encargado', 'servicio'] },
  { to: '/categorias', icon: <Tags size={18} />, label: 'Categorías', roles: ['administrador', 'almacen'] },
  { to: '/naves', icon: <Map size={18} />, label: 'Naves', roles: ['administrador'] },
  { to: '/ambientes', icon: <Building2 size={18} />, label: 'Ambientes', roles: ['administrador'] },
  { to: '/fichas', icon: <BookOpen size={18} />, label: 'Fichas', roles: ['administrador'] },
  { to: '/usuarios', icon: <Users size={18} />, label: 'Usuarios', roles: ['administrador'] },
  { to: '/logs', icon: <FileText size={18} />, label: 'Registros', roles: ['administrador', 'almacen'] },
  { to: '/notificaciones', icon: <Bell size={18} />, label: 'Notificaciones', roles: ['administrador', 'almacen', 'coordinador', 'encargado', 'instructor', 'servicio'] },
  // Configuración (límites de cuentas) solo para admin
  { to: '/configuracion', icon: <Settings size={18} />, label: 'Configuración', roles: ['administrador'] },
  // Mi Perfil para todos los roles
  { to: '/perfil', icon: <User size={18} />, label: 'Mi Perfil', roles: ['administrador', 'almacen', 'coordinador', 'encargado', 'instructor', 'servicio'] },
];

const ROL_LABELS: Record<Rol, string> = {
  administrador: 'Administrador', almacen: 'Almacén',
  coordinador: 'Coordinador', encargado: 'Encargado',
  instructor: 'Instructor', servicio: 'Servicio',
};

const ROL_COLORS: Record<Rol, string> = {
  administrador: 'badge-green', almacen: 'badge-green',
  coordinador: 'badge-green', encargado: 'badge-green',
  instructor: 'badge-green', servicio: 'badge-green',
};

interface Props {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen, onClose }: Props) {
  const { user, logout } = useAuth();
  const { totalNoLeidas } = useNotificaciones();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_ITEMS.filter(item => item.roles.includes(user.rol));

  // Separar "Mi Perfil" para ponerlo al fondo (antes de logout)
  const mainItems = navItems.filter(i => i.to !== '/perfil');
  const profileItem = navItems.find(i => i.to === '/perfil');

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64
          bg-gradient-to-b from-sena-950 to-sena-900
          shadow-sidebar z-40 flex flex-col transition-transform duration-300
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >

        {/* Nav principal */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 mt-2">
          {mainItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item-inactive'}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.to === '/notificaciones' && totalNoLeidas > 0 && (
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]" title={`${totalNoLeidas} no leídas`}></span>
              )}
              {location.pathname.startsWith(item.to) && item.to !== '/notificaciones' && (
                <ChevronRight size={14} className="opacity-60" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile dropdown area */}
        <div className="relative px-3 py-3 border-t border-sena-800/60">
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 w-full px-3 mb-2 animate-fade-in">
              <div className="bg-sena-800 rounded-xl border border-sena-700/50 shadow-lg p-1.5 flex flex-col gap-1">
                {profileItem && (
                  <NavLink
                    to={profileItem.to}
                    onClick={() => { onClose?.(); setUserMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sena-100 hover:bg-sena-700 transition-colors text-sm"
                  >
                    {profileItem.icon}
                    <span>Mi Perfil</span>
                  </NavLink>
                )}
                <button
                  onClick={() => { void logout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors text-sm text-left"
                >
                  <LogOut size={17} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-sena-800/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-sena-600 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-white font-semibold text-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate capitalize">{user.nombre.split(' ')[0]}</p>
              <span className={`badge text-[10px] px-1.5 py-0 mt-0.5 ${ROL_COLORS[user.rol]}`}>
                {ROL_LABELS[user.rol]}
              </span>
            </div>
            <div className="text-sena-400">
              {userMenuOpen ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
