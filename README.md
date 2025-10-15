# Masyzarac - Application de Gestion Comptable

Application web de gestion comptable et documentaire développée avec Next.js, TypeScript et Supabase.

## 🚀 Fonctionnalités

### Authentification et Gestion des Utilisateurs
- ✅ Système d'authentification avec Supabase Auth
- ✅ Gestion des rôles (Admin, Collaborateur, Client)
- ✅ Inscription et connexion sécurisées
- ✅ Sessions utilisateur persistantes

### Tableaux de Bord
- ✅ Tableau de bord Admin (gestion globale)
- ✅ Tableau de bord Collaborateur (gestion des clients)
- ✅ Tableau de bord Client (accès aux services)
- ⏳ Tableaux de bord personnalisés par client

### Gestion Documentaire (GED)
- ⏳ Upload et stockage de documents
- ⏳ Catégorisation des documents
- ⏳ Recherche et filtrage
- ⏳ Gestion des permissions d'accès

### Messagerie et Communication
- ⏳ Chat en temps réel entre collaborateurs et clients
- ⏳ Notifications de nouveaux messages
- ⏳ Historique des conversations

### Outils Comptables
- ⏳ Module Balance comptable
- ⏳ Simulateur de charges sociales
- ⏳ Génération de rapports

## 🛠️ Technologies Utilisées

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **UI Components**: Headless UI, Heroicons
- **Validation**: Zod, React Hook Form

## 📦 Installation

1. Cloner le repository
```bash
git clone <repository-url>
cd masyzarac
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.local.example .env.local
```

Modifier le fichier `.env.local` avec vos configurations :
```env
NEXT_PUBLIC_SUPABASE_URL=votre-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-supabase
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-supabase
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

4. Configurer Supabase
- Créer un projet sur [supabase.com](https://supabase.com)
- Exécuter les scripts SQL dans le dossier `scripts/`
- Configurer les RLS (Row Level Security) policies

5. Lancer l'application en développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🏗️ Structure du Projet

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   ├── auth/              # Pages d'authentification
│   ├── admin/             # Interface administrateur
│   ├── collaborateur/     # Interface collaborateur
│   └── client/            # Interface client
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   ├── auth/             # Composants d'authentification
│   ├── dashboard/        # Composants de tableau de bord
│   └── ...
├── lib/                  # Utilitaires et configurations
├── lib/                  # Utilitaires et configurations Supabase
├── services/             # Services métier
└── types/                # Types TypeScript
└── types/                # Types TypeScript
```

## 🔐 Rôles et Permissions

### Administrateur
- Gestion complète des utilisateurs
- Supervision de tous les clients
- Accès à tous les documents
- Génération de rapports globaux

### Collaborateur
- Gestion des clients assignés
- Upload et gestion des documents clients
- Communication avec les clients
- Utilisation des outils comptables

### Client
- Accès à ses propres documents
- Communication avec son collaborateur
- Consultation de ses données comptables

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connecter le repository à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Supabase
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Configurer les tables avec les scripts SQL dans `scripts/`
3. Mettre à jour les variables d'environnement Supabase

#### Rôles via variables d'environnement (optionnel)

Pour promouvoir automatiquement certains emails en administrateur ou collaborateur après connexion, définissez ces variables publiques (exposées au client) sur votre plateforme d'hébergement ou dans `.env.local`:

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@masyzarac.com,autre.admin@exemple.com
NEXT_PUBLIC_COLLABORATEUR_EMAILS=collaborateur@masyzarac.com
```

Ces listes sont utilisées côté client pour surclasser le rôle issu de Supabase (metadata), avec priorité: admin > collaborateur > client.

## 📝 Prochaines Étapes

1. **Tableaux de bord personnalisés** - Implémenter des tableaux de bord spécifiques par client
2. **Système de GED complet** - Upload, catégorisation et recherche de documents
3. **Messagerie temps réel** - Chat avec Socket.IO
4. **Outils comptables avancés** - Balance et simulateur social
5. **Notifications** - Système de notifications en temps réel
6. **Tests** - Tests unitaires et d'intégration
7. **Documentation API** - Documentation complète des endpoints

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.# gestionmzc-app
# gestionmzc-app
