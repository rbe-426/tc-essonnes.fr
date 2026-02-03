# Migration PostgreSQL - Photos

## Vue d'ensemble
Migration du système de gestion des photos de fichiers JSON statiques vers une base de données PostgreSQL. Cela permet:
- ✅ Suppression propre (fichier + DB en même temps)
- ✅ Gestion complète du cycle de vie des photos
- ✅ Queries performantes même avec des milliers de photos
- ✅ Fallback sur les fichiers si la DB est indisponible

## Étapes à suivre

### 1. Configuration de la DB

Vous avez déjà une DB PostgreSQL sur Railway:
```
postgresql://postgres:sfobzalOXkHOLvwEOJBXsfchOpvZUOjF@postgres-4yt1.railway.internal:5432/railway
```

Ajouter à votre `.env.local`:
```
DATABASE_URL=postgresql://postgres:sfobzalOXkHOLvwEOJBXsfchOpvZUOjF@postgres-4yt1.railway.internal:5432/railway
BACKEND_URL=http://localhost:3001
```

### 2. Exécuter les migrations

```bash
cd server
npm install
npm run migration:run
```

### 3. Importer les photos existantes

```bash
cd server
npm run import:photos
```

Cela va:
- Lire tous les fichiers `photos.json` depuis `public/photos/[folder]/`
- Créer les réseaux manquants
- Importer chaque photo dans PostgreSQL

### 4. Tester en local

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm run dev
```

Visiter `http://localhost:3000` pour tester.

### 5. Déployer sur Railway

Push vos changements:
```bash
git add .
git commit -m "feat: migration PostgreSQL pour les photos"
git push origin main
```

Railway va:
1. Compiler le projet
2. Créer les migrations DB automatiquement
3. Déployer l'application

## API Endpoints (Backend)

### Lire les photos récentes
```
GET /api/photos/latest?limit=20
```
Retourne un tableau de `LatestItem` (format utilisé par le frontend).

### Supprimer une photo
```
DELETE /api/photos/:networkSlug/:photoId
```
Supprime:
- La ligne de la DB
- Le fichier physique du disque

### Récupérer les photos d'un réseau
```
GET /api/photos/:networkSlug
```

## Fallback

Si la DB est indisponible, le système retombe automatiquement sur la lecture des fichiers JSON. Cela garantit que le site reste accessible même en cas de panne DB.

## Schéma de la table `photos`

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  displayTitle VARCHAR,
  img VARCHAR NOT NULL,
  src VARCHAR NOT NULL,         -- /photos/folder/filename.jpg
  slug VARCHAR NOT NULL,         -- ratp, rer, etc.
  brand VARCHAR,                 -- Marque du bus
  model VARCHAR,                 -- Modèle du bus
  date VARCHAR,
  desc TEXT,
  displayDesc TEXT,
  "order" INTEGER DEFAULT 0,
  networkId UUID NOT NULL,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (networkId) REFERENCES networks(id) ON DELETE CASCADE,
  INDEX (slug)
);
```

## Prochaines étapes

Une fois PostgreSQL en place, vous pouvez:
1. ✅ Supprimer proprement les photos (avec suppression du fichier)
2. Ajouter un système d'édition en ligne (titres, descriptions, etc.)
3. Implémenter un système de votes/favoris
4. Ajouter des filtres avancés
