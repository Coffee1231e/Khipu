import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@lib/api';
import { Modal } from '@shared/components/ui';
import { Shield, ShieldCheck, ShieldAlert, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@features/auth/context/AuthContext';
import { ROL_LABELS } from '@shared/types';

interface DosFAStatus { activado: boolean; metodo: string | null; activadoEn?: string; }

export default function MiPerfilPage() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [dosFA, setDosFA] = useState<DosFAStatus | null>(null);
    const [loadingFA, setLoadingFA] = useState(true);
    const [modalDesact, setModalDesact] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);

    // QR setup ya no está aquí

    useEffect(() => {
        api.get<{ dosFA: DosFAStatus }>('/2fa/estado')
            .then(({ data }) => setDosFA(data.dosFA))
            .catch(() => setDosFA(null))
            .finally(() => setLoadingFA(false));
    }, []);

    const handleDesactivar = async () => {
        if (codigo.length !== 6) { toast.error('Ingresa el código de 6 dígitos'); return; }
        setLoading(true);
        try {
            await api.post('/2fa/desactivar', { codigo });
            toast.success('2FA desactivado.');
            setDosFA({ activado: false, metodo: null });
            setModalDesact(false); setCodigo('');
            await refreshUser();
        } catch (e: unknown) { toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Código incorrecto'); }
        finally { setLoading(false); }
    };


    return (
        <div className="space-y-6 max-w-xl">
            <div>
                <h2 className="font-display font-bold text-sena-900 text-xl">Mi Perfil</h2>
                <p className="text-forest-500 text-sm">Información de tu cuenta y seguridad</p>
            </div>

            {/* Información de la cuenta */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="stat-icon bg-forest-100">
                        <User size={20} className="text-forest-600" />
                    </div>
                    <h3 className="font-semibold text-sena-900">Información de la cuenta</h3>
                </div>

                <div className="space-y-4">
                    {/* Avatar / Inicial */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-sena-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-display font-bold text-2xl">
                                {user?.nombre.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-sena-900 text-lg">{user?.nombre}</p>
                            <span className="badge badge-green text-xs mt-1">
                                {user?.rol ? ROL_LABELS[user.rol] : ''}
                            </span>
                        </div>
                    </div>

                    <hr className="border-forest-100" />

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-forest-500">Correo electrónico</span>
                            <span className="text-sm font-medium text-sena-900">{user?.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-forest-500">Rol asignado</span>
                            <span className="text-sm font-medium text-sena-900">
                                {user?.rol ? ROL_LABELS[user.rol] : ''}
                            </span>
                        </div>
                    </div>

                    <div className="bg-forest-50 rounded-xl p-3 text-xs text-forest-500">
                        Para cambiar tu nombre o contraseña, contacta al administrador del sistema.
                        El correo electrónico no puede modificarse.
                    </div>
                </div>
            </div>

            {/* Seguridad — 2FA */}
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="stat-icon bg-sena-100">
                        <Shield size={20} className="text-sena-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sena-900">Doble Factor de Autenticación</h3>
                        <p className="text-forest-400 text-xs mt-0.5">Protege tu cuenta con un segundo paso de verificación</p>
                    </div>
                </div>

                {loadingFA ? (
                    <div className="flex justify-center py-6">
                        <div className="w-5 h-5 border-2 border-sena-300 border-t-sena-600 rounded-full animate-spin" />
                    </div>
                ) : dosFA?.activado ? (
                    <div className="space-y-4">
                        {/* Estado activo */}
                        <div className="flex items-center gap-3 bg-sena-50 border border-sena-200 rounded-xl p-4">
                            <ShieldCheck size={22} className="text-sena-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sena-800 text-sm">2FA Activo ✓</p>
                                <p className="text-forest-500 text-xs mt-0.5">
                                    Método: {dosFA.metodo === 'totp' ? 'App autenticadora (Google Authenticator / Authy)' : 'Código por correo'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => { setModalDesact(true); setCodigo(''); }}
                            className="btn-danger flex items-center gap-2 text-sm"
                        >
                            <ShieldAlert size={14} /> Desactivar 2FA
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Estado inactivo */}
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                            <ShieldAlert size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700 text-sm">2FA no configurado</p>
                                <p className="text-red-500 text-xs mt-1 leading-relaxed">
                                    Sin 2FA activo, tu cuenta podría ser vulnerada si alguien obtiene tu contraseña.
                                    Ciertas acciones del sistema requieren 2FA activo.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/configuracion/2fa')}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Shield size={15} /> Activar 2FA ahora
                        </button>
                    </div>
                )}
            </div>

            {/* Modal desactivar 2FA */}
            <Modal
                open={modalDesact}
                onClose={() => { setModalDesact(false); setCodigo(''); }}
                title="Desactivar 2FA"
                size="sm"
                footer={
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setModalDesact(false)} className="btn-secondary">Cancelar</button>
                        <button
                            onClick={handleDesactivar}
                            disabled={loading || codigo.length !== 6}
                            className="btn-danger disabled:opacity-60"
                        >
                            {loading ? 'Verificando...' : 'Desactivar'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                        Ingresa el código de 6 dígitos de tu app autenticadora para confirmar.
                    </div>
                    <div>
                        <label className="label">Código de verificación</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={codigo}
                            onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="input mt-1 text-center text-2xl font-mono tracking-[0.5em] py-3"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') void handleDesactivar(); }}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
