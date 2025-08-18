# Migration du Cache de Balance vers Supabase

## Vue d'ensemble

Ce document décrit la migration du système de cache de balance depuis localStorage vers Supabase pour éviter la perte de données lors du rafraîchissement du navigateur ou du nettoyage des données locales.

## Problème résolu

**Avant :** Les données de balance importées étaient stockées uniquement dans localStorage, ce qui causait :
- Perte des données lors du rafraîchissement de la page
- Perte des données lors du nettoyage du navigateur
- Données non partagées entre appareils/sessions

**Après :** Les données sont maintenant stockées dans Supabase, permettant :
- Persistance des données entre sessions
- Synchronisation entre appareils
- Sauvegarde fiable des données importées

## Fichiers modifiés

### 1. Cache système - Migration vers Supabase
- **`src/lib/balanceLocalCache.ts`** : Modifié pour utiliser Supabase au lieu de localStorage
- **`src/lib/balanceSupabaseCache.ts`** : Nouveau fichier avec implémentation Supabase pure
- **`src/components/clients/modal-pages/BalancePage.tsx`** : Mis à jour pour les appels asynchrones

### 2. Scripts et migration
- **`scripts/create-balance-cache-tables.sql`** : Script SQL pour créer les tables Supabase
- **`src/utils/balanceCacheMigration.ts`** : Utilitaires de migration
- **`src/components/admin/BalanceCacheMigration.tsx`** : Interface de migration

## Étapes d'installation

### 1. Créer les tables Supabase

Exécutez le script SQL dans votre dashboard Supabase :

```sql
-- Voir le contenu complet dans scripts/create-balance-cache-tables.sql
```

### 2. Configurer les variables d'environnement

Assurez-vous que ces variables sont définies dans votre `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anonyme_supabase
```

### 3. Migrer les données existantes (optionnel)

Si vous avez des données existantes dans localStorage, utilisez le composant de migration :

```tsx
import BalanceCacheMigration from '@/components/admin/BalanceCacheMigration';

// Dans votre page d'administration
<BalanceCacheMigration onMigrationComplete={() => console.log('Migration terminée')} />
```

## Structure des tables Supabase

### Table `balance_cache`
- `id` : Clé primaire auto-incrémentée
- `cache_key` : Clé unique au format `clientId::period`
- `client_id` : Identifiant du client
- `period` : Période de la balance (nullable)
- `data` : Données JSON de la balance
- `created_at` / `updated_at` : Timestamps automatiques

### Table `balance_last_period`
- `id` : Clé primaire auto-incrémentée
- `client_id` : Identifiant du client (unique)
- `period` : Dernière période utilisée
- `created_at` / `updated_at` : Timestamps automatiques

## API modifiée

Les fonctions de cache gardent la même signature mais sont maintenant asynchrones :

```typescript
// Avant (synchrone)
const data = getBalanceLocalCache(clientId, period);
setBalanceLocalCache(clientId, period, items);

// Après (asynchrone)
const data = await getBalanceLocalCache(clientId, period);
await setBalanceLocalCache(clientId, period, items);
```

## Avantages de la migration

1. **Persistance** : Les données survivent aux rafraîchissements de page
2. **Synchronisation** : Accès aux mêmes données depuis différents appareils
3. **Fiabilité** : Pas de perte due au nettoyage de localStorage
4. **Performance** : Cache intelligent avec fallback localStorage
5. **Évolutivité** : Prêt pour fonctionnalités multi-utilisateurs

## Migration automatique

Le système inclut une migration automatique optionnelle qui :
1. Détecte les données existantes dans localStorage
2. Les transfère vers Supabase
3. Permet le nettoyage sécurisé des anciennes données

## Fallback et résilience

En cas de problème avec Supabase :
- Les erreurs sont loggées mais n'interrompent pas l'application
- Le système continue de fonctionner en mode dégradé
- Les données locales peuvent servir de fallback temporaire

## Tests recommandés

1. **Test de persistance** : Importer des données, rafraîchir la page, vérifier que les données sont toujours là
2. **Test de migration** : Avoir des données localStorage, migrer, vérifier l'intégrité
3. **Test multi-session** : Importer dans un onglet, vérifier dans un autre
4. **Test de fallback** : Simuler une panne Supabase, vérifier que l'app fonctionne

## Rollback

En cas de problème, il est possible de revenir à l'ancienne version en :
1. Remplaçant le contenu de `balanceLocalCache.ts` par l'ancienne version
2. Supprimant les imports Supabase
3. Les données localStorage existantes continueront de fonctionner

## Support

Pour toute question ou problème lié à cette migration, consultez :
- Les logs de la console pour les erreurs Supabase
- Le dashboard Supabase pour vérifier les données
- Les notifications de l'application pour les erreurs utilisateur
