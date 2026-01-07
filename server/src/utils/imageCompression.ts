import sharp from 'sharp';

/**
 * Compresse une image buffer avec Sharp
 * @param buffer Buffer de l'image originale
 * @param options Options de compression
 * @returns Buffer compressé
 */
export async function compressImage(
  buffer: Buffer,
  options?: {
    quality?: number;
    resize?: { width?: number; height?: number };
  }
): Promise<Buffer> {
  try {
    let transformer = sharp(buffer);

    // Redimensionner si spécifié
    if (options?.resize?.width || options?.resize?.height) {
      transformer = transformer.resize(
        options.resize.width,
        options.resize.height,
        {
          fit: 'inside',
          withoutEnlargement: true,
        }
      );
    }

    // Compresser en JPEG ou WebP
    const compressed = await transformer
      .toFormat('jpeg', { quality: options?.quality || 80, progressive: true })
      .toBuffer();

    return compressed;
  } catch (error) {
    console.error('Erreur lors de la compression:', error);
    throw error;
  }
}

/**
 * Génère plusieurs versions d'une image (thumbnails)
 * @param buffer Buffer de l'image originale
 * @returns Objet avec les différentes versions
 */
export async function generateImageVariants(buffer: Buffer): Promise<{
  thumbnail: Buffer;
  medium: Buffer;
  large: Buffer;
  original: Buffer;
}> {
  try {
    const [thumbnail, medium, large, original] = await Promise.all([
      // Thumbnail (300px)
      sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { quality: 70, progressive: true })
        .toBuffer(),

      // Medium (800px)
      sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { quality: 80, progressive: true })
        .toBuffer(),

      // Large (1400px)
      sharp(buffer)
        .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { quality: 85, progressive: true })
        .toBuffer(),

      // Original compressé
      sharp(buffer)
        .toFormat('jpeg', { quality: 90, progressive: true })
        .toBuffer(),
    ]);

    return { thumbnail, medium, large, original };
  } catch (error) {
    console.error('Erreur lors de la génération des variantes:', error);
    throw error;
  }
}
