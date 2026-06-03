-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('administrador', 'almacen', 'coordinador', 'encargado', 'instructor', 'servicio');

-- CreateEnum
CREATE TYPE "EstadoItem" AS ENUM ('inactivo', 'activo', 'danado', 'en_mantenimiento', 'baja');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('entrada', 'asignacion', 'traslado', 'mantenimiento', 'devolucion', 'baja');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'aceptado', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('traslado_solicitado', 'traslado_aceptado', 'traslado_rechazado', 'verificacion_enviada', 'item_danado_reportado', 'servicio_solicitado', 'item_en_mantenimiento', 'item_devuelto', 'item_baja', 'cuenta_creada', 'contrasena_cambiada', 'mantenimiento_completado');

-- CreateEnum
CREATE TYPE "MetodoDos2FA" AS ENUM ('totp', 'email');

-- CreateEnum
CREATE TYPE "EstadoVerificacion" AS ENUM ('presente', 'ausente', 'danado');

-- CreateTable
CREATE TABLE "naves" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "naves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambientes" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "nave_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas" (
    "id" TEXT NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "ambiente_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL,
    "ficha_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_naves" (
    "usuario_id" TEXT NOT NULL,
    "nave_id" TEXT NOT NULL,
    "asignado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_naves_pkey" PRIMARY KEY ("usuario_id","nave_id")
);

-- CreateTable
CREATE TABLE "usuario_ambientes" (
    "usuario_id" TEXT NOT NULL,
    "ambiente_id" TEXT NOT NULL,
    "asignado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_ambientes_pkey" PRIMARY KEY ("usuario_id","ambiente_id")
);

-- CreateTable
CREATE TABLE "usuario_dos_fa" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "metodo" "MetodoDos2FA" NOT NULL,
    "secreto" VARCHAR(255),
    "activado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activado_en" TIMESTAMP(3),

    CONSTRAINT "usuario_dos_fa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_item" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "numero_inventario" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "categoria_id" INTEGER NOT NULL,
    "nave_id" TEXT,
    "ambiente_id" TEXT,
    "estado" "EstadoItem" NOT NULL DEFAULT 'inactivo',
    "observaciones" TEXT,
    "imagen_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "asignado_en" TIMESTAMP(3),
    "creado_por_id" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "ambiente_origen_id" TEXT,
    "ambiente_destino_id" TEXT,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_traslado" (
    "id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "solicitante_id" TEXT NOT NULL,
    "resolvedor_id" TEXT,
    "ambiente_origen_id" TEXT NOT NULL,
    "ambiente_destino_id" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "observaciones" TEXT,
    "motivo_rechazo" TEXT,
    "es_inter_nave" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelto_en" TIMESTAMP(3),

    CONSTRAINT "solicitudes_traslado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_mantenimiento" (
    "id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "solicitante_id" TEXT NOT NULL,
    "servicio_id" TEXT,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "descripcion_falla" TEXT NOT NULL,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceptado_en" TIMESTAMP(3),
    "completado_en" TIMESTAMP(3),
    "resultado_final" VARCHAR(20),

    CONSTRAINT "solicitudes_mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificaciones_inventario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "ambiente_id" TEXT NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verificaciones_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_verificacion" (
    "id" TEXT NOT NULL,
    "verificacion_id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "estado" "EstadoVerificacion" NOT NULL,

    CONSTRAINT "detalles_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "url_destino" VARCHAR(500),
    "metadatos" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida_en" TIMESTAMP(3),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "rol_usuario" "Rol" NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "entidad_id" VARCHAR(50) NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "area" VARCHAR(50) NOT NULL,
    "campos_antes" JSONB,
    "campos_despues" JSONB,
    "ip" VARCHAR(50),
    "user_agent" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item_id" INTEGER,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "limite_administrador" INTEGER NOT NULL DEFAULT 3,
    "limite_almacen" INTEGER NOT NULL DEFAULT 5,
    "limite_coordinador" INTEGER NOT NULL DEFAULT 10,
    "limite_encargado" INTEGER NOT NULL DEFAULT 50,
    "limite_instructor" INTEGER NOT NULL DEFAULT 200,
    "limite_servicio" INTEGER NOT NULL DEFAULT 10,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fichas_numero_key" ON "fichas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_dos_fa_usuario_id_key" ON "usuario_dos_fa"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_item_nombre_key" ON "categorias_item"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "items_numero_inventario_key" ON "items"("numero_inventario");

-- CreateIndex
CREATE INDEX "items_ambiente_id_idx" ON "items"("ambiente_id");

-- CreateIndex
CREATE INDEX "items_nave_id_idx" ON "items"("nave_id");

-- CreateIndex
CREATE INDEX "items_estado_idx" ON "items"("estado");

-- CreateIndex
CREATE INDEX "items_categoria_id_idx" ON "items"("categoria_id");

-- CreateIndex
CREATE INDEX "movimientos_item_id_idx" ON "movimientos"("item_id");

-- CreateIndex
CREATE INDEX "movimientos_usuario_id_idx" ON "movimientos"("usuario_id");

-- CreateIndex
CREATE INDEX "movimientos_fecha_idx" ON "movimientos"("fecha" DESC);

-- CreateIndex
CREATE INDEX "solicitudes_traslado_estado_idx" ON "solicitudes_traslado"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_traslado_solicitante_id_idx" ON "solicitudes_traslado"("solicitante_id");

-- CreateIndex
CREATE INDEX "solicitudes_mantenimiento_estado_idx" ON "solicitudes_mantenimiento"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_mantenimiento_item_id_idx" ON "solicitudes_mantenimiento"("item_id");

-- CreateIndex
CREATE INDEX "verificaciones_inventario_ambiente_id_idx" ON "verificaciones_inventario"("ambiente_id");

-- CreateIndex
CREATE INDEX "verificaciones_inventario_usuario_id_idx" ON "verificaciones_inventario"("usuario_id");

-- CreateIndex
CREATE INDEX "verificaciones_inventario_creado_en_idx" ON "verificaciones_inventario"("creado_en" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "detalles_verificacion_verificacion_id_item_id_key" ON "detalles_verificacion"("verificacion_id", "item_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_idx" ON "notificaciones"("usuario_id", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_creado_en_idx" ON "notificaciones"("creado_en" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_usuario_id_idx" ON "audit_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_logs_entidad_entidad_id_idx" ON "audit_logs"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "audit_logs_creado_en_idx" ON "audit_logs"("creado_en" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_area_idx" ON "audit_logs"("area");

-- AddForeignKey
ALTER TABLE "ambientes" ADD CONSTRAINT "ambientes_nave_id_fkey" FOREIGN KEY ("nave_id") REFERENCES "naves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_naves" ADD CONSTRAINT "usuario_naves_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_naves" ADD CONSTRAINT "usuario_naves_nave_id_fkey" FOREIGN KEY ("nave_id") REFERENCES "naves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_ambientes" ADD CONSTRAINT "usuario_ambientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_ambientes" ADD CONSTRAINT "usuario_ambientes_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_dos_fa" ADD CONSTRAINT "usuario_dos_fa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_nave_id_fkey" FOREIGN KEY ("nave_id") REFERENCES "naves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_ambiente_origen_id_fkey" FOREIGN KEY ("ambiente_origen_id") REFERENCES "ambientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_ambiente_destino_id_fkey" FOREIGN KEY ("ambiente_destino_id") REFERENCES "ambientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_traslado" ADD CONSTRAINT "solicitudes_traslado_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_traslado" ADD CONSTRAINT "solicitudes_traslado_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_traslado" ADD CONSTRAINT "solicitudes_traslado_resolvedor_id_fkey" FOREIGN KEY ("resolvedor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_traslado" ADD CONSTRAINT "solicitudes_traslado_ambiente_origen_id_fkey" FOREIGN KEY ("ambiente_origen_id") REFERENCES "ambientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_traslado" ADD CONSTRAINT "solicitudes_traslado_ambiente_destino_id_fkey" FOREIGN KEY ("ambiente_destino_id") REFERENCES "ambientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_mantenimiento" ADD CONSTRAINT "solicitudes_mantenimiento_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_mantenimiento" ADD CONSTRAINT "solicitudes_mantenimiento_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificaciones_inventario" ADD CONSTRAINT "verificaciones_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_verificacion" ADD CONSTRAINT "detalles_verificacion_verificacion_id_fkey" FOREIGN KEY ("verificacion_id") REFERENCES "verificaciones_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_verificacion" ADD CONSTRAINT "detalles_verificacion_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
