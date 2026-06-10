import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { PageLoader, SelectSearch } from '@shared/components/ui';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Send, Package, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Item, VerificacionInventario } from '@shared/types';
import { useAuth } from '@features/auth/context/AuthContext';
import { formatFecha } from '@features/notificaciones/utils/formatDate';

type EstadoVerificacion = 'presente' | 'ausente' | 'danado';

interface DetalleForm {
  itemId: number;
  nombre: string;
  numeroInventario: string;
  imagenUrl?: string;
  estado: EstadoVerificacion | null;
}

const ESTADO_CONFIG = {
  presente: { label: 'Presente', icon: <CheckCircle2 size={16} />, color: 'bg-sena-100 text-sena-600 border-sena-300' },
  ausente:  { label: 'Ausente',  icon: <XCircle size={16} />,      color: 'bg-red-50 text-red-600 border-red-300' },
  danado:   { label: 'Dañado',   icon: <AlertTriangle size={16} />, color: 'bg-red-50 text-red-600 border-red-300' },
};

export default function VerificacionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNueva = !id || id === 'nueva';

  // Estado del formulario (solo para nueva)
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [ambienteId, setAmbienteId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar verificación existente
  const { data: verData, loading: verLoading } = useFetch<{ verificacion: VerificacionInventario }>(
    !isNueva ? `/verificaciones/${id}` : null,
  );

  // Ambientes del usuario
  const { data: ambData } = useFetch<{ ambientes: { id: string; nombre: string; naveId: string; nave?: { nombre: string } }[] }>('/ambientes');
  const ambientes = ambData?.ambientes ?? [];

  // Ítems del ambiente seleccionado
  const { data: itemsData, loading: itemsLoading } = useFetch<{ items: Item[] }>(
    ambienteId ? `/bodega?ambienteId=${ambienteId}&estado=activo&limite=100` : null,
  );

  useEffect(() => {
    if (itemsData?.items) {
      setDetalles(itemsData.items.map(item => ({
        itemId: item.id,
        nombre: item.nombre,
        numeroInventario: item.numeroInventario,
        imagenUrl: item.imagenUrl,
        estado: null,
      })));
    }
  }, [itemsData]);

  useEffect(() => {
    if (user?.ambientes?.[0] && !ambienteId) {
      setAmbienteId(user.ambientes[0].id);
    }
  }, [user]);

  const marcarEstado = (itemId: number, estado: EstadoVerificacion) => {
    setDetalles(prev => prev.map(d =>
      d.itemId === itemId ? { ...d, estado: d.estado === estado ? null : estado } : d,
    ));
  };

  const todosVerificados = detalles.length > 0 && detalles.every(d => d.estado !== null);
  const verificadosCount = detalles.filter(d => d.estado !== null).length;

  const handleEnviar = async () => {
    if (!ambienteId) { toast.error('Selecciona un ambiente'); return; }
    if (!todosVerificados) { toast.error(`Debes verificar todos los ítems (${detalles.length - verificadosCount} pendientes)`); return; }

    setLoading(true);
    try {
      await api.post('/verificaciones', {
        ambienteId,
        tipo,
        observaciones: observaciones.trim() || undefined,
        detalles: detalles.map(d => ({ itemId: d.itemId, estado: d.estado })),
      });
      toast.success('Verificación enviada correctamente.');
      navigate('/verificaciones');
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al enviar');
    } finally { setLoading(false); }
  };

  // Vista de verificación existente (read-only)
  if (!isNueva) {
    if (verLoading) return <PageLoader />;
    const ver = verData?.verificacion;
    if (!ver) return <div className="card p-8 text-center"><p className="text-forest-500">Verificación no encontrada.</p></div>;

    const COLORS = {
      presente: 'bg-sena-100 text-sena-700',
      ausente: 'bg-red-50 text-red-600',
      danado: 'bg-red-50 text-red-700',
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/verificaciones')} className="btn-icon"><ArrowLeft size={18} /></button>
          <div>
            <h2 className="font-display font-bold text-sena-900 text-xl">
              Verificación de {ver.tipo}
            </h2>
            <p className="text-forest-500 text-sm">{formatFecha(ver.creadoEn)} · {ver.usuario?.nombre}</p>
          </div>
        </div>

        {ver.observaciones && (
          <div className="card p-4">
            <p className="text-xs text-forest-500 mb-1">Observaciones</p>
            <p className="text-sm text-sena-800">{ver.observaciones}</p>
          </div>
        )}

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-forest-50 border-b border-forest-100">
              <tr>
                <th className="th">Ítem</th>
                <th className="th">Estado verificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {(ver.detalles ?? []).map(d => (
                <tr key={d.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-sena-50 flex items-center justify-center overflow-hidden">
                        {d.item?.imagenUrl
                          ? <img src={d.item.imagenUrl} alt="" className="w-full h-full object-cover" />
                          : <Package size={14} className="text-forest-300" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sena-900">{d.item?.nombre}</p>
                        <p className="font-mono text-amber-600 text-xs">N° {d.item?.numeroInventario}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${COLORS[d.estado as keyof typeof COLORS]} text-xs`}>
                      {ESTADO_CONFIG[d.estado as keyof typeof ESTADO_CONFIG]?.label || d.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sección de Confirmación de Daños */}
        {(user?.rol === 'encargado' || user?.rol === 'administrador') && 
         !ver.danosReportados && 
         (ver.detalles ?? []).some(d => d.estado === 'danado') && (
          <div className="card bg-amber-50/50 border-amber-200 p-5 mt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 text-base">Ítems dañados detectados</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Se han encontrado {(ver.detalles ?? []).filter(d => d.estado === 'danado').length} ítem(s) dañados en esta verificación. 
                  Por favor confirme para reportarlos oficialmente como dañados en el inventario y notificar al equipo de Servicio.
                </p>
                <button
                  onClick={async () => {
                    if (confirm('¿Estás seguro de reportar estos ítems como dañados? Esta acción es irreversible.')) {
                      setLoading(true);
                      try {
                        await api.patch(`/verificaciones/${ver.id}/confirmar-danos`);
                        toast.success('Daños reportados y notificados a Servicio');
                        window.location.reload();
                      } catch (e: any) {
                        toast.error(e.mensajeUI || 'Error al confirmar daños');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  disabled={loading}
                  className="mt-4 btn-primary bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 text-sm py-2.5 px-5 flex items-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertTriangle size={16} />}
                  {loading ? 'Confirmando...' : 'Confirmar y reportar daños'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Formulario de nueva verificación
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/verificaciones')} className="btn-icon"><ArrowLeft size={18} /></button>
        <h2 className="font-display font-bold text-sena-900 text-xl">Nueva verificación</h2>
      </div>

      {/* Configuración */}
      <div className="card p-5 space-y-4">
        {/* Tipo */}
        <div>
          <label className="label mb-2">Tipo de verificación *</label>
          <div className="flex gap-3">
            {(['entrada', 'salida'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                  tipo === t
                    ? t === 'entrada' ? 'border-sena-400 bg-sena-50 text-sena-700' : 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-forest-200 text-forest-500 hover:border-forest-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {t === 'entrada' ? <LogIn size={16} /> : <LogOut size={16} />}
                  <span>{t === 'entrada' ? 'Entrada' : 'Salida'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ambiente */}
        {!user?.ambientes?.[0] && (
          <div>
            <label className="label">Ambiente *</label>
            <SelectSearch
              options={ambientes.map(a => ({ value: a.id, label: a.nombre, sublabel: a.nave?.nombre }))}
              value={ambienteId}
              onChange={setAmbienteId}
              placeholder="Seleccionar ambiente"
              className="mt-1"
            />
          </div>
        )}

        {/* Observaciones */}
        <div>
          <label className="label">Observaciones <span className="text-forest-400 font-normal">(opcional)</span></label>
          <textarea className="input mt-1 resize-none" rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)} maxLength={500} placeholder="Observaciones generales de la verificación..." />
        </div>
      </div>

      {/* Lista de ítems */}
      {ambienteId && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-forest-100 flex items-center justify-between">
            <p className="font-semibold text-sena-900 text-sm">Ítems a verificar</p>
            {detalles.length > 0 && (
              <span className="text-xs text-forest-500">
                {verificadosCount}/{detalles.length} verificados
              </span>
            )}
          </div>

          {itemsLoading ? (
            <div className="py-10 flex justify-center"><div className="w-5 h-5 border-2 border-sena-300 border-t-sena-600 rounded-full animate-spin" /></div>
          ) : detalles.length === 0 ? (
            <div className="py-10 text-center text-forest-400 text-sm">No hay ítems activos en este ambiente.</div>
          ) : (
            <div className="divide-y divide-forest-50">
              {detalles.map(d => (
                <div key={d.itemId} className="px-5 py-3 flex items-center gap-4">
                  {/* Imagen */}
                  <div className="w-10 h-10 rounded-lg bg-sena-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {d.imagenUrl
                      ? <img src={d.imagenUrl} alt={d.nombre} className="w-full h-full object-cover" />
                      : <Package size={15} className="text-forest-300" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sena-900 truncate">{d.nombre}</p>
                    <p className="font-mono text-amber-600 text-xs">N° {d.numeroInventario}</p>
                  </div>

                  {/* Botones de estado */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {(Object.entries(ESTADO_CONFIG) as [EstadoVerificacion, typeof ESTADO_CONFIG.presente][]).map(([est, cfg]) => (
                      <button
                        key={est}
                        onClick={() => marcarEstado(d.itemId, est)}
                        title={cfg.label}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all text-xs
                          ${d.estado === est ? cfg.color + ' border-opacity-100' : 'border-forest-200 text-forest-400 hover:border-forest-300'}
                        `}
                      >
                        {cfg.icon}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Barra inferior */}
      {ambienteId && detalles.length > 0 && (
        <div className="card p-4 flex items-center justify-between gap-4 sticky bottom-4">
          <div>
            {todosVerificados
              ? <p className="text-sena-700 text-sm font-medium flex items-center gap-1.5"><CheckCircle2 size={16} /> Todos los ítems verificados</p>
              : <p className="text-amber-600 text-sm">{detalles.length - verificadosCount} ítem(s) pendientes</p>
            }
          </div>
          <button
            onClick={handleEnviar}
            disabled={!todosVerificados || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={15} />
            {loading ? 'Enviando...' : 'Enviar verificación'}
          </button>
        </div>
      )}
    </div>
  );
}
