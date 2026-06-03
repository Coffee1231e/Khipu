import { useState } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, EmptyState, PageLoader, SearchInput, SelectSearch } from '@shared/components/ui';
import { BookOpen, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Ambiente } from '@shared/types';

interface Ficha { id: string; numero: string; nombre: string; ambienteId: string; activo: boolean; ambiente?: { id: string; nombre: string }; }

export default function FichasPage() {
  const [modal, setModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState({ numero: '', nombre: '', ambienteId: '' });
  const [loading, setLoading] = useState(false);

  const { data, loading: cargando, refetch } = useFetch<{ fichas: Ficha[] }>('/fichas');
  const { data: ambData } = useFetch<{ ambientes: Ambiente[] }>('/ambientes');

  const fichas = (data?.fichas ?? []).filter(f =>
    f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.numero.toLowerCase().includes(busqueda.toLowerCase())
  );
  const ambientes = ambData?.ambientes ?? [];

  const handleGuardar = async () => {
    if (!form.numero.trim() || !form.nombre.trim() || !form.ambienteId) { toast.error('Todos los campos son requeridos'); return; }
    setLoading(true);
    try {
      await api.post('/fichas', form);
      toast.success('Ficha creada.');
      setModal(false); setForm({ numero: '', nombre: '', ambienteId: '' }); refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Fichas de Formación</h2>
          <p className="text-forest-500 text-sm">{data?.fichas.length ?? 0} fichas registradas</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva ficha
        </button>
      </div>

      <div className="card p-4">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o número..." />
      </div>

      {cargando ? <PageLoader /> : fichas.length === 0 ? (
        <EmptyState icon={<BookOpen size={32} />} title="Sin fichas" description="No hay fichas que coincidan." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-forest-50 border-b border-forest-100">
              <tr>
                <th className="th">Número</th>
                <th className="th">Nombre</th>
                <th className="th hidden md:table-cell">Ambiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {fichas.map((f) => (
                <tr key={f.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <span className="font-mono text-amber-600 text-sm font-medium">{f.numero}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-sena-800">{f.nombre}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-forest-500">
                    {f.ambiente?.nombre ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva ficha" size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleGuardar} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : 'Crear ficha'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Número de ficha *</label>
            <input className="input mt-1 font-mono" value={form.numero} onChange={(e) => setForm(p => ({ ...p, numero: e.target.value }))} maxLength={20} placeholder="Ej: 2879834" autoFocus />
          </div>
          <div>
            <label className="label">Nombre del programa *</label>
            <input className="input mt-1" value={form.nombre} onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))} maxLength={200} placeholder="Ej: Técnico en Sistemas" />
          </div>
          <div>
            <label className="label">Ambiente asignado *</label>
            <SelectSearch
              options={ambientes.map((a) => ({ value: a.id, label: a.nombre, sublabel: a.nave?.nombre }))}
              value={form.ambienteId}
              onChange={(v) => setForm(p => ({ ...p, ambienteId: v }))}
              placeholder="Seleccionar ambiente"
              className="mt-1"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
