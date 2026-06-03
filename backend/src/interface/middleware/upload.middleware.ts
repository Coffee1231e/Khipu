// ============================================================
//  interface/middleware/upload.middleware.ts
// ============================================================

import multer from 'multer';
import { AppError } from '../../shared/errors/AppError';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const uploadImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new AppError('Solo se permiten imágenes JPG, PNG o WebP.', 422, 'INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
}).single('imagen');
