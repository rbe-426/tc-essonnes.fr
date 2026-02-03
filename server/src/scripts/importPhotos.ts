import "dotenv/config";
import fs from "fs";
import path from "path";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";

// Charger les networks depuis le fichier TypeScript principal
const networks = require(path.join(process.cwd(), "content", "networks")).networks || [];

const VALID = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function folderFor(n: any) {
  const fromHref = (n?.href || "").split("/").filter(Boolean).pop();
  return (n as any).folder || fromHref || n.slug;
}

function readPhotosJson(dir: string) {
  const p = path.join(dir, "photos.json");
  if (!fs.existsSync(p)) return {} as Record<string, any>;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const arr: any[] = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
    const map: Record<string, any> = {};
    for (const it of arr) {
      if (typeof it === "string") map[it] = {};
      else if (it && typeof it.src === "string") {
        map[it.src] = {
          title: it.title,
          description: it.description,
          brand: it.brand,
          model: it.model,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function importPhotos() {
  try {
    await AppDataSource.initialize();
    console.log("✓ Connexion DB établie");

    const photoRepo = AppDataSource.getRepository(Photo);
    const networkRepo = AppDataSource.getRepository(Network);

    let totalImported = 0;

    for (const n of networks) {
      const folder = folderFor(n);
      const dir = path.join(process.cwd(), "public", "photos", folder);

      if (!fs.existsSync(dir)) {
        console.log(`⊘ Dossier non trouvé: ${folder}`);
        continue;
      }

      // Récupérer ou créer le réseau
      let network = await networkRepo.findOne({ where: { slug: folder } });
      if (!network) {
        network = networkRepo.create({
          slug: folder,
          name: n.name || folder,
          href: n.href || `/gallery/network/${folder}`,
        });
        await networkRepo.save(network);
        console.log(`✓ Réseau créé: ${folder}`);
      }

      const meta = readPhotosJson(dir);
      const files = fs.readdirSync(dir).filter(f => VALID.has(path.extname(f).toLowerCase()));

      for (const file of files) {
        const fullPath = path.posix.join("/photos", folder, file);
        const metadata = meta[fullPath] || meta[file] || {};

        // Vérifier si la photo existe déjà
        const existing = await photoRepo.findOne({ where: { src: fullPath } });
        if (existing) {
          console.log(`⊘ Photo existe déjà: ${fullPath}`);
          continue;
        }

        const photo = photoRepo.create({
          title: metadata.title || file.replace(/\.[^/.]+$/, ""),
          displayTitle: metadata.title || file.replace(/\.[^/.]+$/, ""),
          img: file,
          src: fullPath,
          slug: folder,
          desc: metadata.description || null,
          displayDesc: metadata.description || null,
          brand: metadata.brand || null,
          model: metadata.model || null,
          network,
          networkId: network.id,
          order: totalImported,
        });

        await photoRepo.save(photo);
        totalImported++;
        console.log(`✓ Importée: ${fullPath}`);
      }
    }

    console.log(`\n✓ Importation terminée: ${totalImported} photos`);
    process.exit(0);
  } catch (error) {
    console.error("✗ Erreur importation:", error);
    process.exit(1);
  }
}

importPhotos();
