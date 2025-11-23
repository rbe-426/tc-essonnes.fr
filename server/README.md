# TCE Photos Backend

Backend API pour la galerie photos TCE avec PostgreSQL et Express.

## Installation

### Prérequis
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Étapes

1. **Installer les dépendances**
```bash
cd server
npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL
```

3. **Créer la base de données PostgreSQL**
```bash
createdb tce_photos
# ou via pgAdmin
```

4. **Initialiser les tables** (TypeORM synchronize fait ça en dev)
```bash
npm run migration:run
```

5. **Lancer le serveur en développement**
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur (authentifié)
- `POST /api/auth/logout` - Déconnexion

### Réseaux
- `GET /api/networks` - Lister tous les réseaux
- `GET /api/networks/:slug` - Détails d'un réseau
- `POST /api/networks` - Créer un réseau (authentifié)
- `PUT /api/networks/:slug` - Modifier un réseau (authentifié)

### Photos
- `GET /api/photos/:networkSlug` - Photos d'un réseau
- `GET /api/photos/:networkSlug/:photoId` - Détails d'une photo
- `POST /api/photos/:networkSlug` - Ajouter une photo (authentifié)
- `PUT /api/photos/:networkSlug/:photoId` - Modifier une photo (authentifié)
- `DELETE /api/photos/:networkSlug/:photoId` - Supprimer une photo (authentifié)

## Variables d'environnement (.env)

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tce_photos

JWT_SECRET=your-secret-key-change-this
JWT_EXPIRATION=7d

NODE_ENV=development
```

## Architecture

```
src/
├── entities/      # Entités TypeORM (models)
├── routes/        # Routes API
├── middleware/    # Middlewares (auth, etc.)
├── database.ts    # Config TypeORM
└── index.ts       # Point d'entrée
```

## Déploiement

Pour la production :

1. Build TypeScript : `npm run build`
2. Lancer : `npm start`
3. Utiliser un `.env` sécurisé avec des valeurs de production
4. Changer `synchronize: false` dans database.ts
