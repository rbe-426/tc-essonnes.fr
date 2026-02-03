# 🚀 Étapes de migration PostgreSQL en production

## 1. Exécuter les migrations sur Railway

```bash
# Via Railway CLI ou console
npm run migration:run
```

**Status attendu:**
- ✅ Création des tables (networks, photos, users, audit_logs)
- ✅ Ajout des colonnes (src, slug, brand, model)

Vérifier dans la DB:
```sql
SELECT COUNT(*) FROM photos;
SELECT COUNT(*) FROM networks;
```

## 2. Importer les photos depuis JSON

**Option A:** Via le site (recommandé)
- Allez à `https://tc-essonnes.fr`
- Cliquez sur "Importer photos" (navbar)
- Entrez le token admin
- Attendez la confirmation

**Option B:** Via API directe
```bash
curl -X POST https://tc-essonnes.fr/api/admin/import-photos \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
- Photos importées de `public/photos/[network]/photos.json`
- Métadonnées préservées (titre, description, brand, model)
- Les doublons sont ignorés

## 3. Vérifier les données

```bash
# Nombre de photos
curl https://tc-essonnes.fr/api/photos/latest?limit=1

# Photo de la semaine
curl https://tc-essonnes.fr/api/random-photo
```

## 4. Nettoyer les JSON (optionnel)

Si vous voulez supprimer complètement le fallback JSON:

```bash
npm run clean:photos
```

⚠️ **Important:** Les JSON seront toujours utilisés en fallback si l'API échoue. Ne les supprimez pas!

## ❓ Troubleshooting

### Les migrations ne trouvent pas la DB
- Vérifier `DATABASE_URL` sur Railway
- Vérifier la connexion: `psql $DATABASE_URL -c "SELECT 1"`

### L'import dit "zéro photos"
- Vérifier que les dossiers existent: `public/photos/[network]/`
- Vérifier les fichiers `photos.json` contiennent des données
- Vérifier les permissions du serveur

### L'API retourne 401 Unauthorized
- Vérifier le token admin dans `ADMIN_TOKEN` env var
- Vérifier que le token est passé dans l'header `Authorization: Bearer ...`

### Les "Derniers arrivages" affichent toujours les anciennes photos
1. Vérifier que `BACKEND_URL` en production pointe vers le bon serveur
2. Vérifier que les migrations ont été exécutées
3. Vérifier que l'import a été fait
4. Vérifier les logs du serveur: `heroku logs` ou console Railway

## 📋 Checklist finale

- [ ] Migrations exécutées: `npm run migration:run`
- [ ] Photos importées via `/api/admin/import-photos`
- [ ] `SELECT COUNT(*) FROM photos` retourne > 0
- [ ] `/api/photos/latest` retourne les bonnes photos
- [ ] Site affiche les bonnes photos
- [ ] Photo de la semaine est stable et correcte
