import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

/**
 * POST /api/local-photos/save
 * Sauvegarde les modifications de photos en fichiers JSON (localhost seulement)
 */
router.post("/save", (req: any, res: any) => {
  try {
    // Vérifier que c'est localhost
    const host = req.hostname || req.headers.host || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return res.status(403).json({ success: false, message: "Non autorisé" });
    }

    const { folder, src, title, description } = req.body;

    if (!folder || !src) {
      return res
        .status(400)
        .json({ success: false, message: "Données manquantes" });
    }

    // Construire le chemin du dossier photos
    const photosDir = path.join(process.cwd(), "public", "photos", folder);
    const photosJsonPath = path.join(photosDir, "photos.json");

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Lire le fichier photos.json existant ou en créer un nouveau
    let photosData: any[] = [];

    if (fs.existsSync(photosJsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(photosJsonPath, "utf8"));
        photosData = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
      } catch (err) {
        console.error("Erreur lecture photos.json:", err);
        photosData = [];
      }
    }

    // Trouver ou créer l'entry pour cette photo
    const existingIndex = photosData.findIndex(
      (p: any) => (typeof p === "string" ? p : p?.src) === src
    );

    const photoEntry = {
      src,
      title: title || undefined,
      description: description || undefined,
    };

    // Nettoyer les champs vides
    Object.keys(photoEntry).forEach(
      (key) =>
        photoEntry[key as keyof typeof photoEntry] === undefined &&
        delete photoEntry[key as keyof typeof photoEntry]
    );

    if (existingIndex >= 0) {
      // Mettre à jour la photo existante
      photosData[existingIndex] = photoEntry;
    } else {
      // Ajouter une nouvelle photo
      photosData.push(photoEntry);
    }

    // Sauvegarder le fichier photos.json
    fs.writeFileSync(
      photosJsonPath,
      JSON.stringify({ photos: photosData }, null, 2),
      "utf8"
    );

    console.log(`✅ photos.json mis à jour: ${photosJsonPath}`);

    return res.json({
      success: true,
      message: "Photo sauvegardée avec succès",
      file: photosJsonPath,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    return res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: String(error) });
  }
});

export default router;
