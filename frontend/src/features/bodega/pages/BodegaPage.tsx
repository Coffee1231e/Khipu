// ============================================================
//  features/bodega/pages/BodegaPage.tsx
// ============================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Package } from 'lucide-react';
import { useAuth } from '@features/auth/context/AuthContext';
import { SearchInput, EmptyState, PageLoader, Paginacion, SelectSearch } from '@shared/components/ui';
import { BodegaItemCard } from '../components/BodegaItemCard';
import { ModalCrearItem } from '../components/BodegaItemCard';
import { useFetch } from '@shared/hooks/useFetch';
import type { Item, CategoriaItem, EstadoItem } from '@shared/types';

const ESTADOS: { value: EstadoItem | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'inactivo', label: 'En Bodega' },
  { value: 'activo', label: 'Activo' },
  { value: 'danado', label: 'Dañado' },
  { value: 'en_mantenimiento', label: 'En Mantenimiento' },
  { value: 'baja', label: 'Baja' },
];

export default function BodegaPage() {
  const { puedeEditarBodega } = useAuth();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [pagina, setPagina] = useState(1);
  const [modalCrear, setModalCrear] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  const { data: categoriasData } = useFetch<{ categorias: CategoriaItem[] }>('/categorias');
  const categorias = categoriasData?.categorias ?? [];

  const params = new URLSearchParams({
    pagina: String(pagina),
    limite: '20',
    ...(busqueda && { q: busqueda }),
    ...(estado && { estado }),
    ...(categoriaId && { categoriaId }),
  });

  const { data, loading, refetch } = useFetch<{
    items: Item[];
    paginacion: { total: number; paginas: number };
  }>(`/bodega?${params}`);

  const items = data?.items ?? [];
  const totalPaginas = data?.paginacion?.paginas ?? 1;
  const total = data?.paginacion?.total ?? 0;

  const handleBusqueda = useCallback((q: string) => {
    setBusqueda(q);
    setPagina(1);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Bodega de Inventario</h2>
          <p className="text-forest-500 text-sm mt-0.5">
            {total > 0 ? `${total} ítems registrados` : 'Sin ítems registrados'}
          </p>
        </div>
        {puedeEditarBodega && (
          <button onClick={() => setModalCrear(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo ítem
          </button>
        )}
      </div>

      {/* Búsqueda y filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <SearchInput
            value={busqueda}
            onChange={handleBusqueda}
            placeholder="Buscar por nombre o N° inventario..."
            className="flex-1 min-w-48"
          />
          <button
            onClick={() => setFiltrosOpen((v) => !v)}
            className={`btn-secondary flex items-center gap-2 ${filtrosOpen ? 'ring-2 ring-sena-300' : ''}`}
          >
            <Filter size={15} />
            Filtros
            {(estado || categoriaId) && <span className="w-2 h-2 rounded-full bg-sena-500" />}
          </button>
        </div>

        {filtrosOpen && (
          <div className="flex gap-3 flex-wrap pt-2 border-t border-forest-100 animate-fade-in">
            <SelectSearch
              options={ESTADOS.map((e) => ({ value: e.value, label: e.label }))}
              value={estado}
              onChange={(v) => { setEstado(v); setPagina(1); }}
              placeholder="Estado"
              className="w-48"
            />
            <SelectSearch
              options={[
                { value: '', label: 'Todas las categorías' },
                ...categorias.map((c) => ({ value: String(c.id), label: c.nombre })),
              ]}
              value={categoriaId}
              onChange={(v) => { setCategoriaId(v); setPagina(1); }}
              placeholder="Categoría"
              className="w-48"
            />
            {(estado || categoriaId) && (
              <button
                onClick={() => { setEstado(''); setCategoriaId(''); setPagina(1); }}
                className="text-sm text-forest-500 hover:text-red-500 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid de ítems */}
      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="Sin ítems"
          description={
            busqueda || estado
              ? 'No hay ítems que coincidan con tu búsqueda.'
              : 'Aún no hay ítems en bodega. Crea el primero.'
          }
          action={
            puedeEditarBodega ? (
              <button onClick={() => setModalCrear(true)} className="btn-primary flex items-center gap-2">
                <Plus size={15} /> Crear primer ítem
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <BodegaItemCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/bodega/${item.id}`)}
              />
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </>
      )}

      {/* Modal crear ítem */}
      <ModalCrearItem
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        onCreado={() => { setModalCrear(false); refetch(); }}
        categorias={categorias}
      />
    </div>
  );
}
