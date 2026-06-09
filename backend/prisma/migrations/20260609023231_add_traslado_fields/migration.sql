-- AlterTable
ALTER TABLE "items" ADD COLUMN     "ambiente_origen_original_id" TEXT;

-- AlterTable
ALTER TABLE "solicitudes_traslado" ADD COLUMN     "es_devolucion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usuario_destino_id" TEXT;
