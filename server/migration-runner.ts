#!/usr/bin/env node

import "dotenv/config";
import { DataSource } from "typeorm";
import path from "path";

// Charger les entités depuis le répertoire dist
const entitiesDir = path.join(__dirname, "dist", "entities");
const migrationsDir = path.join(__dirname, "dist", "migrations");

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [`${entitiesDir}/**/*.js`],
  migrations: [`${migrationsDir}/**/*.js`],
  subscribers: [],
});

const command = process.argv[2];

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log("✓ Connexion DB établie");
    
    const migrations = await AppDataSource.runMigrations();
    console.log(`✓ ${migrations.length} migrations exécutées`);
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("✗ Erreur migration:", error);
    process.exit(1);
  }
}

async function revertMigrations() {
  try {
    await AppDataSource.initialize();
    console.log("✓ Connexion DB établie");
    
    await AppDataSource.undoLastMigration();
    console.log("✓ Dernière migration annulée");
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("✗ Erreur revert:", error);
    process.exit(1);
  }
}

if (command === "run") {
  runMigrations();
} else if (command === "revert") {
  revertMigrations();
} else {
  console.log("Usage: npm run migration:run | npm run migration:revert");
  process.exit(1);
}
