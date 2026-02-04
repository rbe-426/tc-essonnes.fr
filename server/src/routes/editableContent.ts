import express from "express";
import { AppDataSource } from "../database";
import { EditableContent } from "../entities/EditableContent";

const router = express.Router();
const editableRepository = AppDataSource.getRepository(EditableContent);

// GET un texte éditable
router.get("/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const content = await editableRepository.findOne({ where: { id } });

    if (!content) {
      return res.json({ id, content: "" });
    }

    return res.json(content);
  } catch (error) {
    console.error("Error fetching editable content:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// POST/PUT sauvegarder un texte éditable
router.post("/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Content requis" });
    }

    let record = await editableRepository.findOne({ where: { id } });

    if (!record) {
      record = editableRepository.create({ id, content });
    } else {
      record.content = content;
    }

    await editableRepository.save(record);
    return res.json({ success: true, id, content });
  } catch (error) {
    console.error("Error saving editable content:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
