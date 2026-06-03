// ============================================================
//  features/notificaciones/components/NotificacionToast.tsx
// ============================================================

import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Toast } from 'react-hot-toast';
import toast from 'react-hot-toast';
import type { Notificacion } from '@shared/types';

const TIPO_ICONS: Record<string, string> = {
  traslado_solicitado: '🔄',
  traslado_aceptado: '✅',
  traslado_rechazado: '❌',
  verificacion_enviada: '📋',
  item_danado_reportado: '⚠️',
  item_en_mantenimiento: '🔧',
  item_devuelto: '✅',
  item_baja: '🗑️',
  cuenta_creada: '👤',
};

interface Props {
  notificacion: Notificacion;
  toastInstance: Toast;
}

export function NotificacionToast({ notificacion, toastInstance }: Props) {
  const navigate = useNavigate();
  const icono = TIPO_ICONS[notificacion.tipo] ?? '🔔';

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
