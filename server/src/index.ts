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
import uploadRoutes from "./routes/upload";
import maintenanceRoutes from "./routes/maintenance";
import editableContentRoutes from "./routes/editableContent";
import newsRoutes from "./routes/news";

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
      return;
    }
    
    // Autoriser les domaines tc-essonnes (PRODUCTION)
    const allowedOrigins = [
      "https://www.tc-essonnes.fr",
      "https://tc-essonnes.fr",
      "http://www.tc-essonnes.fr",
      "http://tc-essonnes.fr"
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed: ${origin}`);
      callback(null, true);
    } else {
      // Rejeter les origins non autorisés
      console.warn(`❌ CORS blocked: ${origin}`);
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/networks", networksRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/local-photos", localPhotosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/editable-content", editableContentRoutes);
app.use("/api/news", newsRoutes);

// Health check
app.get("/api/health", (req: any, res: any) => {
  res.json({ success: true, message: "Serveur ok" });
});

// Diagnostic DB simple
app.get("/api/db-status", async (req: any, res: any) => {
  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ success: false, message: "DB not initialized" });
    }
    
    const photoRepo = AppDataSource.getRepository("Photo");
    const networkRepo = AppDataSource.getRepository("Network");
    
    const totalPhotos = await photoRepo.count();
    const totalNetworks = await networkRepo.count();
    const photosWithImageData = await photoRepo.createQueryBuilder("photo")
      .where("photo.imageData IS NOT NULL")
      .getCount();
    
    res.json({ 
      success: true, 
      db: {
        connected: true,
        photos: totalPhotos,
        photosWithImageData,
        networks: totalNetworks
      }
    });
  } catch (error) {
    res.status(503).json({ success: false, error: String(error) });
  }
});

// Diagnostic DB détaillé
app.get("/api/db-audit", async (req: any, res: any) => {
  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ success: false, message: "DB not initialized" });
    }
    
    const photoRepo = AppDataSource.getRepository("Photo");
    const networkRepo = AppDataSource.getRepository("Network");
    
    // Tous les réseaux
    const networks = await networkRepo.find();
    
    // Toutes les photos avec détails
    const allPhotos = await photoRepo.find({ relations: ["network"] });
    
    // Photos groupées par réseau
    const photosByNetwork: Record<string, any> = {};
    for (const net of networks) {
      const photos = allPhotos.filter(p => p.networkId === net.id);
      photosByNetwork[net.slug] = {
        networkId: net.id,
        count: photos.length,
        hasImageData: photos.filter(p => !!p.imageData).length,
        photos: photos.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          hasImageData: !!p.imageData
        }))
      };
    }
    
    // Photos sans networkId
    const orphanPhotos = allPhotos.filter(p => !p.networkId);
    
    res.json({ 
      success: true, 
      summary: {
        totalNetworks: networks.length,
        totalPhotos: allPhotos.length,
        photosWithImage: allPhotos.filter(p => !!p.imageData).length,
        orphanPhotos: orphanPhotos.length
      },
      networks,
      photosByNetwork,
      orphanPhotos: orphanPhotos.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        networkId: p.networkId
      }))
    });
  } catch (error) {
    res.status(503).json({ success: false, error: String(error) });
  }
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
    console.log(`   NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || "NOT SET"}`);
    
    // 🚀 DÉMARRER LE SERVEUR D'ABORD (même sans DB)
    app.listen(PORT, () => {
      console.log(`✅ Serveur HTTP lancé sur le port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });

    // Ensuite, initialiser la base de données (optional)
    if (process.env.DATABASE_URL) {
      try {
        console.log("🚀 Tentative de connexion à PostgreSQL...");
        await AppDataSource.initialize();
        console.log("✅ Base de données connectée!");
        
        // Debug: compter les photos en DB
        try {
          const photoRepo = AppDataSource.getRepository("Photo");
          const totalPhotos = await photoRepo.count();
          const photosWithImageData = await photoRepo.createQueryBuilder("photo")
            .where("photo.imageData IS NOT NULL")
            .getCount();
          console.log(`📊 Infos DB: ${totalPhotos} photos total, ${photosWithImageData} avec imageData`);
        } catch (e) {
          console.warn("⚠️ Erreur lors du comptage des photos");
        }
        
        // Exécuter les migrations
        try {
          await AppDataSource.runMigrations();
          console.log("✅ Migrations exécutées");
        } catch (migrationError) {
          console.warn("⚠️ Erreur lors des migrations:", migrationError);
        }
      } catch (dbError) {
        console.error("❌ ERREUR DB CRITIQUE:");
        console.error(dbError);
        if (dbError instanceof Error) {
          console.error(`   Détail: ${dbError.message}`);
          console.error(`   Stack: ${dbError.stack}`);
        }
        console.warn("   Serveur fonctionne en mode lecture-seule (JSON)");
      }
    } else {
      console.log("⚠️ DATABASE_URL non défini, serveur fonctionne en mode lecture-seule (JSON)");
    }
  } catch (error) {
    console.error("❌ Erreur critique au démarrage:", error);
    process.exit(1);
  }
};

startServer();
