import { useState } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, EmptyState, PageLoader } from '@shared/components/ui';
import { Map, Plus, Edit2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Nave } from '@shared/types';

interface FormData { nombre: string; descripcion: string; }

export default function NavesPage() {
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [activa, setActiva] = useState<Nave | null>(null);
  const [form, setForm] = useState<FormData>({ nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(false);

  const { data, loading: cargando, refetch } = useFetch<{ naves: Nave[] }>('/naves');
  const naves = data?.naves ?? [];

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setLoading(true);
    try {
      if (modal === 'crear') {
        await api.post('/naves', form);
        toast.success('Nave creada.');
      } else {
        await api.put(`/naves/${activa!.id}`, form);
        toast.success('Nave actualizada.');
      }
      setModal(null); refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const abrirEditar = (n: Nave) => {
    setActiva(n);
    setForm({ nombre: n.nombre, descripcion: n.descripcion ?? '' });
    setModal('editar');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Naves</h2>
          <p className="text-forest-500 text-sm">{naves.length} naves registradas</p>
        </div>
        <button
          onClick={() => { setForm({ nombre: '', descripcion: '' }); setActiva(null); setModal('crear'); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nueva nave
        </button>
      </div>

      {cargando ? <PageLoader /> : naves.length === 0 ? (
        <EmptyState
          icon={<Map size={32} />}
          title="Sin naves"
          description="Crea la primera nave para organizar los ambientes."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {naves.map(n => (
            <div key={n.id} className="card p-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Map size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sena-900">{n.nombre}</p>
                  {n.descripcion && (
                    <p className="text-forest-400 text-xs mt-0.5 line-clamp-2">{n.descripcion}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Building2 size={12} className="text-forest-400" />
                    <span className="text-xs text-forest-500">
                      {n._count?.ambientes ?? 0} ambientes
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => abrirEditar(n)} className="action-btn flex-shrink-0">
                <Edit2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nueva nave' : 'Editar nave'}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button
              onClick={handleGuardar}
              disabled={loading || !form.nombre.trim()}
              className="btn-primary disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input mt-1"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              maxLength={100}
              autoFocus
              placeholder="Ej: Nave 1 — Tecnología"
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input mt-1 resize-none"
              rows={3}
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              maxLength={500}
              placeholder="Descripción opcional de la nave"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
