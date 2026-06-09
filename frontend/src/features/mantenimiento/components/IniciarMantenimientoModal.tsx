import { useState, useRef } from 'react';
import { Modal } from '@shared/components/ui';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import type { SolicitudMantenimiento } from '@shared/types';

interface Props {
  solicitud: SolicitudMantenimiento | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (observaciones: string, foto: File) => void;
  loading?: boolean;
}

export function IniciarMantenimientoModal({ solicitud, isOpen, onClose, onSubmit, loading }: Props) {
  const [observaciones, setObservaciones] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!solicitud) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foto) return;
    onSubmit(observaciones, foto);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Iniciar Mantenimiento" size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
          <button 
            onClick={handleSubmit}
            disabled={!foto || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar y Actualizar Foto'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-forest-700 mb-1">Ítem</label>
          <div className="p-3 bg-forest-50 rounded-lg text-sm text-sena-900 font-medium">
            {solicitud.item?.nombre} (N° {solicitud.item?.numeroInventario})
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-forest-700 mb-1">Observaciones de Ingreso (Opcional)</label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            className="input w-full resize-none h-20"
            placeholder="Añade algún comentario sobre el estado en el que recibes el ítem..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-forest-700 mb-1">Foto del estado al recibirlo * (Obligatorio)</label>
          {!fotoPreview ? (
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex-1 justify-center flex items-center gap-2"
              >
                <ImageIcon size={16} /> Subir Foto
              </button>
              <label className="btn-secondary flex-1 justify-center flex items-center gap-2 cursor-pointer mb-0">
                <Camera size={16} /> Tomar Foto
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
          ) : (
            <div className="relative h-40 bg-sena-50 rounded-xl overflow-hidden border border-forest-100 flex items-center justify-center">
              <img src={fotoPreview} alt="Preview" className="h-full object-contain" />
              <button 
                type="button" 
                onClick={handleRemoveFoto}
                className="absolute top-2 right-2 w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
