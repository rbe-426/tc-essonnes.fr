import express from "express";
import { AppDataSource } from "../database";
import { Photo } from "../entities/Photo";
import { Network } from "../entities/Network";
import { authMiddleware, AdminRequest } from "../middleware/auth";

const router = express.Router();
const photoRepository = AppDataSource.getRepository(Photo);
const networkRepository = AppDataSource.getRepository(Network);

// GET toutes les photos d'un réseau
router.get("/:networkSlug", async (req: any, res: any) => {
  try {
    const { networkSlug } = req.params;

    const network = await networkRepository.findOne({ where: { slug: networkSlug } });
    if (!network) {
      return res.status(404).json({ success: false, message: "Réseau non trouvé" });
    }

    const photos = await photoRepository.find({
      where: { networkId: network.id },
      order: { order: "ASC" },
    });

    return res.json({ success: true, photos, network });
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

// PUT mettre à jour une photo (authentifié)
router.put("/:networkSlug/:photoId", authMiddleware, async (req: any, res: any) => {
  try {
    const { networkSlug, photoId } = req.params;
    const { title, img, date, desc, order } = req.body;

    const photo = await photoRepository.findOne({
      where: { id: photoId },
      relations: ["network"],
    });

    if (!photo || photo.network.slug !== networkSlug) {
      return res.status(404).json({ success: false, message: "Photo non trouvée" });
    }

    if (title) photo.title = title;
    if (img) photo.img = img;
    if (date !== undefined) photo.date = date;
    if (desc !== undefined) photo.desc = desc;
    if (order !== undefined) photo.order = order;

    await photoRepository.save(photo);

    return res.json({ success: true, photo });
  } catch (error) {
    console.error("Erreur PUT photo:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// DELETE une photo (authentifié)
router.delete("/:networkSlug/:photoId", authMiddleware, async (req: any, res: any) => {
  try {
    const { networkSlug, photoId } = req.params;

    const photo = await photoRepository.findOne({
      where: { id: photoId },
      relations: ["network"],
    });

    if (!photo || photo.network.slug !== networkSlug) {
      return res.status(404).json({ success: false, message: "Photo non trouvée" });
    }

    await photoRepository.remove(photo);

    return res.json({ success: true, message: "Photo supprimée" });
  } catch (error) {
    console.error("Erreur DELETE photo:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
