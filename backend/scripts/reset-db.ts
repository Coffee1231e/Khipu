/// <reference types="node" />

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const env = process.env['NODE_ENV'];
  if (env === 'production') {
    console.error('❌ Este script NO puede ejecutarse en producción.');
    process.exit(1);
  }

  console.log('\n⚠️ ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos.');
  console.log('   Tienes 3 segundos para cancelar (Ctrl+C)...\n');
  await new Promise<void>((r) => setTimeout(r, 3000));

  console.log('🧹 Limpiando base de datos...');
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notificacion.deleteMany(),
    prisma.detalleVerificacion.deleteMany(),
    prisma.verificacionInventario.deleteMany(),
    prisma.solicitudMantenimiento.deleteMany(),
    prisma.solicitudTraslado.deleteMany(),
    prisma.movimiento.deleteMany(),
    prisma.item.deleteMany(),
    prisma.categoriaItem.deleteMany(),
    prisma.usuarioDosFA.deleteMany(),
    prisma.usuarioAmbiente.deleteMany(),
    prisma.usuarioNave.deleteMany(),
    prisma.usuario.deleteMany(),
    prisma.ficha.deleteMany(),
    prisma.ambiente.deleteMany(),
    prisma.nave.deleteMany(),
    prisma.configuracionSistema.deleteMany(),
  ]);

  console.log('✅ Base de datos limpia.\n🌱 Creando configuración inicial...');

  // Configuración
  await prisma.configuracionSistema.create({ data: { id: 'singleton' } });

  // Usuario Admin
  const pass = await bcrypt.hash('Sena2024!', 12);

  await prisma.usuario.create({
    data: {
      nombre: 'Administrador Principal',
      email: 'kennethyeraysierra@gmail.com',
      passwordHash: pass,
      rol: 'administrador',
    }
  });

  console.log('\n✅ BASE DE DATOS RESTAURADA A SU ESTADO INICIAL!\n');
  console.log('──────────────────────────────────────────────────');
  console.log('📋 CUENTA DE ADMINISTRADOR CREADA');
  console.log('   Correo: kennethyeraysierra@gmail.com');
  console.log('   Contraseña: Sena2024!');
  console.log('──────────────────────────────────────────────────\n');
}

main()
  .catch((e: unknown) => { console.error(e); process.exit(1); })
  .finally(() => { void prisma.$disconnect(); });