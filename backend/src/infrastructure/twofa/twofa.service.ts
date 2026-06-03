// ============================================================
//  infrastructure/twofa/twofa.service.ts
// ============================================================

import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../database/prisma.client';
import { AppError, UnauthorizedError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger/logger';
import { cacheService } from '../cache/cache.service';

const APP_NAME = 'Khipu SENA';
const emailOtpCache = new Map<string, { codigo: string; expira: Date }>();

// ─── TOTP ─────────────────────────────────────────────────────

/**
 * Genera un secreto TOTP.
 * @param _usuarioId  Reservado para auditoría futura (no usado aún)
 * @param email       Correo del usuario, mostrado en la app autenticadora
 */
export async function generarSecretoTOTP(
  _usuarioId: string,
  email: string,
): Promise<{ secreto: string; uri: string; qrCode: string }> {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret(),
  });

  const uri = totp.toString();
  const qrCode = await QRCode.toDataURL(uri);

  return { secreto: totp.secret.base32, uri, qrCode };
}

export function verificarCodigoTOTP(secreto: string, codigo: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secreto),
  });
  const delta = totp.validate({ token: codigo, window: 1 });
  return delta !== null;
}

// ─── Email OTP ────────────────────────────────────────────────

export function generarEmailOTP(usuarioId: string): string {
  const codigo = crypto.randomInt(100_000, 999_999).toString();
  const expira = new Date(Date.now() + 10 * 60 * 1000);
  emailOtpCache.set(usuarioId, { codigo, expira });
  setTimeout(() => emailOtpCache.delete(usuarioId), 10 * 60 * 1000);
  return codigo;
}

export function verificarEmailOTP(usuarioId: string, codigo: string): boolean {
  const entry = emailOtpCache.get(usuarioId);
  if (!entry) return false;
  if (new Date() > entry.expira) { emailOtpCache.delete(usuarioId); return false; }
  if (entry.codigo !== codigo) return false;
  emailOtpCache.delete(usuarioId);
  return true;
}

// ─── Verificación general ─────────────────────────────────────

export async function verificar2FA(usuarioId: string, codigo: string): Promise<boolean> {
  const dosFA = await prisma.usuarioDosFA.findUnique({ where: { usuarioId } });
  if (!dosFA || !dosFA.activado) {
    throw new AppError('El usuario no tiene 2FA configurado.', 400, 'TWO_FA_NOT_CONFIGURED');
  }
  if (dosFA.metodo === 'totp') {
    if (!dosFA.secreto) return false;
    return verificarCodigoTOTP(dosFA.secreto, codigo);
  }
  if (dosFA.metodo === 'email') {
    return verificarEmailOTP(usuarioId, codigo);
  }
  return false;
}

export async function activar2FA(usuarioId: string, codigo: string, secreto: string): Promise<void> {
  const esValido = verificarCodigoTOTP(secreto, codigo);
  if (!esValido) {
    throw new UnauthorizedError('El código ingresado no es válido. Verifica tu app autenticadora.');
  }
  await prisma.usuarioDosFA.upsert({
    where: { usuarioId },
    create: { usuarioId, metodo: 'totp', secreto, activado: true, activadoEn: new Date() },
    update: { metodo: 'totp', secreto, activado: true, activadoEn: new Date() },
  });
  cacheService.invalidateUserSession(usuarioId);
  logger.info(`2FA activado para usuario ${usuarioId}`);
}

export async function desactivar2FA(usuarioId: string, codigo: string): Promise<void> {
  const esValido = await verificar2FA(usuarioId, codigo);
  if (!esValido) {
    throw new UnauthorizedError('El código ingresado no es válido. No se pudo desactivar el 2FA.');
  }
  await prisma.usuarioDosFA.update({
    where: { usuarioId },
    data: { activado: false, secreto: null },
  });
  cacheService.invalidateUserSession(usuarioId);
}
