import "dotenv/config";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./database";
import authRoutes from "./routes/auth";
import networksRoutes from "./routes/networks";
import photosRoutes from "./routes/photos";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/networks", networksRoutes);
app.use("/api/photos", photosRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Serveur ok" });
});

// Erreur 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route non trouvée" });
});

// Démarrer le serveur
const startServer = async () => {
  try {
    // Initialiser la base de données
    await AppDataSource.initialize();
    console.log("✅ Base de données connectée");

    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage:", error);
    process.exit(1);
  }
};

startServer();
