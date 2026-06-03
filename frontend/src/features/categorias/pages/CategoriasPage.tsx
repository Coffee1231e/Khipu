import { useState, useMemo } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, ConfirmDialog, EmptyState, PageLoader, SearchInput } from '@shared/components/ui';
import { Tags, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CategoriaItem } from '@shared/types';

interface FormData { nombre: string; }

export default function CategoriasPage() {
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [activa, setActiva] = useState<CategoriaItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoriaItem | null>(null);
  const [form, setForm] = useState<FormData>({ nombre: '' });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const { data, loading: cargando, refetch } = useFetch<{ categorias: CategoriaItem[] }>('/categorias');
  const categorias = data?.categorias ?? [];

  // Filtrado local
  const filtradas = useMemo(() => {
    if (!q) return categorias;
    return categorias.filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()));
  }, [categorias, q]);

  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setLoading(true);
    try {
      if (modal === 'crear') {
        await api.post('/categorias', form);
        toast.success('Categoría creada.');
      } else {
        await api.put(`/categorias/${activa!.id}`, form);
        toast.success('Categoría actualizada.');
      }
      setModal(null);
      refetch();
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await api.delete(`/categorias/${confirmDelete.id}`);
      toast.success('Categoría eliminada.');
      setConfirmDelete(null);
      refetch();
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (c: CategoriaItem) => {
    setActiva(c);
    setForm({ nombre: c.nombre });
    setModal('editar');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Encabezado y Acciones ──────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Categorías</h2>
          <p className="text-forest-500 text-sm">Gestiona la clasificación de ítems</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Buscar categoría..."
            className="w-full sm:w-64"
          />
          <button
            onClick={() => { setForm({ nombre: '' }); setActiva(null); setModal('crear'); }}
            className="btn-primary flex-shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nueva categoría</span>
          </button>
        </div>
      </div>

      {/* ─── Contenido Principal ───────────────────────────── */}
      {cargando ? <PageLoader /> : categorias.length === 0 ? (
        <EmptyState
          icon={<Tags size={32} />}
          title="Sin categorías"
          description="Comienza creando la primera categoría para organizar los ítems de bodega."
          action={
            <button onClick={() => setModal('crear')} className="btn-primary">
              <Plus size={16} /> Crear categoría
            </button>
          }
        />
      ) : filtradas.length === 0 ? (
        <div className="card p-12 text-center text-forest-500">
          No se encontraron categorías que coincidan con "{q}".
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-forest-50 border-b border-forest-100">
                  <th className="th">Categoría</th>
                  <th className="th">Ítems asociados</th>
                  <th className="th w-[120px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-100">
                {filtradas.map(c => (
                  <tr key={c.id} className="table-row-hover group">
                    <td className="px-4 py-3 text-sm text-sena-900 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-sm text-forest-600">
                      <span className="badge badge-slate">{c._count?.items ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => abrirEditar(c)} className="action-btn" title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(c)} className="action-btn-danger" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal Crear/Editar ────────────────────────────── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nueva categoría' : 'Editar categoría'}
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
        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="label">Nombre de la categoría *</label>
            <input
              type="text"
              className="input mt-1"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              maxLength={100}
              autoFocus
              placeholder="Ej: Herramientas manuales"
            />
          </div>
          {/* Un botón oculto para permitir submit con Enter */}
          <button type="submit" className="hidden">Guardar</button>
        </form>
      </Modal>

      {/* ─── Confirmación de Eliminación ───────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleEliminar}
        title="Eliminar categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={loading}
      />
    </div>
  );
}
