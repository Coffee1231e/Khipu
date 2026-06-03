import { useState, useEffect } from 'react';
import { useAuth } from '@features/auth/context/AuthContext';
import { useFetch } from '@shared/hooks/useFetch';
import { PageLoader } from '@shared/components/ui';
import { Wrench, ArrowLeftRight, CheckCircle2, Clock, Map, ClipboardList } from 'lucide-react';
import { TIPO_MOVIMIENTO_LABELS } from '@shared/types';
import type { Movimiento } from '@shared/types';
import { formatDistanceToNow } from '@features/notificaciones/utils/formatDate';
import { useNavigate } from 'react-router-dom';

interface Stats {
  naves: number; ambientes: number; totalItems: number;
  items: { activos: number; inactivos: number; danados: number; enMantenimiento: number; baja: number };
  movimientosRecientes: Movimiento[];
  alertasCriticas: number;
  trasladosPendientes: number;
  mantenimientosPendientes: number;
}

function DashboardHero({ nombre, heroGradient }: { nombre: string, heroGradient: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatterDate = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formatterTime = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroGradient} shadow-xl border border-white/10 p-6 lg:p-8 animate-fade-in`}>
      {/* Background Decorators */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start justify-center gap-1">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 text-white/80 font-medium tracking-wide text-xs md:text-sm uppercase">
          <span className="capitalize">{formatterDate.format(time)}</span>
          <span className="hidden md:inline text-white/40">•</span>
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10 shadow-sm">{formatterTime.format(time)}</span>
        </div>

        <h1 className="font-display font-bold text-white text-2xl md:text-3xl mt-3 leading-snug">
          Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{nombre?.split(' ')[0]}</span>
        </h1>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, esAdmin, esAlmacen, esCoordinador, esEncargado, esInstructor, esServicio } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useFetch<{ ok: boolean; stats: Stats }>('/stats');
  const stats = data?.stats;

  if (loading || !stats) return <PageLoader />;

  // Cálculo del score de salud
  // Para servicio: salud basada en mantenimientos resueltos vs pendientes (si hubiera datos).
  // Como simplificación: % de items que NO están dañados ni en mantenimiento.
  const itemsProblematicos = stats.items.danados + stats.items.enMantenimiento;
  const totalRelevant = stats.totalItems > 0 ? stats.totalItems : 1;
  const healthScore = Math.max(0, Math.round(((totalRelevant - itemsProblematicos) / totalRelevant) * 100));

  const isOptimal = healthScore >= 90;
  const isWarning = healthScore >= 70 && healthScore < 90;

  const heroGradient = isOptimal
    ? 'from-emerald-950 via-sena-900 to-sena-950'
    : isWarning ? 'from-amber-950 via-sena-900 to-sena-950' : 'from-red-950 via-sena-900 to-sena-950';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ─── HERO SECTION ─── */}
      <DashboardHero nombre={user?.nombre ?? 'Usuario'} heroGradient={heroGradient} />

      {/* ─── DASHBOARDS ESPECÍFICOS POR ROL ─── */}
      <div className="space-y-6">

        {/* SECCIÓN: RESUMEN DE ACTIVOS (Ocupa todo el ancho) */}
        <div className="card p-6 border-forest-100 shadow-sm animate-slide-up stagger-2">
          <h3 className="font-display font-bold text-sena-900 text-xl flex items-center gap-2 border-b border-forest-100 pb-4 mb-6">
            <CheckCircle2 size={20} className="text-sena-600" /> Resumen de Activos
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tarjetas comunes a (casi) todos los roles */}
            {(!esServicio) && (
              <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-forest-100 shadow-sm">
                <div className="bg-sena-50/40 border-b border-forest-100 px-4 py-3 flex justify-center items-center">
                  <p className="text-sena-800 text-xs font-semibold uppercase tracking-wider">Ítems Totales</p>
                </div>
                <div className="px-4 py-6 flex justify-center items-center bg-white">
                  <p className="font-display font-bold text-sena-900 text-4xl">{stats.totalItems}</p>
                </div>
              </div>
            )}

            <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-emerald-100 shadow-sm">
              <div className="bg-emerald-50/40 border-b border-emerald-100 px-4 py-3 flex justify-center items-center">
                <p className="text-emerald-800 text-xs font-semibold uppercase tracking-wider">Activos</p>
              </div>
              <div className="px-4 py-6 flex justify-center items-center bg-white">
                <p className="font-display font-bold text-emerald-900 text-4xl">{stats.items.activos}</p>
              </div>
            </div>

            <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-amber-100 shadow-sm">
              <div className="bg-amber-50/40 border-b border-amber-100 px-4 py-3 flex justify-center items-center">
                <p className="text-amber-800 text-xs font-semibold uppercase tracking-wider">Mantenimiento</p>
              </div>
              <div className="px-4 py-6 flex justify-center items-center bg-white">
                <p className="font-display font-bold text-amber-900 text-4xl">{stats.items.enMantenimiento}</p>
              </div>
            </div>

            <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-red-100 shadow-sm">
              <div className="bg-red-50/40 border-b border-red-100 px-4 py-3 flex justify-center items-center">
                <p className="text-red-800 text-xs font-semibold uppercase tracking-wider">Dañados</p>
              </div>
              <div className="px-4 py-6 flex justify-center items-center bg-white">
                <p className="font-display font-bold text-red-900 text-4xl">{stats.items.danados}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN INFERIOR: Registro y Exclusivos (Dividido en 2 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* COLUMNA IZQUIERDA: Actividad Reciente */}
          <div className="space-y-6 animate-slide-up stagger-3">
            <h3 className="font-display font-bold text-sena-900 text-xl flex items-center gap-2 border-b border-forest-100 pb-2">
              <Clock size={20} className="text-sena-600" /> Registro de Actividad
            </h3>

            <div className="card p-0 overflow-hidden border-forest-200 shadow-sm">
              {stats.movimientosRecientes.length === 0 ? (
                <div className="p-8 text-center text-forest-400">
                  <ClipboardList size={32} className="mx-auto opacity-30 mb-2" />
                  <p className="text-sm">No hay movimientos recientes en tu área.</p>
                </div>
              ) : (
                <div className="divide-y divide-forest-50">
                  {stats.movimientosRecientes.slice(0, 4).map(mov => (
                    <div key={mov.id} className="p-3 hover:bg-forest-50/50 transition-colors flex gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${mov.tipo === 'entrada' ? 'bg-emerald-500' :
                        mov.tipo === 'baja' ? 'bg-red-500' :
                          mov.tipo === 'mantenimiento' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-sena-900 truncate" title={mov.item?.nombre}>
                          {mov.item?.nombre ?? 'Ítem desconocido'}
                        </p>
                        <p className="text-xs text-forest-600 mt-0.5">
                          {TIPO_MOVIMIENTO_LABELS[mov.tipo]} por <span className="font-medium text-sena-700">{mov.usuario?.nombre}</span>
                        </p>
                        <p className="text-[10px] text-forest-400 mt-1 font-mono">
                          {formatDistanceToNow(mov.fecha)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Tarjetas Exclusivas por Rol */}
          <div className="space-y-4 animate-slide-up stagger-4">
            <h3 className="font-display font-bold text-sena-900 text-xl flex items-center gap-2 border-b border-forest-100 pb-2">
              <Map size={20} className="text-sena-600" /> Gestión y Tareas
            </h3>

            {(esAdmin || esAlmacen || esCoordinador) && (
              <div className="card p-5 bg-gradient-to-r from-blue-50 to-white border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-blue-800 text-xs font-medium uppercase tracking-wider mb-1">Estructura</p>
                  <p className="font-display font-bold text-blue-950 text-2xl">
                    {stats.naves} <span className="text-lg font-medium text-blue-700">Naves</span> · {stats.ambientes} <span className="text-lg font-medium text-blue-700">Ambientes</span>
                  </p>
                </div>
                <Map size={32} className="text-blue-300 opacity-50" />
              </div>
            )}

            {(esAdmin || esAlmacen || esCoordinador || esEncargado || esInstructor) && (
              <div className="card p-5 bg-gradient-to-r from-amber-50 to-white border border-amber-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/traslados')}>
                <div>
                  <p className="text-amber-800 text-xs font-medium uppercase tracking-wider mb-1">Traslados Pendientes</p>
                  <p className="font-display font-bold text-amber-950 text-2xl">{stats.trasladosPendientes}</p>
                </div>
                <ArrowLeftRight size={32} className="text-amber-300 opacity-50" />
              </div>
            )}

            {(esServicio || esAdmin || esEncargado) && (
              <div className="card p-5 bg-gradient-to-r from-red-50 to-white border border-red-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/mantenimiento')}>
                <div>
                  <p className="text-red-800 text-xs font-medium uppercase tracking-wider mb-1">Tickets de Mantenimiento</p>
                  <p className="font-display font-bold text-red-950 text-2xl">{stats.mantenimientosPendientes}</p>
                </div>
                <Wrench size={32} className="text-red-300 opacity-50" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
