import "dotenv/config";
import { DataSource } from "typeorm";
import { Network } from "./src/entities/Network";
import { Photo } from "./src/entities/Photo";
import { User } from "./src/entities/User";
import { AuditLog } from "./src/entities/AuditLog";

export const AppDataSourceMigrations = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [Network, Photo, User, AuditLog],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: [],
});

// Exécuter les migrations si appelé directement
const command = process.argv[2];

if (command === "run") {
  AppDataSourceMigrations.initialize()
    .then(async (dataSource) => {
      console.log("✓ Exécution des migrations...");
      const migrations = await dataSource.runMigrations();
      console.log(`✓ ${migrations.length} migrations exécutées`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("✗ Erreur migration:", error);
      process.exit(1);
    });
} else if (command === "revert") {
  AppDataSourceMigrations.initialize()
    .then(async (dataSource) => {
      console.log("✓ Revert de la dernière migration...");
      const migration = await dataSource.undoLastMigration();
      console.log("✓ Revert complété");
      process.exit(0);
    })
    .catch((error) => {
      console.error("✗ Erreur revert:", error);
      process.exit(1);
    });
}
