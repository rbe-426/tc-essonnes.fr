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

    console.log(`📸 Upload de ${files.length} photos reçu`);

    if (files.length === 0) {
      return res.status(400).json({ success: false, error: "Aucun fichier" });
    }

    const photoRepository = AppDataSource.getRepository(Photo);
    const networkRepository = AppDataSource.getRepository(Network);
    const savedPhotos = [];

    // Récupérer ou créer le réseau "imported"
    let network = await networkRepository.findOne({ where: { slug: "imported" } });
    if (!network) {
      network = networkRepository.create({
        slug: "imported",
        name: "Photos Importées",
      });
      await networkRepository.save(network);
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
        const filePath = path.join(__dirname, "../../../public/photos/imported", fileName);

        // Créer le répertoire s'il n'existe pas
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Compresser et sauvegarder l'image
        await sharp(file.buffer)
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(filePath);

        console.log(`✓ Image sauvegardée: ${fileName}`);

        // Créer le record en DB
        const src = `/photos/imported/${fileName}`;
        const photo = photoRepository.create({
          title: title || baseName,
          displayTitle: title || baseName,
          img: src,
          src: src,
          slug: "imported",
          desc: description || "",
          displayDesc: description || "",
        });
        photo.network = network;

        const saved = await photoRepository.save(photo);
        savedPhotos.push(saved);
        console.log(`✓ Photo ajoutée en BD: ${title}`);
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
