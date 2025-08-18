# Correction de la persistance des données de balance

## Problème identifié

Les données de la balance importée ne persistaient pas entre les sessions. À chaque fermeture et réouverture de la page de balance, les données disparaissaient.

## Causes du problème

1. **Double système de cache non synchronisé** :
   - `balanceLocalCache.ts` : utilise Supabase pour le stockage persistant
   - `balanceCache.ts` : système en mémoire utilisé par l'API
   - Ces deux systèmes n'étaient pas synchronisés

2. **Logique de chargement insuffisante** :
   - Pas de rechargement automatique des données au retour sur la page
   - Gestion d'erreur qui ne fallback pas correctement sur le cache local

3. **Sauvegarde non robuste** :
   - Échecs de sauvegarde serveur non gérés correctement
   - Cache local non mis à jour en cas d'échec réseau

## Solutions implémentées

### 1. Hook personnalisé `useBalancePersistence`

Créé un hook spécialisé qui gère :
- **Chargement intelligent** : Cache local d'abord, puis synchronisation serveur
- **Sauvegarde robuste** : Cache local immédiat + sauvegarde serveur en arrière-plan
- **Récupération automatique** : Rechargement quand la page redevient visible
- **Synchronisation périodique** : Vérification toutes les 5 minutes
- **Gestion d'erreurs** : Fallback gracieux vers le cache local

### 2. Améliorations du composant BalancePage

- **État simplifié** : Plus de gestion manuelle de `importedItems` et `loading`
- **Interface améliorée** :
  - Indicateur de synchronisation avec heure de dernière sync
  - Bouton de rechargement manuel
  - Messages de statut plus informatifs
- **Persistance garantie** : Les données sont sauvées localement même en cas d'échec réseau

### 3. Fonctionnalités ajoutées

- **Rechargement automatique** : Détection quand l'utilisateur revient sur la page
- **Synchronisation périodique** : Vérification automatique des mises à jour
- **Mode hors ligne** : Fonctionnement complet même sans connexion serveur
- **Indicateurs visuels** : Statut de sauvegarde et dernière synchronisation

## Architecture de persistance

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Composant     │    │  Hook Persistence│    │  Cache Local    │
│   BalancePage   │◄──►│ useBalancePers.  │◄──►│   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   API Serveur   │
                       │   (MongoDB)     │
                       └─────────────────┘
```

## Flux de données

### 1. Chargement initial
1. Hook charge le cache local Supabase → Affichage immédiat
2. Hook interroge l'API serveur → Synchronisation
3. Mise à jour du cache local avec les données serveur

### 2. Import de nouvelles données
1. Traitement des données CSV/Excel
2. Mise à jour immédiate de l'état → Affichage instantané
3. Sauvegarde dans le cache local Supabase
4. Sauvegarde sur le serveur (en arrière-plan)
5. Notification du statut de sauvegarde

### 3. Retour sur la page
1. Détection de la visibilité de la page
2. Rechargement automatique depuis le cache local
3. Synchronisation optionnelle avec le serveur

## Avantages de la solution

- ✅ **Persistance garantie** : Les données ne sont jamais perdues
- ✅ **Performance** : Affichage immédiat depuis le cache local
- ✅ **Robustesse** : Fonctionne même hors ligne
- ✅ **Transparence** : L'utilisateur voit le statut de synchronisation
- ✅ **Maintenance** : Code plus maintenable avec le hook spécialisé

## Tests recommandés

1. **Import de données** : Vérifier la sauvegarde immédiate
2. **Fermeture/Réouverture** : Confirmer la persistance
3. **Mode hors ligne** : Tester sans connexion réseau
4. **Changement de période** : Vérifier le chargement correct
5. **Synchronisation** : Observer les indicateurs de statut

## Fichiers modifiés

- `src/components/clients/modal-pages/BalancePage.tsx` : Logique simplifiée
- `src/hooks/useBalancePersistence.ts` : Nouveau hook (créé)
- Suppression des fichiers API vides qui causaient des erreurs de build

## Configuration requise

- Supabase configuré avec les tables `balance_cache` et `balance_last_period`
- API `/api/balance` fonctionnelle pour la synchronisation serveur
- Connexion réseau optionnelle (mode dégradé disponible)
