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

    const { folder, filename, title, description } = req.body;

    if (!folder || !filename) {
      return res
        .status(400)
        .json({ success: false, message: "Données manquantes" });
    }

    // Construire le chemin du fichier JSON
    const photosDir = path.join(process.cwd(), "public", "photos", folder);
    const basename = path.basename(filename, path.extname(filename));
    const jsonFilePath = path.join(photosDir, `${basename}.json`);

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Créer ou mettre à jour le fichier JSON
    const photoData = {
      title: title || basename,
      description: description || "",
      src: filename,
    };

    fs.writeFileSync(jsonFilePath, JSON.stringify(photoData, null, 2), "utf8");

    console.log(`✅ Photo sauvegardée: ${jsonFilePath}`);

    return res.json({
      success: true,
      message: "Photo sauvegardée avec succès",
      file: jsonFilePath,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    return res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: String(error) });
  }
});

export default router;
