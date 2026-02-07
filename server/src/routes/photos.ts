import express from "express";
import fs from "fs";
import path from "path";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";
import { WeeklySelection } from "../entities/WeeklySelection";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
const photoRepository = AppDataSource.getRepository(Photo);
const networkRepository = AppDataSource.getRepository(Network);
const weeklyRepository = AppDataSource.getRepository(WeeklySelection);

function getLastSundayAtSixUtc(): Date {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const msPerWeek = 7 * msPerDay;
  const referenceTime = new Date("1970-01-04T18:00:00Z").getTime();
  const weeksSinceReference = Math.floor((now.getTime() - referenceTime) / msPerWeek);
  const lastSundayAtSix = referenceTime + weeksSinceReference * msPerWeek;
  return new Date(lastSundayAtSix);
}

function seededIndex(seed: number, total: number): number {
  if (total <= 0) return 0;
  return seed % total;
}

async function pickRandomPhoto(excludeSlug?: string | null) {
  let query = photoRepository
    .createQueryBuilder("photo")
    .where("photo.slug IS NOT NULL");

  if (excludeSlug) {
    query = query.andWhere("photo.slug <> :excludeSlug", { excludeSlug });
  }

  const total = await query.getCount();
  if (total === 0) {
    if (excludeSlug) {
      return pickRandomPhoto(null);
    }
    return null;
  }

  const offset = Math.floor(Math.random() * total);

  const photo = await query
    .orderBy("photo.createdAt", "DESC")
    .addOrderBy("photo.id", "DESC")
    .offset(offset)
    .limit(1)
    .select([
      "photo.id",
      "photo.src",
      "photo.title",
      "photo.displayTitle",
      "photo.desc",
      "photo.displayDesc",
      "photo.slug",
      "photo.brand",
      "photo.model",
      "photo.createdAt",
    ])
    .getOne();

  return photo || null;
}

// GET latest photos pour le frontend (LatestItem format)
router.get("/latest", async (req: any, res: any) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const photos = await photoRepository
      .createQueryBuilder("photo")
      .orderBy("photo.createdAt", "DESC")
      .addOrderBy("photo.id", "DESC")
      .limit(limit)
      .select([
        "photo.id",
        "photo.src",
        "photo.title",
        "photo.displayTitle",
        "photo.desc",
        "photo.displayDesc",
        "photo.slug",
        "photo.brand",
        "photo.model",
        "photo.createdAt",
        "photo.imageData",  // Ajouter pour vérifier que l'image existe
      ])
      .getMany();

    console.log(`📊 Total photos en DB: ${photos.length}`);

    const mapped = photos.map(p => {
      if (!p.slug) {
        console.warn(`⚠️ Photo ${p.id} n'a pas de slug`);
        return null;
      }
      if (!p.imageData) {
      router.get("/weekly-photo", async (req: any, res: any) => {
        try {
          const cutoff = getLastSundayAtSixUtc();
          const seed = Math.floor(cutoff.getTime() / 1000);

          const total = await photoRepository
            .createQueryBuilder("photo")
            .where("photo.createdAt <= :cutoff", { cutoff: cutoff.toISOString() })
            .andWhere("photo.slug IS NOT NULL")
            .getCount();

          if (total === 0) {
            return res.json({ success: true, photo: null });
          }

          const offset = seededIndex(seed, total);

          const photo = await photoRepository
            .createQueryBuilder("photo")
            .where("photo.createdAt <= :cutoff", { cutoff: cutoff.toISOString() })
            .andWhere("photo.slug IS NOT NULL")
            .orderBy("photo.createdAt", "DESC")
            .addOrderBy("photo.id", "DESC")
            .offset(offset)
            .limit(1)
            .select([
              "photo.id",
              "photo.src",
              "photo.title",
              "photo.displayTitle",
              "photo.desc",
              "photo.displayDesc",
              "photo.slug",
              "photo.brand",
              "photo.model",
              "photo.createdAt",
            ])
            .getOne();

          if (!photo || !photo.slug) {
            return res.json({ success: true, photo: null });
          }

          const mapped = {
            href: `/gallery/network/${photo.slug}`,
            slug: photo.slug,
            src: `/api/photos/${photo.slug}/image/${photo.id}`,
            title: photo.displayTitle || photo.title || null,
            description: photo.displayDesc || photo.desc || null,
            brand: photo.brand || null,
            model: photo.model || null,
            mtime: new Date(photo.createdAt).getTime(),
          };

          return res.json({ success: true, photo: mapped });
        } catch (error) {
          console.error("Error fetching weekly photo:", error);
          return res.status(500).json({ success: false, message: "Erreur serveur" });
        }
      });

        console.warn(`⚠️ Photo ${p.id} (${p.slug}) n'a pas d'imageData`);
        return null;
      }
      return {
        href: `/gallery/network/${p.slug}`,
        slug: p.slug,
        src: `/api/photos/${p.slug}/image/${p.id}`,
        title: p.displayTitle || p.title || null,
        description: p.displayDesc || p.desc || null,
        brand: p.brand || null,
        model: p.model || null,
        mtime: new Date(p.createdAt).getTime(),
        isReformed: p.isReformed,
        isPreserved: p.isPreserved,
      };
    }).filter(p => p !== null);

    console.log(`✓ ${mapped.length} photos retournées (${photos.length - mapped.length} filtrées)`);
    return res.json({ success: true, items: mapped });
  } catch (error) {
    console.error("Error fetching latest photos:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET photo de la semaine (stable jusqu'au dimanche 18h UTC)
router.get("/weekly-photo", async (req: any, res: any) => {
  try {
    const weekStart = getLastSundayAtSixUtc();

    let selection = await weeklyRepository.findOne({ where: { weekStart } });
    if (!selection) {
      const previous = await weeklyRepository.find({
        order: { weekStart: "DESC" },
        take: 1,
      });
      const previousSlug = previous[0]?.slug || null;

      const picked = await pickRandomPhoto(previousSlug);
      if (!picked || !picked.slug) {
        return res.json({ success: true, photo: null });
      }

      selection = weeklyRepository.create({
        weekStart,
        photoId: picked.id,
        slug: picked.slug,
      });
      await weeklyRepository.save(selection);
    }

    const photo = await photoRepository.findOne({ where: { id: selection.photoId } });
    if (!photo || !photo.slug) {
      return res.json({ success: true, photo: null });
    }

    const mapped = {
      href: `/gallery/network/${photo.slug}`,
      slug: photo.slug,
      src: `/api/photos/${photo.slug}/image/${photo.id}`,
      title: photo.displayTitle || photo.title || null,
      description: photo.displayDesc || photo.desc || null,
      brand: photo.brand || null,
      model: photo.model || null,
      mtime: new Date(photo.createdAt).getTime(),
      isReformed: photo.isReformed,
      isPreserved: photo.isPreserved,
    };

    return res.json({ success: true, photo: mapped });
  } catch (error) {
    console.error("Error fetching weekly photo:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET l'image d'une photo (stockée en base64 dans la DB)
router.get("/:networkSlug/image/:photoId", async (req: any, res: any) => {
  try {
    const { networkSlug, photoId } = req.params;
    console.log(`🖼️ Demande image: networkSlug=${networkSlug}, photoId=${photoId}`);

    // Chercher la photo par ID et vérifier que le slug correspond
    const photo = await photoRepository.findOne({
      where: { id: photoId, slug: networkSlug },
      relations: ["network"],
    });

    if (!photo) {
      console.error(`❌ Photo non trouvée: id=${photoId}, slug=${networkSlug}`);
      return res.status(404).json({ success: false, message: "Photo non trouvée" });
    }

    if (!photo.imageData) {
      // Fallback: servir le fichier depuis public/photos si present
      const src = photo.src || "";
      if (src.startsWith("/photos/")) {
        const projectRoot = path.join(__dirname, "..", "..", "..");
        const filePath = path.join(projectRoot, "public", src.replace(/^\/+/, ""));
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType =
            ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
            ext === ".png" ? "image/png" :
            ext === ".webp" ? "image/webp" :
            ext === ".gif" ? "image/gif" :
            "application/octet-stream";

          const fileBuffer = fs.readFileSync(filePath);
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", fileBuffer.length);
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return res.send(fileBuffer);
        }
      }

      console.error(`❌ Pas de imageData pour la photo ${photoId}`);
      return res.status(404).json({ success: false, message: "Image manquante" });
    }

    console.log(`✓ Trouvée. ImageData size: ${photo.imageData.length} bytes (base64)`);

    // Convertir le base64 en buffer et servir comme image
    try {
      const imageBuffer = Buffer.from(photo.imageData, "base64");
      console.log(`✓ Buffer créé: ${imageBuffer.length} bytes`);
      
      // Headers d'optimisation pour chargement rapide
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Content-Length", imageBuffer.length);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // Cache 1 an
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader("ETag", `"${photo.id}"`); // Pour revalidation
      
      // Compression gzip activée automatiquement par middleware compression()
      return res.send(imageBuffer);
    } catch (decodeErr) {
      console.error(`❌ Erreur décodage base64:`, decodeErr);
      return res.status(500).json({ success: false, message: "Erreur décodage image" });
    }
  } catch (error) {
    console.error("❌ Error fetching image:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET thumbnail rapide (version très compressée pour LQIP)
router.get("/:networkSlug/thumb/:photoId", async (req: any, res: any) => {
  try {
    const { networkSlug, photoId } = req.params;

    const photo = await photoRepository.findOne({
      where: { id: photoId, slug: networkSlug },
    });

    if (!photo || !photo.imageData) {
      return res.status(404).json({ success: false, message: "Thumbnail non trouvé" });
    }

    // Créer un thumbnail ultra-compressé si pas en cache
    try {
      const sharp = require("sharp");
      const imageBuffer = Buffer.from(photo.imageData, "base64");
      
      // Réduire drastiquement: 150x150, quality 40 pour un tout petit fichier
      const thumbBuffer = await sharp(imageBuffer)
        .resize(150, 150, { fit: "cover" })
        .webp({ quality: 40, effort: 4 })
        .toBuffer();
      
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Content-Length", thumbBuffer.length);
      return res.send(thumbBuffer);
    } catch (err) {
      console.error("Erreur création thumbnail:", err);
      return res.status(500).json({ success: false, message: "Erreur thumbnail" });
    }
  } catch (error) {
    console.error("Error fetching thumbnail:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET toutes les photos d'un réseau
router.get("/:networkSlug", async (req: any, res: any) => {
  try {
    const { networkSlug } = req.params;
    console.log(`\n🔍 [GET /:networkSlug] Requête pour networkSlug="${networkSlug}"`);

    // 1️⃣ Vérifier que le réseau existe
    const network = await networkRepository.findOne({ where: { slug: networkSlug } });
    console.log(`   Network trouvé:`, network ? `ID=${network.id}, slug=${network.slug}` : "❌ NULL");
    if (!network) {
      console.warn(`⚠️ Réseau non trouvé: ${networkSlug}`);
      return res.status(404).json({ success: false, message: "Réseau non trouvé" });
    }

    // 2️⃣ Chercher les photos par networkId
    console.log(`   🔎 Cherchant photos avec networkId=${network.id}`);
    const photos = await photoRepository.find({
      where: { networkId: network.id },
      order: { order: "ASC" },
    });
    console.log(`   📊 Trouvées ${photos.length} photos`);

    // 3️⃣ Debug: afficher les détails
    photos.forEach((p, i) => {
      console.log(`      Photo ${i}: id=${p.id}, slug="${p.slug}", title="${p.title}", displayTitle="${p.displayTitle}", hasImageData=${!!p.imageData}`);
    });

    // 4️⃣ Mapper et filtrer
    const projectRoot = path.join(__dirname, "..", "..", "..");

    const mappedPhotos = photos.map((p: Photo) => {
      if (!p.imageData) {
        console.warn(`   ⚠️ FILTRÉE (pas d'imageData): ${p.id}`);
        return null;
      }
      const srcUrl = `/api/photos/${p.slug}/image/${p.id}`;
      console.log(`   ✓ INCLUSE: ${p.id} → src="${srcUrl}"`);

      let fallbackDate: string | null = null;
      if (!p.date && p.src?.startsWith("/photos/")) {
        const filePath = path.join(projectRoot, "public", p.src.replace(/^\/+/, ""));
        if (fs.existsSync(filePath)) {
          try {
            const stat = fs.statSync(filePath);
            fallbackDate = stat.mtime.toISOString();
          } catch {
            fallbackDate = null;
          }
        }
      }

      if (!fallbackDate && p.createdAt) {
        fallbackDate = p.createdAt.toISOString();
      }

      return {
        ...p,
        src: srcUrl,
        displayTitle: p.displayTitle || p.title,
        displayDesc: p.displayDesc || p.desc,
        date: p.date || fallbackDate,
        createdAt: p.createdAt,
        isReformed: p.isReformed,
        isPreserved: p.isPreserved,
      };
    }).filter(p => p !== null);

    console.log(`   ✅ Retournant ${mappedPhotos.length} photos valides\n`);
    return res.json({ success: true, photos: mappedPhotos, network });
  } catch (error) {
    console.error("Erreur GET photos:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET une photo
router.get("/:networkSlug/:photoId", async (req: any, res: any) => {
  try {
    const { networkSlug, photoId } = req.params;

    const photo = await photoRepository.findOne({
      where: { id: photoId },
      relations: ["network"],
    });

    if (!photo || photo.network.slug !== networkSlug) {
      return res.status(404).json({ success: false, message: "Photo non trouvée" });
    }

    return res.json({ success: true, photo });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// POST créer une photo (authentifié)
router.post("/:networkSlug", authMiddleware, async (req: any, res: any) => {
  try {
    const { networkSlug } = req.params;
    const { title, img, date, desc } = req.body;

    if (!title || !img) {
      return res.status(400).json({ success: false, message: "Données manquantes" });
    }

    const network = await networkRepository.findOne({ where: { slug: networkSlug } });
    if (!network) {
      return res.status(404).json({ success: false, message: "Réseau non trouvé" });
    }

    // Trouver le prochain ordre
    const lastPhoto = await photoRepository.findOne({
      where: { networkId: network.id },
      order: { order: "DESC" },
    });

    const newPhoto = photoRepository.create({
      title,
      img,
      date: date || null,
      desc: desc || null,
      order: (lastPhoto?.order ?? -1) + 1,
      network,
    });

    await photoRepository.save(newPhoto);

    return res.status(201).json({ success: true, photo: newPhoto });
  } catch (error) {
    console.error("Erreur POST photo:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// PUT mettre à jour une photo (accessible pour gallery management)
router.put("/:networkSlug/:photoId", async (req: any, res: any) => {
  try {
    const { networkSlug, photoId } = req.params;
    const { displayTitle, displayDesc, date, order, isReformed, isPreserved } = req.body;

    const photo = await photoRepository.findOne({
      where: { id: photoId },
      relations: ["network"],
    });

    if (!photo || photo.network.slug !== networkSlug) {
      return res.status(404).json({ success: false, message: "Photo non trouvée" });
    }

    // Mettre à jour uniquement les champs affichables
    if (displayTitle !== undefined) photo.displayTitle = displayTitle;
    if (displayDesc !== undefined) photo.displayDesc = displayDesc;
    if (date !== undefined) photo.date = date;
    if (order !== undefined) photo.order = order;
    if (isReformed !== undefined) photo.isReformed = isReformed;
    if (isPreserved !== undefined) photo.isPreserved = isPreserved;

    await photoRepository.save(photo);

    // Retourner avec les champs affichables
    const response = {
      ...photo,
      displayTitle: photo.displayTitle || photo.title,
      displayDesc: photo.displayDesc || photo.desc,
    };

    return res.json({ success: true, photo: response });
  } catch (error) {
    console.error("Erreur PUT photo:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// DELETE une photo (accessible librement pour gallery management)
router.delete("/:networkSlug/:photoId", async (req: any, res: any) => {
  try {
    const { networkSlug, photoId } = req.params;
    const fs = require("fs");
    const path = require("path");

    const photo = await photoRepository.findOne({
      where: { id: photoId },
      relations: ["network"],
    });

    if (!photo || photo.network.slug !== networkSlug) {
      return res.status(404).json({ success: false, message: "Photo non trouvée" });
    }

    // Supprimer le fichier physique
    if (photo.src) {
      const filePath = path.join(process.cwd(), "public", photo.src);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`✓ Fichier supprimé: ${filePath}`);
        } catch (err) {
          console.error("Erreur suppression fichier:", err);
        }
      }
    }

    // Supprimer de la DB
    await photoRepository.remove(photo);

    return res.json({ success: true, message: "Photo supprimée" });
  } catch (error) {
    console.error("Erreur DELETE photo:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
