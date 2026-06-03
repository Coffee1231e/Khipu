// ============================================================
//  infrastructure/storage/storage.service.ts
//  Gestión de imágenes en Supabase Storage.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger/logger';

const BUCKET = 'item-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const OUTPUT_QUALITY = 85;
const MAX_DIMENSION = 1200;

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * Sube una imagen de ítem a Supabase Storage.
 * Comprime y redimensiona automáticamente antes de subir.
 *
 * @returns URL pública de la imagen
 */
export async function subirImagenItem(
  itemId: number,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new AppError('Solo se permiten imágenes en formato JPG, PNG o WebP.', 422, 'INVALID_IMAGE_TYPE');
  }

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new AppError('La imagen no puede superar 5MB.', 422, 'IMAGE_TOO_LARGE');
  }

  // Comprimir y redimensionar
  const imagenProcesada = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: OUTPUT_QUALITY })
    .toBuffer();

  const fileName = `items/${itemId}.webp`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, imagenProcesada, {
      contentType: 'image/webp',
      upsert: true, // Reemplaza si ya existe
    });

  if (error) {
    logger.error('Error al subir imagen a Storage:', error);
    throw new AppError('No se pudo subir la imagen. Intenta de nuevo.', 500, 'STORAGE_ERROR');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Elimina la imagen de un ítem del Storage.
 */
export async function eliminarImagenItem(itemId: number): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([`items/${itemId}.webp`]);

  if (error) {
    logger.warn(`No se pudo eliminar imagen del ítem ${itemId}:`, error);
    // No lanzamos error — la imagen puede no existir
  }
}
