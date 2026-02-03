import fs from "fs";
import path from "path";

// Networks hardcodés (même liste)
const networks = [
  { slug: "tisse", name: "TISSE", href: "/gallery/network/tisse" },
  { slug: "ratp", name: "RATP", href: "/gallery/network/ratp" },
  { slug: "kvyvs", name: "KVYVS", href: "/gallery/network/kvyvs" },
  { slug: "rer", name: "RER", href: "/gallery/network/rer" },
  { slug: "ratp_cap_saclay", name: "RATP Cap Saclay", href: "/gallery/network/ratp_cap_saclay" },
  { slug: "nav_rerd", name: "Navigation RERD", href: "/gallery/network/nav_rerd" },
  { slug: "reseau-t12", name: "Réseau T12", href: "/gallery/network/reseau-t12" },
  { slug: "reseau-ksvm", name: "Réseau KSVM", href: "/gallery/network/reseau-ksvm" },
  { slug: "cars-soeur", name: "Cars Soeur", href: "/gallery/network/cars-soeur" },
  { slug: "retrobus-essonne", name: "Retrobus Essonne", href: "/gallery/network/retrobus-essonne" },
  { slug: "transdev-coeur-essonne", name: "Transdev Coeur Essonne", href: "/gallery/network/transdev-coeur-essonne" },
  { slug: "transdev-senart", name: "Transdev Sénart", href: "/gallery/network/transdev-senart" },
];

function folderFor(n: any) {
  const fromHref = (n?.href || "").split("/").filter(Boolean).pop();
  return (n as any).folder || fromHref || n.slug;
}

async function cleanPhotosJson() {
  console.log("🧹 Nettoyage des fichiers photos.json...\n");

  const projectRoot = path.join(__dirname, "..", "..", "..");

  for (const n of networks) {
    const folder = folderFor(n);
    const dir = path.join(projectRoot, "public", "photos", folder);

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
