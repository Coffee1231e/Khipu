// ============================================================
//  features/notificaciones/components/NotificacionToast.tsx
// ============================================================

import { 
  X, RefreshCw, CheckCircle2, XCircle, ClipboardCheck, 
  AlertTriangle, Wrench, Trash2, UserPlus, Key, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Toast } from 'react-hot-toast';
import toast from 'react-hot-toast';
import type { Notificacion } from '@shared/types';
import React from 'react';

const TIPO_ICONS: Record<string, React.ReactNode> = {
  traslado_solicitado: <RefreshCw size={18} className="text-blue-500" />,
  traslado_aceptado: <CheckCircle2 size={18} className="text-sena-500" />,
  traslado_rechazado: <XCircle size={18} className="text-red-500" />,
  verificacion_enviada: <ClipboardCheck size={18} className="text-forest-500" />,
  item_danado_reportado: <AlertTriangle size={18} className="text-red-500" />,
  item_en_mantenimiento: <Wrench size={18} className="text-amber-500" />,
  item_devuelto: <CheckCircle2 size={18} className="text-sena-500" />,
  item_baja: <Trash2 size={18} className="text-forest-500" />,
  cuenta_creada: <UserPlus size={18} className="text-blue-500" />,
  contrasena_cambiada: <Key size={18} className="text-amber-500" />,
};

interface Props {
  notificacion: Notificacion;
  toastInstance: Toast;
}

export function NotificacionToast({ notificacion, toastInstance }: Props) {
  const navigate = useNavigate();
  const icono = TIPO_ICONS[notificacion.tipo] ?? <Bell size={18} className="text-forest-400" />;

  const handleClick = () => {
    toast.dismiss(toastInstance.id);
    if (notificacion.urlDestino) navigate(notificacion.urlDestino);
  };

  return (
    <div
      className={`
        flex items-start gap-3 bg-white border border-forest-100 rounded-xl
        shadow-card-hover p-4 w-80 cursor-pointer
        transition-all duration-300
        ${toastInstance.visible ? 'animate-slide-in-left opacity-100' : 'opacity-0 translate-x-4'}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      <div className="w-9 h-9 rounded-lg bg-sena-50 flex items-center justify-center flex-shrink-0 text-base">
        {icono}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sena-900 text-sm leading-tight truncate">
          {notificacion.titulo}
        </p>
        <p className="text-forest-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">
          {notificacion.mensaje}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); toast.dismiss(toastInstance.id); }}
        className="btn-icon flex-shrink-0 text-forest-400 hover:text-sena-700 w-6 h-6"
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  );
}
