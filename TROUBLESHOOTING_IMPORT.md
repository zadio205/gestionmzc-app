# Guide de dépannage - Importation de données

## Problèmes courants et solutions

### 1. Les données ne s'affichent pas après l'importation

**Causes possibles :**
- Format de fichier incorrect
- Colonnes mal nommées
- Données invalides

**Solutions :**
1. **Vérifiez le format du fichier**
   - Utilisez uniquement des fichiers CSV (pas Excel pour cette version)
   - Assurez-vous que l'encodage est UTF-8

2. **Vérifiez les noms de colonnes**
   - Les noms doivent correspondre exactement aux exemples
   - Respectez les accents et la casse

3. **Vérifiez les données**
   - Les montants doivent être des nombres (utilisez des points pour les décimales)
   - Les dates doivent être au format YYYY-MM-DD

### 2. Erreur "Colonnes manquantes"

**Solution :**
Assurez-vous que votre fichier CSV contient toutes les colonnes requises :

**Pour la Balance :**
```
N° Compte,Libellé,Débit,Crédit
```

**Pour les Clients :**
```
Date,Nom Client,Description,Référence,Débit,Crédit
```

**Pour les Fournisseurs :**
```
Date,Nom Fournisseur,Description,Référence,Débit,Crédit
```

**Pour les Comptes Divers :**
```
Date,N° Compte,Libellé,Description,Référence,Débit,Crédit,Catégorie
```

### 3. Les montants ne s'affichent pas correctement

**Causes :**
- Utilisation de virgules au lieu de points pour les décimales
- Présence de caractères non numériques

**Solutions :**
- Utilisez des points (.) pour les décimales : `1234.56`
- Évitez les espaces et symboles monétaires : `1000` au lieu de `1 000 €`

### 4. Les dates ne sont pas reconnues

**Solution :**
Utilisez le format ISO : `YYYY-MM-DD`
- Correct : `2024-01-15`
- Incorrect : `15/01/2024` ou `15-01-2024`

### 5. Caractères spéciaux mal affichés

**Solution :**
Sauvegardez votre fichier CSV en UTF-8 :
- Excel : "Enregistrer sous" → "CSV UTF-8"
- LibreOffice : "Enregistrer sous" → Format "CSV" → Encodage "UTF-8"

## Fichiers de test

Utilisez ces fichiers pour tester l'importation :

### Balance (test-balance.csv)
```csv
N° Compte,Libellé,Débit,Crédit
101000,Capital social,0,50000
411000,Clients,25000,0
401000,Fournisseurs,0,15000
```

### Clients (test-clients.csv)
```csv
Date,Nom Client,Description,Référence,Débit,Crédit
2024-01-05,Client ABC,Facture de prestation,FAC-001,1200,0
2024-01-10,Client ABC,Règlement,REG-001,0,1200
```

## Vérification étape par étape

1. **Ouvrez la console du navigateur** (F12)
2. **Importez votre fichier**
3. **Vérifiez les messages de debug** :
   - "Headers trouvés:" doit afficher vos colonnes
   - "Lignes de données:" doit afficher vos données
   - "Données importées reçues:" doit afficher les données traitées

4. **Si les données n'apparaissent pas** :
   - Vérifiez qu'il n'y a pas d'erreurs dans la console
   - Assurez-vous que les lignes sont marquées comme "valides"

## Contact support

Si le problème persiste :
1. Ouvrez la console du navigateur (F12)
2. Reproduisez le problème
3. Copiez les messages d'erreur
4. Joignez votre fichier CSV de test
5. Contactez le support technique