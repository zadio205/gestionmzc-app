# Guide de Démarrage - Masyzarac

## 🚀 Démarrage Rapide

### 1. Prérequis
- Node.js 18+ installé
- MongoDB installé et en cours d'exécution
- Git installé

### 2. Installation

```bash
# Cloner le projet (si depuis un repository)
git clone <repository-url>
cd masyzarac

# Installer les dépendances
npm install
```

### 3. Configuration

Créer le fichier `.env.local` à la racine du projet :

```env
# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/masyzarac
MONGODB_DB=masyzarac

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# JWT
JWT_SECRET=your-jwt-secret-here-change-this-in-production

# Email (optionnel pour les notifications)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@masyzarac.com

# Upload de fichiers
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Socket.IO
SOCKET_PORT=3001
```

### 4. Démarrer MongoDB

#### Sur macOS (avec Homebrew)
```bash
brew services start mongodb-community
```

#### Sur Ubuntu/Debian
```bash
sudo systemctl start mongod
```

#### Sur Windows
Démarrer le service MongoDB depuis les services Windows ou :
```bash
net start MongoDB
```

### 5. Initialiser la Base de Données

```bash
npm run init-db
```

Cette commande créera les utilisateurs de test suivants :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@masyzarac.com | admin123 |
| Collaborateur | collaborateur@masyzarac.com | collab123 |
| Client | client@masyzarac.com | client123 |

### 6. Démarrer l'Application

```bash
npm run dev
```

L'application sera accessible sur : `http://localhost:3000`

## 🔐 Première Connexion

1. Aller sur `http://localhost:3000`
2. Vous serez redirigé vers la page de connexion
3. Utiliser un des comptes de test créés ci-dessus
4. Vous serez redirigé vers le tableau de bord correspondant à votre rôle

## 🎯 Test des Fonctionnalités

### Test du Rôle Admin
1. Se connecter avec `admin@masyzarac.com` / `admin123`
2. Accéder au tableau de bord administrateur
3. Voir les options de gestion des utilisateurs, clients, documents et rapports

### Test du Rôle Collaborateur
1. Se connecter avec `collaborateur@masyzarac.com` / `collab123`
2. Accéder au tableau de bord collaborateur
3. Voir les options de gestion des clients, documents, messagerie et outils comptables

### Test du Rôle Client
1. Se connecter avec `client@masyzarac.com` / `client123`
2. Accéder au tableau de bord client
3. Voir les options d'accès aux documents, messagerie et outils comptables

## 🛠️ Développement

### Structure des Dossiers
```
masyzarac/
├── src/
│   ├── app/                 # Pages et API routes (App Router)
│   ├── components/          # Composants réutilisables
│   ├── lib/                # Utilitaires et configurations
│   ├── models/             # Modèles MongoDB/Mongoose
│   └── types/              # Types TypeScript
├── scripts/                # Scripts utilitaires
└── public/                 # Fichiers statiques
```

### Commandes Utiles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start

# Linting
npm run lint

# Réinitialiser la base de données
npm run init-db
```

## 🔧 Dépannage

### Problème de Connexion MongoDB
```bash
# Vérifier si MongoDB est en cours d'exécution
ps aux | grep mongod

# Redémarrer MongoDB
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod            # Linux
```

### Erreur de Variables d'Environnement
- Vérifier que le fichier `.env.local` existe
- Vérifier que toutes les variables requises sont définies
- Redémarrer le serveur de développement après modification

### Port Déjà Utilisé
```bash
# Trouver le processus utilisant le port 3000
lsof -ti:3000

# Tuer le processus
kill -9 <PID>
```

## 📚 Prochaines Étapes

1. **Personnaliser les tableaux de bord** selon vos besoins
2. **Implémenter la GED** pour la gestion des documents
3. **Ajouter la messagerie temps réel** avec Socket.IO
4. **Développer les outils comptables** (Balance, Simulateur)
5. **Configurer le déploiement** sur Vercel/Netlify + MongoDB Atlas

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs dans la console du navigateur
2. Vérifier les logs du serveur dans le terminal
3. Consulter la documentation MongoDB et Next.js
4. Créer une issue sur le repository du projet