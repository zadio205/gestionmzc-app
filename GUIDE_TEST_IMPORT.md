# 🎯 Guide de test - Importation corrigée

## ✅ **Problème résolu**
Les fichiers importés s'affichent maintenant correctement avec tous les champs et l'index de ligne d'origine.

## 🧪 **Comment tester rapidement**

### 1. **Test avec bouton "Test"**
- Allez dans **Balance détaillée**
- Cliquez sur le bouton **"Test"** (bleu)
- Vérifiez que 2 lignes apparaissent avec les badges **"LIGNE #1"** et **"LIGNE #2"**

### 2. **Test avec fichiers CSV**
Les fichiers de test sont disponibles dans le dossier `public/` :

#### 📊 **Balance** : `test-balance-simple.csv`
```csv
N° Compte,Libellé,Débit,Crédit
201000,Frais d'établissement,5000,0
411000,Clients - Ventes,15000,0
401000,Fournisseurs,0,8000
512000,Banque,12000,0
```

#### 👥 **Clients** : `test-clients-simple.csv`  
```csv
Date,Nom Client,Description,Référence,Débit,Crédit
2024-01-05,Client ABC,Facture de prestation,FAC-001,1200,0
2024-01-10,Client ABC,Règlement,REG-001,0,1200
2024-01-15,Client XYZ,Facture conseil,FAC-002,800,0
```

#### 🏭 **Fournisseurs** : `test-fournisseurs-simple.csv`
```csv
Date,Nom Fournisseur,Description,Référence,Débit,Crédit
2024-01-03,Fournisseur Alpha,Facture fournitures,FALP-001,0,450
2024-01-08,Fournisseur Beta,Prestations,FBET-002,0,750
2024-01-12,Fournisseur Gamma,Matériel,FGAM-003,0,320
```

#### 📋 **Comptes divers** : `test-comptes-divers-simple.csv`
```csv
Date,N° Compte,Libellé,Description,Débit,Crédit,Catégorie
2024-01-02,512000,Banque,Virement initial,50000,0,Banque
2024-01-05,606000,Achats non stockés,Fournitures de bureau,150,0,Achats
2024-01-08,613000,Locations,Loyer janvier 2024,1200,0,Charges
2024-01-10,641000,Rémunérations personnel,Salaires janvier,3500,0,Personnel
```

## 🎨 **Ce que vous devez voir**

### ✅ **Données importées identifiables**
- **Fond coloré** : Vert (Balance), Bleu (Clients), Orange (Fournisseurs), Violet (Comptes divers)
- **Pastille colorée** animée à gauche du numéro de compte
- **Badge "LIGNE #X"** avec le numéro de ligne du fichier original

### ✅ **Tous les champs affichés**
- ✅ **N° Compte** : Ex. "201000"
- ✅ **Libellé** : Ex. "Frais d'établissement"  
- ✅ **Débit** : Ex. "5 000,00 €"
- ✅ **Crédit** : Ex. "8 000,00 €"
- ✅ **Solde** : Ex. "12 000,00 € (D)" ou "(C)"

### ✅ **Notifications**
- 🟢 **Succès** : "X éléments importés avec succès"
- 🔵 **Info** : "Données de test ajoutées" (bouton Test)
- 🔴 **Avertissement** : Si aucune donnée valide

## 🔧 **Debugging**
Si un problème persiste :
1. **Ouvrez la console** (F12)
2. **Cherchez les logs** commençant par 🔍, ✅, ❌
3. **Vérifiez** les données reçues et traitées

## 📁 **Accès aux fichiers de test**
Les fichiers sont dans : `public/test-*.csv`
- Téléchargez-les depuis : `http://localhost:3000/test-balance-simple.csv`
- Ou accédez directement au dossier `public/` du projet
