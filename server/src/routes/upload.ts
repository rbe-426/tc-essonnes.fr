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
      try {
        const file = files[i];
        const title = Array.isArray(titles) ? titles[i] : titles;
        const description = Array.isArray(descriptions) ? descriptions[i] : descriptions;

        // Générer un nom de fichier unique
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const fileName = `${baseName}-${Date.now()}${ext}`;
        const folderPath = path.join(__dirname, "../../../public/photos", networkSlug);
        const filePath = path.join(folderPath, fileName);

        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        // Compresser et sauvegarder l'image
        await sharp(file.buffer)
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(filePath);

        console.log(`✓ Image sauvegardée: ${fileName}`);

        // Créer le record en DB
        const src = `/photos/${networkSlug}/${fileName}`;
        const photo = photoRepository.create({
          title: title || baseName,
          displayTitle: title || baseName,
          img: src,
          src: src,
          slug: networkSlug,
          desc: description || "",
          displayDesc: description || "",
        });
        photo.network = network;

        const saved = await photoRepository.save(photo);
        savedPhotos.push(saved);
        console.log(`✓ Photo ajoutée en BD: ${title} → ${networkSlug}`);
      } catch (err) {
        console.error(`❌ Erreur traitement fichier ${i}:`, err);
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
