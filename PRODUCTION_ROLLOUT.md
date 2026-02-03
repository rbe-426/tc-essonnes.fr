# Plan d'action - PostgreSQL production

## Problème identifié
Les "Derniers Arrivages" affichent des photos supprimées parce que:
1. Les fichiers JSON ne sont pas synchronisés avec le disque
2. Le fallback JSON reste la source de vérité par défaut
3. Aucun mécanisme de suppression propre (fichier + JSON)

## Solution déployée

### 1. API Backend (source de vérité)
- ✅ `GET /api/photos/latest` - Lire depuis PostgreSQL
- ✅ `DELETE /api/photos/:networkSlug/:photoId` - Supprime fichier + DB
- ✅ Les données DB sont toujours cohérentes

### 2. Frontend (fallback intelligent)
- ✅ Essaye l'API backend d'abord
- ✅ Fallback sur JSON seulement si API échoue
- ✅ Logs de debug pour voir la source utilisée

### 3. Scripts de maintenance
- ✅ `npm run clean:photos` - Nettoie JSON des photos manquantes
- ✅ `npm run import:photos` - Migre JSON → PostgreSQL
- ✅ `npm run migration:run` - Crée les tables DB

## Étapes à faire maintenant

### Phase 1: Nettoyage immédiat (aujourd'hui)
```bash
cd server
npm run clean:photos    # Nettoie les JSON
npm run build
npm run migration:run   # Crée les tables (si pas déjà fait)
npm run import:photos   # Migre JSON → PostgreSQL
```

### Phase 2: Vérification en production
1. Vérifier que `https://tc-essonnes.fr` affiche les photos depuis la DB
2. Les logs Next.js doivent montrer `✓ Chargé depuis API`
3. Tester la suppression d'une photo via l'admin
4. Vérifier qu'elle disparaît immédiatement

### Phase 3: Endpoint de rechargement
Une fois la DB remplie, vous pouvez recharger le cache avec:
```bash
curl -X POST https://tc-essonnes.fr/api/admin/reload-photos \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Avantages de cette approche

✅ **Source de vérité unique** - La DB
✅ **Suppression propre** - Fichier + DB synchronisés
✅ **Aucun besoin de push** - Les changements sont immédiats
✅ **Fallback robuste** - Le site reste accessible même si la DB est down
✅ **Migration progressive** - Les deux systèmes coexistent temporairement

## Après: supprimer le fallback JSON

Une fois sûr que tout fonctionne:
```typescript
export async function getLatestPhotos(limit = 20): Promise<LatestItem[]> {
  // Plus de fallback JSON
  const fromAPI = await getFromAPI(limit);
  if (!fromAPI) throw new Error("Backend unavailable");
  return fromAPI;
}
```
