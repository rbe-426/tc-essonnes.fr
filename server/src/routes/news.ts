import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { AppDataSource } from "../database";
import { NewsItem } from "../entities/NewsItem";

const router = Router();
const newsRepository = AppDataSource.getRepository(NewsItem);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Seules les images sont acceptees"));
  },
});

const maybeUpload = (req: any, res: any, next: any) => {
  if (req.is("multipart/form-data")) {
    return upload.single("image")(req, res, next);
  }
  return next();
};

const adminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_TOKEN || "dev-secret";

  if (!token || token !== adminToken) {
    return res.status(401).json({ success: false, message: "Non autorise" });
  }
  next();
};

router.get("/", async (req: any, res: any) => {
  try {
    const items = await newsRepository.find({
      order: { createdAt: "DESC" },
    });

    const mapped = items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      linkUrl: item.linkUrl || null,
      linkLabel: item.linkLabel || null,
      imageUrl: item.imageData ? `/api/news/${item.id}/image` : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.json({ success: true, items: mapped });
  } catch (error) {
    console.error("Erreur GET news:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/:id/image", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const item = await newsRepository.findOne({ where: { id } });

    if (!item || !item.imageData) {
      return res.status(404).json({ success: false, message: "Image introuvable" });
    }

    const buffer = Buffer.from(item.imageData, "base64");
    res.setHeader("Content-Type", item.imageMime || "image/webp");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(buffer);
  } catch (error) {
    console.error("Erreur image news:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/", adminAuth, maybeUpload, async (req: any, res: any) => {
  try {
    const { title, body, linkUrl, linkLabel } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Titre et contenu requis" });
    }

    let imageData: string | null = null;
    let imageMime: string | null = null;

    if (req.file) {
      const compressed = await sharp(req.file.buffer)
        .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70, effort: 4 })
        .toBuffer();
      imageData = compressed.toString("base64");
      imageMime = "image/webp";
    }

    const item = newsRepository.create({
      title,
      body,
      linkUrl: linkUrl || null,
      linkLabel: linkLabel || null,
      imageData: imageData || null,
      imageMime: imageMime || null,
    });

    const saved = await newsRepository.save(item);

    return res.status(201).json({
      success: true,
      item: {
        id: saved.id,
        title: saved.title,
        body: saved.body,
        linkUrl: saved.linkUrl || null,
        linkLabel: saved.linkLabel || null,
        imageUrl: saved.imageData ? `/api/news/${saved.id}/image` : null,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erreur POST news:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.put("/:id", adminAuth, maybeUpload, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, body, linkUrl, linkLabel } = req.body;

    const item = await newsRepository.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, message: "Actualite introuvable" });
    }

    if (title !== undefined) item.title = title;
    if (body !== undefined) item.body = body;
    if (linkUrl !== undefined) item.linkUrl = linkUrl || null;
    if (linkLabel !== undefined) item.linkLabel = linkLabel || null;

    if (req.file) {
      const compressed = await sharp(req.file.buffer)
        .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70, effort: 4 })
        .toBuffer();
      item.imageData = compressed.toString("base64");
      item.imageMime = "image/webp";
    }

    const saved = await newsRepository.save(item);

    return res.json({
      success: true,
      item: {
        id: saved.id,
        title: saved.title,
        body: saved.body,
        linkUrl: saved.linkUrl || null,
        linkLabel: saved.linkLabel || null,
        imageUrl: saved.imageData ? `/api/news/${saved.id}/image` : null,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erreur PUT news:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.delete("/:id", adminAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const item = await newsRepository.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, message: "Actualite introuvable" });
    }

    await newsRepository.remove(item);
    return res.json({ success: true, message: "Actualite supprimee" });
  } catch (error) {
    console.error("Erreur DELETE news:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
