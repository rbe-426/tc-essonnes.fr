import "dotenv/config";
import { DataSource } from "typeorm";
import { Network } from "./entities/Network";
import { Photo } from "./entities/Photo";
import { User } from "./entities/User";
import { AuditLog } from "./entities/AuditLog";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "tce_photos",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [Network, Photo, User, AuditLog],
  subscribers: [],
  migrations: ["src/migrations/**/*.ts"],
});
