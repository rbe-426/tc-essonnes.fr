import "dotenv/config";
import { DataSource } from "typeorm";
import { Network } from "./entities/Network";
import { Photo } from "./entities/Photo";
import { User } from "./entities/User";
import { AuditLog } from "./entities/AuditLog";
import { NewsItem } from "./entities/NewsItem";
import { AddImageDataToPhotos1738699200000 } from "./migrations/1738699200000-AddImageDataToPhotos";

// Support DATABASE_URL (format Railway) ou variables individuelles
const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (process.env.DATABASE_URL) {
    console.log("📡 Utilise DATABASE_URL (Railway)");
    return {
      type: "postgres" as const,
      url: process.env.DATABASE_URL,
      synchronize: true, // ✅ Créer les tables automatiquement
      logging: true, // 🔍 Logs détaillés pour debug
      entities: [Network, Photo, User, AuditLog, NewsItem],
      subscribers: [],
      migrations: isProduction 
        ? [AddImageDataToPhotos1738699200000]
        : ["src/migrations/**/*.ts"],
    };
  }

  return {
    type: "postgres" as const,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "tce_photos",
    synchronize: true, // ✅ Aussi en dev pour cohérence
    logging: process.env.NODE_ENV === "development",
    entities: [Network, Photo, User, AuditLog, NewsItem],
    subscribers: [],
    migrations: isProduction
      ? [AddImageDataToPhotos1738699200000]
      : ["src/migrations/**/*.ts"],
  };
};

export const AppDataSource = new DataSource(getDatabaseConfig() as any);
