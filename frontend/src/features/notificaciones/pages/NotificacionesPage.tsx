import { useEffect, useState } from 'react';
import { useNotificaciones } from '@features/notificaciones/context/NotificacionesContext';
import { PageLoader } from '@shared/components/ui';
import { Bell, Inbox, ChevronDown, ChevronUp, Package, RefreshCw, CheckCircle2, XCircle, ClipboardList, AlertTriangle, Wrench, Trash2, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from '../utils/formatDate';
import type { Notificacion } from '@shared/types';
import { useNavigate } from 'react-router-dom';

const TIPO_ICONS: Record<string, React.ReactElement> = {
  traslado_solicitado: <RefreshCw size={18} className="text-blue-500" />,
  traslado_aceptado: <CheckCircle2 size={18} className="text-green-500" />,
  traslado_rechazado: <XCircle size={18} className="text-red-500" />,
  verificacion_enviada: <ClipboardList size={18} className="text-purple-500" />,
  item_danado_reportado: <AlertTriangle size={18} className="text-amber-500" />,
  item_en_mantenimiento: <Wrench size={18} className="text-orange-500" />,
  item_devuelto: <RefreshCw size={18} className="text-teal-500" />,
  item_baja: <Trash2 size={18} className="text-gray-500" />,
  cuenta_creada: <UserPlus size={18} className="text-indigo-500" />,
};

export default function NotificacionesPage() {
  const { notificaciones, totalNoLeidas, marcarTodasLeidas, loading, marcarLeida } = useNotificaciones();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (totalNoLeidas > 0) {
      void marcarTodasLeidas();
    }
  }, [totalNoLeidas, marcarTodasLeidas]);

  const handleClick = async (n: Notificacion) => {
    if (!n.leida) await marcarLeida(n.id);
    
    // Si tiene items, es un acordeón
    const hasItems = Array.isArray((n.metadatos as any)?.items);
    if (hasItems) {
      setExpandedId(expandedId === n.id ? null : n.id);
      return;
    }
    
    // Si no, navega al destino
    if (n.urlDestino && n.urlDestino !== '/notificaciones') { 
      navigate(n.urlDestino); 
    }
  };

  if (loading && notificaciones.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sena-100 flex items-center justify-center text-sena-600">
            <Bell size={20} />
          </div>
          <h1 className="font-display font-bold text-sena-900 text-2xl">Notificaciones</h1>
        </div>
      </div>

      <div className="card overflow-hidden">
        {notificaciones.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-forest-400">
            <Inbox size={48} className="opacity-30 mb-4" />
            <p className="text-lg font-medium text-sena-900">Bandeja vacía</p>
            <p className="text-sm mt-1">No tienes notificaciones pendientes.</p>
          </div>
        ) : (
          <div className="divide-y divide-forest-50">
            {notificaciones.map((n) => {
              const itemsDanados = (n.metadatos as any)?.items as { id: number; nombre: string; numeroInventario: string }[] | undefined;
              const isExpanded = expandedId === n.id;

              return (
                <div key={n.id} className="p-5 hover:bg-forest-50/50 transition-colors">
                  <div 
                    className={`flex items-start gap-4 ${itemsDanados || n.urlDestino ? 'cursor-pointer' : ''}`}
                    onClick={() => handleClick(n)}
                  >
                    <div className="w-10 h-10 rounded-full bg-sena-50 flex items-center justify-center flex-shrink-0">
                      {TIPO_ICONS[n.tipo] ?? <Bell size={18} className="text-sena-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-sena-900">{n.titulo}</h3>
                          <p className="text-sena-800 mt-1">{n.mensaje}</p>
                        </div>
                        <span className="text-xs text-forest-500 whitespace-nowrap mt-1">
                          {formatDistanceToNow(n.creadoEn)}
                        </span>
                      </div>
                      
                      {itemsDanados && (
                        <div className="mt-3 flex items-center gap-1 text-sena-600 text-sm font-medium">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {isExpanded ? 'Ocultar ítems' : 'Ver ítems dañados'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acordeón de ítems */}
                  {itemsDanados && isExpanded && (
                    <div className="mt-4 ml-14 bg-white border border-forest-100 rounded-xl overflow-hidden animate-fade-in">
                      <table className="w-full text-sm">
                        <thead className="bg-forest-50 border-b border-forest-100 text-forest-600">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Ítem</th>
                            <th className="px-4 py-2 text-left font-medium">N° Inventario</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-forest-50">
                          {itemsDanados.map(item => (
                            <tr key={item.id}>
                              <td className="px-4 py-2 text-sena-900 flex items-center gap-2">
                                <Package size={14} className="text-forest-400" />
                                {item.nombre}
                              </td>
                              <td className="px-4 py-2 font-mono text-amber-600 text-xs">
                                {item.numeroInventario}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
