import "dotenv/config";
import { AppDataSource } from "./server/src/database";
import { Photo } from "./server/src/entities/Photo";

/**
 * Script pour synchroniser les photos de la DB locale vers la production
 * Usage: npx ts-node sync-to-production.ts
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || "https://www.tc-essonnes.fr";
const ADMIN_TOKEN = process.env.PRODUCTION_ADMIN_TOKEN || process.env.ADMIN_TOKEN;

async function syncPhotosToProduction() {
  if (!ADMIN_TOKEN) {
    console.error("❌ ADMIN_TOKEN non défini!");
    console.log("Définissez: export PRODUCTION_ADMIN_TOKEN=votre_token");
    process.exit(1);
  }

  console.log(`🔄 Synchronisation vers: ${PRODUCTION_URL}`);

  // Initialiser la DB locale
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const photoRepo = AppDataSource.getRepository(Photo);

  // Récupérer toutes les photos avec imageData (queryBuilder pour WHERE NOT NULL)
  const photos = await photoRepo
    .createQueryBuilder("photo")
    .where("photo.imageData IS NOT NULL")
    .leftJoinAndSelect("photo.network", "network")
    .getMany();

  console.log(`📊 ${photos.length} photos trouvées en local`);

  if (photos.length === 0) {
    console.log("ℹ️ Aucune photo à synchroniser");
    await AppDataSource.destroy();
    return;
  }

  let synced = 0;
  let failed = 0;

  for (const photo of photos) {
    try {
      const slug = photo.slug || photo.network?.slug;
      if (!slug) {
        console.warn(`⚠️ Photo ${photo.id} sans slug, skipped`);
        failed++;
        continue;
      }

      // Créer un FormData avec l'imageData en base64
      const formData = new FormData();
      
      // Créer un Blob depuis le base64
      const binaryString = Buffer.from(photo.imageData, "base64").toString("binary");
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/webp" });

      formData.append("files", blob, `${photo.title}.webp`);
      formData.append("titles[]", photo.displayTitle || photo.title);
      formData.append("descriptions[]", photo.displayDesc || photo.desc || "");
      formData.append("networkSlug", slug);

      // Envoyer à la production
      const response = await fetch(`${PRODUCTION_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ADMIN_TOKEN}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ ${photo.displayTitle} → ${slug}`);
        synced++;
      } else {
        console.error(`❌ Erreur ${photo.displayTitle}:`, result.message);
        failed++;
      }
    } catch (error) {
      console.error(`❌ Erreur sync ${photo.id}:`, error);
      failed++;
    }
  }

  console.log(`\n📈 Résultats: ${synced}/${photos.length} synchronisées (${failed} erreurs)`);
  await AppDataSource.destroy();
}

syncPhotosToProduction().catch(console.error);
