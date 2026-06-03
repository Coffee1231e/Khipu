// ============================================================
//  features/notificaciones/components/NotificacionesPanel.tsx
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNotificaciones } from '../context/NotificacionesContext';
import { formatDistanceToNow } from '../utils/formatDate';
import type { Notificacion } from '@shared/types';

const TIPO_ICONS: Record<string, string> = {
  traslado_solicitado: '🔄', traslado_aceptado: '✅', traslado_rechazado: '❌',
  verificacion_enviada: '📋', item_danado_reportado: '⚠️', item_en_mantenimiento: '🔧',
  item_devuelto: '✅', item_baja: '🗑️', cuenta_creada: '👤',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificacionesPanel({ open, onClose }: Props) {
  const { notificaciones, totalNoLeidas, marcarLeida, marcarTodasLeidas, loading } = useNotificaciones();
  const navigate = useNavigate();

  if (!open) return null;

  const handleClick = async (n: Notificacion) => {
    if (!n.leida) await marcarLeida(n.id);
    if (n.urlDestino) { navigate(n.urlDestino); onClose(); }
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-card-hover border border-forest-100 z-50 animate-scale-in overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-forest-100">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-sena-600" />
          <span className="font-semibold text-sena-900">Notificaciones</span>
          {totalNoLeidas > 0 && (
            <span className="badge badge-green text-xs px-2 py-0.5">{totalNoLeidas}</span>
          )}
        </div>
        {totalNoLeidas > 0 && (
          <button
            onClick={() => void marcarTodasLeidas()}
            className="flex items-center gap-1.5 text-xs text-forest-500 hover:text-sena-600 transition-colors"
          >
            <CheckCheck size={13} />
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-5 h-5 border-2 border-sena-300 border-t-sena-600 rounded-full animate-spin" />
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-forest-400">
            <Inbox size={32} className="opacity-40" />
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          notificaciones.map((n) => (
            <button
              key={n.id}
              onClick={() => void handleClick(n)}
              className={`
                w-full flex items-start gap-3 px-5 py-3.5 text-left
                hover:bg-sena-50 transition-colors border-b border-forest-50 last:border-0
                ${!n.leida ? 'bg-sena-50/50' : ''}
              `}
            >
              <div className="flex-shrink-0 mt-1">
                {!n.leida
                  ? <div className="w-2 h-2 rounded-full bg-sena-500" />
                  : <div className="w-2 h-2" />
                }
              </div>

              <span className="text-base flex-shrink-0">
                {TIPO_ICONS[n.tipo] ?? '🔔'}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${!n.leida ? 'font-semibold text-sena-900' : 'text-sena-800'}`}>
                  {n.titulo}
                </p>
                <p className="text-xs text-forest-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {n.mensaje}
                </p>
                <p className="text-xs text-forest-400 mt-1">
                  {formatDistanceToNow(n.creadoEn)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
