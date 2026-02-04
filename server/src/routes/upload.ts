import express, { Request, Response } from "express";

const router = express.Router();

// Endpoint pour uploader des photos
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("📸 Requête upload reçue");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    
    // Pour l'instant, on retourne juste un succès basique
    res.json({
      success: true,
      message: "Photos reçues",
      photos: [],
    });
  } catch (error) {
    console.error("❌ Erreur upload:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur",
    });
  }
});

export default router;
