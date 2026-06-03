import { useNavigate } from 'react-router-dom';
import { useFetch } from '@shared/hooks/useFetch';
import { EmptyState, PageLoader, Paginacion } from '@shared/components/ui';
import { ClipboardList, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { VerificacionInventario } from '@shared/types';
import { formatFecha } from '@features/notificaciones/utils/formatDate';
import { useAuth } from '@features/auth/context/AuthContext';

export default function VerificacionesPage() {
  const navigate = useNavigate();
  const { esInstructor, esEncargado } = useAuth();
  const [pagina, setPagina] = useState(1);

  const { data, loading } = useFetch<{
    verificaciones: VerificacionInventario[];
    paginacion: { total: number; paginas: number };
  }>(`/verificaciones?pagina=${pagina}&limite=20`);

  const verificaciones = data?.verificaciones ?? [];
  const totalPaginas = data?.paginacion?.paginas ?? 1;
  const total = data?.paginacion?.total ?? 0;

  const TIPO_COLORS = {
    entrada: 'badge-green',
    salida: 'badge-blue',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Verificaciones de Inventario</h2>
          <p className="text-forest-500 text-sm">{total} verificaciones registradas</p>
        </div>
        {(esInstructor || esEncargado) && (
          <button onClick={() => navigate('/verificaciones/nueva')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nueva verificación
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : verificaciones.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Sin verificaciones"
          description="No hay verificaciones registradas aún."
          action={(esInstructor || esEncargado) ? (
            <button onClick={() => navigate('/verificaciones/nueva')} className="btn-primary flex items-center gap-2">
              <Plus size={15} /> Crear primera verificación
            </button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {verificaciones.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate(`/verificaciones/${v.id}`)}
                className="card-hover cursor-pointer p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${v.tipo === 'entrada' ? 'bg-sena-100' : 'bg-blue-50'}`}>
                  {v.tipo === 'entrada'
                    ? <CheckCircle2 size={18} className="text-sena-600" />
                    : <XCircle size={18} className="text-blue-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${TIPO_COLORS[v.tipo as keyof typeof TIPO_COLORS]} text-xs capitalize`}>
                      {v.tipo}
                    </span>
                    <p className="text-sm font-medium text-sena-900">{v.usuario?.nombre}</p>
                    <span className="badge badge-slate text-xs">{v.usuario?.rol}</span>
                  </div>
                  <p className="text-xs text-forest-500 mt-0.5">
                    {formatFecha(v.creadoEn)} · {v._count?.detalles ?? 0} ítems verificados
                  </p>
                  {v.observaciones && (
                    <p className="text-xs text-forest-400 mt-0.5 line-clamp-1">{v.observaciones}</p>
                  )}
                </div>
                <div className="text-forest-300">›</div>
              </div>
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </>
      )}
    </div>
  );
}
