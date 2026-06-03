// ============================================================
//  pages/LoginPage.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Building2, LayoutGrid, Download } from 'lucide-react';
import { api } from '@lib/api';
import { useAuth } from '@features/auth/context/AuthContext';
import toast from 'react-hot-toast';
import type { UsuarioAuth } from '@shared/types';

type Step = 'credentials' | '2fa';

interface PublicStats { naves: number; ambientes: number; }

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo2FA, setCodigo2FA] = useState('');
  const [metodo2FA, setMetodo2FA] = useState<string>('totp');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PublicStats>({ naves: 0, ambientes: 0 });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Redirigir si ya está logueado
  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user]);

  // Stats en tiempo real
  useEffect(() => {
    api.get<PublicStats>('/public/stats')
      .then(({ data }) => setStats(data))
      .catch(() => { });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<{
        ok: boolean;
        requiere2FA: boolean;
        metodo2FA?: string;
        token?: string;
        usuario?: UsuarioAuth;
      }>('/auth/login', { email, password, ...(step === '2fa' && { codigo2FA }) });

      if (data.requiere2FA && step === 'credentials') {
        setMetodo2FA(data.metodo2FA ?? 'totp');
        setStep('2fa');
        return;
      }

      if (data.usuario) {
        login(data.usuario);
        navigate('/dashboard', { replace: true });
      }
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al iniciar sesión');
      if (step === '2fa') setCodigo2FA('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-sena-50">
      {/* ─── Panel izquierdo — branding ─────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-sena-950 via-sena-900 to-sena-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Patrón de puntos decorativo */}
        <div className="absolute inset-0 bg-dot-pattern opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/Khipu_Logo.webp" alt="Khipu Logo" className="w-12 h-12 object-contain rounded-xl" />
            <div>
              <p className="font-display font-bold text-white text-2xl leading-none">Khipu</p>
              <p className="text-sena-400 text-xs mt-0.5 uppercase tracking-wide">Sistema de inventario</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display font-bold text-white text-4xl leading-tight">
              Control total de<br />
              <span className="text-sena-400">activos institucionales</span>
            </h1>
            <p className="text-sena-300 mt-4 text-base leading-relaxed max-w-sm">
              Gestiona, rastrea y controla todos los equipos y materiales del
              SENA Centro de Industria y Construcción.
            </p>
          </div>

          {/* Stats en tiempo real */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-sena-500/20 flex items-center justify-center">
                  <Building2 size={16} className="text-sena-400" />
                </div>
                <span className="text-sena-300 text-xs uppercase tracking-wide">Naves</span>
              </div>
              <p className="font-display font-bold text-white text-3xl">{stats.naves}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-sena-500/20 flex items-center justify-center">
                  <LayoutGrid size={16} className="text-sena-400" />
                </div>
                <span className="text-sena-300 text-xs uppercase tracking-wide">Ambientes</span>
              </div>
              <p className="font-display font-bold text-white text-3xl">{stats.ambientes}</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sena-500 text-xs">
          SENA — Centro de Industria y Construcción · Ibagué, Tolima · {new Date().getFullYear()}
        </p>
      </div>

      {/* ─── Panel derecho — formulario ─────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Header mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/Khipu_Logo.webp" alt="Khipu Logo" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <p className="font-display font-bold text-sena-900 text-xl">Khipu</p>
              <p className="text-forest-500 text-xs">SENA · CIC</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-sena-900 text-2xl">
              {step === 'credentials' ? 'Iniciar sesión' : 'Verificación 2FA'}
            </h2>
            <p className="text-forest-500 text-sm mt-1">
              {step === 'credentials'
                ? 'Ingresa tus credenciales para continuar'
                : `Ingresa el código de ${metodo2FA === 'totp' ? 'tu app autenticadora' : 'tu correo'}`}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {step === 'credentials' ? (
              <>
                <div>
                  <label className="label">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input mt-1"
                    placeholder="correo@sena.edu.co"
                    autoComplete="email"
                    required
                  />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <div className="relative mt-1">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400 hover:text-sena-700"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="label">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo2FA}
                  onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input mt-1 text-center text-2xl font-mono tracking-[0.5em] py-4"
                  placeholder="000000"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setCodigo2FA(''); }}
                  className="text-xs text-forest-500 hover:text-sena-700 mt-2 transition-colors"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield size={16} />
                  {step === 'credentials' ? 'Iniciar sesión' : 'Verificar'}
                </>
              )}
            </button>
          </form>

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="btn-secondary w-full py-3 mt-4 flex items-center justify-center gap-2 border-forest-200 hover:border-forest-300"
            >
              <Download size={16} />
              Instalar Aplicación
            </button>
          )}

          <p className="text-center text-forest-400 text-xs mt-8">
            Khipu · SENA CIC · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
