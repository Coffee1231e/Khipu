// ============================================================
//  features/configuracion/pages/Setup2FAPage.tsx
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Mail, CheckCircle2, ArrowLeft, Copy, Check } from 'lucide-react';
import { api } from '@lib/api';
import { useAuth } from '@features/auth/context/AuthContext';
import toast from 'react-hot-toast';

type Paso = 'metodo' | 'qr' | 'verificar' | 'completado';

export default function Setup2FAPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [paso, setPaso] = useState<Paso>('metodo');
  const [metodo, setMetodo] = useState<'totp' | 'email'>('totp');
  const [qrCode, setQrCode] = useState('');
  const [secreto, setSecreto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const iniciarTOTP = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<{ qrCode: string; secreto: string }>('/2fa/totp/iniciar');
      setQrCode(data.qrCode);
      setSecreto(data.secreto);
      setPaso('qr');
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Error al iniciar configuración');
    } finally { setLoading(false); }
  };

  const copiarSecreto = () => {
    void navigator.clipboard.writeText(secreto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const verificar = async () => {
    if (codigo.length !== 6) return;
    setLoading(true);
    try {
      if (metodo === 'totp') {
        await api.post('/2fa/totp/activar', { codigo, secreto });
      } else {
        await api.post('/2fa/verificar', { codigo });
      }
      await refreshUser();
      setPaso('completado');
    } catch (e: unknown) {
      toast.error((e as { mensajeUI?: string }).mensajeUI ?? 'Código incorrecto');
    } finally { setLoading(false); }
  };

  const iniciarEmail = () => {
    setMetodo('email');
    setPaso('verificar');
    void api.post('/2fa/email/enviar');
    toast.success('Código enviado a tu correo');
  };

  return (
    <div className="min-h-screen bg-sena-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-forest-500 hover:text-sena-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Volver</span>
        </button>

        <div className="card p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="stat-icon bg-sena-100">
              <Shield size={22} className="text-sena-600" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-sena-900">Configurar 2FA</h1>
              <p className="text-forest-500 text-sm">Doble factor de autenticación</p>
            </div>
          </div>

          {/* ─── Paso 1: Elegir método ─────────────────────── */}
          {paso === 'metodo' && (
            <div className="space-y-4">
              <p className="text-sena-800 text-sm leading-relaxed mb-6">
                Elige cómo quieres recibir tus códigos de verificación.
                Recomendamos la <strong>app autenticadora</strong> por ser más segura.
              </p>

              <button
                onClick={() => { setMetodo('totp'); void iniciarTOTP(); }}
                disabled={loading}
                className={`
                  w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all
                  border-sena-200 hover:border-sena-400 hover:bg-sena-50
                  ${loading ? 'opacity-60 cursor-wait' : ''}
                `}
              >
                <div className="w-12 h-12 rounded-xl bg-sena-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone size={22} className="text-sena-600" />
                </div>
                <div>
                  <p className="font-semibold text-sena-900">App autenticadora</p>
                  <p className="text-forest-500 text-sm">Google Authenticator, Authy u otra app TOTP.</p>
                </div>
                <span className="ml-auto badge badge-green text-xs">Recomendado</span>
              </button>

              <button
                onClick={iniciarEmail}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all border-forest-200 hover:border-forest-400 hover:bg-forest-50/30"
              >
                <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center flex-shrink-0">
                  <Mail size={22} className="text-forest-600" />
                </div>
                <div>
                  <p className="font-semibold text-sena-900">Código por correo</p>
                  <p className="text-forest-500 text-sm">Recibe un código de 6 dígitos. Expira en 10 min.</p>
                </div>
              </button>
            </div>
          )}

          {/* ─── Paso 2: QR ───────────────────────────────── */}
          {paso === 'qr' && (
            <div className="space-y-6">
              <div className="bg-sena-50 rounded-xl p-4 space-y-3">
                <p className="text-sena-800 text-sm font-semibold">Instrucciones:</p>
                <ol className="space-y-2 text-sm text-forest-600">
                  <li className="flex gap-2"><span className="text-sena-500 font-bold">1.</span>Instala Google Authenticator o Authy en tu teléfono</li>
                  <li className="flex gap-2"><span className="text-sena-500 font-bold">2.</span>Abre la app y escanea el código QR de abajo</li>
                  <li className="flex gap-2"><span className="text-sena-500 font-bold">3.</span>Ingresa el código de 6 dígitos que aparece en la app</li>
                </ol>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl border border-forest-200 shadow-sm">
                  {qrCode && <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />}
                </div>
                <p className="text-forest-400 text-xs text-center">¿No puedes escanear? Ingresa el código manualmente:</p>
                <div className="flex items-center gap-2 bg-forest-50 rounded-lg px-3 py-2 border border-forest-200">
                  <code className="text-xs font-mono text-sena-800 break-all">{secreto}</code>
                  <button onClick={copiarSecreto} className="btn-icon w-7 h-7 flex-shrink-0">
                    {copiado ? <Check size={13} className="text-sena-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <button onClick={() => setPaso('verificar')} className="btn-primary w-full">
                Continuar → Verificar código
              </button>
            </div>
          )}

          {/* ─── Paso 3: Verificar ────────────────────────── */}
          {paso === 'verificar' && (
            <div className="space-y-6">
              <p className="text-sena-800 text-sm leading-relaxed">
                {metodo === 'totp'
                  ? 'Ingresa el código de 6 dígitos que aparece en tu app autenticadora.'
                  : 'Ingresa el código de 6 dígitos que enviamos a tu correo.'}
              </p>

              <div className="space-y-2">
                <label className="label">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input text-center text-3xl font-mono tracking-[0.5em] py-4"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') void verificar(); }}
                />
              </div>

              <button
                onClick={() => void verificar()}
                disabled={codigo.length !== 6 || loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar y activar'}
              </button>

              <button
                onClick={() => setPaso('metodo')}
                className="text-forest-500 text-sm hover:text-sena-700 transition-colors w-full text-center"
              >
                Cambiar método
              </button>
            </div>
          )}

          {/* ─── Paso 4: Completado ───────────────────────── */}
          {paso === 'completado' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sena-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-sena-600" />
              </div>
              <h3 className="text-xl font-bold text-sena-900">¡2FA activado!</h3>
              <p className="text-forest-500 text-sm leading-relaxed">
                Tu cuenta ahora está protegida con doble factor de autenticación.
                Necesitarás el código de tu app cada vez que inicies sesión.
              </p>
              <button
                onClick={() => navigate('/configuracion')}
                className="btn-primary w-full mt-2"
              >
                Ir a configuración
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
