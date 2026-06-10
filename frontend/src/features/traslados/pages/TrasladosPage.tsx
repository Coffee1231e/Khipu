import { useState } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, EmptyState, PageLoader, Paginacion, SelectSearch } from '@shared/components/ui';
import { ArrowLeftRight, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SolicitudTraslado, Item, Ambiente } from '@shared/types';
import { useAuth } from '@features/auth/context/AuthContext';
import { formatFecha } from '@features/notificaciones/utils/formatDate';

const ESTADO_COLORS = { pendiente: 'badge-yellow', aceptado: 'badge-green', rechazado: 'badge-red' };
const ESTADO_LABELS = { pendiente: 'Pendiente', aceptado: 'Aprobado', rechazado: 'Rechazado' };

export default function TrasladosPage() {
  const { user, esEncargado, esCoordinador, esAdmin } = useAuth();
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina] = useState(1);

  // Tabs para coordinador
  const [selectedNaveId, setSelectedNaveId] = useState<string | null>(
    user?.rol === 'coordinador' && user.naves?.[0] ? user.naves[0].id : null
  );

  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [modalResolver, setModalResolver] = useState<{ id: string; accion: 'aceptar' | 'rechazar' } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [formSolicitud, setFormSolicitud] = useState({ itemId: '', ambienteDestinoId: '', observaciones: '' });
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams({ 
    pagina: String(pagina), limite: '20', 
    ...(filtroEstado && { estado: filtroEstado }),
    ...(selectedNaveId && { naveId: selectedNaveId })
  });
  const { data, loading: cargando, refetch } = useFetch<{ solicitudes: SolicitudTraslado[]; paginacion: { total: number; paginas: number } }>(
    `/traslados?${params}`,
  );

  const { data: itemsData } = useFetch<{ items: Item[] }>('/bodega?estado=activo&limite=200');
  const { data: ambData } = useFetch<{ ambientes: Ambiente[] }>('/ambientes');

  const solicitudes = data?.solicitudes ?? [];
  const totalPaginas = data?.paginacion?.paginas ?? 1;
  const total = data?.paginacion?.total ?? 0;
  const items = itemsData?.items ?? [];
  const ambientes = ambData?.ambientes ?? [];

  const handleSolicitar = async () => {
    if (!formSolicitud.itemId || !formSolicitud.ambienteDestinoId) { toast.error('Completa todos los campos requeridos'); return; }
    setLoading(true);
    try {
      await api.post('/traslados', {
        itemId: Number(formSolicitud.itemId),
        ambienteDestinoId: formSolicitud.ambienteDestinoId,
        observaciones: formSolicitud.observaciones || undefined,
      });
      toast.success('Solicitud de traslado enviada.');
      setModalSolicitar(false);
      setFormSolicitud({ itemId: '', ambienteDestinoId: '', observaciones: '' });
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const handleResolver = async () => {
    if (!modalResolver) return;
    if (modalResolver.accion === 'rechazar' && !motivo.trim()) { toast.error('Indica el motivo del rechazo'); return; }
    setLoading(true);
    try {
      await api.patch(`/traslados/${modalResolver.id}/resolver`, {
        accion: modalResolver.accion,
        motivoRechazo: motivo || undefined,
      });
      toast.success(modalResolver.accion === 'aceptar' ? 'Traslado aprobado.' : 'Traslado rechazado.');
      setModalResolver(null); setMotivo(''); refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const puedeResolver = (s: SolicitudTraslado) => {
    if (s.estado !== 'pendiente') return false;
    if (esAdmin) return true;
    if (esEncargado && !s.esInterNave) return true;
    if (esCoordinador && s.esInterNave) return true;
    return false;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Traslados</h2>
          <p className="text-forest-500 text-sm">{total} solicitudes</p>
        </div>
        <button onClick={() => setModalSolicitar(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Solicitar traslado
        </button>
      </div>

      {/* ─── NAVE TABS (Coordinador) ─── */}
      {user?.rol === 'coordinador' && user.naves && user.naves.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sena-200">
          {user.naves.map(nave => (
            <button
              key={nave.id}
              onClick={() => { setSelectedNaveId(nave.id); setPagina(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedNaveId === nave.id
                  ? 'bg-sena-600 text-white shadow-md'
                  : 'bg-white text-sena-700 border border-sena-100 hover:bg-sena-50'
              }`}
            >
              {nave.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 flex gap-2 flex-wrap">
        {[{ v: '', l: 'Todos' }, { v: 'pendiente', l: 'Pendientes' }, { v: 'aceptado', l: 'Aprobados' }, { v: 'rechazado', l: 'Rechazados' }].map(f => (
          <button key={f.v} onClick={() => { setFiltroEstado(f.v); setPagina(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtroEstado === f.v ? 'bg-sena-600 text-white' : 'bg-forest-100 text-forest-600 hover:bg-forest-200'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? <PageLoader /> : solicitudes.length === 0 ? (
        <EmptyState icon={<ArrowLeftRight size={32} />} title="Sin traslados" description="No hay solicitudes de traslado." />
      ) : (
        <>
          <div className="space-y-3">
            {solicitudes.map(s => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <ArrowLeftRight size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sena-900">{s.item?.nombre}</p>
                        <span className="font-mono text-amber-600 text-xs">#{s.item?.numeroInventario}</span>
                        <span className={`badge ${ESTADO_COLORS[s.estado]} text-xs`}>{ESTADO_LABELS[s.estado]}</span>
                        {s.esInterNave && <span className="badge badge-purple text-xs">Inter-nave</span>}
                      </div>
                      <p className="text-forest-500 text-sm mt-1">
                        <span className="font-medium">{s.ambienteOrigen?.nombre}</span>
                        {s.ambienteOrigen?.nave && <span className="text-forest-400"> ({s.ambienteOrigen.nave.nombre})</span>}
                        {' → '}
                        <span className="font-medium">{s.ambienteDestino?.nombre}</span>
                        {s.ambienteDestino?.nave && <span className="text-forest-400"> ({s.ambienteDestino.nave.nombre})</span>}
                      </p>
                      <p className="text-xs text-forest-400 mt-1 flex items-center gap-1">
                        <Clock size={11} /> {formatFecha(s.creadoEn)} · {s.solicitante?.nombre}
                      </p>
                      {s.motivoRechazo && (
                        <p className="text-xs text-red-500 mt-1 bg-red-50 rounded-lg px-2 py-1">
                          Rechazado: {s.motivoRechazo}
                        </p>
                      )}
                    </div>
                  </div>
                  {puedeResolver(s) && (
                    <div className="flex gap-2">
                      <button onClick={() => setModalResolver({ id: s.id, accion: 'aceptar' })} className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3">
                        <CheckCircle2 size={14} /> Aprobar
                      </button>
                      <button onClick={() => setModalResolver({ id: s.id, accion: 'rechazar' })} className="btn-danger flex items-center gap-1.5 text-sm py-1.5 px-3">
                        <XCircle size={14} /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </>
      )}

      {/* Modal solicitar */}
      <Modal open={modalSolicitar} onClose={() => setModalSolicitar(false)} title="Solicitar traslado" size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalSolicitar(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSolicitar} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Ítem a trasladar *</label>
            <SelectSearch
              options={items.map(i => ({ value: String(i.id), label: i.nombre, sublabel: `N° ${i.numeroInventario} · ${i.ambiente?.nombre ?? 'Bodega'}` }))}
              value={formSolicitud.itemId}
              onChange={v => setFormSolicitud(p => ({ ...p, itemId: v }))}
              placeholder="Buscar ítem por nombre o número..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="label">Ambiente destino *</label>
            <SelectSearch
              options={ambientes.map(a => ({ value: a.id, label: a.nombre, sublabel: a.nave?.nombre }))}
              value={formSolicitud.ambienteDestinoId}
              onChange={v => setFormSolicitud(p => ({ ...p, ambienteDestinoId: v }))}
              placeholder="Buscar ambiente destino..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea className="input mt-1 resize-none" rows={3} value={formSolicitud.observaciones}
              onChange={e => setFormSolicitud(p => ({ ...p, observaciones: e.target.value }))} maxLength={500} />
          </div>
        </div>
      </Modal>

      {/* Modal resolver */}
      <Modal open={!!modalResolver} onClose={() => { setModalResolver(null); setMotivo(''); }}
        title={modalResolver?.accion === 'aceptar' ? 'Aprobar traslado' : 'Rechazar traslado'} size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setModalResolver(null); setMotivo(''); }} className="btn-secondary">Cancelar</button>
            <button onClick={handleResolver} disabled={loading}
              className={`${modalResolver?.accion === 'aceptar' ? 'btn-primary' : 'btn-danger'} disabled:opacity-60`}>
              {loading ? 'Procesando...' : modalResolver?.accion === 'aceptar' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
            </button>
          </div>
        }
      >
        {modalResolver?.accion === 'rechazar' ? (
          <div>
            <label className="label">Motivo del rechazo *</label>
            <textarea className="input mt-1 resize-none" rows={3} value={motivo}
              onChange={e => setMotivo(e.target.value)} placeholder="Explica el motivo..." maxLength={500} autoFocus />
          </div>
        ) : (
          <p className="text-forest-600 text-sm">¿Confirmas la aprobación de este traslado? El ítem se moverá al ambiente destino.</p>
        )}
      </Modal>
    </div>
  );
}
