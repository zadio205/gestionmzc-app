# Structure du Code Source

## 📁 Organisation des Dossiers

### `/cache` - Système de Cache Unifié
- `BaseCache.ts` - Classe abstraite pour tous les types de cache
- `CacheFactory.ts` - Factory pour créer des instances de cache
- `MemoryCache.ts` - Cache en mémoire rapide
- `LocalStorageCache.ts` - Cache persistant local
- `SupabaseCache.ts` - Cache distant Supabase
- `unified/BalanceCache.ts` - Cache optimisé pour les balances

### `/components` - Composants React
- `ui/` - Composants UI réutilisables (Button, Input, Card...)
- `ledgers/` - Composants de gestion des grand livres
  - `shared/` - Composants partagés (LedgerTable, LedgerHeader...)
  - `client/` - Composants spécifiques au ledger client
  - `supplier/` - Composants spécifiques au ledger fournisseur
  - `miscellaneous/` - Composants pour les écritures diverses
  - `balance/` - Composants de balance comptable
- `dashboard/` - Widgets et composants de dashboard
- `layout/` - Composants de mise en page

### `/repositories` - Pattern Repository
- `BaseRepository.ts` - Repository de base avec CRUD complet
- `ClientLedgerRepository.ts` - Repository spécialisé pour les clients

### `/services` - Logique Métier
- `dashboardService.ts` - Service optimisé pour les dashboards
- `optimizedBalanceService.ts` - Service de balance avec cache
- `clientLedgerService.ts` - Logique métier du ledger client
- `aiService.ts` - Service d'intelligence artificielle

### `/hooks` - Hooks React Optimisés
- `useDashboardData.ts` - Hook avec chargement parallèle
- `useClientLedgerState.ts` - Hook d'état du ledger client

### `/types` - Définitions TypeScript
- `index.ts` - Types principaux
- `auth.ts` - Types d'authentification
- `accounting.ts` - Types comptables
- `ledger.ts` - Types de grand livre

### `/utils` - Utilitaires
- `formatters.ts` - Formatage de données (monnaie, dates...)
- `inputValidation.ts` - Validation des entrées
- `csvSanitizer.ts` - Nettoyage des fichiers CSV

## 🎯 Recommandations

### Pour les nouveaux développements :
1. **Utiliser le nouveau système de cache** via `CacheFactory`
2. **Préférer les repositories** aux appels API directs
3. **Utiliser les composants partagés** dans `components/ledgers/shared/`
4. **Suivre les patterns établis** dans les services existants

### Imports recommandés :
```typescript
// Import depuis le point d'entrée central
import { clientLedgerRepository, optimizedBalanceService } from '@/index';

// Import spécifique pour les composants
import { LedgerTable, LedgerHeader } from '@/ledgers/shared';

// Import pour le cache
import { createCacheFromPreset } from '@/cache';
```

### À éviter :
- Les anciens fichiers de cache (`balanceLocalCache*`, `ledgerCache*`)
- Les appels API directs dans les composants
- La création de composants dupliqués

## 🔄 Migration en cours

Les éléments suivants sont en migration vers la nouvelle structure :
- Anciens hooks de balance → `optimizedBalanceService`
- Anciens services API → `repositories`
- Anciens composants modal-pages → `components/ledgers/*`