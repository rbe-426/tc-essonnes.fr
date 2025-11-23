import "dotenv/config";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./database";
import authRoutes from "./routes/auth";
import networksRoutes from "./routes/networks";
import photosRoutes from "./routes/photos";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS - AVANT tout le reste
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      "https://www.tc-essonnes.fr",
      "http://localhost:3000",
      "http://localhost:3001"
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight pour TOUS les endpoints
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/networks", networksRoutes);
app.use("/api/photos", photosRoutes);

// Health check
app.get("/api/health", (req: any, res: any) => {
  res.json({ success: true, message: "Serveur ok" });
});

// Erreur 404
app.use((req: any, res: any) => {
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
