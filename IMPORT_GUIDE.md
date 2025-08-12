# Guide d'importation des données comptables

## Vue d'ensemble

La fonctionnalité d'importation permet d'importer des données comptables depuis des fichiers Excel (.xlsx, .xls) ou CSV (.csv) dans les différentes sections :

- **Balance générale**
- **Grand livre des clients**
- **Grand livre des fournisseurs**
- **Grand livre des comptes divers**

## Formats de fichiers supportés

- **CSV** : Fichiers texte délimités par des virgules
- **Excel** : Fichiers .xlsx et .xls (support limité dans cette version de démonstration)

## Structure des fichiers d'importation

### 1. Balance générale

**Colonnes requises :**
- `N° Compte` : Numéro du compte comptable
- `Libellé` : Nom du compte
- `Débit` : Montant débiteur (nombre)
- `Crédit` : Montant créditeur (nombre)

**Exemple :**
```csv
N° Compte,Libellé,Débit,Crédit
101000,Capital social,0,50000
411000,Clients,25000,0
401000,Fournisseurs,0,15000
```

### 2. Grand livre des clients

**Colonnes requises :**
- `Date` : Date de l'écriture (format YYYY-MM-DD)
- `Nom Client` : Nom du client
- `Description` : Description de l'opération
- `Référence` : Référence de l'écriture
- `Débit` : Montant débiteur (nombre)
- `Crédit` : Montant créditeur (nombre)

**Colonnes optionnelles :**
- `N° Facture` : Numéro de facture

**Exemple :**
```csv
Date,Nom Client,Description,Référence,Débit,Crédit,N° Facture
2024-01-05,Client ABC,Facture de prestation,FAC-2024-001,1200,0,FAC-2024-001
2024-01-10,Client ABC,Règlement chèque,REG-001,0,1200,
```

### 3. Grand livre des fournisseurs

**Colonnes requises :**
- `Date` : Date de l'écriture (format YYYY-MM-DD)
- `Nom Fournisseur` : Nom du fournisseur
- `Description` : Description de l'opération
- `Référence` : Référence de l'écriture
- `Débit` : Montant débiteur (nombre)
- `Crédit` : Montant créditeur (nombre)

**Colonnes optionnelles :**
- `N° Facture` : Numéro de facture fournisseur

**Exemple :**
```csv
Date,Nom Fournisseur,Description,Référence,Débit,Crédit,N° Facture
2024-01-03,Fournisseur Alpha,Fournitures bureau,FALP-001,0,450,FALP-001
2024-01-08,Fournisseur Alpha,Règlement facture,REG-FALP-001,450,0,
```

### 4. Grand livre des comptes divers

**Colonnes requises :**
- `Date` : Date de l'écriture (format YYYY-MM-DD)
- `N° Compte` : Numéro du compte comptable
- `Libellé` : Nom du compte
- `Description` : Description de l'opération
- `Référence` : Référence de l'écriture
- `Débit` : Montant débiteur (nombre)
- `Crédit` : Montant créditeur (nombre)
- `Catégorie` : Catégorie du compte (Banque, Achats, Charges, Personnel, Services, Produits, etc.)

**Exemple :**
```csv
Date,N° Compte,Libellé,Description,Référence,Débit,Crédit,Catégorie
2024-01-02,512000,Banque,Virement initial capital,VIR-001,50000,0,Banque
2024-01-05,606000,Achats non stockés,Fournitures de bureau,ACH-001,150,0,Achats
```

## Comment importer des données

1. **Accédez à la section souhaitée** (Balance, Clients, Fournisseurs, ou Comptes divers)
2. **Cliquez sur le bouton "Importer"** (bouton vert avec icône d'upload)
3. **Sélectionnez votre fichier** :
   - Glissez-déposez le fichier dans la zone prévue
   - Ou cliquez pour ouvrir l'explorateur de fichiers
4. **Vérifiez l'aperçu** des données importées
5. **Confirmez l'importation** si les données sont correctes

## Fonctionnalités de l'importation

### Validation des données
- Vérification de la présence des colonnes requises
- Validation des formats de données (dates, nombres)
- Indication des erreurs par ligne

### Aperçu avant importation
- Affichage des données à importer
- Statut de validation pour chaque ligne
- Possibilité d'annuler avant confirmation

### Identification des données importées
- Les données importées sont marquées avec un fond coloré
- Affichage de l'index d'origine du fichier (numéro de ligne)
- Distinction visuelle entre données existantes et importées

### Gestion des erreurs
- Messages d'erreur explicites
- Indication des lignes problématiques
- Possibilité de corriger et réimporter

## Fichiers d'exemple

Des fichiers d'exemple sont disponibles dans le dossier `public/exemples/` :

- `balance-exemple.csv` : Exemple pour la balance générale
- `clients-exemple.csv` : Exemple pour le grand livre clients
- `fournisseurs-exemple.csv` : Exemple pour le grand livre fournisseurs
- `comptes-divers-exemple.csv` : Exemple pour les comptes divers

## Conseils d'utilisation

1. **Préparez vos données** selon le format attendu avant l'importation
2. **Utilisez des formats de date cohérents** (YYYY-MM-DD recommandé)
3. **Vérifiez les montants** (utilisez des points pour les décimales)
4. **Testez avec un petit échantillon** avant d'importer de gros volumes
5. **Sauvegardez vos données** avant toute importation importante

## Limitations actuelles

- Support Excel limité (utilisez CSV pour de meilleurs résultats)
- Pas de mise à jour automatique des données existantes
- Validation basique des formats de données
- Pas de gestion des doublons automatique

## Support technique

En cas de problème avec l'importation :
1. Vérifiez le format de votre fichier
2. Consultez les fichiers d'exemple
3. Assurez-vous que toutes les colonnes requises sont présentes
4. Contactez le support technique si le problème persiste