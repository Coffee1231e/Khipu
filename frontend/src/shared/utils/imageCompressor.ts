/**
 * Comprime y redimensiona una imagen antes de subirla, convirtiéndola a WebP.
 * Esto ayuda a prevenir el error de "File too large" del backend (10MB límite).
 * 
 * @param file El archivo original subido por el usuario
 * @param maxWidth Ancho máximo permitido (default: 1920)
 * @param maxHeight Alto máximo permitido (default: 1920)
 * @param quality Calidad de compresión WebP (0 a 1) (default: 0.8)
 * @returns Una Promesa que resuelve a un nuevo objeto File (WebP)
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Verificar si es una imagen
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones si excede los máximos
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de canvas.'));
          return;
        }

        // Fondo blanco para imágenes transparentes que se convierten a formato sin alfa (aunque WebP soporta alfa)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al convertir el canvas a Blob.'));
              return;
            }
            // Crear el nuevo File con la extensión cambiada
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + '.webp';
            const newFile = new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen para compresión.'));
      };
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo de imagen original.'));
    };
  });
}
