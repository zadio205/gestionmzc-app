# Guide d'intégration LLM pour l'analyse comptable

## Vue d'ensemble

Le composant `ClientsLedgerPage` intègre maintenant des fonctionnalités d'intelligence artificielle pour faciliter l'analyse des grands livres clients et la génération automatique de demandes de justificatifs.

## Fonctionnalités IA ajoutées

### 1. Analyse intelligente des écritures
- **Détection automatique** des factures non soldées
- **Identification** des paiements sans justificatifs
- **Signalement** des écritures suspectes (montants ronds, descriptions vagues)
- **Suggestions d'amélioration** basées sur l'analyse des patterns

### 2. Génération automatique de messages
- **Messages personnalisés** pour demander des justificatifs
- **Adaptation du ton** selon le type d'écriture (facture/paiement)
- **Contextualisation** avec les informations spécifiques du client
- **Fallback intelligent** vers des templates prédéfinis

### 3. Interface utilisateur améliorée
- **Panneau d'analyse** avec métriques visuelles
- **Sélection en lot** des écritures problématiques
- **Indicateurs de statut** pour chaque écriture
- **Historique des demandes** avec statut de suivi

## Options LLM disponibles (par ordre de recommandation)

### Option 1: Hugging Face Inference API (Gratuit)
```bash
# Créer un compte sur https://huggingface.co/
# Générer un token API gratuit
# Ajouter dans .env.local (ne jamais le committer) :
HUGGING_FACE_TOKEN=hf_votre_token_ici
```

> Important: Ne mettez jamais de token réel dans la documentation ni dans le code versionné. Utilisez des variables d'environnement (ex: `.env.local`, déjà ignoré par `.gitignore`). Si un token a été exposé, révoquez-le immédiatement dans votre compte Hugging Face et générez-en un nouveau.

**Avantages :**
- Complètement gratuit
- Pas d'installation locale requise
- Modèles pré-entraînés disponibles

**Inconvénients :**
- Limitations de débit
- Qualité variable selon les modèles
- Dépendance réseau

### Option 2: Ollama (Gratuit, local)
```bash
# Installation sur macOS
brew install ollama

# Démarrer le service
ollama serve

# Télécharger un modèle (ex: Llama 2)
ollama pull llama2

# Configurer dans .env.local :
OLLAMA_BASE_URL=http://localhost:11434
```

**Avantages :**
- Complètement gratuit
- Fonctionne hors ligne
- Contrôle total sur les données
- Modèles performants (Llama, Mistral, etc.)

**Inconvénients :**
- Nécessite installation locale
- Consomme des ressources système
- Temps de réponse plus lent

### Option 3: Serveur OpenAI‑compatible (gpt-oss, LM Studio, etc.)
Si vous disposez d’un serveur OpenAI‑compatible (par ex. gpt-oss) exposant l’endpoint `POST /v1/chat/completions`, vous pouvez le brancher sans code.

1) Variables d’environnement (`.env.local`)
```env
# URL de base vers votre serveur OpenAI‑compatible (ex: gpt-oss)
OPENAI_API_BASE=http://localhost:1234/v1

# Modèle par défaut à utiliser côté serveur
OPENAI_MODEL=gpt-oss-model-id

# Clé API (optionnelle si votre serveur n’en exige pas)
# OPENAI_API_KEY=sk-votre-cle-ici
```

2) Priorité et détection
- L’app détecte d’abord Ollama (local), puis un endpoint OpenAI‑compatible (si `OPENAI_API_BASE` ou `OPENAI_API_KEY` est défini), puis Hugging Face.

3) Test rapide (facultatif)
Assurez-vous que votre serveur répond sur `/v1/chat/completions` au format OpenAI. Exemple de requête JSON attendue :
```json
{
  "model": "gpt-oss-model-id",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Bonjour" }
  ]
}
```

4) Notes
- Si `OPENAI_API_KEY` n’est pas défini, l’app n’enverra pas l’entête Authorization.
- Personnalisez `OPENAI_MODEL` selon l’ID exposé par votre serveur.

### Option 3: OpenAI API (Payant)
```bash
# Ajouter dans .env.local :
OPENAI_API_KEY=your-api-key-here
```

**Avantages :**
- Très haute qualité
- Réponses rapides
- API stable et documentée

**Inconvénients :**
- Coût par utilisation
- Dépendance à un service externe

## Installation et configuration

### 1. Installer les dépendances
```bash
cd masyzarac
npm install
```

### 2. Configurer les variables d'environnement
Choisir une des options LLM ci-dessus et configurer le fichier `.env.local`.

### 3. Tester l'intégration
```bash
npm run dev
```

Naviguer vers le grand livre clients et tester :
1. Importer un fichier CSV/Excel
2. Cliquer sur "Analyse IA"
3. Sélectionner des écritures problématiques
4. Générer des demandes de justificatifs

## Utilisation des fonctionnalités

### Analyse automatique
1. **Ouvrir le grand livre clients**
2. **Cliquer sur "Analyse IA"** dans la barre d'outils
3. **Consulter les métriques** : factures non soldées, justificatifs manquants, écritures suspectes
4. **Lire les suggestions d'amélioration** générées par l'IA

### Génération de demandes
1. **Sélectionner les écritures** problématiques (cases à cocher)
2. **Cliquer sur "Demander justificatifs"**
3. **L'IA génère automatiquement** des messages personnalisés
4. **Réviser et envoyer** les demandes aux clients

### Actions en lot
- **Sélectionner factures non soldées** : sélectionne automatiquement toutes les factures impayées
- **Sélectionner paiements sans justif** : sélectionne les encaissements sans références claires
- **Sélectionner tout problématique** : combine les deux catégories précédentes

## Personnalisation des messages

Le service LLM peut être personnalisé en modifiant `src/services/llmService.ts` :

```typescript
// Modifier les prompts pour adapter le ton
private buildJustificationPrompt(context: AnalysisContext): string {
  return `Génère un message [VOTRE_STYLE] pour demander...`;
}

// Ajouter des règles d'analyse spécifiques
private performLocalAnalysis(description: string, amount: number) {
  // Vos règles métier spécifiques
}
```

## Sécurité et confidentialité

### Données sensibles
- Les données comptables ne sont **jamais stockées** par les services LLM externes
- Seuls les **contextes nécessaires** sont transmis (montants, descriptions génériques)
- Les **informations personnelles** sont automatiquement anonymisées

### Recommandations
1. **Utiliser Ollama** pour les données très sensibles (traitement local)
2. **Configurer des timeouts** appropriés pour éviter les blocages
3. **Monitorer l'utilisation** des APIs externes pour contrôler les coûts
4. **Tester régulièrement** les fallbacks en cas de panne des services

## Dépannage

### Problèmes courants

**L'analyse ne fonctionne pas :**
- Vérifier la configuration des variables d'environnement
- Contrôler la connectivité réseau (pour APIs externes)
- Consulter les logs de la console navigateur

**Messages génériques au lieu de personnalisés :**
- L'IA utilise automatiquement des templates de fallback
- Vérifier la validité du token API
- Contrôler les quotas d'utilisation

**Performance lente :**
- Ollama : vérifier les ressources système disponibles
- APIs externes : contrôler la latence réseau
- Considérer la mise en cache des réponses fréquentes

### Logs et debugging
```javascript
// Activer les logs détaillés dans llmService.ts
console.log('🤖 LLM Request:', prompt);
console.log('🤖 LLM Response:', response);
```

## Évolutions futures

### Fonctionnalités prévues
- **Analyse prédictive** des risques de non-paiement
- **Classification automatique** des types d'écritures
- **Détection de fraudes** basée sur les patterns
- **Rapports d'analyse** automatisés
- **Intégration avec d'autres modules** (fournisseurs, immobilisations)

### Améliorations techniques
- **Cache intelligent** des réponses LLM
- **Fine-tuning** des modèles sur données comptables
- **Interface de configuration** des règles d'analyse
- **API REST** pour intégrations externes

## Support

Pour toute question ou problème :
1. Consulter les logs de l'application
2. Vérifier la documentation des APIs LLM utilisées
3. Tester avec des données d'exemple
4. Contacter l'équipe de développement avec les détails de l'erreur