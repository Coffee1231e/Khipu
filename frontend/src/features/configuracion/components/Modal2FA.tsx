// ============================================================
//  features/configuracion/components/Modal2FA.tsx
//  Aparece cuando el usuario entra sin 2FA activo
// ============================================================

import { Shield, ShieldAlert } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Props {
  onActivar: () => void;
  onLuego: () => void;
}

export function Modal2FAAdvertencia({ onActivar, onLuego }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-card-hover w-full max-w-md animate-scale-in overflow-hidden">
        {/* Header rojo de advertencia */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl leading-tight">
              Cuenta sin protección 2FA
            </h2>
            <p className="text-red-100 text-sm mt-1">
              Tu cuenta está en riesgo de acceso no autorizado
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sena-800 text-sm leading-relaxed">
            El <strong>doble factor de autenticación (2FA)</strong> añade una capa extra de seguridad.
            Sin él, cualquier persona que obtenga tu contraseña puede acceder a tu cuenta.
          </p>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
            <p className="text-red-700 text-xs font-semibold uppercase tracking-wide">
              Sin 2FA activo no podrás:
            </p>
            <ul className="space-y-1.5">
              {[
                'Crear o editar cuentas de usuario',
                'Gestionar naves y ambientes',
                'Dar de baja ítems del inventario',
                'Aprobar traslados entre naves',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-red-600 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-forest-500 text-xs">
            Solo necesitas instalar <strong>Google Authenticator</strong> o <strong>Authy</strong> en tu teléfono.
            El proceso toma menos de 2 minutos.
          </p>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={onActivar}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <Shield size={16} />
            Activar 2FA ahora
          </button>
          <button
            onClick={onLuego}
            className="text-forest-500 text-sm hover:text-sena-700 transition-colors py-1"
          >
            Activar más tarde
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ============================================================
//  Modal2FARequerido — acción protegida sin 2FA activo
// ============================================================

interface PropsRequerido {
  onActivar: () => void;
  onCerrar: () => void;
  accion?: string;
}

export function Modal2FARequerido({ onActivar, onCerrar, accion }: PropsRequerido) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative bg-white rounded-2xl shadow-card-hover w-full max-w-sm animate-scale-in">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-amber-500" />
          </div>
          <h3 className="text-sena-900 font-bold text-lg">2FA requerido</h3>
          <p className="text-forest-500 text-sm mt-2 leading-relaxed">
            Para <strong>{accion ?? 'realizar esta acción'}</strong> debes tener el
            doble factor de autenticación activo.
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={onCerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={onActivar} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Shield size={15} />
              Activar 2FA
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
