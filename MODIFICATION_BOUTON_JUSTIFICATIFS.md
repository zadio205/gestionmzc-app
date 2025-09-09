# 📎 Remplacement Bouton Exporter → Ajouter des Justificatifs

## ✅ **MODIFICATION EFFECTUÉE**

### **Changement demandé :**
- Remplacer la fonctionnalité du bouton "Exporter" par "Ajouter des justificatifs" dans le mode compact

### **Modification appliquée :**

#### **1. Ajout de la nouvelle prop interface**
```typescript
interface ModernLedgerDisplayProps {
  // ... autres props
  onExport?: (entry: any) => void;
  onAddDocument?: (entry: any) => void;  // 🆕 NOUVEAU
  onSendRequest?: (entry: any) => void;
}
```

#### **2. Ajout dans la déstructuration des props**
```typescript
const ModernLedgerDisplay: React.FC<ModernLedgerDisplayProps> = ({
  // ... autres props
  onExport,
  onAddDocument,  // 🆕 NOUVEAU
  onSendRequest
}) => {
```

#### **3. Remplacement du bouton dans le mode compact**

**AVANT :**
```tsx
{onExport && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onExport(entry);
    }}
    className="p-1.5 rounded-md hover:bg-purple-50 hover:text-purple-600 text-gray-400 transition-colors"
    title="Exporter"
  >
    <Download className="w-4 h-4" />
  </button>
)}
```

**APRÈS :**
```tsx
{onAddDocument && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onAddDocument(entry);
    }}
    className="p-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
    title="Ajouter des justificatifs"
  >
    <Upload className="w-4 h-4" />
  </button>
)}
```

---

## 🎨 **DÉTAILS DE LA MODIFICATION**

### **Changements visuels :**
- **Icône** : `Download` → `Upload` (📥 vers ⬆️)
- **Couleur** : `purple` → `blue` (violet vers bleu)
- **Titre** : "Exporter" → "Ajouter des justificatifs"
- **Fonction** : `onExport` → `onAddDocument`

### **Couleurs de hover :**
- **Fond** : `hover:bg-purple-50` → `hover:bg-blue-50`
- **Texte** : `hover:text-purple-600` → `hover:text-blue-600`

### **Position :**
- **Mode Compact** : ✅ Modifié
- **Mode Cartes** : ⚠️ Non modifié (garde l'ancien bouton exporter)

---

## 🔧 **UTILISATION**

### **Pour les composants parents :**

**Avant :**
```tsx
<ModernLedgerDisplay
  entries={entries}
  onExport={(entry) => handleExport(entry)}
  // ... autres props
/>
```

**Maintenant :**
```tsx
<ModernLedgerDisplay
  entries={entries}
  onExport={(entry) => handleExport(entry)}        // Mode cartes
  onAddDocument={(entry) => handleAddDocument(entry)}  // Mode compact 🆕
  // ... autres props
/>
```

### **Fonction de callback attendue :**
```typescript
const handleAddDocument = (entry: any) => {
  // Logique pour ajouter des justificatifs à cette écriture
  console.log('Ajouter justificatifs pour:', entry);
  
  // Exemples d'actions possibles :
  // 1. Ouvrir un modal d'upload de fichiers
  // 2. Rediriger vers une page de justificatifs
  // 3. Afficher un sélecteur de documents
  // 4. Ouvrir l'explorateur de fichiers
};
```

---

## 🎯 **IMPACT ET COMPATIBILITÉ**

### **Mode Compact :**
- ✅ **Bouton remplacé** : Ajouter des justificatifs au lieu d'exporter
- ✅ **Icône cohérente** : Upload (⬆️) pour l'ajout de documents
- ✅ **Couleur différenciée** : Bleu pour distinguer de l'export

### **Mode Cartes :**
- ⚠️ **Non modifié** : Garde toujours le bouton "Exporter"
- ℹ️ **Raison** : Modification demandée uniquement pour le mode compact

### **Rétrocompatibilité :**
- ✅ **onExport** : Toujours disponible pour le mode cartes
- ✅ **Props optionnelles** : `onAddDocument?` ne casse pas l'existant
- ✅ **Composants existants** : Fonctionnent sans changement

---

## 🚀 **PROCHAINES ÉTAPES**

### **1. Implémentation de la fonction `onAddDocument`**
```typescript
// Dans le composant parent
const handleAddDocument = async (entry: any) => {
  try {
    // Option 1: Ouvrir un modal d'upload
    setUploadModalEntry(entry);
    setShowUploadModal(true);
    
    // Option 2: Déclencher un input file
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => uploadFiles(e.target.files, entry);
    input.click();
    
    // Option 3: Redirection vers page dédiée
    router.push(`/justificatifs/${entry._id}`);
    
  } catch (error) {
    console.error('Erreur ajout justificatifs:', error);
  }
};
```

### **2. Gestion des fichiers uploadés**
```typescript
const uploadFiles = async (files: FileList, entry: any) => {
  const formData = new FormData();
  
  Array.from(files).forEach(file => {
    formData.append('justificatifs', file);
  });
  
  formData.append('entryId', entry._id);
  
  const response = await fetch('/api/justificatifs/upload', {
    method: 'POST',
    body: formData
  });
  
  if (response.ok) {
    // Rafraîchir les données ou afficher succès
    refreshEntries();
    showNotification('Justificatifs ajoutés avec succès', 'success');
  }
};
```

### **3. Interface complète de gestion des justificatifs**
- **Liste des justificatifs** : Affichage des documents liés
- **Prévisualisation** : Vue rapide des fichiers
- **Suppression** : Retrait de justificatifs
- **Organisation** : Classement par catégories

---

## 🎉 **RÉSULTAT**

**LE BOUTON "EXPORTER" EN MODE COMPACT EST MAINTENANT "AJOUTER DES JUSTIFICATIFS" !**

- ✅ **Icône Upload** : Cohérente avec l'action d'ajout
- ✅ **Couleur bleue** : Différenciée et attrayante
- ✅ **Fonction dédiée** : `onAddDocument` pour la gestion des documents
- ✅ **Interface intuitive** : Plus logique pour la gestion documentaire
- ✅ **Prêt à l'usage** : Attendu une implémentation de la fonction callback

La modification améliore l'expérience utilisateur en offrant une action plus pertinente pour la gestion des justificatifs directement depuis la vue compacte ! 📎🚀
