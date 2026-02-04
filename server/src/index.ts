import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import { AppDataSource } from "./database";
import authRoutes from "./routes/auth";
import networksRoutes from "./routes/networks";
import photosRoutes from "./routes/photos";
import localPhotosRoutes from "./routes/localPhotos";
import adminRoutes from "./routes/admin";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de compression gzip - AVANT tout le reste
app.use(compression());

// Middleware CORS - AVANT tout le reste
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Toujours autoriser localhost en dev
    if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== "production") {
      // En développement (non-production), autoriser tous les origins
      callback(null, true);
    } else {
      // En production stricte, restreindre
      const allowedOrigins = [
        "https://www.tc-essonnes.fr",
        "https://tc-essonnes.fr"
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight pour TOUS les endpoints
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/networks", networksRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/local-photos", localPhotosRoutes);
app.use("/api/admin", adminRoutes);

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
    console.log("🔧 Configuration:");
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${PORT}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST || "localhost"}`);
    console.log(`   DATABASE_URL present: ${!!process.env.DATABASE_URL}`);
    
    // Initialiser la base de données (optionnel si pas de DATABASE_URL)
    if (process.env.DATABASE_URL) {
      try {
        await AppDataSource.initialize();
        console.log("✅ Base de données connectée");
      } catch (dbError) {
        console.warn("⚠️ Impossible de se connecter à la BD, serveur démarrera sans DB");
      }
    } else {
      console.log("⚠️ DATABASE_URL non défini, serveur démarrera sans BD");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erreur critique au démarrage:", error);
    process.exit(1);
  }
};

startServer();
