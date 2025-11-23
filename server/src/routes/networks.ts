import express from "express";
import { AppDataSource } from "../database";
import { Network } from "../entities/Network";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
const networkRepository = AppDataSource.getRepository(Network);

// GET tous les réseaux
router.get("/", async (req: any, res: any) => {
  try {
    const networks = await networkRepository.find({
      relations: ["photos"],
      order: { name: "ASC" },
    });

    return res.json({ success: true, networks });
  } catch (error) {
    console.error("Erreur GET networks:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// GET un réseau
router.get("/:slug", async (req: any, res: any) => {
  try {
    const { slug } = req.params;

    const network = await networkRepository.findOne({
      where: { slug },
      relations: ["photos"],
    });

    if (!network) {
      return res.status(404).json({ success: false, message: "Réseau non trouvé" });
    }

    return res.json({ success: true, network });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// POST créer un réseau (authentifié)
router.post("/", authMiddleware, async (req: any, res: any) => {
  try {
    const { slug, name, folder, img, href, logoHeight } = req.body;

    if (!slug || !name || !folder) {
      return res.status(400).json({ success: false, message: "Données manquantes" });
    }

    const existing = await networkRepository.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Réseau déjà existant" });
    }

    const network = networkRepository.create({
      slug,
      name,
      folder,
      img: img || null,
      href: href || null,
      logoHeight: logoHeight || null,
    });

    await networkRepository.save(network);

    return res.status(201).json({ success: true, network });
  } catch (error) {
    console.error("Erreur POST network:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// PUT mettre à jour un réseau (authentifié)
router.put("/:slug", authMiddleware, async (req: any, res: any) => {
  try {
    const { slug } = req.params;
    const { name, folder, img, href, logoHeight } = req.body;

    const network = await networkRepository.findOne({ where: { slug } });

    if (!network) {
      return res.status(404).json({ success: false, message: "Réseau non trouvé" });
    }

    if (name) network.name = name;
    if (folder) network.folder = folder;
    if (img !== undefined) network.img = img;
    if (href !== undefined) network.href = href;
    if (logoHeight !== undefined) network.logoHeight = logoHeight;

    await networkRepository.save(network);

    return res.json({ success: true, network });
  } catch (error) {
    console.error("Erreur PUT network:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
