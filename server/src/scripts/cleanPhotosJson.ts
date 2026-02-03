import fs from "fs";
import path from "path";

// Charger les networks depuis le fichier TypeScript principal
const networks = require(path.join(process.cwd(), "content", "networks")).networks || [];

function folderFor(n: any) {
  const fromHref = (n?.href || "").split("/").filter(Boolean).pop();
  return (n as any).folder || fromHref || n.slug;
}

async function cleanPhotosJson() {
  console.log("🧹 Nettoyage des fichiers photos.json...\n");

  for (const n of networks) {
    const folder = folderFor(n);
    const dir = path.join(process.cwd(), "public", "photos", folder);

    if (!fs.existsSync(dir)) {
      console.log(`⊘ Dossier non trouvé: ${folder}`);
      continue;
    }

    const jsonPath = path.join(dir, "photos.json");
    if (!fs.existsSync(jsonPath)) {
      console.log(`⊘ Pas de photos.json: ${folder}`);
      continue;
    }

    try {
      const content = fs.readFileSync(jsonPath, "utf8");
      const data = JSON.parse(content);
      const photos = Array.isArray(data?.photos) ? data.photos : Array.isArray(data) ? data : [];

      // Filtrer les photos qui existent réellement
      const validPhotos = photos.filter((photo: any) => {
        let filename: string;
        if (typeof photo === "string") {
          filename = photo;
        } else if (photo?.src) {
          filename = path.basename(photo.src);
        } else {
          return false;
        }

        const filePath = path.join(dir, filename);
        const exists = fs.existsSync(filePath);
        
        if (!exists) {
          console.log(`  ✗ Supprimée du JSON: ${folder}/${filename}`);
        }
        
        return exists;
      });

      // Écrire le JSON nettoyé
      if (validPhotos.length !== photos.length) {
        const updated = {
          photos: validPhotos.map((p: any) => 
            typeof p === "string" ? p : p
          )
        };
        fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2));
        console.log(`✓ ${folder}: ${photos.length} → ${validPhotos.length} photos\n`);
      } else {
        console.log(`✓ ${folder}: OK (${photos.length} photos)\n`);
      }
    } catch (error) {
      console.error(`✗ Erreur parsing ${folder}:`, error);
    }
  }

  console.log("✓ Nettoyage terminé!");
}

cleanPhotosJson().catch(console.error);
