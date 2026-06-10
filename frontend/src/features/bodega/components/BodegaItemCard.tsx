// ============================================================
//  features/bodega/components/BodegaItemCard.tsx
// ============================================================

import { Package, MapPin } from 'lucide-react';
import type { Item } from '@shared/types';
import { ESTADO_ITEM_LABELS, ESTADO_ITEM_COLORS } from '@shared/types';

// ─── Props únicas para BodegaItemCard ────────────────────────
// IMPORTANTE: NO reutilizar el nombre "Props" — estaban duplicadas
// en este archivo causando que TypeScript las mergease incorrectamente.

interface BodegaItemCardProps {
  item: Item;
  onClick: () => void | Promise<void>;
}

export function BodegaItemCard({ item, onClick }: BodegaItemCardProps) {
  return (
    <div
      onClick={() => { void onClick(); }}
      className="card-hover cursor-pointer p-4 flex flex-col gap-3"
    >
      {/* Imagen o placeholder */}
      <div className="w-full h-36 rounded-xl overflow-hidden bg-sena-50 flex items-center justify-center flex-shrink-0">
        {item.imagenUrl ? (
          <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
        ) : (
          <Package size={32} className="text-forest-300" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sena-900 leading-tight line-clamp-1">{item.nombre}</p>
            <p className="font-mono text-amber-600 text-xs mt-0.5">N° {item.numeroInventario}</p>
          </div>
          <span className={`badge ${ESTADO_ITEM_COLORS[item.estado]} text-xs flex-shrink-0`}>
            {ESTADO_ITEM_LABELS[item.estado]}
          </span>
        </div>

        {item.categoria && (
          <p className="text-forest-500 text-xs">{item.categoria.nombre}</p>
        )}

        {item.estado === 'activo' && item.nave && item.ambiente && (
          <div className="flex items-center gap-1.5 text-forest-500 text-xs">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{item.nave.nombre} — {item.ambiente.nombre}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  ModalCrearItem
// ============================================================

import { useState, useEffect } from 'react';
import { api } from '@lib/api';
import { Modal } from '@shared/components/ui';
import toast from 'react-hot-toast';
import type { CategoriaItem } from '@shared/types';

// Props separadas para el modal — nombre único para evitar merge
interface ModalCrearItemProps {
  open: boolean;
  onClose: () => void;
  onCreado: () => void;
  categorias: CategoriaItem[];
}

interface FormState {
  numeroInventario: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  observaciones: string;
}

export function ModalCrearItem({ open, onClose, onCreado, categorias }: ModalCrearItemProps) {
  const [form, setForm] = useState<FormState>({
    numeroInventario: '',
    nombre: '',
    descripcion: '',
    categoriaId: '',
    observaciones: '',
  });
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoriaEditadaManualmente, setCategoriaEditadaManualmente] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'numeroInventario' && !/^\d*$/.test(value)) return;
    if (name === 'categoriaId' && value !== '') setCategoriaEditadaManualmente(true);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm({ numeroInventario: '', nombre: '', descripcion: '', categoriaId: '', observaciones: '' });
    setImagen(null);
    setPreview(null);
    setCategoriaEditadaManualmente(false);
  };

  // Auto-seleccionar categoría basado en el nombre del ítem
  useEffect(() => {
    if (categoriaEditadaManualmente || !form.nombre || categorias.length === 0) return;

    const nombreLower = form.nombre.toLowerCase();
    
    // Diccionario de heurísticas de categorías típicas para SENA Centro de Industria y la Construcción
    const heuristica: Record<string, string[]> = {
      'tecnología': ['computador', 'portatil', 'portátil', 'mouse', 'teclado', 'monitor', 'pantalla', 'impresora', 'cable', 'cargador', 'telefono', 'teléfono', 'tv', 'televisor', 'proyector', 'tablet', 'ipad', 'camara', 'cámara', 'switch', 'router', 'servidor'],
      'mobiliario': ['silla', 'mesa', 'escritorio', 'archivador', 'estante', 'estanteria', 'estantería', 'tablero', 'sofa', 'sofá', 'mueble', 'pupitre', 'vitrina', 'locker', 'casillero'],
      'herramientas': ['martillo', 'destornillador', 'llave', 'taladro', 'pulidora', 'sierra', 'alicate', 'pinza', 'cinta', 'metro', 'soldador', 'calibrador', 'torno', 'fresadora', 'prensa', 'cizalla', 'yunque', 'broca'],
      'construcción': ['cemento', 'ladrillo', 'varilla', 'arena', 'bloque', 'palustre', 'llana', 'plomada', 'nivel', 'andamio', 'mezcladora', 'carretilla', 'pala', 'pica', 'grada', 'tubo', 'pvc'],
      'soldadura': ['electrodo', 'careta', 'esmeril', 'soplete', 'argon', 'argón', 'oxigeno', 'oxígeno', 'soldadura', 'inversor'],
      'mecánica': ['motor', 'bujia', 'bujía', 'llanta', 'aceite', 'filtro', 'gato', 'compresor', 'polea', 'rodamiento', 'embrague', 'freno', 'valvula', 'pistón'],
      'electricidad': ['multimetro', 'multímetro', 'cable', 'protoboard', 'resistencia', 'condensador', 'osciloscopio', 'cautin', 'cautín', 'estaño', 'breaker', 'transformador', 'rele', 'relé', 'plc', 'contacto', 'bombillo'],
      'seguridad': ['casco', 'guante', 'bota', 'gafa', 'mascarilla', 'arnes', 'arnés', 'extintor', 'botiquin', 'botiquín', 'tapaoídos', 'overol'],
      'electrodomésticos': ['nevera', 'microondas', 'cafetera', 'licuadora', 'aire acondicionado', 'ventilador', 'estufa', 'horno'],
      'papelería': ['resma', 'papel', 'lapiz', 'lápiz', 'esfero', 'bolígrafo', 'marcador', 'borrador', 'cuaderno', 'carpeta', 'ganchos', 'tijeras'],
      'aseo': ['escoba', 'trapeador', 'jabon', 'jabón', 'cloro', 'desinfectante', 'papel higienico', 'basura', 'caneca', 'trapo', 'limpiador'],
      'vehículos': ['carro', 'moto', 'motocicleta', 'camioneta', 'bicicleta']
    };

    let categoriaSugeridaId = '';

    // 1. Buscar si el nombre incluye directamente el nombre de alguna categoría
    const categoriaDirecta = categorias.find(c => nombreLower.includes(c.nombre.toLowerCase()));
    
    if (categoriaDirecta) {
      categoriaSugeridaId = String(categoriaDirecta.id);
    } else {
      // 2. Buscar por palabras clave en el diccionario heurístico
      for (const [catName, keywords] of Object.entries(heuristica)) {
        if (keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(nombreLower) || nombreLower.includes(kw))) {
          // Si encontramos una palabra clave, buscar la categoría real equivalente
          const matchCat = categorias.find(c => 
            c.nombre.toLowerCase().includes(catName.toLowerCase()) || 
            catName.includes(c.nombre.toLowerCase())
          );
          if (matchCat) {
            categoriaSugeridaId = String(matchCat.id);
            break;
          }
        }
      }
    }

    if (categoriaSugeridaId && form.categoriaId !== categoriaSugeridaId) {
      setForm(prev => ({ ...prev, categoriaId: categoriaSugeridaId }));
    }
  }, [form.nombre, categorias, categoriaEditadaManualmente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoriaId) { toast.error('Selecciona una categoría'); return; }
    setLoading(true);
    try {
      const { data } = await api.post<{ item: { id: number } }>('/bodega', {
        ...form,
        categoriaId: Number(form.categoriaId),
      });

      if (imagen && data.item) {
        const fd = new FormData();
        fd.append('imagen', imagen);
        await api.post(`/bodega/${data.item.id}/imagen`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Ítem creado correctamente');
      resetForm();
      onCreado();
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al crear el ítem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo ítem en bodega"
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={(e) => { void handleSubmit(e as unknown as React.FormEvent); }}
            disabled={loading}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Crear ítem'}
          </button>
        </div>
      }
    >
      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* N° Inventario */}
          <div>
            <label className="label">N° Inventario *</label>
            <input
              name="numeroInventario"
              value={form.numeroInventario}
              onChange={handleChange}
              inputMode="numeric"
              placeholder="Solo números, ej: 12345"
              className="input mt-1 font-mono"
              required
              maxLength={50}
            />
            <p className="text-forest-400 text-xs mt-1">Solo dígitos, único en el sistema</p>
          </div>

          {/* Categoría */}
          <div>
            <label className="label">Categoría *</label>
            <select
              name="categoriaId"
              value={form.categoriaId}
              onChange={handleChange}
              className="input mt-1"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="label">Nombre *</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre descriptivo del ítem"
            className="input mt-1"
            required
            maxLength={200}
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="label">Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción adicional"
            className="input mt-1 resize-none"
            rows={3}
            maxLength={1000}
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="label">Observaciones</label>
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            placeholder="Observaciones de ingreso"
            className="input mt-1 resize-none"
            rows={2}
            maxLength={1000}
          />
        </div>

        {/* Imagen */}
        <div>
          <label className="label">Foto del ítem</label>
          <div className="mt-1 flex gap-3">
            <label className="btn-secondary cursor-pointer flex items-center gap-2 text-sm">
              <Package size={15} />
              Galería
              <input type="file" accept="image/*" onChange={handleImagen} className="hidden" />
            </label>
            <label className="btn-secondary cursor-pointer flex items-center gap-2 text-sm">
              <Package size={15} />
              Cámara
              <input
                type="file" accept="image/*"
                capture="environment"
                onChange={handleImagen}
                className="hidden"
              />
            </label>
          </div>
          {preview && (
            <div className="mt-3 relative w-32 h-32">
              <img src={preview} alt="Preview" className="w-32 h-32 rounded-xl object-cover border border-forest-200" />
              <button
                type="button"
                onClick={() => { setImagen(null); setPreview(null); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Estado info */}
        <div className="bg-forest-50 border border-forest-200 rounded-xl p-3">
          <span className="text-forest-500 text-xs leading-relaxed">
            El ítem se creará con estado <strong>En Bodega</strong> (inactivo).
            Para activarlo, asígnalo a una nave y ambiente.
          </span>
        </div>
      </form>
    </Modal>
  );
}
