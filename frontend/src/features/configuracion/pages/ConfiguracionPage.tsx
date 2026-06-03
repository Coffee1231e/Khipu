import { useState, useEffect } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { PageLoader } from '@shared/components/ui';
import { Settings, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ConfiguracionSistema } from '@shared/types';

const ROL_LIMITES = [
  {
    key: 'limiteAdministrador' as keyof ConfiguracionSistema, label: 'Administrador',
    desc: 'Acceso total al sistema'
  },
  {
    key: 'limiteAlmacen' as keyof ConfiguracionSistema, label: 'Almacén',
    desc: 'Gestión de bodega e ítems'
  },
  {
    key: 'limiteCoordinador' as keyof ConfiguracionSistema, label: 'Coordinador',
    desc: 'Supervisión de naves asignadas'
  },
  {
    key: 'limiteEncargado' as keyof ConfiguracionSistema, label: 'Encargado',
    desc: 'Responsable de un ambiente'
  },
  {
    key: 'limiteInstructor' as keyof ConfiguracionSistema, label: 'Instructor',
    desc: 'Verificaciones y traslados'
  },
  {
    key: 'limiteServicio' as keyof ConfiguracionSistema, label: 'Servicio',
    desc: 'Mantenimiento de ítems'
  },
];

export default function ConfiguracionPage() {
  const { data, loading, refetch } = useFetch<{ config: ConfiguracionSistema }>('/configuracion');
  const config = data?.config;

  const [limites, setLimites] = useState<Partial<ConfiguracionSistema>>({});
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setLimites({ ...config });
  }, [config]);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await api.put('/configuracion', limites);
      toast.success('Límites actualizados correctamente.');
      setEditando(false);
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setSaving(false); }
  };

  const handleCancelar = () => {
    if (config) setLimites({ ...config });
    setEditando(false);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-sena-900 text-xl">Configuración del Sistema</h2>
        <p className="text-forest-500 text-sm">Controla cuántas cuentas pueden existir por cada rol</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="stat-icon bg-sena-100">
              <Users size={20} className="text-sena-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sena-900">Límites de cuentas por rol</h3>
              <p className="text-forest-500 text-xs mt-0.5">
                Máximo de cuentas activas permitidas para cada rol
              </p>
            </div>
          </div>
          {!editando ? (
            <button onClick={() => setEditando(true)} className="btn-secondary flex items-center gap-2">
              <Settings size={14} /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancelar} className="btn-secondary">Cancelar</button>
              <button onClick={handleGuardar} disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {ROL_LIMITES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3 border-b border-forest-50 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-sena-800">{label}</p>
                <p className="text-xs text-forest-400 mt-0.5">{desc}</p>
              </div>
              {editando ? (
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={Number(limites[key]) || 0}
                  onChange={e => setLimites(p => ({ ...p, [key]: Number(e.target.value) }))}
                  className="input w-24 text-center font-semibold"
                />
              ) : (
                <div className="w-24 text-center bg-sena-50 rounded-xl py-2 font-display font-bold text-sena-700 text-lg">
                  {config ? Number(config[key]) : '—'}
                </div>
              )}
            </div>
          ))}
        </div>

        {editando && (
          <p className="text-xs text-forest-400 mt-4">
            Los cambios afectan la creación de nuevas cuentas. Las cuentas existentes no se ven afectadas.
          </p>
        )}
      </div>
    </div>
  );
}
