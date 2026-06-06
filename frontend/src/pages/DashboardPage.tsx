import { useAuth } from '@features/auth/context/AuthContext';
import { useFetch } from '@shared/hooks/useFetch';
import { PageLoader } from '@shared/components/ui';
import { Warehouse, Package, ArrowLeftRight, Wrench, CheckCircle2, AlertTriangle, Clock, Map, Users, FileText, Tags, ClipboardList } from 'lucide-react';
import { TIPO_MOVIMIENTO_LABELS } from '@shared/types';
import type { Movimiento } from '@shared/types';
import { formatDistanceToNow } from '@features/notificaciones/utils/formatDate';
import { useNavigate } from 'react-router-dom';

interface Stats {
  naves: number; ambientes: number; totalItems: number;
  items: { activos: number; inactivos: number; danados: number; enMantenimiento: number; baja: number };
  movimientosRecientes: Movimiento[];
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="w-32 h-32 rounded-full bg-forest-100 flex items-center justify-center text-forest-400 text-xs">Sin datos</div>;
  const r = 54; const cx = 64; const cy = 64; const circ = 2 * Math.PI * r;
  let cum = 0;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 128 128" className="w-full h-full">
        {data.filter(d => d.value > 0).map(d => {
          const pct = d.value / total; const dash = circ * pct;
          const angle = (cum / total) * 360 - 90; cum += d.value;
          return <circle key={d.label} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px` }} />;
        })}
        <circle cx={cx} cy={cy} r={47} fill="white" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-2xl text-sena-900">{total}</span>
        <span className="text-xs text-forest-500">total</span>
      </div>
    </div>
  );
}

function HealthBar({ activos, total }: { activos: number; total: number }) {
  const pct = total > 0 ? Math.round((activos / total) * 100) : 0;
  const color = pct >= 80 ? 'bg-sena-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
  const label = pct >= 80 ? 'Óptimo' : pct >= 60 ? 'Aceptable' : 'Crítico';
  const tc = pct >= 80 ? 'text-sena-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500';
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-forest-600 font-medium">Salud del inventario</span>
        <span className={`text-sm font-bold ${tc}`}>{pct}% · {label}</span>
      </div>
      <div className="w-full h-2.5 bg-forest-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const MOV_COLORS: Record<string, string> = {
  entrada: 'bg-sena-100 text-sena-600', asignacion: 'bg-blue-50 text-blue-600',
  traslado: 'bg-amber-50 text-amber-600', mantenimiento: 'bg-orange-50 text-orange-600',
  devolucion: 'bg-purple-50 text-purple-600', baja: 'bg-red-50 text-red-500',
};

export default function DashboardPage() {
  const { user, esAdmin, esAlmacen, esCoordinador, esEncargado, esInstructor, esServicio } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useFetch<{ ok: boolean; stats: Stats }>('/stats');
  const stats = data?.stats;

  if (loading || !stats) return <PageLoader />;

  const donutData = [
    { label: 'Activos', value: stats.items.activos, color: '#22C55E' },
    { label: 'En Bodega', value: stats.items.inactivos, color: '#86EFAC' },
    { label: 'Dañados', value: stats.items.danados, color: '#F87171' },
    { label: 'Mantenimiento', value: stats.items.enMantenimiento, color: '#FBBF24' },
    { label: 'Baja', value: stats.items.baja, color: '#94A3B8' },
  ];

  // KPIs según rol
  const kpis = esServicio ? [
    { icon: <Wrench size={20} className="text-amber-600" />, bg: 'bg-amber-50', label: 'En mantenimiento', value: stats.items.enMantenimiento },
    { icon: <AlertTriangle size={20} className="text-red-500" />, bg: 'bg-red-50', label: 'Dañados', value: stats.items.danados },
  ] : (esAdmin || esAlmacen) ? [
    { icon: <Package size={20} className="text-sena-600" />, bg: 'bg-sena-100', label: 'Total ítems', value: stats.totalItems },
    { icon: <CheckCircle2 size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Activos', value: stats.items.activos },
    { icon: <Warehouse size={20} className="text-blue-600" />, bg: 'bg-blue-50', label: 'En Bodega', value: stats.items.inactivos },
    { icon: <AlertTriangle size={20} className="text-amber-600" />, bg: 'bg-amber-50', label: 'Dañados', value: stats.items.danados },
  ] : [
    { icon: <Package size={20} className="text-sena-600" />, bg: 'bg-sena-100', label: 'Ítems asignados', value: stats.items.activos },
    { icon: <AlertTriangle size={20} className="text-amber-600" />, bg: 'bg-amber-50', label: 'Dañados', value: stats.items.danados },
  ];

  // Accesos rápidos según rol
  type QuickLink = { to: string; icon: React.ReactNode; label: string; color: string };
  const quickLinks: QuickLink[] = ([
    (esAdmin) && { to: '/usuarios', icon: <Users size={20} />, label: 'Usuarios', color: 'bg-purple-50 text-purple-600' },
    (esAdmin) && { to: '/naves', icon: <Map size={20} />, label: 'Naves', color: 'bg-blue-50 text-blue-600' },
    (esAdmin || esAlmacen) && { to: '/bodega', icon: <Warehouse size={20} />, label: 'Bodega', color: 'bg-sena-100 text-sena-600' },
    (esAdmin || esAlmacen) && { to: '/categorias', icon: <Tags size={20} />, label: 'Categorías', color: 'bg-amber-50 text-amber-600' },
    (esAdmin) && { to: '/logs', icon: <FileText size={20} />, label: 'Registros', color: 'bg-forest-100 text-forest-600' },
    (!esServicio) && { to: '/traslados', icon: <ArrowLeftRight size={20} />, label: 'Traslados', color: 'bg-teal-50 text-teal-600' },
    (esEncargado || esInstructor) && { to: '/verificaciones', icon: <ClipboardList size={20} />, label: 'Verificar', color: 'bg-green-50 text-green-600' },
    (esEncargado || esServicio || esAdmin) && { to: '/mantenimiento', icon: <Wrench size={20} />, label: 'Mantenimiento', color: 'bg-orange-50 text-orange-600' },
    (esCoordinador || esEncargado || esInstructor || esServicio) && { to: '/inventario', icon: <Package size={20} />, label: 'Inventario', color: 'bg-sena-100 text-sena-600' },
  ] as (QuickLink | false)[]).filter(Boolean).slice(0, 4) as QuickLink[];

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="animate-fade-in">
        <h2 className="font-display font-bold text-sena-900 text-2xl">
          Bienvenido, {user?.nombre.split(' ')[0]}
        </h2>
        <p className="text-forest-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className={`grid gap-4 animate-slide-up ${kpis.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {kpis.map(k => (
          <div key={k.label} className="card stat-card">
            <div className={`stat-icon ${k.bg}`}>{k.icon}</div>
            <div>
              <p className="font-display font-bold text-sena-900 text-2xl">{k.value}</p>
              <p className="text-forest-500 text-xs">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fila central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(esAdmin || esAlmacen) && (
          <>
            {/* Donut */}
            <div className="card p-5 animate-slide-up stagger-2">
              <p className="font-semibold text-sena-900 mb-4">Distribución</p>
              <div className="flex items-center gap-5">
                <DonutChart data={donutData} />
                <div className="space-y-1.5 flex-1">
                  {donutData.map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-forest-600">{d.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-sena-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Salud + naves/ambientes */}
            <div className="card p-5 space-y-4 animate-slide-up stagger-2">
              <HealthBar activos={stats.items.activos} total={stats.totalItems} />
              <hr className="border-forest-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sena-50 rounded-xl p-3 text-center">
                  <p className="font-display font-bold text-xl text-sena-900">{stats.naves}</p>
                  <p className="text-forest-500 text-xs">Naves</p>
                </div>
                <div className="bg-sena-50 rounded-xl p-3 text-center">
                  <p className="font-display font-bold text-xl text-sena-900">{stats.ambientes}</p>
                  <p className="text-forest-500 text-xs">Ambientes</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actividad reciente */}
        <div className={`card p-5 animate-slide-up stagger-3 ${!(esAdmin || esAlmacen) ? 'lg:col-span-3' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sena-900">Actividad reciente</p>
            <Clock size={15} className="text-forest-400" />
          </div>
          {stats.movimientosRecientes.length === 0 ? (
            <p className="text-forest-400 text-sm text-center py-6">Sin actividad registrada</p>
          ) : (
            <div className="space-y-3">
              {stats.movimientosRecientes.slice(0, 6).map((mov, idx) => (
                <div key={mov.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${MOV_COLORS[mov.tipo] ?? 'bg-forest-100 text-forest-600'}`}>
                      <ArrowLeftRight size={12} />
                    </div>
                    {idx < 5 && <div className="w-px flex-1 bg-forest-100 mt-1 min-h-3" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm text-sena-800 font-medium truncate">{mov.item?.nombre ?? 'Ítem'}</p>
                    <p className="text-xs text-forest-500">{TIPO_MOVIMIENTO_LABELS[mov.tipo]} · {mov.usuario?.nombre}</p>
                    <p className="text-xs text-forest-400 mt-0.5">{formatDistanceToNow(mov.fecha)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      {quickLinks.length > 0 && (
        <div className="animate-slide-up stagger-4">
          <p className="font-semibold text-sena-800 text-sm mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map(item => (
              <button key={item.to} onClick={() => navigate(item.to)} className="card-hover p-4 flex flex-col items-center gap-2 text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>{item.icon}</div>
                <span className="text-sm font-medium text-sena-800">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
