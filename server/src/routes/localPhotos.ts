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

    // Construire le chemin du dossier photos (à la racine du projet, pas dans server/)
    const projectRoot = path.join(process.cwd(), "..");
    const photosDir = path.join(projectRoot, "public", "photos", folder);
    const photosJsonPath = path.join(photosDir, "photos.json");

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Lire le fichier photos.json existant ou en créer un nouveau
    let photosData: any[] = [];

    if (fs.existsSync(photosJsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(photosJsonPath, "utf8").replace(/^\uFEFF/, ''));
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

/**
 * POST /api/local-photos/save-batch
 * Sauvegarde plusieurs photos à la fois (pour l'import)
 */
router.post("/save-batch", (req: any, res: any) => {
  try {
    // Vérifier que c'est localhost
    const host = req.hostname || req.headers.host || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return res.status(403).json({ success: false, message: "Non autorisé" });
    }

    const { folder, photos } = req.body;

    if (!folder || !Array.isArray(photos)) {
      return res
        .status(400)
        .json({ success: false, message: "Données manquantes ou invalides" });
    }

    // Construire le chemin du dossier photos (à la racine du projet, pas dans server/)
    const projectRoot = path.join(process.cwd(), "..");
    const photosDir = path.join(projectRoot, "public", "photos", folder);
    const photosJsonPath = path.join(photosDir, "photos.json");

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Lire le fichier photos.json existant ou en créer un nouveau
    let photosData: any[] = [];

    if (fs.existsSync(photosJsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(photosJsonPath, "utf8").replace(/^\uFEFF/, ''));
        photosData = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
      } catch (err) {
        console.error("Erreur lecture photos.json:", err);
        photosData = [];
      }
    }

    // Ajouter les nouvelles photos
    photos.forEach((newPhoto: any) => {
      const { src, title, description } = newPhoto;
      
      // Vérifier si la photo existe déjà
      const existingIndex = photosData.findIndex(
        (p: any) => (typeof p === "string" ? p : p?.src) === src
      );

      const photoEntry: any = { src };
      if (title) photoEntry.title = title;
      if (description) photoEntry.description = description;

      if (existingIndex >= 0) {
        photosData[existingIndex] = photoEntry;
      } else {
        photosData.push(photoEntry);
      }
    });

    // Sauvegarder le fichier photos.json
    fs.writeFileSync(
      photosJsonPath,
      JSON.stringify({ photos: photosData }, null, 2),
      "utf8"
    );

    console.log(`✅ photos.json mis à jour avec ${photos.length} photo(s): ${photosJsonPath}`);

    return res.json({
      success: true,
      message: `${photos.length} photo(s) sauvegardée(s) avec succès`,
      file: photosJsonPath,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde batch:", error);
    return res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: String(error) });
  }
});

/**
 * DELETE /api/local-photos/delete
 * Supprime une photo (localhost seulement)
 */
router.delete("/delete", (req: any, res: any) => {
  try {
    // Vérifier que c'est localhost
    const host = req.hostname || req.headers.host || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return res.status(403).json({ success: false, message: "Non autorisé" });
    }

    const { folder, src } = req.body;

    if (!folder || !src) {
      return res
        .status(400)
        .json({ success: false, message: "Données manquantes" });
    }

    // Construire le chemin du dossier photos
    const projectRoot = path.join(process.cwd(), "..");
    const photosDir = path.join(projectRoot, "public", "photos", folder);
    const photosJsonPath = path.join(photosDir, "photos.json");
    const imagePath = path.join(projectRoot, src);

    if (!fs.existsSync(photosJsonPath)) {
      return res.status(404).json({ success: false, message: "Fichier photos.json non trouvé" });
    }

    // Lire le fichier photos.json
    let photosData: any[] = [];
    try {
      const raw = JSON.parse(fs.readFileSync(photosJsonPath, "utf8").replace(/^\uFEFF/, ''));
      photosData = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
    } catch (err) {
      return res.status(500).json({ success: false, message: "Erreur lecture photos.json" });
    }

    // Supprimer la photo du tableau
    const initialLength = photosData.length;
    photosData = photosData.filter((p: any) => (typeof p === "string" ? p : p?.src) !== src);

    if (photosData.length === initialLength) {
      return res.status(404).json({ success: false, message: "Photo non trouvée" });
    }

    // Sauvegarder le fichier photos.json
    fs.writeFileSync(
      photosJsonPath,
      JSON.stringify({ photos: photosData }, null, 2),
      "utf8"
    );

    // Supprimer le fichier image s'il existe
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    console.log(`✅ Photo supprimée: ${src}`);

    return res.json({
      success: true,
      message: "Photo supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: String(error) });
  }
});

export default router;

