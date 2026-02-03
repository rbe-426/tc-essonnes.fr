/**
 * Handler serveur pour l'upload de photos
 * Isolé pour éviter les imports de decorators TypeORM côté client
 */
import { mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";

export async function handlePhotoUpload(
  files: Array<{ name: string; buffer: Buffer }>,
  folder: string,
  networkSlug: string
) {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const photoRepository = AppDataSource.getRepository(Photo);
    const networkRepository = AppDataSource.getRepository(Network);

    // Find the network
    const network = await networkRepository.findOne({ where: { slug: networkSlug } });
    if (!network) {
      throw new Error(`Réseau '${networkSlug}' non trouvé`);
    }

    const photosDir = join(process.cwd(), "public", "photos", folder);

    // Create directory if it doesn't exist
    if (!existsSync(photosDir)) {
      await mkdir(photosDir, { recursive: true });
    }

    const uploadedPhotos = [];

    for (const file of files) {
      try {
        const baseFilename = file.name.replace(/\.[^/.]+$/, "");
        const webpFilename = `${baseFilename}.webp`;
        const webpFilepath = join(photosDir, webpFilename);
        const fullPath = `/photos/${folder}/${webpFilename}`;

        // Compress and convert to WebP
        await sharp(file.buffer)
          .resize(2000, 2000, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 75 })
          .toFile(webpFilepath);

        // Check if photo already exists
        const existing = await photoRepository.findOne({
          where: { src: fullPath },
        });

        if (existing) {
          console.log(`⊘ Photo existe déjà: ${fullPath}`);
          continue;
        }

        // Get the last photo order
        const lastPhoto = await photoRepository.findOne({
          where: { networkId: network.id },
          order: { order: "DESC" },
        });

        // Create and save photo to database
        const photoData = {
          title: baseFilename,
          displayTitle: baseFilename,
          img: webpFilename,
          src: fullPath,
          slug: folder,
          desc: undefined,
          displayDesc: undefined,
          brand: undefined,
          model: undefined,
          date: undefined,
          network,
          networkId: network.id,
          order: (lastPhoto?.order ?? -1) + 1,
        };

        const photo = photoRepository.create(photoData);
        await photoRepository.save(photo);

        uploadedPhotos.push({
          id: photo.id,
          src: fullPath,
          title: baseFilename,
          description: "",
        });

        console.log(`✅ Photo importée en DB: ${fullPath}`);
      } catch (fileError) {
        console.error(`❌ Erreur traitement ${file.name}:`, fileError);
        // Continue with next file instead of failing
      }
    }

    if (uploadedPhotos.length === 0) {
      throw new Error("Aucune photo n'a pu être traitée");
    }

    return {
      success: true,
      message: `${uploadedPhotos.length} photo(s) importée(s) et sauvegardée(s) en DB`,
      photos: uploadedPhotos,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
