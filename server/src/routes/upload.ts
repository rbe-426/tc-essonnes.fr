import express, { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";

const router = express.Router();

// Configurer multer pour stocker en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont acceptées"));
    }
  },
});

// Endpoint pour uploader des photos
router.post("/", upload.array("files"), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] || [];
    const body = req.body as Record<string, any>;
    const titles = body["titles[]"] || [];
    const descriptions = body["descriptions[]"] || [];
    const networkSlug = req.body.networkSlug || "imported"; // Utilise "imported" par défaut

    console.log(`📸 Upload de ${files.length} photos pour le réseau: ${networkSlug}`);

    if (files.length === 0) {
      return res.status(400).json({ success: false, error: "Aucun fichier" });
    }

    const photoRepository = AppDataSource.getRepository(Photo);
    const networkRepository = AppDataSource.getRepository(Network);
    const savedPhotos = [];

    // Récupérer ou créer le réseau
    let network = await networkRepository.findOne({ where: { slug: networkSlug } });
    if (!network) {
      network = networkRepository.create({
        slug: networkSlug,
        name: networkSlug.toUpperCase().replace(/-/g, " "),
      });
      await networkRepository.save(network);
      console.log(`✓ Réseau créé: ${networkSlug}`);
    }

    // Traiter chaque fichier
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const indexedTitle = body[`titles[${i}]`];
      const indexedDesc = body[`descriptions[${i}]`];
      const title = indexedTitle ?? (Array.isArray(titles) ? titles[i] : titles);
      const description = indexedDesc ?? (Array.isArray(descriptions) ? descriptions[i] : descriptions);
      
      try {
        // Compresser l'image et convertir en base64
        // Optimisé: 1200×1200, quality 55, effort 4 pour meilleure compression
        const compressedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 55, effort: 4 })
          .toBuffer();
        
        const imageData = compressedBuffer.toString("base64");
        console.log(`✓ Image compressée et encodée (${Math.round(imageData.length / 1024)}KB en base64 - optimisée pour chargement rapide)`);

        // Créer le record en DB avec l'image - créer d'abord sans src
        const baseName = path.basename(file.originalname, path.extname(file.originalname));
        const photo = photoRepository.create({
          title: title || baseName,
          displayTitle: title || baseName,
          img: "", // À remplir après l'ID
          src: "", // À remplir après l'ID
          slug: networkSlug,
          desc: description || "",
          displayDesc: description || "",
          imageData: imageData, // STOCKAGE EN DB
        });
        photo.network = network;

        const saved = await photoRepository.save(photo);
        
        // Maintenant on peut créer le src avec l'ID
        saved.src = `/api/photos/${networkSlug}/image/${saved.id}`;
        saved.img = saved.src;
        await photoRepository.save(saved);
        savedPhotos.push(saved);
        console.log(`✓ Photo ajoutée en BD (avec image): ${title} → ${networkSlug}`);
      } catch (err) {
        console.error(`❌ Erreur traitement fichier ${i}:`, err);
        
        // Si l'erreur est "column imageData does not exist", créer la photo sans imageData
        if (err instanceof Error && err.message.includes("column \"imageData\" does not exist")) {
          try {
            console.log(`⚠️ Colonne imageData manquante, création sans image...`);
            const baseName = path.basename(file.originalname, path.extname(file.originalname));
            const photo = photoRepository.create({
              title: title || baseName,
              displayTitle: title || baseName,
              img: "",
              src: "",
              slug: networkSlug,
              desc: description || "",
              displayDesc: description || "",
              // Pas de imageData ici
            });
            photo.network = network;
            const saved = await photoRepository.save(photo);
            
            // Ajouter l'ID au src après création
            saved.src = `/api/photos/${networkSlug}/image/${saved.id}`;
            saved.img = saved.src;
            await photoRepository.save(saved);
            
            savedPhotos.push(saved);
            console.log(`✓ Photo ajoutée sans image: ${title} → ${networkSlug}`);
          } catch (fallbackErr) {
            console.error(`❌ Erreur création fallback:`, fallbackErr);
          }
        }
      }
    }

    res.json({
      success: true,
      message: `${savedPhotos.length} photo(s) sauvegardée(s)`,
      photos: savedPhotos,
    });
  } catch (error) {
    console.error("❌ Erreur upload:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur",
    });
  }
});

export default router;
