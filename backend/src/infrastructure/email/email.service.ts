// ============================================================
//  infrastructure/email/email.service.ts
// ============================================================

import nodemailer from 'nodemailer';
import { env } from '../../shared/config/env';
import { logger } from '../../shared/logger/logger';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para port 465, false para 587
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
  // FORZAR IPv4: Resuelve el error ENETUNREACH de IPv6 en plataformas como Railway
  family: 4 
} as any);

// ─── Base del template HTML ───────────────────────────────────
function baseTemplate(contenido: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Khipu — SENA CIC</title>
</head>
<body style="margin:0;padding:0;background:#F0FDF4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0A2E1A 0%,#15803D 100%);padding:40px 48px;border-radius:16px 16px 0 0;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Khipu</p>
          <p style="margin:6px 0 0;font-size:13px;color:#86EFAC;letter-spacing:0.5px;text-transform:uppercase;">SENA — Centro de Industria y Construcción</p>
        </td></tr>
        <!-- Contenido -->
        <tr><td style="background:#fff;padding:48px;border-radius:0 0 16px 16px;border:1px solid #DCFCE7;border-top:none;">
          ${contenido}
          <hr style="border:none;border-top:1px solid #DCFCE7;margin:40px 0;" />
          <p style="margin:0;font-size:12px;color:#4A9062;text-align:center;">
            SENA — Centro de Industria y Construcción · Ibagué, Tolima<br/>
            ${new Date().getFullYear()} · Este correo fue generado automáticamente, no responder.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Templates específicos ────────────────────────────────────

function templateBienvenida(params: {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}): string {
  return baseTemplate(`
    <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#14532D;">Bienvenido al sistema, ${params.nombre}</p>
    <p style="margin:0 0 32px;font-size:16px;color:#3A7350;">Tu cuenta en Khipu ha sido creada. Aquí están tus credenciales de acceso:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:28px;margin-bottom:32px;">
      <tr><td>
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Tus credenciales</p>
        <p style="margin:0 0 8px;font-size:14px;color:#3A7350;">
          <strong style="color:#14532D;">Correo:</strong> ${params.email}
        </p>
        <p style="margin:0 0 8px;font-size:14px;color:#3A7350;">
          <strong style="color:#14532D;">Contrasena temporal:</strong>
          <span style="font-family:monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #BBF7D0;">${params.password}</span>
        </p>
        <p style="margin:0;font-size:14px;color:#3A7350;">
          <strong style="color:#14532D;">Rol asignado:</strong> ${params.rol}
        </p>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:14px;color:#166534;font-weight:600;">Importante:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#3A7350;font-size:14px;line-height:1.8;">
      <li>Cambia tu contrasena la primera vez que ingreses.</li>
      <li>Activa el doble factor de autenticacion (2FA) desde tu perfil.</li>
      <li>No compartas tus credenciales con nadie.</li>
    </ul>
  `);
}

function templateCambioPassword(params: {
  nombreUsuario: string;
  email: string;
  nombreAdmin: string;
  passwordNueva: string;
}): string {
  return baseTemplate(`
    <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#14532D;">Contrasena actualizada</p>
    <p style="margin:0 0 32px;font-size:16px;color:#3A7350;">Hola ${params.nombreUsuario}, tu contrasena en Khipu fue cambiada por un administrador.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:28px;margin-bottom:32px;">
      <tr><td>
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Nueva contrasena temporal</p>
        <p style="margin:0;font-size:14px;color:#3A7350;">
          <span style="font-family:monospace;font-size:20px;background:#fff;padding:8px 16px;border-radius:8px;border:1px solid #BBF7D0;display:inline-block;">${params.passwordNueva}</span>
        </p>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:14px;color:#166534;font-weight:600;">Realizado por:</p>
    <p style="margin:0 0 24px;font-size:14px;color:#3A7350;">${params.nombreAdmin}</p>
    <p style="margin:0;font-size:14px;color:#B45309;background:#FFFBEB;padding:16px;border-radius:8px;border-left:4px solid #F59E0B;">
      Si no solicitaste este cambio o no reconoces esta accion, contacta al administrador del sistema inmediatamente.
    </p>
  `);
}

function templateCodigo2FA(params: {
  nombre: string;
  codigo: string;
}): string {
  return baseTemplate(`
    <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#14532D;">Codigo de verificacion</p>
    <p style="margin:0 0 32px;font-size:16px;color:#3A7350;">Hola ${params.nombre}, aqui esta tu codigo de acceso de un solo uso:</p>
    <div style="text-align:center;margin:0 0 32px;">
      <span style="font-family:monospace;font-size:48px;font-weight:700;letter-spacing:12px;color:#15803D;background:#F0FDF4;padding:20px 32px;border-radius:16px;display:inline-block;border:2px solid #BBF7D0;">${params.codigo}</span>
    </div>
    <p style="margin:0;font-size:14px;color:#3A7350;text-align:center;">Este codigo expira en <strong>10 minutos</strong>. No lo compartas con nadie.</p>
  `);
}

// ─── Funciones públicas ───────────────────────────────────────

async function enviar(to: string, subject: string, html: string): Promise<void> {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    logger.warn(`Email no configurado — no se envió correo a ${to}`);
    return;
  }
  try {
    await transporter.sendMail({ from: `"Khipu SENA" <${env.EMAIL_USER}>`, to, subject, html });
    logger.info(`Email enviado a ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Error al enviar email a ${to}:`, err);
  }
}

export const emailService = {
  async enviarBienvenida(params: { nombre: string; email: string; password: string; rol: string }) {
    await enviar(params.email, 'Bienvenido a Khipu — Credenciales de acceso', templateBienvenida(params));
  },

  async enviarCambioPassword(params: { nombreUsuario: string; email: string; nombreAdmin: string; passwordNueva: string }) {
    await enviar(params.email, 'Khipu — Tu contrasena fue actualizada', templateCambioPassword(params));
  },

  async enviarCodigo2FA(params: { nombre: string; email: string; codigo: string }) {
    await enviar(params.email, `Khipu — Codigo de verificacion: ${params.codigo}`, templateCodigo2FA(params));
  },
};
