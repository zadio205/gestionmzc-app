# Installation de MongoDB

## macOS

### Avec Homebrew (Recommandé)
```bash
# Installer Homebrew si pas déjà fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Ajouter le tap MongoDB
brew tap mongodb/brew

# Installer MongoDB Community Edition
brew install mongodb-community

# Démarrer MongoDB
brew services start mongodb-community

# Vérifier que MongoDB fonctionne
brew services list | grep mongodb
```

### Installation Manuelle
1. Télécharger MongoDB depuis https://www.mongodb.com/try/download/community
2. Suivre les instructions d'installation pour macOS
3. Démarrer MongoDB avec `mongod`

## Ubuntu/Debian

```bash
# Importer la clé publique GPG
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Créer le fichier de liste pour MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Recharger la base de données des paquets
sudo apt-get update

# Installer MongoDB
sudo apt-get install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod

# Activer MongoDB au démarrage
sudo systemctl enable mongod

# Vérifier le statut
sudo systemctl status mongod
```

## Windows

1. Télécharger MongoDB Community Server depuis https://www.mongodb.com/try/download/community
2. Exécuter l'installateur MSI
3. Choisir "Complete" installation
4. Installer MongoDB Compass (optionnel, interface graphique)
5. MongoDB se lancera automatiquement comme service Windows

### Démarrage Manuel sur Windows
```cmd
# Démarrer le service
net start MongoDB

# Arrêter le service
net stop MongoDB
```

## Docker (Alternative)

Si vous préférez utiliser Docker :

```bash
# Démarrer MongoDB avec Docker
docker run --name mongodb -d -p 27017:27017 mongo:latest

# Arrêter le conteneur
docker stop mongodb

# Redémarrer le conteneur
docker start mongodb
```

## Vérification de l'Installation

Une fois MongoDB installé et démarré :

```bash
# Se connecter à MongoDB (optionnel)
mongosh

# Dans le shell MongoDB, tester :
> show dbs
> exit
```

## Configuration pour Masyzarac

Après l'installation de MongoDB, vous pouvez :

1. Démarrer MongoDB
2. Exécuter `npm run init-db` dans le projet Masyzarac
3. Démarrer l'application avec `npm run dev`

## Dépannage

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port 27017
lsof -ti:27017

# Tuer le processus si nécessaire
kill -9 <PID>
```

### Permissions (Linux/macOS)
```bash
# Créer le répertoire de données MongoDB
sudo mkdir -p /data/db

# Donner les permissions appropriées
sudo chown -R $(whoami) /data/db
```

### MongoDB ne démarre pas
1. Vérifier les logs : `/var/log/mongodb/mongod.log` (Linux) ou `/usr/local/var/log/mongodb/mongo.log` (macOS)
2. Vérifier l'espace disque disponible
3. Vérifier que le port 27017 n'est pas utilisé par un autre processus