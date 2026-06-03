import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, PageLoader, SelectSearch, ConfirmDialog } from '@shared/components/ui';
import {
  ArrowLeft, Edit2, MapPin, Package, Camera,
  ArrowLeftRight, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Item, Nave, Ambiente, CategoriaItem } from '@shared/types';
import { ESTADO_ITEM_LABELS, ESTADO_ITEM_COLORS, TIPO_MOVIMIENTO_LABELS } from '@shared/types';
import { useAuth } from '@features/auth/context/AuthContext';
import { formatFecha } from '@features/notificaciones/utils/formatDate';

export default function BodegaItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { puedeEditarBodega } = useAuth();

  const [modalEditar, setModalEditar] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [confirmBaja, setConfirmBaja] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', descripcion: '', observaciones: '', categoriaId: '' });
  const [asignarForm, setAsignarForm] = useState({ naveId: '', ambienteId: '' });
  const [loading, setLoading] = useState(false);

  const { data, loading: cargando, refetch } = useFetch<{ item: Item }>(`/bodega/${id}`);
  const { data: navesData } = useFetch<{ naves: Nave[] }>('/naves');
  const { data: catData } = useFetch<{ categorias: CategoriaItem[] }>('/categorias');

  const item = data?.item;
  const naves = navesData?.naves ?? [];
  const categorias = catData?.categorias ?? [];

  // Ambientes filtrados por nave seleccionada
  const { data: ambData } = useFetch<{ ambientes: Ambiente[] }>(
    asignarForm.naveId ? `/ambientes?naveId=${asignarForm.naveId}` : null,
  );
  const ambientes = ambData?.ambientes ?? [];

  const abrirEditar = () => {
    if (!item) return;
    setEditForm({
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      observaciones: item.observaciones ?? '',
      categoriaId: String(item.categoriaId),
    });
    setModalEditar(true);
  };

  const handleEditar = async () => {
    setLoading(true);
    try {
      await api.put(`/bodega/${id}`, {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        observaciones: editForm.observaciones,
        categoriaId: Number(editForm.categoriaId),
      });
      toast.success('Ítem actualizado.');
      setModalEditar(false);
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const handleAsignar = async () => {
    if (!asignarForm.naveId || !asignarForm.ambienteId) { toast.error('Selecciona nave y ambiente'); return; }
    setLoading(true);
    try {
      await api.post(`/bodega/${id}/asignar`, asignarForm);
      toast.success('Ítem asignado correctamente.');
      setModalAsignar(false);
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('imagen', file);
    try {
      await api.post(`/bodega/${id}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Imagen actualizada.');
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al subir imagen'); }
  };

  const handleBaja = async () => {
    setLoading(true);
    try {
      await api.post(`/bodega/${id}/baja`, {});
      toast.success('Ítem dado de baja.');
      navigate('/bodega');
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  if (cargando) return <PageLoader />;
  if (!item) return (
    <div className="card p-8 text-center">
      <p className="text-forest-500">Ítem no encontrado.</p>
      <button onClick={() => navigate('/bodega')} className="btn-secondary mt-4">Volver</button>
    </div>
  );

  const MOV_COLORS: Record<string, string> = {
    entrada: 'bg-sena-100 text-sena-600', asignacion: 'bg-blue-50 text-blue-600',
    traslado: 'bg-amber-50 text-amber-600', mantenimiento: 'bg-orange-50 text-orange-600',
    devolucion: 'bg-purple-50 text-purple-600', baja: 'bg-red-50 text-red-500',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={() => navigate('/bodega')} className="btn-icon mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display font-bold text-sena-900 text-xl">{item.nombre}</h2>
            <span className={`badge ${ESTADO_ITEM_COLORS[item.estado]}`}>
              {ESTADO_ITEM_LABELS[item.estado]}
            </span>
          </div>
          <p className="font-mono text-amber-600 text-sm mt-0.5">N° {item.numeroInventario}</p>
        </div>
        {puedeEditarBodega && item.activo && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={abrirEditar} className="btn-secondary flex items-center gap-2">
              <Edit2 size={15} /> Editar
            </button>
            {item.estado === 'inactivo' && (
              <button onClick={() => setModalAsignar(true)} className="btn-primary flex items-center gap-2">
                <MapPin size={15} /> Asignar
              </button>
            )}
            {item.estado !== 'baja' && (
              <button onClick={() => setConfirmBaja(true)} className="btn-danger flex items-center gap-2">
                Dar de baja
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda - imagen e info */}
        <div className="space-y-4">
          {/* Imagen */}
          <div className="card overflow-hidden">
            <div className="w-full h-52 bg-sena-50 flex items-center justify-center relative">
              {item.imagenUrl ? (
                <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
              ) : (
                <Package size={48} className="text-forest-200" />
              )}
            </div>
            {puedeEditarBodega && item.activo && (
              <div className="p-3 border-t border-forest-100 flex gap-2">
                <label className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs cursor-pointer">
                  <Camera size={13} /> Galería
                  <input type="file" accept="image/*" onChange={handleSubirImagen} className="hidden" />
                </label>
                <label className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs cursor-pointer">
                  <Camera size={13} /> Cámara
                  <input type="file" accept="image/*" capture="environment" onChange={handleSubirImagen} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Info básica */}
          <div className="card p-5 space-y-3">
            <p className="font-semibold text-sena-900 text-sm">Información</p>
            {[
              { label: 'Categoría', value: item.categoria?.nombre },
              { label: 'Estado', value: ESTADO_ITEM_LABELS[item.estado] },
              { label: 'Creado', value: item.creadoEn ? formatFecha(item.creadoEn) : '—' },
              { label: 'Asignado', value: item.asignadoEn ? formatFecha(item.asignadoEn) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-xs text-forest-500">{label}</span>
                <span className="text-xs font-medium text-sena-800 text-right">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha - descripción y ubicación */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ubicación */}
          {item.estado === 'activo' && item.nave && item.ambiente && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-sena-500" />
                <p className="font-semibold text-sena-900 text-sm">Ubicación actual</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sena-50 rounded-xl p-3">
                  <p className="text-xs text-forest-500 mb-0.5">Nave</p>
                  <p className="font-medium text-sena-900 text-sm">{item.nave.nombre}</p>
                </div>
                <div className="bg-sena-50 rounded-xl p-3">
                  <p className="text-xs text-forest-500 mb-0.5">Ambiente</p>
                  <p className="font-medium text-sena-900 text-sm">{item.ambiente.nombre}</p>
                </div>
              </div>
            </div>
          )}

          {/* Descripción y observaciones */}
          <div className="card p-5 space-y-4">
            <div>
              <p className="label mb-1">Descripción</p>
              <p className="text-sena-800 text-sm leading-relaxed">{item.descripcion || 'Sin descripción'}</p>
            </div>
            {item.observaciones && (
              <div>
                <p className="label mb-1">Observaciones</p>
                <p className="text-sena-800 text-sm leading-relaxed">{item.observaciones}</p>
              </div>
            )}
          </div>

          {/* Historial de movimientos */}
          {item.movimientos && item.movimientos.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-forest-400" />
                <p className="font-semibold text-sena-900 text-sm">Historial de movimientos</p>
              </div>
              <div className="space-y-3">
                {item.movimientos.map((m, idx) => (
                  <div key={m.id} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${MOV_COLORS[m.tipo] ?? 'bg-forest-100 text-forest-500'}`}>
                        <ArrowLeftRight size={12} />
                      </div>
                      {idx < item.movimientos!.length - 1 && <div className="w-px flex-1 bg-forest-100 mt-1 min-h-3" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-sm font-medium text-sena-800">{TIPO_MOVIMIENTO_LABELS[m.tipo]}</p>
                      {(m.ambienteOrigen || m.ambienteDestino) && (
                        <p className="text-xs text-forest-500">
                          {m.ambienteOrigen?.nombre && `De: ${m.ambienteOrigen.nombre}`}
                          {m.ambienteDestino?.nombre && ` → ${m.ambienteDestino.nombre}`}
                        </p>
                      )}
                      <p className="text-xs text-forest-400 mt-0.5">
                        {m.usuario?.nombre} · {formatFecha(m.fecha)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal editar */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar ítem" size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalEditar(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleEditar} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            El N° de inventario <strong className="font-mono">{item.numeroInventario}</strong> no puede modificarse.
          </div>
          <div>
            <label className="label">Nombre *</label>
            <input className="input mt-1" value={editForm.nombre} onChange={(e) => setEditForm(p => ({ ...p, nombre: e.target.value }))} maxLength={200} />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input mt-1" value={editForm.categoriaId} onChange={(e) => setEditForm(p => ({ ...p, categoriaId: e.target.value }))}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input mt-1 resize-none" rows={3} value={editForm.descripcion} onChange={(e) => setEditForm(p => ({ ...p, descripcion: e.target.value }))} maxLength={1000} />
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea className="input mt-1 resize-none" rows={2} value={editForm.observaciones} onChange={(e) => setEditForm(p => ({ ...p, observaciones: e.target.value }))} maxLength={1000} />
          </div>
        </div>
      </Modal>

      {/* Modal asignar */}
      <Modal open={modalAsignar} onClose={() => setModalAsignar(false)} title="Asignar ítem a ambiente" size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalAsignar(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleAsignar} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Asignando...' : 'Confirmar asignación'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-forest-600 text-sm">Al asignar este ítem, pasará a estado <strong>Activo</strong>.</p>
          <div>
            <label className="label">Nave *</label>
            <SelectSearch
              options={naves.map((n) => ({ value: n.id, label: n.nombre }))}
              value={asignarForm.naveId}
              onChange={(v) => setAsignarForm({ naveId: v, ambienteId: '' })}
              placeholder="Seleccionar nave"
              className="mt-1"
            />
          </div>
          <div>
            <label className="label">Ambiente *</label>
            <SelectSearch
              options={ambientes.map((a) => ({ value: a.id, label: a.nombre }))}
              value={asignarForm.ambienteId}
              onChange={(v) => setAsignarForm(p => ({ ...p, ambienteId: v }))}
              placeholder={asignarForm.naveId ? 'Seleccionar ambiente' : 'Primero selecciona una nave'}
              disabled={!asignarForm.naveId}
              className="mt-1"
            />
          </div>
        </div>
      </Modal>

      {/* Confirmar baja */}
      <ConfirmDialog
        open={confirmBaja}
        onClose={() => setConfirmBaja(false)}
        onConfirm={handleBaja}
        title="Dar de baja"
        message={`¿Confirmas dar de baja permanente el ítem "${item.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Dar de baja"
        danger
        loading={loading}
      />
    </div>
  );
}
