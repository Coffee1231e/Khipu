import { useState, useEffect } from 'react';
import { useAuth } from '@features/auth/context/AuthContext';
import { useFetch } from '@shared/hooks/useFetch';
import { PageLoader } from '@shared/components/ui';
import { Wrench, ArrowLeftRight, CheckCircle2, Clock, Map, ClipboardList } from 'lucide-react';
import { TIPO_MOVIMIENTO_LABELS } from '@shared/types';
import type { Movimiento, UsuarioAuth } from '@shared/types';
import { formatDistanceToNow } from '@features/notificaciones/utils/formatDate';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Stats {
  naves: number; ambientes: number; totalItems: number;
  items: { activos: number; inactivos: number; danados: number; enMantenimiento: number; baja: number };
  categorias?: { nombre: string; cantidad: number }[];
  movimientosRecientes: Movimiento[];
  alertasCriticas: number;
  trasladosPendientes: number;
  mantenimientosPendientes: number;
}

function DashboardHero({ user, heroGradient }: { user: UsuarioAuth | null, heroGradient: string }) {
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
          Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{user?.nombre?.split(' ')[0] ?? 'Usuario'}</span>
        </h1>
        
        {user && ['instructor', 'encargado'].includes(user.rol) && (
          <div className="mt-3 text-white/90 text-sm bg-black/20 p-3 rounded-lg border border-white/10">
            {user.ambientes && user.ambientes.length > 0 ? (
              <>
                <p className="font-medium text-white">Usted está asignado a {user.ambientes.length === 1 ? 'el ambiente' : 'los ambientes'}:</p>
                <ul className="list-disc list-inside mt-1 ml-1 text-white/80">
                  {user.ambientes.map(a => <li key={a.id}>{a.nombre}</li>)}
                </ul>
              </>
            ) : (
              <p className="text-amber-200 font-medium">Usted no está asignado a ningún ambiente.</p>
            )}
          </div>
        )}
        
        {user && user.rol === 'coordinador' && (
          <div className="mt-3 text-white/90 text-sm bg-black/20 p-3 rounded-lg border border-white/10">
            {user.naves && user.naves.length > 0 ? (
              <>
                <p className="font-medium text-white">Usted está asignado a {user.naves.length === 1 ? 'la nave' : 'las naves'}:</p>
                <ul className="list-disc list-inside mt-1 ml-1 text-white/80">
                  {user.naves.map(n => <li key={n.id}>{n.nombre}</li>)}
                </ul>
              </>
            ) : (
              <p className="text-amber-200 font-medium">Usted no está asignado a ninguna nave.</p>
            )}
          </div>
        )}
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

  // Para coordinador: selección de nave
  const [selectedNaveId, setSelectedNaveId] = useState<string | null>(
    user?.rol === 'coordinador' && user.naves?.[0] ? user.naves[0].id : null
  );

  const fetchUrl = selectedNaveId 
    ? `/stats?naveId=${selectedNaveId}` 
    : '/stats';

  const { data, loading } = useFetch<{ ok: boolean; stats: Stats }>(fetchUrl);
  const stats = data?.stats;

  if (loading && !stats) return <PageLoader />;
  if (!stats) return <PageLoader />;

  // Cálculo del score de salud
  const itemsProblematicos = stats.items.danados + stats.items.enMantenimiento;
  const totalRelevant = stats.totalItems > 0 ? stats.totalItems : 1;
  const healthScore = Math.max(0, Math.round(((totalRelevant - itemsProblematicos) / totalRelevant) * 100));

  const isOptimal = healthScore >= 90;
  const isWarning = healthScore >= 70 && healthScore < 90;

  const heroGradient = isOptimal
    ? 'from-emerald-950 via-sena-900 to-sena-950'
    : isWarning ? 'from-amber-950 via-sena-900 to-sena-950' : 'from-red-950 via-sena-900 to-sena-950';

  const pieData = [
    { name: 'Activos', value: stats.items.activos, color: '#10b981' }, // emerald-500
    { name: 'En Mantenimiento', value: stats.items.enMantenimiento, color: '#f59e0b' }, // amber-500
    { name: 'Dañados', value: stats.items.danados, color: '#ef4444' }, // red-500
  ].filter(d => d.value > 0);

  const isUnassigned = 
    (['instructor', 'encargado'].includes(user?.rol ?? '') && (!user?.ambientes || user.ambientes.length === 0)) ||
    (user?.rol === 'coordinador' && (!user?.naves || user.naves.length === 0));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* ─── HERO SECTION ─── */}
      <DashboardHero user={user} heroGradient={heroGradient} />

      {/* ─── NAVE TABS (Coordinador) ─── */}
      {user?.rol === 'coordinador' && user.naves && user.naves.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sena-200">
          {user.naves.map(nave => (
            <button
              key={nave.id}
              onClick={() => setSelectedNaveId(nave.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedNaveId === nave.id
                  ? 'bg-sena-600 text-white shadow-md'
                  : 'bg-white text-sena-700 border border-sena-100 hover:bg-sena-50'
              }`}
            >
              {nave.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ─── DASHBOARDS ESPECÍFICOS POR ROL ─── */}
      {!isUnassigned && (
        <>
          {(esAdmin || esAlmacen) ? (
        <div className="space-y-6 animate-slide-up stagger-2">
          {/* PRIMERA FILA DE 4 TARJETAS: ESTADOS DE ITEMS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-forest-100 shadow-sm">
              <div className="bg-sena-50/40 border-b border-forest-100 px-4 py-3 flex justify-center items-center">
                <p className="text-sena-800 text-xs font-semibold uppercase tracking-wider">Ítems Totales</p>
              </div>
              <div className="px-4 py-6 flex justify-center items-center bg-white">
                <p className="font-display font-bold text-sena-900 text-4xl">{stats.totalItems}</p>
              </div>
            </div>
            
            <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-emerald-100 shadow-sm">
              <div className="bg-emerald-50/40 border-b border-emerald-100 px-4 py-3 flex justify-center items-center">
                <p className="text-emerald-800 text-xs font-semibold uppercase tracking-wider">Ítems Activos</p>
              </div>
              <div className="px-4 py-6 flex justify-center items-center bg-white">
                <p className="font-display font-bold text-emerald-900 text-4xl">{stats.items.activos}</p>
              </div>
            </div>

            <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-amber-100 shadow-sm">
              <div className="bg-amber-50/40 border-b border-amber-100 px-4 py-3 flex justify-center items-center">
                <p className="text-amber-800 text-xs font-semibold uppercase tracking-wider">Ítems en Mantenimiento</p>
              </div>
              <div className="px-4 py-6 flex justify-center items-center bg-white">
                <p className="font-display font-bold text-amber-900 text-4xl">{stats.items.enMantenimiento}</p>
              </div>
            </div>

            <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-red-100 shadow-sm">
              <div className="bg-red-50/40 border-b border-red-100 px-4 py-3 flex justify-center items-center">
                <p className="text-red-800 text-xs font-semibold uppercase tracking-wider">Ítems Dañados</p>
              </div>
              <div className="px-4 py-6 flex justify-center items-center bg-white">
                <p className="font-display font-bold text-red-900 text-4xl">{stats.items.danados}</p>
              </div>
            </div>
          </div>

          {/* SEGUNDA FILA DE 4 TARJETAS: GESTIÓN (Solo Administrador) */}
          {esAdmin && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-blue-100 shadow-sm">
                <div className="bg-blue-50/40 border-b border-blue-100 px-4 py-3 flex justify-center items-center">
                  <p className="text-blue-800 text-xs font-semibold uppercase tracking-wider">Naves</p>
                </div>
                <div className="px-4 py-6 flex justify-center items-center bg-white">
                  <p className="font-display font-bold text-blue-900 text-4xl">{stats.naves}</p>
                </div>
              </div>

              <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-indigo-100 shadow-sm">
                <div className="bg-indigo-50/40 border-b border-indigo-100 px-4 py-3 flex justify-center items-center">
                  <p className="text-indigo-800 text-xs font-semibold uppercase tracking-wider">Ambientes</p>
                </div>
                <div className="px-4 py-6 flex justify-center items-center bg-white">
                  <p className="font-display font-bold text-indigo-900 text-4xl">{stats.ambientes}</p>
                </div>
              </div>

              <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-orange-100 shadow-sm cursor-pointer" onClick={() => navigate('/traslados')}>
                <div className="bg-orange-50/40 border-b border-orange-100 px-4 py-3 flex justify-center items-center">
                  <p className="text-orange-800 text-xs font-semibold uppercase tracking-wider text-center">Traslados Pendientes</p>
                </div>
                <div className="px-4 py-6 flex justify-center items-center bg-white">
                  <p className="font-display font-bold text-orange-900 text-4xl">{stats.trasladosPendientes}</p>
                </div>
              </div>

              <div className="card p-0 hover:-translate-y-1 transition-transform overflow-hidden border border-rose-100 shadow-sm cursor-pointer" onClick={() => navigate('/mantenimiento')}>
                <div className="bg-rose-50/40 border-b border-rose-100 px-4 py-3 flex justify-center items-center">
                  <p className="text-rose-800 text-xs font-semibold uppercase tracking-wider text-center">Tickets de Mantenimiento</p>
                </div>
                <div className="px-4 py-6 flex justify-center items-center bg-white">
                  <p className="font-display font-bold text-rose-900 text-4xl">{stats.mantenimientosPendientes}</p>
                </div>
              </div>
            </div>
          )}

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico Circular: Salud del Inventario */}
            <div className="card p-6 border-forest-100 shadow-sm flex flex-col">
              <h3 className="font-display font-bold text-sena-900 text-lg mb-2 text-center border-b border-forest-100 pb-3">
                Salud del Inventario
              </h3>
              <div className="flex-1 min-h-[250px] relative">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                        className="text-xs font-medium"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${value} ítems`, 'Cantidad']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-forest-400 text-sm">
                    No hay datos suficientes
                  </div>
                )}
                {/* Score central */}
                {pieData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-display font-bold text-sena-900">{healthScore}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-forest-500 font-semibold">Salud</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de Barras: Ítems por Categoría */}
            <div className="card p-6 border-forest-100 shadow-sm flex flex-col">
              <h3 className="font-display font-bold text-sena-900 text-lg mb-2 text-center border-b border-forest-100 pb-3">
                Ítems por Categoría
              </h3>
              <div className="flex-1 h-[250px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                {(!stats.categorias || stats.categorias.length === 0) ? (
                   <div className="h-full flex items-center justify-center text-forest-400 text-sm">
                     No hay categorías registradas
                   </div>
                ) : (
                  <div style={{ height: Math.max(250, stats.categorias.length * 40) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.categorias}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="nombre" type="category" width={110} tick={{fontSize: 11, fill: '#334155'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => [`${value} ítems`, 'Cantidad']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="cantidad" fill="#047857" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* REGISTRO DE ACTIVIDAD */}
          <div className="card p-6 border-forest-100 shadow-sm">
            <div className="flex items-center justify-between border-b border-forest-100 pb-4 mb-4">
              <h3 className="font-display font-bold text-sena-900 text-xl flex items-center gap-2">
                <Clock size={20} className="text-sena-600" /> Registro de Actividad
              </h3>
              <button 
                onClick={() => navigate('/logs')}
                className="text-sm text-sena-600 hover:text-sena-800 font-medium transition-colors"
              >
                Ver registros completos →
              </button>
            </div>
            
            {stats.movimientosRecientes.length === 0 ? (
              <div className="py-8 text-center text-forest-400">
                <ClipboardList size={32} className="mx-auto opacity-30 mb-2" />
                <p className="text-sm">No hay movimientos recientes en el sistema.</p>
              </div>
            ) : (
              <div className="divide-y divide-forest-50">
                {stats.movimientosRecientes.slice(0, 10).map(mov => (
                  <div key={mov.id} className="py-3 px-2 hover:bg-forest-50/50 transition-colors flex gap-4 items-center">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        mov.tipo === 'entrada' ? 'bg-emerald-500' :
                        mov.tipo === 'baja' ? 'bg-red-500' :
                        mov.tipo === 'mantenimiento' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
                      <div>
                        <p className="text-sm font-semibold text-sena-900 truncate" title={mov.item?.nombre}>
                          {mov.item?.nombre ?? 'Ítem desconocido'}
                        </p>
                        <p className="text-xs text-forest-500 mt-0.5 font-mono">
                          {mov.item?.numeroInventario}
                        </p>
                      </div>
                      <div className="text-sm text-forest-600">
                        {TIPO_MOVIMIENTO_LABELS[mov.tipo]} por <span className="font-medium text-sena-700">{mov.usuario?.nombre}</span>
                      </div>
                      <div className="text-xs text-forest-400 text-left md:text-right font-mono">
                        {formatDistanceToNow(mov.fecha)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
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
          )}
        </>
      )}
    </div>
  );
}
