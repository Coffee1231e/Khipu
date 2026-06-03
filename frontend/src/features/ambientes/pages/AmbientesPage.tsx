import { useState } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, EmptyState, PageLoader, SelectSearch } from '@shared/components/ui';
import { Building2, Plus, Edit2, Map } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Ambiente, Nave } from '@shared/types';

interface FormData { nombre: string; descripcion: string; naveId: string; }

export default function AmbientesPage() {
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [activo, setActivo] = useState<Ambiente | null>(null);
  const [form, setForm] = useState<FormData>({ nombre: '', descripcion: '', naveId: '' });
  const [loading, setLoading] = useState(false);

  const { data: ambData, loading: cargando, refetch } = useFetch<{ ambientes: Ambiente[] }>('/ambientes');
  const { data: navesData } = useFetch<{ naves: Nave[] }>('/naves');

  const ambientes = ambData?.ambientes ?? [];
  const naves = navesData?.naves ?? [];

  // Agrupar por nave
  const porNave = naves.map((n) => ({
    nave: n,
    ambientes: ambientes.filter((a) => a.naveId === n.id),
  })).filter((g) => g.ambientes.length > 0);

  const sinNave = ambientes.filter((a) => !naves.find((n) => n.id === a.naveId));

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.naveId) { toast.error('Nombre y nave son requeridos'); return; }
    setLoading(true);
    try {
      if (modal === 'crear') {
        await api.post('/ambientes', form);
        toast.success('Ambiente creado.');
      } else {
        await api.put(`/ambientes/${activo!.id}`, { nombre: form.nombre, descripcion: form.descripcion });
        toast.success('Ambiente actualizado.');
      }
      setModal(null); refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const abrirEditar = (a: Ambiente) => {
    setActivo(a);
    setForm({ nombre: a.nombre, descripcion: a.descripcion ?? '', naveId: a.naveId });
    setModal('editar');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Ambientes</h2>
          <p className="text-forest-500 text-sm">{ambientes.length} ambientes registrados</p>
        </div>
        <button onClick={() => { setForm({ nombre: '', descripcion: '', naveId: '' }); setModal('crear'); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo ambiente
        </button>
      </div>

      {cargando ? <PageLoader /> : ambientes.length === 0 ? (
        <EmptyState icon={<Building2 size={32} />} title="Sin ambientes" description="Crea el primer ambiente asignándolo a una nave." />
      ) : (
        <div className="space-y-6">
          {porNave.map(({ nave, ambientes: amps }) => (
            <div key={nave.id}>
              <div className="flex items-center gap-2 mb-3">
                <Map size={15} className="text-sena-500" />
                <h3 className="font-semibold text-sena-800 text-sm">{nave.nombre}</h3>
                <span className="badge badge-green text-xs">{amps.length} ambientes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {amps.map((a) => (
                  <div key={a.id} className="card p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sena-900 text-sm">{a.nombre}</p>
                        {a.descripcion && <p className="text-forest-400 text-xs mt-0.5 line-clamp-1">{a.descripcion}</p>}
                        <p className="text-forest-400 text-xs mt-1">{a._count?.items ?? 0} ítems</p>
                      </div>
                    </div>
                    <button onClick={() => abrirEditar(a)} className="action-btn flex-shrink-0"><Edit2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {sinNave.length > 0 && (
            <div>
              <p className="text-forest-400 text-sm mb-3">Sin nave asignada</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sinNave.map((a) => (
                  <div key={a.id} className="card p-4 flex items-center justify-between gap-3">
                    <p className="font-medium text-sena-900 text-sm">{a.nombre}</p>
                    <button onClick={() => abrirEditar(a)} className="action-btn"><Edit2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'crear' ? 'Nuevo ambiente' : 'Editar ambiente'} size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleGuardar} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {modal === 'crear' && (
            <div>
              <label className="label">Nave *</label>
              <SelectSearch
                options={naves.map((n) => ({ value: n.id, label: n.nombre }))}
                value={form.naveId}
                onChange={(v) => setForm(p => ({ ...p, naveId: v }))}
                placeholder="Seleccionar nave"
                className="mt-1"
              />
            </div>
          )}
          <div>
            <label className="label">Nombre *</label>
            <input className="input mt-1" value={form.nombre} onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))} maxLength={100} autoFocus />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input mt-1 resize-none" rows={3} value={form.descripcion} onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))} maxLength={500} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
