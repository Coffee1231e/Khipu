import { Modal } from '@shared/components/ui';
import { Package, MapPin, RefreshCw, Wrench } from 'lucide-react';
import type { Item } from '@shared/types';
import { ESTADO_ITEM_LABELS, ESTADO_ITEM_COLORS } from '@shared/types';
import { useAuth } from '@features/auth/context/AuthContext';
import { useFetch } from '@shared/hooks/useFetch';

interface Props {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSolicitarTraslado: () => void;
  onSolicitarMantenimiento: () => void;
  onDevolver: () => void;
}

export function ItemPreviewModal({ item, isOpen, onClose, onSolicitarTraslado, onSolicitarMantenimiento, onDevolver }: Props) {
  const { user } = useAuth();
  
  // We need to fetch full item details if the list doesn't have it all, but for now we assume we have enough or we fetch it.
  // Actually the bodegapage uses /bodega/:id. We can fetch it here if we want fresh data, or just use what we have.
  const { data: itemDetalle } = useFetch<{ item: Item }>(isOpen && item ? `/bodega/${item.id}` : null);
  const displayItem = itemDetalle?.item ?? item;

  if (!displayItem) return null;

  const esInstructor = user?.rol === 'instructor';
  const esEncargado = user?.rol === 'encargado';
  const puedeAccionar = esInstructor || esEncargado;
  
  const estaPrestado = Boolean(displayItem.ambienteOrigenOriginalId);
  // Un ítem "prestado" a mi ambiente. (This means I am the destination of a previous transfer).
  // Ideally, only the current environment's users can return it.
  const puedeDevolver = estaPrestado && (esInstructor || esEncargado) && (user?.ambienteIds?.includes(displayItem.ambienteId ?? ''));

  return (
    <Modal open={isOpen} onClose={onClose} title="Detalles del Ítem" size="md">
      <div className="space-y-5 pb-2">
        <div className="relative h-48 bg-sena-50 rounded-xl overflow-hidden">
          {displayItem.imagenUrl ? (
            <img src={displayItem.imagenUrl} alt={displayItem.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sena-200">
              <Package size={64} />
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className={`badge shadow-sm ${ESTADO_ITEM_COLORS[displayItem.estado]}`}>
              {ESTADO_ITEM_LABELS[displayItem.estado]}
            </span>
            {estaPrestado && (
              <span className="badge bg-amber-100 text-amber-700 border-amber-200 shadow-sm">
                En Préstamo
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-display font-bold text-sena-900">
              {displayItem.nombre}
            </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-amber-600 text-sm">N° {displayItem.numeroInventario}</span>
                <span className="text-forest-300">•</span>
                <span className="text-forest-500 text-sm">{displayItem.categoria?.nombre ?? 'Sin categoría'}</span>
              </div>
            </div>

            <div className="p-3 bg-forest-50 rounded-xl flex items-start gap-3">
              <MapPin size={18} className="text-sena-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-sena-900">
                  {displayItem.nave?.nombre ?? 'Bodega Principal'}
                </p>
                {displayItem.ambiente && (
                  <p className="text-xs text-forest-500 mt-0.5">{displayItem.ambiente.nombre}</p>
                )}
              </div>
            </div>

            {displayItem.descripcion && (
              <div>
                <h4 className="text-xs font-bold text-forest-500 uppercase tracking-wider mb-1">Descripción</h4>
                <p className="text-sm text-forest-600">{displayItem.descripcion}</p>
              </div>
            )}

            {puedeAccionar && (
              <div className="pt-2 grid grid-cols-1 gap-2">
                <button 
                  onClick={() => { onClose(); onSolicitarTraslado(); }}
                  className="btn-secondary w-full justify-center"
                >
                  <RefreshCw size={18} />
                  Solicitar Traslado
                </button>
                
                {esEncargado && displayItem.estado !== 'danado' && displayItem.estado !== 'en_mantenimiento' && (
                  <button 
                    onClick={() => { onClose(); onSolicitarMantenimiento(); }}
                    className="btn-secondary w-full justify-center"
                  >
                    <Wrench size={18} />
                    Solicitar Mantenimiento
                  </button>
                )}

                {puedeDevolver && (
                  <button 
                    onClick={() => { onClose(); onDevolver(); }}
                    className="btn-primary w-full justify-center bg-teal-500 hover:bg-teal-600 ring-teal-500/50"
                  >
                    <RefreshCw size={18} />
                    {esEncargado ? 'Devolver Ítem (Instantáneo)' : 'Solicitar Devolución'}
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}
