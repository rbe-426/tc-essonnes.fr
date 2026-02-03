import { Router } from "express";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";
import fs from "fs";
import path from "path";

const router = Router();

// Middleware d'authentification admin
const adminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_TOKEN || "dev-secret";

  if (!token || token !== adminToken) {
    return res.status(401).json({ success: false, message: "Non autorisé" });
  }
  next();
};

// Charger les networks (hardcodé pour fiabilité)
function getNetworks() {
  return [
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
}

// Lire les métadonnées des photos depuis photos.json
function readPhotosJson(dir: string) {
  const p = path.join(dir, "photos.json");
  if (!fs.existsSync(p)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const arr = Array.isArray(raw?.photos)
      ? raw.photos
      : Array.isArray(raw)
        ? raw
        : [];
    const map: Record<string, any> = {};
    for (const it of arr) {
      if (typeof it === "string") {
        map[it] = {};
      } else if (it && typeof it.src === "string") {
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

function folderFor(n: any) {
  const fromHref = (n?.href || "").split("/").filter(Boolean).pop();
  return (n as any).folder || fromHref || n.slug;
}

const VALID = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// POST /api/admin/import-photos
router.post("/import-photos", adminAuth, async (req: any, res: any) => {
  try {
    const photoRepo = AppDataSource.getRepository(Photo);
    const networkRepo = AppDataSource.getRepository(Network);

    let networks = getNetworks();
    if (networks.length === 0) {
      const dbNetworks = await networkRepo.find();
      networks = dbNetworks;
    }

    const projectRoot = path.join(__dirname, "..", "..", "..");
    let totalImported = 0;
    const imported = [];
    const skipped = [];

    for (const n of networks) {
      const folder = folderFor(n);
      const dir = path.join(projectRoot, "public", "photos", folder);

      if (!fs.existsSync(dir)) {
        skipped.push(`Dossier non trouvé: ${folder}`);
        continue;
      }

      // Créer ou récupérer le réseau
      let network = await networkRepo.findOne({ where: { slug: folder } });
      if (!network) {
        network = networkRepo.create({
          slug: folder,
          name: n.name || folder,
          href: n.href || `/gallery/network/${folder}`,
        });
        await networkRepo.save(network);
      }

      const meta = readPhotosJson(dir);
      const files = fs
        .readdirSync(dir)
        .filter((f) => VALID.has(path.extname(f).toLowerCase()));

      for (const file of files) {
        const fullPath = path.posix.join("/photos", folder, file);
        const metadata = meta[fullPath] || meta[file] || {};

        // Vérifier si existe déjà
        const existing = await photoRepo.findOne({ where: { src: fullPath } });
        if (existing) {
          skipped.push(fullPath);
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
        imported.push(fullPath);
      }
    }

    return res.json({
      success: true,
      imported: totalImported,
      skipped: skipped.length,
      details: {
        imported: imported.slice(0, 10),
        skipped: skipped.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Erreur import photos:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'import",
      error: (error as any).message,
    });
  }
});

export default router;
