import { useState } from 'react';
import { useFetch } from '@shared/hooks/useFetch';
import { SearchInput, PageLoader, EmptyState, Paginacion } from '@shared/components/ui';
import { FileText, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditLog } from '@shared/types';
import { ROL_LABELS } from '@shared/types';
import { formatFecha } from '@features/notificaciones/utils/formatDate';

const ACCION_COLORS: Record<string, string> = {
  creacion: 'badge-green', edicion: 'badge-yellow', baja: 'badge-red',
  asignacion: 'badge-blue', activacion: 'badge-green', desactivacion: 'badge-slate',
  traslado: 'badge-blue', mantenimiento: 'badge-orange', devolucion: 'badge-purple',
};

const AREAS = ['bodega', 'ambiente', 'mantenimiento', 'usuarios', 'naves_ambientes', 'configuracion'];
const ACCIONES = ['creacion', 'edicion', 'baja', 'asignacion', 'activacion', 'desactivacion', 'traslado'];

function LogDetalle({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const hasChanges = log.camposAntes && Object.keys(log.camposAntes).length > 0;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${ACCION_COLORS[log.accion] ?? 'badge-slate'} text-xs`}>{log.accion}</span>
            <span className="text-xs bg-forest-100 text-forest-600 px-2 py-0.5 rounded-md">{log.area}</span>
            <span className="text-xs font-mono text-amber-600">{log.entidad} #{log.entidadId.slice(0, 8)}</span>
          </div>
          <p className="text-sm font-medium text-sena-900 mt-1">{log.usuario?.nombre}</p>
          <p className="text-xs text-forest-400">{ROL_LABELS[log.usuario?.rol ?? log.rolUsuario] ?? log.rolUsuario} · {formatFecha(log.creadoEn)}</p>
        </div>
        {hasChanges && (
          <button onClick={() => setOpen(v => !v)} className="btn-icon flex-shrink-0">
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        )}
      </div>

      {open && hasChanges && (
        <div className="mt-3 bg-forest-50 rounded-xl p-3 space-y-1.5 animate-fade-in">
          {Object.entries(log.camposDespues ?? {}).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2 text-xs">
              <span className="font-medium text-forest-700 w-32 flex-shrink-0">{k}:</span>
              {log.camposAntes?.[k] !== undefined && (
                <span className="line-through text-red-400 truncate max-w-[100px]">{String(log.camposAntes[k])}</span>
              )}
              <span className="text-sena-700 font-medium truncate">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogsPage() {
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [accion, setAccion] = useState('');
  const [pagina, setPagina] = useState(1);
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  const params = new URLSearchParams({
    pagina: String(pagina), limite: '25',
    ...(q && { q }),
    ...(area && { area }),
    ...(accion && { accion }),
  });

  const { data, loading } = useFetch<{ logs: AuditLog[]; paginacion: { total: number; paginas: number } }>(
    `/logs?${params}`,
  );

  const logs = data?.logs ?? [];
  const total = data?.paginacion?.total ?? 0;
  const totalPaginas = data?.paginacion?.paginas ?? 1;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-sena-900 text-xl">Registros de Auditoría</h2>
        <p className="text-forest-500 text-sm">{total} eventos registrados</p>
      </div>

      {/* Búsqueda y filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <SearchInput value={q} onChange={v => { setQ(v); setPagina(1); }} placeholder="Buscar por usuario o entidad..." className="flex-1 min-w-48" />
          <button onClick={() => setFiltrosOpen(v => !v)} className={`btn-secondary flex items-center gap-2 ${filtrosOpen ? 'ring-2 ring-sena-300' : ''}`}>
            <Filter size={15} /> Filtros {(area || accion) && <span className="w-2 h-2 rounded-full bg-sena-500" />}
          </button>
        </div>
        {filtrosOpen && (
          <div className="flex gap-3 flex-wrap pt-2 border-t border-forest-100 animate-fade-in">
            <select className="input w-48" value={area} onChange={e => { setArea(e.target.value); setPagina(1); }}>
              <option value="">Todas las áreas</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="input w-48" value={accion} onChange={e => { setAccion(e.target.value); setPagina(1); }}>
              <option value="">Todas las acciones</option>
              {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {(area || accion) && (
              <button onClick={() => { setArea(''); setAccion(''); setPagina(1); }} className="text-sm text-forest-500 hover:text-red-500 transition-colors">Limpiar</button>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? <PageLoader /> : logs.length === 0 ? (
        <EmptyState icon={<FileText size={32} />} title="Sin registros" description="No hay registros que coincidan con los filtros." />
      ) : (
        <>
          <div className="card divide-y divide-forest-50">
            {logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-sena-50/50 transition-colors">
                <LogDetalle log={log} />
              </div>
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </>
      )}
    </div>
  );
}
