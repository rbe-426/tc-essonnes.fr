import "dotenv/config";
import { AppDataSource } from "./src/database";
import { Photo } from "./src/entities/Photo";
import { Network } from "./src/entities/Network";
import { createConnection, Connection } from "typeorm";

/**
 * Script pour synchroniser les photos de la DB locale vers la production (Railway)
 * Usage: npm run sync:prod
 */

const PROD_DB_URL = process.env.PRODUCTION_DATABASE_URL || 
  "postgresql://postgres:sfobzalOXkHOLvwEOJBXsfchOpvZUOjF@postgres-4yt1.railway.internal:5432/railway";

async function syncPhotosToProduction() {
  console.log("🔄 Synchronisation des photos en production...\n");

  let localDB: any;
  let prodDB: Connection | undefined;

  try {
    // Initialiser la DB locale
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    localDB = AppDataSource;

    // Créer connexion production
    prodDB = await createConnection({
      type: "postgres",
      url: PROD_DB_URL,
      entities: [Photo, Network],
      synchronize: false,
      logging: false,
      ssl: { rejectUnauthorized: false }, // Railway utilise SSL
    });

    const localPhotoRepo = localDB.getRepository(Photo);
    const localNetworkRepo = localDB.getRepository(Network);
    const prodPhotoRepo = prodDB.getRepository(Photo);
    const prodNetworkRepo = prodDB.getRepository(Network);

    // Récupérer les photos locales
    const localPhotos = await localPhotoRepo
      .createQueryBuilder("photo")
      .where("photo.imageData IS NOT NULL")
      .leftJoinAndSelect("photo.network", "network")
      .getMany();

    console.log(`📊 ${localPhotos.length} photos trouvées en local\n`);

    if (localPhotos.length === 0) {
      console.log("ℹ️ Aucune photo à synchroniser");
      return;
    }

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (const localPhoto of localPhotos) {
      try {
        const slug = localPhoto.slug || localPhoto.network?.slug;
        if (!slug) {
          console.warn(`⚠️ Photo sans slug, skipped`);
          skipped++;
          continue;
        }

        // Vérifier si existe déjà
        const existing = await prodPhotoRepo.findOne({
          where: [{ id: localPhoto.id }, { src: localPhoto.src }]
        });

        if (existing) {
          console.log(`⊘ ${localPhoto.displayTitle || localPhoto.title} (déjà existe)`);
          skipped++;
          continue;
        }

        // Créer ou récupérer réseau en prod
        let prodNetwork = await prodNetworkRepo.findOne({ where: { slug } });
        if (!prodNetwork && localPhoto.network) {
          prodNetwork = prodNetworkRepo.create({
            slug: localPhoto.network.slug,
            name: localPhoto.network.name,
            href: localPhoto.network.href,
          });
          await prodNetworkRepo.save(prodNetwork);
        }

        // Créer la photo en prod
        const prodPhoto = prodPhotoRepo.create({
          id: localPhoto.id,
          title: localPhoto.title,
          displayTitle: localPhoto.displayTitle,
          img: localPhoto.img,
          src: localPhoto.src,
          slug: localPhoto.slug,
          desc: localPhoto.desc,
          displayDesc: localPhoto.displayDesc,
          brand: localPhoto.brand,
          model: localPhoto.model,
          order: localPhoto.order,
          imageData: localPhoto.imageData,
          networkId: prodNetwork?.id || localPhoto.networkId,
          createdAt: localPhoto.createdAt,
          updatedAt: localPhoto.updatedAt,
        });

        await prodPhotoRepo.save(prodPhoto);
        console.log(`✅ ${localPhoto.displayTitle || localPhoto.title}`);
        synced++;
      } catch (error) {
        console.error(`❌ Erreur:`, error instanceof Error ? error.message : error);
        failed++;
      }
    }

    console.log(`\n📈 Résultats: ${synced} sync, ${skipped} skip, ${failed} erreurs`);

  } catch (error) {
    console.error("❌ Erreur connexion:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    if (localDB && localDB.isInitialized) await localDB.destroy();
    if (prodDB && prodDB.isConnected) await prodDB.close();
  }
}

syncPhotosToProduction().catch(console.error);
