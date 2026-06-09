import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal, SelectSearch } from '@shared/components/ui';
import type { Item, Ambiente, Usuario } from '@shared/types';
import { useFetch } from '@shared/hooks/useFetch';

interface Props {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ambienteDestinoId: string, usuarioDestinoId: string, observaciones: string) => void;
}

export function SolicitarTrasladoModal({ item, isOpen, onClose, onSubmit }: Props) {
  const [ambienteDestinoId, setAmbienteDestinoId] = useState('');
  const [usuarioDestinoId, setUsuarioDestinoId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Cargar ambientes de la misma nave
  const { data: ambientesData } = useFetch<{ ambientes: Ambiente[] }>(
    isOpen && item?.naveId ? `/ambientes?naveId=${item.naveId}` : null
  );
  
  // Cargar usuarios del ambiente seleccionado
  const { data: usuariosData } = useFetch<{ usuarios: Usuario[] }>(
    isOpen && ambienteDestinoId ? `/usuarios?ambienteIds=${ambienteDestinoId}` : null
  );

  if (!item) return null;

  const ambientesOptions = (ambientesData?.ambientes ?? [])
    .filter(a => a.id !== item.ambienteId)
    .map(a => ({ value: a.id, label: a.nombre }));

  const usuariosOptions = (usuariosData?.usuarios ?? [])
    .filter(u => u.rol === 'encargado' || u.rol === 'instructor')
    .map(u => ({ value: String(u.id), label: `${u.nombre} - ${u.rol.toUpperCase()}` }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ambienteDestinoId) return;
    onSubmit(ambienteDestinoId, usuarioDestinoId, observaciones);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Solicitar Traslado" size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button 
            onClick={handleSubmit}
            disabled={!ambienteDestinoId}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Enviar Solicitud
          </button>
        </div>
      }
    >
      <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Ítem a trasladar</label>
              <div className="p-3 bg-forest-50 rounded-lg text-sm text-sena-900 font-medium">
                {item.nombre} (N° {item.numeroInventario})
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Ambiente Destino (misma Nave)</label>
              <SelectSearch
                options={ambientesOptions}
                value={ambienteDestinoId}
                onChange={(v) => { setAmbienteDestinoId(v); setUsuarioDestinoId(''); }}
                placeholder="Selecciona el ambiente"
              />
            </div>

            {ambienteDestinoId && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">Usuario Receptor (Opcional)</label>
                <SelectSearch
                  options={usuariosOptions}
                  value={usuarioDestinoId}
                  onChange={setUsuarioDestinoId}
                  placeholder="Selecciona con quién se hace el traslado"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="input w-full resize-none h-20"
                placeholder="Motivo del traslado..."
              />
            </div>

      </div>
    </Modal>
  );
}
