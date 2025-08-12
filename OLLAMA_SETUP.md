# Configuration Ollama pour Masyzarac

## Qu'est-ce qu'Ollama ?

Ollama est un outil qui permet d'exécuter des modèles de langage (LLM) localement sur votre machine, gratuitement et sans connexion internet. Il améliore considérablement la qualité des messages générés automatiquement dans Masyzarac.

## Installation

### macOS

```bash
# Télécharger et installer Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Ou via Homebrew
brew install ollama
```

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows

Téléchargez l'installateur depuis [ollama.ai](https://ollama.ai/download/windows)

## Configuration pour Masyzarac

### 1. Démarrer Ollama

```bash
# Démarrer le service Ollama
ollama serve
```

Le service sera disponible sur `http://localhost:11434`

### 2. Télécharger un modèle recommandé

```bash
# Modèle léger et rapide (recommandé)
ollama pull llama2

# Ou modèle plus performant (plus lourd)
ollama pull mistral

# Ou modèle spécialisé en code
ollama pull codellama
```

### 3. Tester l'installation

```bash
# Tester avec une question simple
ollama run llama2 "Bonjour, peux-tu m'aider ?"
```

## Configuration dans Masyzarac

### Variables d'environnement (optionnel)

Ajoutez dans votre fichier `.env.local` :

```env
# URL d'Ollama (par défaut: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434

# Modèle préféré (par défaut: llama2)
OLLAMA_DEFAULT_MODEL=llama2
```

## Modèles recommandés

| Modèle | Taille | Performance | Usage |
|--------|--------|-------------|-------|
| `llama2` | ~4GB | Bon | Usage général, recommandé |
| `mistral` | ~4GB | Excellent | Meilleure qualité |
| `codellama` | ~4GB | Spécialisé | Code et technique |
| `neural-chat` | ~4GB | Conversationnel | Dialogue naturel |

## Utilisation dans Masyzarac

Une fois Ollama configuré, Masyzarac l'utilisera automatiquement pour :

- **Messages de justificatifs** : Génération de demandes personnalisées et professionnelles
- **Analyse d'écritures** : Détection d'anomalies dans les descriptions comptables  
- **Suggestions d'amélioration** : Recommandations pour optimiser la saisie

## Dépannage

### Ollama ne démarre pas

```bash
# Vérifier le statut
ollama list

# Redémarrer le service
pkill ollama
ollama serve
```

### Port déjà utilisé

```bash
# Changer le port d'Ollama
OLLAMA_HOST=0.0.0.0:11435 ollama serve
```

Puis mettre à jour `.env.local` :
```env
OLLAMA_BASE_URL=http://localhost:11435
```

### Modèle non trouvé

```bash
# Lister les modèles installés
ollama list

# Télécharger le modèle manquant
ollama pull llama2
```

## Mode dégradé

Si Ollama n'est pas disponible, Masyzarac fonctionne en **mode dégradé** :
- Utilise des templates prédéfinis pour les messages
- Analyse locale basique des écritures
- Suggestions génériques mais pertinentes

## Performance

### Optimisation

- **RAM recommandée** : 8GB minimum, 16GB idéal
- **Stockage** : 10GB d'espace libre pour les modèles
- **CPU** : Plus de cœurs = génération plus rapide

### Monitoring

```bash
# Surveiller l'utilisation
ollama ps

# Logs du service
ollama logs
```

## Sécurité

- Ollama fonctionne **entièrement en local**
- Aucune donnée n'est envoyée vers des serveurs externes
- Respect total de la confidentialité des données comptables

## Support

- Documentation officielle : [ollama.ai/docs](https://ollama.ai/docs)
- GitHub : [github.com/jmorganca/ollama](https://github.com/jmorganca/ollama)
- Communauté Discord : [discord.gg/ollama](https://discord.gg/ollama)