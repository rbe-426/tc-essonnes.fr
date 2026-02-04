import express from "express";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
const photoRepository = AppDataSource.getRepository(Photo);
const networkRepository = AppDataSource.getRepository(Network);

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
      };
    }).filter(p => p !== null);

    console.log(`✓ ${mapped.length} photos retournées (${photos.length - mapped.length} filtrées)`);
    return res.json({ success: true, items: mapped });
  } catch (error) {
    console.error("Error fetching latest photos:", error);
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
    console.log(`🔍 DEBUG: Requête pour networkSlug="${networkSlug}"`);

    const network = await networkRepository.findOne({ where: { slug: networkSlug } });
    if (!network) {
      console.warn(`⚠️ Réseau non trouvé: ${networkSlug}`);
      return res.status(404).json({ success: false, message: "Réseau non trouvé" });
    }

    const photos = await photoRepository.find({
      where: { networkId: network.id },
      order: { order: "ASC" },
    });

    console.log(`📊 ${networkSlug}: ${photos.length} photos en DB`);
    photos.forEach((p, i) => {
      console.log(`   Photo ${i}: id=${p.id}, slug="${p.slug}", title="${p.title}"`);
    });

    // Mapper les photos pour afficher displayTitle/displayDesc ou title/desc en fallback
    const mappedPhotos = photos.map((p: Photo) => {
      if (!p.imageData) {
        console.warn(`⚠️ Photo ${p.id} (${p.slug}) n'a pas d'imageData`);
        return null;
      }
      const srcUrl = `/api/photos/${p.slug}/image/${p.id}`;
      console.log(`   ✓ Photo ${p.id}: src="${srcUrl}"`);
      return {
        ...p,
        src: srcUrl,
        displayTitle: p.displayTitle || p.title,
        displayDesc: p.displayDesc || p.desc,
      };
    }).filter(p => p !== null);

    console.log(`✓ ${mappedPhotos.length} photos valides retournées`);
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
    const { displayTitle, displayDesc, date, order } = req.body;

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
