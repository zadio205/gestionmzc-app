# Instructions pour les Agents IA - Masyzarac

## Architecture et Technologies

**Stack Principal**: Next.js 15 + TypeScript + Supabase + Tailwind CSS
- App Router (Next.js 13+) dans `src/app/`
- Authentification via Supabase Auth (remplace l'ancien MongoDB/NextAuth)
- Stockage de données hybride : Supabase + cache local pour performances
- Interface multi-rôles : admin, collaborateur, client

## Authentification et Autorisation

**Système Supabase Auth** (`src/hooks/useAuth.ts`):
- Hook `useAuth()` central pour l'état utilisateur
- Rôles déterminés par `user_metadata.role` + surclassement via variables d'env publiques
- Variables `NEXT_PUBLIC_ADMIN_EMAILS` et `NEXT_PUBLIC_COLLABORATEUR_EMAILS` pour promotion automatique
- Redirection automatique selon rôle : `/{role}/dashboard`
- Middleware neutre (migration complète vers Supabase)

## Architecture de Cache et Persistance

**Système de Cache Hybride** critique pour performances:
- **Balance** : `src/lib/balanceRealCache.ts` - Cache direct Supabase avec fallback localStorage
- **Grand Livre** : `src/lib/{clientLedgerCache,supplierLedgerCache,miscLedgerCache}.ts`
- Migration automatique localStorage → Supabase via `src/components/admin/BalanceCacheMigration.tsx`
- Résolution dynamique des tables : `balance` ou `balance_cache` selon disponibilité

**Pattern de Cache**:
```typescript
// Standard dans tous les hooks métier
const loadFromCache = async () => {
  // 1. Tenter cache Supabase
  // 2. Fallback localStorage si échec
  // 3. Synchronisation différée avec serveur
}
```

## Structure des Composants

**Layout Multi-Rôles** (`src/components/layout/DashboardLayout.tsx`):
- Props : `userRole`, `userId`, `clientId?`
- Sidebar dynamique selon permissions (`src/components/ui/Sidebar.tsx`)
- Navigation contextualisée par rôle

**Pages Modales Réutilisables** (`src/components/clients/modal-pages/`):
- Pattern conteneur + page modale pour fonctionnalités métier
- Import/Export intégré avec validation CSV (`src/components/ui/FileImporter.tsx`)
- Système de notifications contextuelles (`src/contexts/NotificationContextSimple.tsx`)

## Hooks et Logique Métier

**Hooks de Données** standardisés :
- `useClientLedgerState`, `useSupplierLedgerState`, `useMiscLedgerState`
- Pattern : état local + cache + synchronisation serveur
- Import avec validation et transformation automatique
- Persistance automatique Supabase + gestion d'erreurs

**Hook Dashboard** (`src/hooks/useDashboardData.ts`):
- Données mockées pour démo avec interface TypeScript stricte
- Structure extensible pour intégration API future

## Patterns d'Import/Export

**Import CSV** standardisé :
- Mappage colonnes flexible dans `src/constants/clientLedgerConstants.ts`
- Validation avec `src/utils/csvSanitizer.ts`
- Déduplication par signature (`src/utils/ledgerDedup.ts`)
- Enrichissement IA optionnel via `src/services/aiAdapter.ts`

**Export Multi-Format** (`src/components/clients/modal-pages/ExportShareSystem.tsx`):
- PDF, Excel, CSV, HTML avec templates configurables
- Options d'inclusion : commentaires, analyses IA, justificatifs

## Conventions de Développement

**Structure de Fichiers**:
- Services dans `src/services/` pour logique métier pure
- Utils dans `src/utils/` pour fonctions utilitaires
- Constants dans `src/constants/` pour configuration
- Types centralisés dans `src/types/{index,accounting,ledger}.ts`

**Gestion d'État**:
- useState local pour UI temporaire
- Custom hooks pour logique métier persistante
- Context pour état global (notifications, auth)
- Cache Supabase pour persistance données métier

**Notifications**:
- `useNotification()` hook pour feedback utilisateur
- Types : success, error, warning, info avec durées configurables
- Positionnement automatique et gestion de pile

**Validation et Sécurité**:
- `InputValidator` class pour validation côté client (`src/utils/inputValidation.ts`)
- `CSVSanitizer` pour nettoyage données import (`src/utils/csvSanitizer.ts`)
- `PromptSanitizer` pour sécurisation inputs LLM
- Déduplication automatique par signature (`src/utils/ledgerDedup.ts`)

## Configuration de Déploiement

**Vercel (Recommandé)**:
1. Connecter repository GitHub
2. Variables d'environnement dans dashboard Vercel
3. Build automatique : `npm run build` (ESLint désactivé)
4. Images optimisées avec domaines Supabase autorisés

**Supabase Setup**:
1. Créer projet Supabase
2. Exécuter scripts SQL : `scripts/create-balance-cache-tables.sql`
3. Configurer RLS (Row Level Security) si nécessaire
4. Storage bucket pour uploads documents

**Tables Supabase Critiques**:
- `balance` ou `balance_cache` : persistance données balance
- `client_ledger`, `supplier_ledger`, `misc_ledger` : grands livres
- `balance_last_period` : dernières périodes utilisées
- Résolution dynamique de tables avec fallbacks

## Points d'Attention

**Migration de Stack**:
- MongoDB → Supabase en cours (modèles User.ts désactivés)
- APIs auth legacy désactivées (`src/app/api/auth/{login,register,logout}/route.ts`)
- Utiliser exclusivement Supabase Auth et les nouveaux patterns

**Performance**:
- Cache local obligatoire pour UX fluide
- Chargement asynchrone avec fallbacks
- Validation côté client avant persistance
- Pagination pour grandes listes

**Développement Local**:
- Mode dev : confirmation email automatique via `/api/auth/dev-confirm`
- Variables Supabase requises : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ESLint désactivé en build pour déploiement rapide

**Debugging et Diagnostics**:
- Console browser : logs LLM avec préfixes `🤖`
- DevTools : erreurs Supabase avec contexte détaillé
- Network tab : vérifier latence APIs externes
- Mode compact/cartes : tester interactions UI dans les deux modes

## Intégration Intelligence Artificielle

**Système LLM Multi-Provider** (`src/services/llmService.ts`):
- Priorité automatique : Ollama (local) → OpenAI (payant) → Hugging Face (gratuit)
- Variables configurables : `OLLAMA_BASE_URL`, `OPENAI_API_KEY`, `HUGGING_FACE_TOKEN`
- Fallback intelligent vers templates si aucun LLM disponible
- Endpoint OpenAI-compatible supporté via `OPENAI_API_BASE`

**Services IA Spécialisés**:
- `aiAdapter.ts` : Enrichissement automatique des écritures importées
- Analyse des descriptions, détection d'anomalies, génération de suggestions
- Génération de messages de justificatifs professionnels contextualisés
- Mode dégradé avec templates si LLM indisponible

## Scripts et Outils de Développement

**Setup et Migration**:
```bash
npm run dev                              # Développement local
npm run build                            # Build production
node scripts/setup-balance-cache.js      # Setup tables Supabase
node scripts/check-balance-tables.js     # Vérification état Supabase
```

**Tests et Debug** (mode développement uniquement):
- `/api/test-openai?live=1` : Test configuration OpenAI avec coût
- Console browser : `testBalancePersistence()` pour test cache
- Console browser : `checkBalancePersistenceStatus()` pour diagnostic
- Composant `OpenAITestWidget` dans dashboards admin

**Variables d'Environnement**:

*Essentielles*:
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` pour opérations serveur

*Rôles et Permissions*:
- `NEXT_PUBLIC_ADMIN_EMAILS` : promotion automatique admin
- `NEXT_PUBLIC_COLLABORATEUR_EMAILS` : promotion collaborateur

*IA et LLM (optionnelles)*:
- `OLLAMA_BASE_URL=http://localhost:11434` (Ollama local gratuit)
- `OPENAI_API_KEY` + `OPENAI_API_BASE` (OpenAI ou compatible)
- `HUGGING_FACE_TOKEN` (Hugging Face gratuit)

## Tests et Validation

**Utilities de Test** (`src/utils/testUtils.ts`):
- `ClientLedgerTestUtils.createMockEntries()` : données de test
- `ClientLedgerTestUtils.createProblematicEntries()` : cas problématiques
- Mock responses LLM pour tests sans API

**Tests de Persistance**:
- Validation automatique structure tables Supabase
- Test cycle complet insert/read/delete
- Vérification permissions et fallbacks

**Debug Components**:
- `BalanceCacheMigration` : migration localStorage → Supabase
- `OpenAITestWidget` : test configuration LLM temps réel
- Console hooks pour diagnostic données
