import express from "express";
import multer from "multer";
import { handlePhotoUpload } from "../handlers/uploadPhotos";

const router = express.Router();

/**
 * Middleware d'authentification admin
 * Optionnel en développement, requis en production
 */
const adminAuth = (req: any, res: any, next: any) => {
  // En développement, pas de token requis
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  // En production, vérifier le token
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_TOKEN;

  if (!token || token !== adminToken) {
    return res.status(401).json({ success: false, message: "Non autorisé - Token manquant ou invalide" });
  }
  next();
};

/**
 * Configuration multer pour les uploads en mémoire
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"));
    }
  },
});

/**
 * POST /api/photos/upload
 * Upload et compresse les photos en WebP, sauvegarde en base de données
 * Authentification requise
 */
router.post("/", adminAuth, upload.array("files"), async (req: any, res: any) => {
  try {
    // Vérifier qu'il y a des fichiers uploadés
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier uploadé",
      });
    }

    const folder = (req.body.folder || "").toLowerCase();
    const networkSlug = (req.body.networkSlug || folder).toLowerCase();

    if (!folder) {
      return res.status(400).json({
        success: false,
        message: "Le dossier est requis",
      });
    }

    // Convertir les fichiers uploadés en format attendu
    const files = req.files.map((file: any) => ({
      name: file.originalname,
      buffer: file.buffer,
    }));

    // Traiter l'upload
    const result = await handlePhotoUpload(files, folder, networkSlug);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Erreur serveur",
    });
  }
});

export default router;
