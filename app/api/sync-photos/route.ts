import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { networks } from "@/content/networks";

export async function POST() {
  try {
    const photosDir = join(process.cwd(), "public/photos");
    const VALID_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

    for (const network of networks) {
      const folder = network.folder || network.slug;
      const folderPath = join(photosDir, folder);
      const jsonPath = join(folderPath, "photos.json");

      try {
        // Lire les fichiers image dans le dossier
        const files = readdirSync(folderPath).filter(f => {
          const ext = f.substring(f.lastIndexOf(".")).toLowerCase();
          return VALID_EXTS.has(ext) && !f.startsWith(".");
        });

        // Lire le photos.json existant
        let existingData: any = { photos: [] };
        try {
          const content = readFileSync(jsonPath, "utf-8");
          existingData = JSON.parse(content);
          if (!Array.isArray(existingData.photos)) {
            existingData.photos = [];
          }
        } catch {
          // Fichier n'existe pas ou invalide
        }

        // Créer une map des photos existantes par src
        const existingMap = new Map(
          existingData.photos.map((p: any) => [
            p.src || `/photos/${folder}/${p}`,
            p
          ])
        );

        // Ajouter les photos manquantes
        const updatedPhotos = [];
        for (const file of files) {
          const src = `/photos/${folder}/${file}`;
          if (existingMap.has(src)) {
            updatedPhotos.push(existingMap.get(src));
          } else {
            // Nouvelle photo - créer une entrée basique
            updatedPhotos.push({
              src,
              title: file.replace(/\.[^/.]+$/, ""),
              description: ""
            });
          }
        }

        // Écrire le photos.json mis à jour
        writeFileSync(jsonPath, JSON.stringify({ photos: updatedPhotos }, null, 2));
        console.log(`✓ Synchronisé ${folder}: ${updatedPhotos.length} photos`);
      } catch (err) {
        console.error(`Erreur pour ${folder}:`, err);
      }
    }

    return Response.json({ success: true, message: "Synchronisation complète" });
  } catch (error) {
    console.error("Erreur de synchronisation:", error);
    return Response.json({ error: "Synchronisation échouée" }, { status: 500 });
  }
}
