import { useState } from 'react';
import { Modal } from '@shared/components/ui';
import type { Item } from '@shared/types';

interface Props {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (descripcionFalla: string, observaciones: string) => void;
}

export function SolicitarMantenimientoModal({ item, isOpen, onClose, onSubmit }: Props) {
  const [descripcionFalla, setDescripcionFalla] = useState('');
  const [observaciones, setObservaciones] = useState('');

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (descripcionFalla.length < 10) return;
    onSubmit(descripcionFalla, observaciones);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Solicitar Mantenimiento" size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button 
            onClick={handleSubmit}
            disabled={descripcionFalla.length < 10}
            className="btn-primary bg-amber-500 hover:bg-amber-600 ring-amber-500/50"
          >
            Enviar a Servicio
          </button>
        </div>
      }
    >
      <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Ítem</label>
              <div className="p-3 bg-forest-50 rounded-lg text-sm text-sena-900 font-medium">
                {item.nombre} (N° {item.numeroInventario})
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Descripción de la falla *</label>
              <textarea
                value={descripcionFalla}
                onChange={e => setDescripcionFalla(e.target.value)}
                required
                minLength={10}
                className="input w-full resize-none h-24"
                placeholder="Describe qué le pasa al ítem (mín. 10 caracteres)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Observaciones (Opcional)</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="input w-full resize-none h-16"
                placeholder="Cualquier otro detalle relevante..."
              />
            </div>

      </div>
    </Modal>
  );
}
