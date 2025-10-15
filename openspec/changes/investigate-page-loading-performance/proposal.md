## Why
Les pages de l'application sont bloquées pendant le chargement et prennent beaucoup de temps à s'afficher, ce qui dégrade l'expérience utilisateur et peut indiquer des problèmes de performance critiques dans l'architecture actuelle.

## What Changes
- Analyser les goulots d'étranglement de performance dans le pipeline de chargement
- Identifier les causes des blocages de page (middleware, auth, data fetching)
- Optimiser les stratégies de chargement et de mise en cache
- Implémenter des états de chargement appropriés pour éviter les pages blanches
- **BREAKING**: Modifications possibles du middleware et des hooks d'authentification

## Impact
- Affected specs: performance, auth, dashboard
- Affected code: middleware.ts, useAuth.ts, useDashboardData.ts, layouts, pages de dashboard
- Critical user experience improvement needed for all user roles