// ============================================================
//  interface/controllers/twofa.controller.ts
// ============================================================

import { Request, Response, NextFunction } from 'express';
import {
  generarSecretoTOTP,
  activar2FA,
  desactivar2FA,
  generarEmailOTP,
  verificar2FA,
} from '../../infrastructure/twofa/twofa.service';
import { emailService } from '../../infrastructure/email/email.service';
import { prisma } from '../../infrastructure/database/prisma.client';

export const dosFAController = {
  async obtenerEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dosFA = await prisma.usuarioDosFA.findUnique({
        where: { usuarioId: req.usuario.id },
        select: { activado: true, metodo: true, activadoEn: true },
      });
      res.json({ ok: true, dosFA: dosFA ?? { activado: false, metodo: null } });
    } catch (err) { next(err); }
  },

  async iniciarConfiguracionTOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { secreto, uri, qrCode } = await generarSecretoTOTP(
        req.usuario.id,
        req.usuario.email,
      );
      // Guardar secreto temporalmente (no activado aún)
      await prisma.usuarioDosFA.upsert({
        where: { usuarioId: req.usuario.id },
        create: { usuarioId: req.usuario.id, metodo: 'totp', secreto, activado: false },
        update: { metodo: 'totp', secreto, activado: false },
      });
      // No enviamos el secreto al cliente, solo el QR y URI
      res.json({ ok: true, qrCode, uri, secreto });
    } catch (err) { next(err); }
  },

  async activarTOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { codigo, secreto } = req.body;
      await activar2FA(req.usuario.id, codigo, secreto);
      res.json({ ok: true, mensaje: '2FA activado correctamente. Tu cuenta está más segura.' });
    } catch (err) { next(err); }
  },

  async enviarCodigoEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const codigo = generarEmailOTP(req.usuario.id);
      await emailService.enviarCodigo2FA({
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        codigo,
      });
      res.json({ ok: true, mensaje: 'Código enviado a tu correo. Expira en 10 minutos.' });
    } catch (err) { next(err); }
  },

  async verificarCodigo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { codigo } = req.body;
      const valido = await verificar2FA(req.usuario.id, codigo);
      if (!valido) {
        res.status(401).json({ ok: false, mensaje: 'Código incorrecto o expirado.' });
        return;
      }
      res.json({ ok: true, mensaje: 'Código verificado.' });
    } catch (err) { next(err); }
  },

  async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { codigo } = req.body;
      await desactivar2FA(req.usuario.id, codigo);
      res.json({ ok: true, mensaje: '2FA desactivado.' });
    } catch (err) { next(err); }
  },
};
