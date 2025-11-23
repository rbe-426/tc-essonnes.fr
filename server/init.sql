-- Script d'initialisation de la base de données TCE Photos
-- À exécuter après creation de la DB

-- Créer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer les tables (TypeORM le fera aussi, c'est pour référence)

-- Insérer l'utilisateur admin
-- Mot de passe: Waiyl9134# (hasher avec bcrypt)
-- Hash bcrypt généré avec: bcrypt.hash('Waiyl9134#', 10)
INSERT INTO "user" (id, username, password, role, "isActive", "createdAt", "updatedAt") 
VALUES (
  uuid_generate_v4(),
  'w.belaidi',
  '$2b$10$WwYXq4HgI3PnWrh7mKqX.uJL8Kg7oQx8XE8Nwr9.e7KmL5v9K7aEK', -- hash bcrypt de Waiyl9134#
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;
