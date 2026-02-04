import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";

const router = express.Router();

const networks = [
  { slug: "tisse", name: "TISSE" },
  { slug: "ratp", name: "RATP" },
  { slug: "kvyvs", name: "KVYVS" },
  { slug: "rer", name: "RER" },
  { slug: "ratp_cap_saclay", name: "RATP Cap Saclay" },
  { slug: "nav_rerd", name: "Navigation RERD" },
  { slug: "reseau-t12", name: "Réseau T12" },
  { slug: "reseau-ksvm", name: "Réseau KSVM" },
  { slug: "cars-soeur", name: "Cars Soeur" },
  { slug: "retrobus-essonne", name: "Retrobus Essonne" },
  { slug: "transdev-coeur-essonne", name: "Transdev Coeur Essonne" },
  { slug: "transdev-senart", name: "Transdev Sénart" },
];

const VALID_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// Endpoint GET pour afficher l'état de la maintenance
router.get("/status", async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: "Service de maintenance disponible",
      endpoints: {
        cleanup: "POST /api/maintenance/cleanup - Supprimer les photos sans fichiers",
        sync: "POST /api/maintenance/sync - Synchroniser fichiers/DB"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur" });
  }
});

// Endpoint pour nettoyer la DB (supprimer les photos supprimées des dossiers)
router.post("/cleanup", async (req: Request, res: Response) => {
  try {
    const photoRepository = AppDataSource.getRepository(Photo);
    const projectRoot = path.join(__dirname, "../../..");
    
    let removed = 0;

    for (const net of networks) {
      const folder = net.slug;
      const folderPath = path.join(projectRoot, "public", "photos", folder);

      // Récupérer toutes les photos de ce réseau en DB
      const photosInDB = await photoRepository.find({
        where: { slug: folder }
      });

      for (const photo of photosInDB) {
        // Vérifier si le fichier existe
        const filePath = path.join(projectRoot, "public", photo.src);
        
        if (!fs.existsSync(filePath)) {
          // Fichier supprimé → supprimer de la DB
          await photoRepository.remove(photo);
          removed++;
          console.log(`🗑️ Supprimé de la DB: ${photo.src}`);
        }
      }
    }

    res.json({
      success: true,
      message: `${removed} photo(s) supprimée(s) de la base de données`
    });
  } catch (error) {
    console.error("❌ Erreur nettoyage:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur"
    });
  }
});

// Endpoint pour synchroniser les fichiers avec la DB
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const photoRepository = AppDataSource.getRepository(Photo);
    const networkRepository = AppDataSource.getRepository(Network);
    const projectRoot = path.join(__dirname, "../../..");
    
    let synced = 0;

    for (const net of networks) {
      const folder = net.slug;
      const folderPath = path.join(projectRoot, "public", "photos", folder);

      if (!fs.existsSync(folderPath)) continue;

      // Récupérer ou créer le réseau
      let network = await networkRepository.findOne({ where: { slug: folder } });
      if (!network) {
        network = networkRepository.create({ slug: folder, name: net.name });
        await networkRepository.save(network);
      }

      // Lire les fichiers
      const files = fs.readdirSync(folderPath).filter(f =>
        VALID_EXTS.has(path.extname(f).toLowerCase()) && !f.startsWith(".")
      );

      for (const file of files) {
        const fullPath = path.posix.join("/photos", folder, file);
        
        // Vérifier si la photo existe en DB
        const existing = await photoRepository.findOne({ where: { src: fullPath } });
        
        if (!existing) {
          // Créer la photo en DB
          const photo = photoRepository.create({
            title: file.replace(/\.[^/.]+$/, ""),
            displayTitle: file.replace(/\.[^/.]+$/, ""),
            img: fullPath,
            src: fullPath,
            slug: folder,
            desc: "",
            displayDesc: ""
          });
          photo.network = network;
          await photoRepository.save(photo);
          synced++;
          console.log(`✅ Ajouté en DB: ${fullPath}`);
        }
      }
    }

    res.json({
      success: true,
      message: `${synced} photo(s) synchronisée(s) avec la base de données`
    });
  } catch (error) {
    console.error("❌ Erreur sync:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur"
    });
  }
});

export default router;
