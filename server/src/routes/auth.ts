import express, { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppDataSource } from "../database";
import { User } from "../entities/User";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);

router.post("/login", async (req: any, res: any) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Identifiants manquants" });
    }

    const user = await userRepository.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Identifiants invalides" });
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await userRepository.save(user);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      (process.env.JWT_SECRET || "secret-key") as string,
      { expiresIn: process.env.JWT_EXPIRATION || "7d" } as any
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const user = await userRepository.findOne({ where: { id: req.user?.id } });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/logout", authMiddleware, (req: AuthRequest, res: any) => {
  // JWT stateless, pas besoin de faire grand chose
  return res.json({ success: true, message: "Déconnecté" });
});

export default router;
