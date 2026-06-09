import { useState, useCallback } from 'react';

import { Package, Filter, MapPin, Wrench, Trash2 } from 'lucide-react';
import { useFetch } from '@shared/hooks/useFetch';
import { SearchInput, EmptyState, PageLoader, Paginacion, SelectSearch } from '@shared/components/ui';
import type { Item, CategoriaItem, EstadoItem } from '@shared/types';
import { ESTADO_ITEM_LABELS, ESTADO_ITEM_COLORS } from '@shared/types';
import { useAuth } from '@features/auth/context/AuthContext';
import { ItemPreviewModal } from '../components/ItemPreviewModal';
import { SolicitarTrasladoModal } from '../components/SolicitarTrasladoModal';
import { SolicitarMantenimientoModal } from '../components/SolicitarMantenimientoModal';
import { api } from '@lib/api';
import toast from 'react-hot-toast';

const ESTADOS: { value: EstadoItem | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'activo', label: 'Activo' },
  { value: 'danado', label: 'Dañado' },
  { value: 'en_mantenimiento', label: 'En Mantenimiento' },
  { value: 'baja', label: 'Baja' },
];

export default function InventarioPage() {
  const { user, esServicio } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<string>(esServicio ? 'danado' : '');
  const [categoriaId, setCategoriaId] = useState('');
  const [pagina, setPagina] = useState(1);
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  // Modales
  const [itemSeleccionado, setItemSeleccionado] = useState<Item | null>(null);
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);
  const [modalTrasladoOpen, setModalTrasladoOpen] = useState(false);
  const [modalMantenimientoOpen, setModalMantenimientoOpen] = useState(false);

  const { data: catData } = useFetch<{ categorias: CategoriaItem[] }>('/categorias');
  const categorias = catData?.categorias ?? [];

  const params = new URLSearchParams({
    pagina: String(pagina), limite: '20',
    ...(busqueda && { q: busqueda }),
    ...(estado && { estado }),
    ...(categoriaId && { categoriaId }),
  });

  const { data, loading, refetch: _refetch } = useFetch<{
    items: Item[];
    paginacion: { total: number; paginas: number };
  }>(`/bodega?${params}`);

  const items = data?.items ?? [];
  const total = data?.paginacion?.total ?? 0;
  const totalPaginas = data?.paginacion?.paginas ?? 1;

  const handleBusqueda = useCallback((q: string) => { setBusqueda(q); setPagina(1); }, []);

  const hasFiltroActivo = esServicio 
    ? (estado !== 'danado' || categoriaId !== '') 
    : (estado !== '' || categoriaId !== '');

  const tituloRol: Record<string, string> = {
    coordinador: 'Inventario de mis naves',
    encargado: 'Inventario de mi ambiente',
    instructor: 'Inventario del ambiente',
    servicio: 'Ítems dañados',
  };

  const handleRowClick = (item: Item) => {
    setItemSeleccionado(item);
    setModalPreviewOpen(true);
  };

  const handleSolicitarTraslado = async (ambienteDestinoId: string, usuarioDestinoId: string, observaciones: string) => {
    if (!itemSeleccionado) return;
    try {
      await api.post('/traslados', {
        itemId: itemSeleccionado.id,
        ambienteDestinoId,
        usuarioDestinoId,
        observaciones,
      });
      toast.success('Solicitud de traslado enviada al Encargado.');
      setModalTrasladoOpen(false);
      _refetch();
    } catch (e: any) { toast.error(e?.mensajeUI || 'Error al solicitar traslado'); }
  };

  const handleSolicitarMantenimiento = async (descripcionFalla: string, observaciones: string) => {
    if (!itemSeleccionado) return;
    try {
      await api.post('/mantenimiento', {
        itemId: itemSeleccionado.id,
        descripcionFalla,
        observaciones,
      });
      toast.success('Solicitud de mantenimiento enviada.');
      setModalMantenimientoOpen(false);
      _refetch();
    } catch (e: any) { toast.error(e?.mensajeUI || 'Error al solicitar mantenimiento'); }
  };

  const handleDevolver = async () => {
    if (!itemSeleccionado) return;
    try {
      if (user?.rol === 'instructor') {
        // Instructor solicita devolución (un traslado marcado como devolución)
        if (!itemSeleccionado.ambienteOrigenOriginalId) return;
        await api.post('/traslados', {
          itemId: itemSeleccionado.id,
          ambienteDestinoId: itemSeleccionado.ambienteOrigenOriginalId,
          esDevolucion: true,
          observaciones: 'Solicitud de devolución al ambiente original.',
        });
        toast.success('Solicitud de devolución enviada al Encargado.');
      } else {
        // Encargado devuelve instantáneamente
        await api.post(`/traslados/devolver/${itemSeleccionado.id}`);
        toast.success('Ítem devuelto al ambiente original.');
      }
      _refetch();
    } catch (e: any) { toast.error(e?.mensajeUI || 'Error al devolver ítem'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-sena-900 text-xl">
          {tituloRol[user?.rol ?? ''] ?? 'Inventario'}
        </h2>
        <p className="text-forest-500 text-sm mt-0.5">
          {total > 0 ? `${total} ítems` : 'Sin ítems'}
        </p>
      </div>

      {/* Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <SearchInput value={busqueda} onChange={handleBusqueda} placeholder="Buscar por nombre o N° inventario..." className="flex-1 min-w-48" />
          <button onClick={() => setFiltrosOpen(v => !v)} className={`btn-secondary flex items-center gap-2 ${filtrosOpen ? 'ring-2 ring-sena-300' : ''}`}>
            <Filter size={15} /> Filtros
            {hasFiltroActivo && <span className="w-2 h-2 rounded-full bg-sena-500" />}
          </button>
        </div>
        {filtrosOpen && (
          <div className="flex gap-3 flex-wrap pt-2 border-t border-forest-100 animate-fade-in">
            {!esServicio && (
              <SelectSearch
                options={ESTADOS.map(e => ({ value: e.value, label: e.label }))}
                value={estado}
                onChange={v => { setEstado(v); setPagina(1); }}
                placeholder="Estado"
                className="w-48"
              />
            )}
            <SelectSearch
              options={[{ value: '', label: 'Todas las categorías' }, ...categorias.map(c => ({ value: String(c.id), label: c.nombre }))]}
              value={categoriaId}
              onChange={v => { setCategoriaId(v); setPagina(1); }}
              placeholder="Categoría"
              className="w-48"
            />
            {hasFiltroActivo && (
              <button 
                title="Limpiar filtros"
                onClick={() => { setEstado(esServicio ? 'danado' : ''); setCategoriaId(''); setPagina(1); }} 
                className="text-forest-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg cursor-pointer flex items-center justify-center"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState
          icon={esServicio ? <Wrench size={32} /> : <Package size={32} />}
          title={esServicio ? 'Sin ítems dañados' : 'Sin ítems'}
          description={busqueda || estado ? 'No hay ítems que coincidan.' : esServicio ? 'No hay ítems marcados como dañados.' : 'No hay ítems en este inventario.'}
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-forest-50 border-b border-forest-100">
                  <tr>
                    <th className="th">Ítem</th>
                    <th className="th hidden sm:table-cell">Categoría</th>
                    <th className="th">Estado</th>
                    <th className="th hidden md:table-cell">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-50">
                  {items.map(item => (
                    <tr
                      key={item.id}
                      className="table-row-hover cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sena-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.imagenUrl
                              ? <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                              : <Package size={16} className="text-forest-300" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sena-900 text-sm line-clamp-1">{item.nombre}</p>
                            <p className="font-mono text-amber-600 text-xs">N° {item.numeroInventario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm text-forest-500">
                        {item.categoria?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${ESTADO_ITEM_COLORS[item.estado]} text-xs`}>
                          {ESTADO_ITEM_LABELS[item.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {item.nave && item.ambiente ? (
                          <div className="flex items-center gap-1.5 text-xs text-forest-500">
                            <MapPin size={11} />
                            <span>{item.nave.nombre} — {item.ambiente.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-forest-400">En bodega</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </>
      )}

      {/* Modales */}
      <ItemPreviewModal
        item={itemSeleccionado}
        isOpen={modalPreviewOpen}
        onClose={() => setModalPreviewOpen(false)}
        onSolicitarTraslado={() => setModalTrasladoOpen(true)}
        onSolicitarMantenimiento={() => setModalMantenimientoOpen(true)}
        onDevolver={handleDevolver}
      />
      <SolicitarTrasladoModal
        item={itemSeleccionado}
        isOpen={modalTrasladoOpen}
        onClose={() => setModalTrasladoOpen(false)}
        onSubmit={handleSolicitarTraslado}
      />
      <SolicitarMantenimientoModal
        item={itemSeleccionado}
        isOpen={modalMantenimientoOpen}
        onClose={() => setModalMantenimientoOpen(false)}
        onSubmit={handleSolicitarMantenimiento}
      />
    </div>
  );
}
