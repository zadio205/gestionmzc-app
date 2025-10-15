## Context
L'application souffre de problèmes de performance critiques où les pages restent bloquées pendant le chargement. L'analyse initiale révèle plusieurs problèmes potentiels :
- Middleware faisant des requêtes base de données synchrones
- Hook useAuth avec des appels API séquentiels
- useDashboardData avec des setTimeout artificiels de 1 seconde
- Manque d'états de chargement appropriés
- Code non utilisé et imports superflus

## Goals / Non-Goals
- Goals: Réduire le temps de chargement des pages de 50%+, éliminer les pages blanches, améliorer l'expérience utilisateur
- Non-Goals: Refactor complet de l'architecture, migration vers un nouveau framework

## Decisions
- Decision: Conserver Next.js 15 App Router mais optimiser l'implémentation actuelle
- Decision: Implémenter un cache middleware pour les profils utilisateurs (TTL 5 minutes)
- Decision: Utiliser React Suspense pour le chargement progressif
- Decision: Paralléliser les requêtes de données indépendantes
- Decision: Remplacer les setTimeout par des vraies optimisations

## Alternatives considered
- Migration vers SSR complet: Trop complexe, impact trop élevé
- Utilisation de SWR/React Query: Ajouterait une dépendance significative
- Cache Redis: Sur-engineering pour le besoin actuel

## Risks / Trade-offs
- Cache middleware peut servir des données périmées (mitigé par TTL court)
- Suspense peut complexifier le débogage (mitigé par Error Boundaries)
- Optimisations peuvent masquer des problèmes sous-jacents (mitigé par monitoring)

## Migration Plan
1. Phase 1: Diagnostic et mesures baseline
2. Phase 2: Optimisations middleware (low risk)
3. Phase 3: Optimisations hooks (medium risk)
4. Phase 4: UX improvements (low risk)
5. Phase 5: Validation et monitoring

## Open Questions
- Quel niveau de cache est acceptable pour les données utilisateur?
- Comment gérer les rôles dynamiques avec cache?
- Faut-il implémenter un retry mechanism pour les requêtes échouées?