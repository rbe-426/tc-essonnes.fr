# ✅ Backend TCE Photos - Mise en place complète

## Structure créée

```
server/
├── src/
│   ├── entities/
│   │   ├── Network.ts      # Modèle réseau
│   │   ├── Photo.ts        # Modèle photo
│   │   ├── User.ts         # Modèle utilisateur
│   │   └── AuditLog.ts     # Logs audit
│   ├── routes/
│   │   ├── auth.ts         # Routes login/logout
│   │   ├── networks.ts     # Routes réseaux CRUD
│   │   └── photos.ts       # Routes photos CRUD
│   ├── middleware/
│   │   └── auth.ts         # JWT et authMiddleware
│   ├── database.ts         # Config TypeORM
│   └── index.ts            # Point d'entrée
├── package.json
├── tsconfig.json
├── .env.example
├── init.sql
└── README.md
```

## Installation et démarrage

### 1. Installer PostgreSQL
- Windows: https://www.postgresql.org/download/windows/
- macOS: `brew install postgresql@15`
- Linux: `sudo apt install postgresql`

### 2. Créer la base de données
```bash
createdb tce_photos
```

### 3. Installer les dépendances du serveur
```bash
cd server
npm install
```

### 4. Configurer .env
```bash
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL
```

### 5. Lancer le serveur
```bash
npm run dev
```

Le serveur démarre sur **http://localhost:3001**

## Endpoints disponibles

### 🔐 Authentification
```
POST   /api/auth/login      # Connexion (username, password)
GET    /api/auth/me         # Profil (JWT requis)
POST   /api/auth/logout     # Déconnexion
```

### 🌐 Réseaux
```
GET    /api/networks        # Lister tous
GET    /api/networks/:slug  # Un réseau
POST   /api/networks        # Créer (auth)
PUT    /api/networks/:slug  # Modifier (auth)
```

### 📸 Photos
```
GET    /api/photos/:networkSlug                    # Photos d'un réseau
GET    /api/photos/:networkSlug/:photoId           # Une photo
POST   /api/photos/:networkSlug                    # Ajouter (auth)
PUT    /api/photos/:networkSlug/:photoId           # Modifier (auth)
DELETE /api/photos/:networkSlug/:photoId           # Supprimer (auth)
```

## Authentification JWT

1. **Login**: Envoyer `username` et `password`
2. **Réponse**: Reçoit un `token` JWT
3. **Utilisation**: Header `Authorization: Bearer <token>`
4. **Expiration**: 7 jours (configurable)

## Base de données

**Tables créées automatiquement**:
- `networks` - Réseaux
- `photos` - Photos avec références réseau
- `users` - Utilisateurs avec rôles
- `audit_logs` - Historique des modifications

## Utilisateur admin par défaut

```
Username: w.belaidi
Password: Waiyl9134#
Role: admin
```

**Note**: Le hash bcrypt a été pré-généré dans init.sql

## Prochaines étapes

1. ✅ **Backend créé** - Express + PostgreSQL
2. ⏳ **Connecter le frontend** - Remplacer les appels API
3. ⏳ **Upload de photos** - Routes multipart/form-data
4. ⏳ **Migrations DB** - Versionner les schémas
5. ⏳ **Hébergement** - Railway, Render, ou VPS

## Variables d'environnement (fichier .env)

```env
# Serveur
PORT=3001
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tce_photos

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION=7d
```

## Tests rapides

```bash
# Test de santé
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"w.belaidi","password":"Waiyl9134#"}'

# Récupérer les réseaux
curl http://localhost:3001/api/networks
```

## Notes de développement

- **TypeORM synchronize**: `true` en dev, `false` en production
- **CORS**: Activé pour localhost:3000
- **Logging**: Activé en développement
- **Types**: TypeScript strict mode activé

Bon développement! 🚀
