import { useState } from 'react';
import { api } from '@lib/api';
import { useFetch } from '@shared/hooks/useFetch';
import { Modal, SearchInput, EmptyState, PageLoader, ConfirmDialog, SelectSearch } from '@shared/components/ui';
import { Users, Plus, Edit2, UserX, UserCheck, Key, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Usuario, Nave, Ambiente, Rol } from '@shared/types';
import { ROL_LABELS } from '@shared/types';
import { useAuth } from '@features/auth/context/AuthContext';

const ROLES: { value: Rol; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'encargado', label: 'Encargado' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'servicio', label: 'Servicio' },
];

const ROL_COLORS: Record<Rol, string> = {
  administrador: 'badge-green', almacen: 'badge-green',
  coordinador: 'badge-green', encargado: 'badge-green',
  instructor: 'badge-green', servicio: 'badge-green',
};

interface FormData {
  nombre: string; email: string;
  rol: Rol | ''; naveIds: string[]; ambienteIds: string[];
}
const EMPTY: FormData = { nombre: '', email: '', rol: '', naveIds: [], ambienteIds: [] };

export default function UsuariosPage() {
  const { user: me } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<'crear' | 'editar' | 'password' | null>(null);
  const [activo, setActivo] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmToggle, setConfirmToggle] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);

  const { data, loading: cargando, refetch } = useFetch<{ usuarios: Usuario[] }>('/usuarios');
  const { data: navesData } = useFetch<{ naves: Nave[] }>('/naves');
  const { data: ambData } = useFetch<{ ambientes: Ambiente[] }>('/ambientes');

  const usuarios = (data?.usuarios ?? []).filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase()),
  );
  const naves = navesData?.naves ?? [];
  const ambientes = ambData?.ambientes ?? [];

  const abrirCrear = () => { setForm(EMPTY); setActivo(null); setModal('crear'); };
  const abrirEditar = (u: Usuario) => {
    setActivo(u);
    setForm({
      nombre: u.nombre, email: u.email, rol: u.rol,
      naveIds: u.naves?.map(n => n.nave.id) ?? [],
      ambienteIds: u.ambientes?.map(a => a.ambiente.id) ?? [],
    });
    setModal('editar');
  };

  const handleGuardar = async () => {
    if (!form.rol) { toast.error('Selecciona un rol'); return; }
    setLoading(true);
    try {
      const body = {
        nombre: form.nombre, email: form.email, rol: form.rol,
        naveIds: form.rol === 'coordinador' ? form.naveIds : [],
        ambienteIds: ['encargado', 'instructor'].includes(form.rol) ? form.ambienteIds : [],
      };
      if (modal === 'crear') {
        await api.post('/usuarios', body);
        toast.success('Usuario creado. Se envió correo de bienvenida.');
      } else {
        await api.put(`/usuarios/${activo!.id}`, body);
        toast.success('Usuario actualizado.');
      }
      setModal(null); refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const handlePassword = async () => {
    if (passwordNueva.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    setLoading(true);
    try {
      await api.patch(`/usuarios/${activo!.id}/password`, { passwordNueva });
      toast.success('Contraseña cambiada. Se notificó al usuario.');
      setModal(null); setPasswordNueva('');
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (u: Usuario) => {
    try {
      if (u.activo) { await api.patch(`/usuarios/${u.id}/desactivar`); toast.success('Cuenta desactivada.'); }
      else { await api.patch(`/usuarios/${u.id}/activar`); toast.success('Cuenta reactivada.'); }
      refetch();
    } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error'); }
    setConfirmToggle(null);
  };

  const needsNaves = form.rol === 'coordinador';
  const needsAmbientes = form.rol === 'encargado' || form.rol === 'instructor';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-sena-900 text-xl">Gestión de Usuarios</h2>
          <p className="text-forest-500 text-sm">{data?.usuarios.length ?? 0} cuentas registradas</p>
        </div>
        <button onClick={abrirCrear} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <div className="card p-4">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o correo..." />
      </div>

      {cargando ? <PageLoader /> : usuarios.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="Sin usuarios" description="No hay usuarios que coincidan." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-forest-50 border-b border-forest-100">
                <tr>
                  <th className="th">Usuario</th>
                  <th className="th">Rol</th>
                  <th className="th hidden md:table-cell">2FA</th>
                  <th className="th hidden lg:table-cell">Estado</th>
                  <th className="th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50">
                {usuarios.map(u => (
                  <tr key={u.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sena-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">{u.nombre.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sena-900 text-sm">{u.nombre}</p>
                          <p className="text-forest-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ROL_COLORS[u.rol]} text-xs`}>{ROL_LABELS[u.rol]}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {u.dosFA?.activado
                        ? <span className="badge badge-green text-xs">Activo</span>
                        : <span className="badge badge-red text-xs">Inactivo</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {u.activo
                        ? <span className="badge badge-green text-xs">Activa</span>
                        : <span className="badge badge-slate text-xs">Desactivada</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => abrirEditar(u)} className="action-btn" title="Editar"><Edit2 size={14} /></button>
                        <button onClick={() => { setActivo(u); setPasswordNueva(''); setModal('password'); }} className="action-btn" title="Cambiar contraseña"><Key size={14} /></button>
                        {u.id !== me?.id && (
                          <button onClick={() => setConfirmToggle(u)} className={u.activo ? 'action-btn-danger' : 'action-btn'} title={u.activo ? 'Desactivar' : 'Activar'}>
                            {u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal open={modal === 'crear' || modal === 'editar'} onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'} size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleGuardar} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : modal === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input mt-1" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} maxLength={200} />
            </div>
            <div>
              <label className="label">Correo electrónico *</label>
              <input className="input mt-1" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                disabled={modal === 'editar'}
                title={modal === 'editar' ? 'El correo no puede modificarse' : ''}
              />
              {modal === 'editar' && <p className="text-xs text-forest-400 mt-1">El correo no puede modificarse</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modal === 'crear' ? (
              <div>
                <label className="label">Contraseña</label>
                <div className="mt-1 p-2.5 bg-forest-50 border border-forest-100 rounded-lg text-sm text-forest-600">
                  Se generará automáticamente y se enviará por correo.
                </div>
              </div>
            ) : (
              <div>
                <label className="label">Nueva contraseña (opcional)</label>
                <input className="input mt-1" type="password" value={passwordNueva}
                  onChange={e => setPasswordNueva(e.target.value)}
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
            )}
            <div>
              <label className="label">Rol *</label>
              <select className="input mt-1" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value as Rol, naveIds: [], ambienteIds: [] }))}>
                <option value="">Seleccionar rol</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {needsNaves && (
            <div>
              <label className="label">Naves asignadas (pueden ser varias)</label>
              <div className="mt-2 max-h-40 overflow-y-auto border border-forest-200 rounded-xl p-3 space-y-1.5">
                {naves.map(n => (
                  <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-sena-50 rounded-lg px-2 py-1">
                    <input type="checkbox" checked={form.naveIds.includes(n.id)}
                      onChange={e => setForm(p => ({
                        ...p,
                        naveIds: e.target.checked ? [...p.naveIds, n.id] : p.naveIds.filter(id => id !== n.id),
                      }))}
                    />
                    <span className="text-sm text-sena-800">{n.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {needsAmbientes && (
            <div>
              <label className="label">Ambiente asignado</label>
              <SelectSearch
                options={ambientes.map(a => ({ value: a.id, label: a.nombre, sublabel: a.nave?.nombre }))}
                value={form.ambienteIds[0] ?? ''}
                onChange={v => setForm(p => ({ ...p, ambienteIds: v ? [v] : [] }))}
                placeholder="Seleccionar ambiente"
                className="mt-1"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal cambiar contraseña */}
      <Modal open={modal === 'password'} onClose={() => setModal(null)} title="Cambiar contraseña" size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handlePassword} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-forest-600 text-sm">Usuario: <strong>{activo?.nombre}</strong></p>
          <div>
            <label className="label">Nueva contraseña *</label>
            <input className="input mt-1" type="password" value={passwordNueva}
              onChange={e => setPasswordNueva(e.target.value)} minLength={8} placeholder="Mínimo 8 caracteres" autoFocus />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
            <Shield size={14} className="flex-shrink-0 mt-0.5" />
            Se enviará un correo de notificación al usuario.
          </div>
        </div>
      </Modal>

      {/* Confirmar activar/desactivar */}
      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && void handleToggle(confirmToggle)}
        title={confirmToggle?.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
        message={confirmToggle?.activo
          ? `¿Desactivar la cuenta de ${confirmToggle?.nombre}? No podrá iniciar sesión.`
          : `¿Reactivar la cuenta de ${confirmToggle?.nombre}?`
        }
        confirmLabel={confirmToggle?.activo ? 'Desactivar' : 'Reactivar'}
        danger={confirmToggle?.activo}
      />
    </div>
  );
}
