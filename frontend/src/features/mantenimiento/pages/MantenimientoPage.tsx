import { useState } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { EmptyState, PageLoader, Modal } from '@shared/components/ui';
import { Wrench, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SolicitudMantenimiento } from '@shared/types';
import { useAuth } from '@features/auth/context/AuthContext';
import { formatFecha } from '@features/notificaciones/utils/formatDate';
import { compressImageToWebP } from '@shared/utils/imageCompressor';
import { IniciarMantenimientoModal } from '../components/IniciarMantenimientoModal';
import { Image as ImageIcon } from 'lucide-react';

const ESTADO_COLORS = { pendiente: 'badge-yellow', aceptado: 'badge-green', rechazado: 'badge-red' };
const ESTADO_LABELS = { pendiente: 'Pendiente', aceptado: 'Completado', rechazado: 'Rechazado' };

export default function MantenimientoPage() {
  const { esServicio, esAdmin } = useAuth();
  const [filtro, setFiltro] = useState('');
  const [modalResolver, setModalResolver] = useState<SolicitudMantenimiento | null>(null);
  const [modalIniciar, setModalIniciar] = useState<SolicitudMantenimiento | null>(null);
  const [resultado, setResultado] = useState<'devuelto' | 'baja'>('devuelto');
  const [observaciones, setObservaciones] = useState('');
  const [fotoResolver, setFotoResolver] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const params = filtro ? `?estado=${filtro}` : '';
  const { data, loading: cargando, refetch } = useFetch<{ solicitudes: SolicitudMantenimiento[] }>(
    `/mantenimiento${params}`,
  );
  const solicitudes = data?.solicitudes ?? [];

  const handleResolver = async () => {
    if (!modalResolver) return;
    if (resultado === 'devuelto' && !fotoResolver) {
      toast.error('Es obligatorio subir una foto del ítem reparado.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('resultado', resultado);
      if (observaciones) fd.append('observaciones', observaciones);
      if (resultado === 'devuelto' && fotoResolver) fd.append('imagen', fotoResolver);

      await api.patch(`/mantenimiento/${modalResolver.id}/resolver`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(resultado === 'devuelto' ? 'Ítem devuelto al ambiente.' : 'Ítem dado de baja.');
      setModalResolver(null);
      setObservaciones('');
      setFotoResolver(null);
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const handleIniciar = async (obs: string, foto: File) => {
    if (!modalIniciar) return;
    setLoading(true);
    try {
      const fd = new FormData();
      if (obs) fd.append('observaciones', obs);
      fd.append('imagen', foto);

      await api.post(`/mantenimiento/${modalIniciar.id}/iniciar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Mantenimiento iniciado. El ítem ahora figura en mantenimiento.');
      setModalIniciar(null);
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al iniciar'); }
    finally { setLoading(false); }
  };

  const handleReclamar = async (itemId: number) => {
    setLoading(true);
    try {
      await api.post(`/mantenimiento/${itemId}/reclamar`);
      toast.success('Has reclamado esta solicitud. Se notificó al encargado.');
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al reclamar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-sena-900 text-xl">Mantenimiento</h2>
        <p className="text-forest-500 text-sm">{solicitudes.length} solicitudes</p>
      </div>

      {/* Filtros de estado */}
      <div className="card p-4 flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Todas' },
          { value: 'pendiente', label: 'Pendientes' },
          { value: 'aceptado', label: 'Completadas' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === f.value ? 'bg-sena-600 text-white' : 'bg-forest-100 text-forest-600 hover:bg-forest-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? <PageLoader /> : solicitudes.length === 0 ? (
        <EmptyState icon={<Wrench size={32} />} title="Sin solicitudes" description="No hay solicitudes de mantenimiento." />
      ) : (
        <div className="space-y-3">
          {solicitudes.map(s => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {s.item?.imagenUrl
                      ? <img src={s.item.imagenUrl} alt="" className="w-full h-full object-cover" />
                      : <Wrench size={18} className="text-orange-500" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sena-900">{s.item?.nombre}</p>
                      <span className="font-mono text-amber-600 text-xs">#{s.item?.numeroInventario}</span>
                      <span className={`badge ${ESTADO_COLORS[s.estado]} text-xs`}>
                        {ESTADO_LABELS[s.estado]}
                      </span>
                    </div>
                    <p className="text-sm text-forest-600 mt-1">
                      <span className="font-medium">Falla:</span> {s.descripcionFalla}
                    </p>
                    {s.item?.nave && s.item?.ambiente && (
                      <p className="text-xs text-forest-400 mt-0.5">
                        {s.item.nave.nombre} — {s.item.ambiente.nombre}
                      </p>
                    )}
                    <p className="text-xs text-forest-400 mt-1 flex items-center gap-1">
                      <Clock size={11} />
                      {formatFecha(s.creadoEn)} · Solicitado por {s.solicitante?.nombre}
                    </p>
                    {s.resultadoFinal && (
                      <p className="text-xs text-forest-500 mt-1">
                        Resultado: <strong>{s.resultadoFinal === 'devuelto' ? 'Devuelto' : 'Dado de baja'}</strong>
                        {s.completadoEn && ` · ${formatFecha(s.completadoEn)}`}
                      </p>
                    )}
                    {s.estado === 'pendiente' && s.servicioId && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        {s.aprobadoPorEncargado 
                          ? (s.iniciadoEn ? 'Mantenimiento en curso' : 'Aprobado (Esperando ingreso)') 
                          : 'Reclamado (Esperando aprobación del encargado)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acción para servicio o admin */}
                {s.estado === 'pendiente' && (
                  <div className="flex gap-2">
                    {esServicio && !s.servicioId && (
                      <button
                        onClick={() => handleReclamar(s.itemId)}
                        disabled={loading}
                        className="btn-secondary text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-sm disabled:opacity-50"
                      >
                        Reclamar
                      </button>
                    )}
                    {(esAdmin || (esServicio && s.servicioId === useAuth().user?.id)) && (
                      <>
                        {s.aprobadoPorEncargado && !s.iniciadoEn && (
                          <button
                            onClick={() => setModalIniciar(s)}
                            className="btn-primary bg-amber-500 hover:bg-amber-600 ring-amber-500/50 flex items-center gap-2 text-sm"
                          >
                            <Wrench size={14} /> Iniciar Mantenimiento
                          </button>
                        )}
                        {s.iniciadoEn && (
                          <button
                            onClick={() => { setModalResolver(s); setResultado('devuelto'); setObservaciones(''); setFotoResolver(null); }}
                            className="btn-primary flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 size={14} /> Resolver
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal resolver */}
      <Modal
        open={!!modalResolver}
        onClose={() => setModalResolver(null)}
        title="Resolver mantenimiento"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalResolver(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleResolver} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        }
      >
        {modalResolver && (
          <div className="space-y-4">
            <p className="text-forest-600 text-sm">
              Ítem: <strong>{modalResolver.item?.nombre}</strong>
            </p>

            <div>
              <label className="label mb-2">Resultado del mantenimiento *</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setResultado('devuelto')}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${resultado === 'devuelto' ? 'border-sena-400 bg-sena-50 text-sena-700' : 'border-forest-200 text-forest-500'}`}
                >
                  <CheckCircle2 size={15} /> Devolver
                </button>
                <button
                  onClick={() => setResultado('baja')}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${resultado === 'baja' ? 'border-red-400 bg-red-50 text-red-600' : 'border-forest-200 text-forest-500'}`}
                >
                  <XCircle size={15} /> Dar de baja
                </button>
              </div>
            </div>

            <div>
              <label className="label">Observaciones del mantenimiento</label>
              <textarea
                className="input mt-1 resize-none"
                rows={3}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Describe el trabajo realizado..."
                maxLength={500}
              />
            </div>

            {resultado === 'devuelto' && (
              <div>
                <label className="label mb-2">Foto del ítem reparado * (Obligatorio)</label>
                <div className="flex gap-2">
                  <label className="btn-secondary flex-1 justify-center flex items-center gap-2 cursor-pointer mb-0">
                    <ImageIcon size={16} /> {fotoResolver ? 'Cambiar Foto' : 'Subir Foto'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressed = await compressImageToWebP(file);
                          if (compressed.size > 10 * 1024 * 1024) {
                            toast.error('Este archivo supera el valor máximo permitido (10MB) incluso después de comprimir.');
                            return;
                          }
                          setFotoResolver(compressed);
                        } catch(err) {
                          toast.error('Error al procesar la imagen');
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
                {fotoResolver && <p className="text-xs text-green-600 mt-2">Foto cargada: {fotoResolver.name}</p>}
              </div>
            )}

            {resultado === 'baja' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                El ítem será dado de baja permanentemente y no podrá ser reasignado.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Iniciar Mantenimiento */}
      <IniciarMantenimientoModal
        solicitud={modalIniciar}
        isOpen={!!modalIniciar}
        onClose={() => setModalIniciar(null)}
        onSubmit={handleIniciar}
        loading={loading}
      />
    </div>
  );
}
