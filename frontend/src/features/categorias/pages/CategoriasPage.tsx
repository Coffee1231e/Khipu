import { useState } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, EmptyState, PageLoader, ConfirmDialog } from '@shared/components/ui';
import { 
  Tags, Plus, Edit2, Trash2, Package, 
  Monitor, Wrench, Droplet, Zap, Book, Box, 
  Briefcase, Camera, Truck, Shield, Coffee,
  HardHat, HeartPulse, Leaf, Scissors, Armchair
} from 'lucide-react';

const ICON_MAPPINGS = [
  { pattern: /computador|pc|laptop|tecnolog|sistema|software|red|router|servidor|pantalla|teclado/i, Icon: Monitor },
  { pattern: /herramienta|mantenimiento|ferreter|mecanic|taladro|martillo|alicate|llave/i, Icon: Wrench },
  { pattern: /electri|energ|cable|iluminaci|bombill|electronic|circuito|multimetro/i, Icon: Zap },
  { pattern: /construcci|obra|civil|material|cemento|arquitectura|topografia|ladrillo/i, Icon: HardHat },
  { pattern: /aseo|limpieza|liquid|escoba|trapeador|desinfectante|jabon/i, Icon: Droplet },
  { pattern: /libro|papeleri|oficina|documento|archivador|marcador|papel/i, Icon: Book },
  { pattern: /audiovisual|camara|video|foto|sonido|microfono|proyector|multimedia|tv/i, Icon: Camera },
  { pattern: /vehiculo|transporte|auto|moto|automotriz|motor|logistica/i, Icon: Truck },
  { pattern: /seguridad|epp|casco|botiquin|extintor|brigada|guante|bota/i, Icon: Shield },
  { pattern: /alimento|comida|bebida|cafeteri|cocina|gastronomi|chef|olla/i, Icon: Coffee },
  { pattern: /salud|enfermeri|medic|camilla|farmacia/i, Icon: HeartPulse },
  { pattern: /agro|agricola|planta|cultivo|granja|veterinaria|semilla/i, Icon: Leaf },
  { pattern: /confecci|textil|moda|tela|hilo|prenda|costura/i, Icon: Scissors },
  { pattern: /mueble|mobiliario|silla|mesa|escritorio|estante/i, Icon: Armchair },
  { pattern: /malet|bolso|equipaje/i, Icon: Briefcase },
  { pattern: /caja|empaque|insumo/i, Icon: Box },
];

const getCategoryIcon = (name: string, size = 18, className = "text-sena-600") => {
  const normalizedStr = name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remueve tildes
  const match = ICON_MAPPINGS.find(mapping => mapping.pattern.test(normalizedStr));
  if (match) {
    const IconComponent = match.Icon;
    return <IconComponent size={size} className={className} />;
  }
  return <Tags size={size} className={className} />;
};
import toast from 'react-hot-toast';
import type { CategoriaItem } from '@shared/types';

export default function CategoriasPage() {
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [activa, setActiva] = useState<CategoriaItem | null>(null);
  const [nombre, setNombre] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState<CategoriaItem | null>(null);
  const [loading, setLoading] = useState(false);

  const { data, loading: cargando, refetch } = useFetch<{ categorias: CategoriaItem[] }>('/categorias');
  const categorias = data?.categorias ?? [];

  const handleGuardar = async () => {
    if (!nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setLoading(true);
    try {
      if (modal === 'crear') {
        await api.post('/categorias', { nombre: nombre.trim() });
        toast.success('Categoría creada.');
      } else {
        await api.put(`/categorias/${activa!.id}`, { nombre: nombre.trim() });
        toast.success('Categoría actualizada.');
      }
      setModal(null); setNombre(''); refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    try {
      await api.delete(`/categorias/${confirmEliminar.id}`);
      toast.success('Categoría eliminada.');
      setConfirmEliminar(null); refetch();
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'No se puede eliminar: tiene ítems asociados');
      setConfirmEliminar(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Categorías de Ítems</h2>
          <p className="text-forest-500 text-sm">{categorias.length} categorías registradas</p>
        </div>
        <button onClick={() => { setNombre(''); setActiva(null); setModal('crear'); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {cargando ? <PageLoader /> : categorias.length === 0 ? (
        <EmptyState icon={<Tags size={32} />} title="Sin categorías" description="Crea la primera categoría para clasificar los ítems." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map(c => (
            <div key={c.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sena-100 flex items-center justify-center flex-shrink-0">
                  {getCategoryIcon(c.nombre)}
                </div>
                <div>
                  <p className="font-semibold text-sena-900">{c.nombre}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Package size={11} className="text-forest-400" />
                    <span className="text-forest-500 text-xs">{c._count?.items ?? 0} ítems</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => { setActiva(c); setNombre(c.nombre); setModal('editar'); }} className="action-btn">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setConfirmEliminar(c)} className="action-btn-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nueva categoría' : 'Editar categoría'}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleGuardar} disabled={loading || !nombre.trim()} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div>
          <label className="label">Nombre de la categoría *</label>
          <input
            className="input mt-1"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            maxLength={100}
            placeholder="Ej: Computadores, Herramientas..."
            onKeyDown={e => { if (e.key === 'Enter') void handleGuardar(); }}
            autoFocus
          />
        </div>
      </Modal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        onConfirm={handleEliminar}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría "${confirmEliminar?.nombre}"? Solo es posible si no tiene ítems asociados.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
