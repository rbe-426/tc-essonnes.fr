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
    const titles = req.body["titles[]"] || [];
    const descriptions = req.body["descriptions[]"] || [];
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
      const title = Array.isArray(titles) ? titles[i] : titles;
      const description = Array.isArray(descriptions) ? descriptions[i] : descriptions;
      
      try {
        // Compresser l'image et convertir en base64
        const compressedBuffer = await sharp(file.buffer)
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 75 })
          .toBuffer();
        
        const imageData = compressedBuffer.toString("base64");
        console.log(`✓ Image compressée et encodée (${Math.round(imageData.length / 1024)}KB en base64)`);

        // Créer le record en DB avec l'image
        const src = `/api/photos/${networkSlug}/image`; // URL virtuelle
        const baseName = path.basename(file.originalname, path.extname(file.originalname));
        const photo = photoRepository.create({
          title: title || baseName,
          displayTitle: title || baseName,
          img: src,
          src: src,
          slug: networkSlug,
          desc: description || "",
          displayDesc: description || "",
          imageData: imageData, // STOCKAGE EN DB
        });
        photo.network = network;

        const saved = await photoRepository.save(photo);
        savedPhotos.push(saved);
        console.log(`✓ Photo ajoutée en BD (avec image): ${title} → ${networkSlug}`);
      } catch (err) {
        console.error(`❌ Erreur traitement fichier ${i}:`, err);
        
        // Si l'erreur est "column imageData does not exist", créer la photo sans imageData
        if (err instanceof Error && err.message.includes("column \"imageData\" does not exist")) {
          try {
            console.log(`⚠️ Colonne imageData manquante, création sans image...`);
            const baseName = path.basename(file.originalname, path.extname(file.originalname));
            const src = `/api/photos/${networkSlug}/image`; // URL virtuelle
            const photo = photoRepository.create({
              title: title || baseName,
              displayTitle: title || baseName,
              img: src,
              src: src,
              slug: networkSlug,
              desc: description || "",
              displayDesc: description || "",
              // Pas de imageData ici
            });
            photo.network = network;
            const saved = await photoRepository.save(photo);
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
