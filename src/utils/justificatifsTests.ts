/**
 * Tests manuels pour le système de justificatifs
 * 
 * À exécuter dans la console du navigateur pour tester les fonctionnalités
 */

import { logger } from '@/utils/logger';

// ============================================
// 1. TEST: Vérifier la configuration
// ============================================
logger.info('=== TEST 1: Configuration ===', {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Non défini',
  BUCKET: process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'uploads'
});

// ============================================
// 2. TEST: Classement automatique
// ============================================
console.log('\n=== TEST 2: Classement automatique ===');

// Importer le service
import { JustificatifService } from '@/services/justificatifService';

// Test avec montants négatifs (achats)
logger.info('Category determination tests', {
  '-1500': JustificatifService.determineCategory(-1500),
  '-50': JustificatifService.determineCategory(-50),
  '-0.01': JustificatifService.determineCategory(-0.01),
  '2000': JustificatifService.determineCategory(2000),
  '100': JustificatifService.determineCategory(100),
  '0.01': JustificatifService.determineCategory(0.01),
  '0': JustificatifService.determineCategory(0)
});

// Résultats attendus:
// -1500 → achats
// -50 → achats
// 2000 → ventes
// 100 → ventes
// 0 → ventes

// ============================================
// 3. TEST: Validation des fichiers
// ============================================
logger.info('=== TEST 3: Validation des fichiers ===');

// Créer des objets File de test
const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
const jpgFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });
const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });

logger.info('File validation tests', {
  'PDF valide': JustificatifService.isValidFileType(pdfFile),
  'JPG valide': JustificatifService.isValidFileType(jpgFile),
  'TXT valide': JustificatifService.isValidFileType(txtFile),
  'PDF taille OK': JustificatifService.isValidFileSize(pdfFile),
  'Gros fichier taille OK': JustificatifService.isValidFileSize(bigFile)
});

// Résultats attendus:
// PDF valide: true
// JPG valide: true
// TXT valide: false
// PDF taille OK: true
// Gros fichier taille OK: false

// ============================================
// 4. TEST: Chemin de stockage
// ============================================
logger.info('=== TEST 4: Chemin de stockage ===');

const path1 = JustificatifService.getStoragePath('client123', 'achats', 'facture.pdf');
const path2 = JustificatifService.getStoragePath('client456', 'ventes', 'recu.jpg');

logger.info('Storage path tests', {
  'Chemin achats': path1,
  'Chemin ventes': path2
});

// Résultats attendus:
// Chemin achats: justificatifs/clients/client123/achats/facture.pdf
// Chemin ventes: justificatifs/clients/client456/ventes/recu.jpg

// ============================================
// 5. TEST: Formatage de taille
// ============================================
console.log('\n=== TEST 5: Formatage de taille ===');

console.log('500 bytes:', JustificatifService.formatFileSize(500));
console.log('1.5 Ko:', JustificatifService.formatFileSize(1536));
console.log('2.5 Mo:', JustificatifService.formatFileSize(2621440));

// Résultats attendus:
// 500 bytes: 500 o
// 1.5 Ko: 1.5 Ko
// 2.5 Mo: 2.5 Mo

// ============================================
// 6. TEST: Upload d'un fichier (async)
// ============================================
console.log('\n=== TEST 6: Upload d\'un fichier ===');
console.log('⚠️  Ce test nécessite un fichier réel et une authentification');

// Exemple de code pour tester (à adapter)
/*
async function testUpload() {
  try {
    // Créer un fichier de test
    const file = new File(['Test content'], 'test-facture.pdf', { type: 'application/pdf' });
    
    const result = await JustificatifService.uploadJustificatif({
      file,
      clientId: 'test_client_123',
      clientName: 'Client Test',
      entryId: 'test_entry_456',
      montant: -1500.00, // Doit aller dans achats
      reference: 'TEST-001',
      description: 'Test upload',
      dateEcriture: new Date(),
      uploadedBy: 'test_user',
      uploadedByName: 'Test User'
    });
    
    console.log('✅ Upload réussi:', result);
    console.log('Catégorie:', result.category);
    console.log('URL:', result.url);
  } catch (error) {
    console.error('❌ Erreur upload:', error);
  }
}

// Décommenter pour tester
// testUpload();
*/

// ============================================
// 7. TEST: Récupération des justificatifs (async)
// ============================================
console.log('\n=== TEST 7: Récupération des justificatifs ===');
console.log('⚠️  Ce test nécessite des données existantes');

/*
async function testGetJustificatifs() {
  try {
    // Récupérer tous les justificatifs d'un client
    const { achats, ventes } = await JustificatifService
      .getJustificatifsByClient('test_client_123');
    
    console.log('✅ Justificatifs récupérés:');
    console.log('Achats:', achats.length);
    console.log('Ventes:', ventes.length);
    
    // Récupérer avec filtres
    const filtered = await JustificatifService.getJustificatifs({
      clientId: 'test_client_123',
      category: 'achats',
      status: 'pending'
    });
    
    console.log('Filtrés (achats pending):', filtered.length);
  } catch (error) {
    console.error('❌ Erreur récupération:', error);
  }
}

// Décommenter pour tester
// testGetJustificatifs();
*/

// ============================================
// 8. TEST: API Endpoints
// ============================================
console.log('\n=== TEST 8: API Endpoints ===');

/*
// Test GET /api/justificatifs
async function testGetAPI() {
  const response = await fetch('/api/justificatifs?clientId=test_client_123');
  const data = await response.json();
  console.log('GET /api/justificatifs:', data);
}

// Test POST /api/justificatifs
async function testPostAPI() {
  const response = await fetch('/api/justificatifs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'test.pdf',
      clientId: 'test_client_123',
      entryId: 'test_entry_456',
      category: 'achats',
      path: 'justificatifs/clients/test_client_123/achats/test.pdf',
      size: 1024,
      uploadedBy: 'test_user',
      type: 'application/pdf',
      provider: 'supabase',
      bucket: 'uploads',
      storageKey: 'test.pdf',
      mimeType: 'application/pdf'
    })
  });
  const data = await response.json();
  console.log('POST /api/justificatifs:', data);
}

// Décommenter pour tester
// testGetAPI();
// testPostAPI();
*/

// ============================================
// 9. CHECKLIST DE VALIDATION
// ============================================
console.log('\n=== CHECKLIST DE VALIDATION ===');

const checklist = [
  { item: 'Table justificatifs créée', check: '[ ]' },
  { item: 'Index créés', check: '[ ]' },
  { item: 'Bucket uploads créé', check: '[ ]' },
  { item: 'Politiques RLS configurées', check: '[ ]' },
  { item: 'Variables d\'environnement définies', check: '[ ]' },
  { item: 'Service JustificatifService fonctionne', check: '[ ]' },
  { item: 'API /api/justificatifs répond', check: '[ ]' },
  { item: 'Upload via modal fonctionne', check: '[ ]' },
  { item: 'GedViewer affiche les justificatifs', check: '[ ]' },
  { item: 'Classement automatique correct', check: '[ ]' },
  { item: 'Validation des fichiers fonctionne', check: '[ ]' },
  { item: 'Suppression fonctionne', check: '[ ]' },
  { item: 'Filtres et recherche fonctionnent', check: '[ ]' },
];

console.table(checklist);

// ============================================
// 10. RÉSUMÉ DES TESTS
// ============================================
console.log('\n=== RÉSUMÉ DES TESTS ===');
console.log(`
✅ Tests de base (1-5): Exécutables immédiatement
⚠️  Tests d'upload (6-8): Nécessitent:
   - Base de données configurée
   - Bucket Supabase créé
   - Utilisateur authentifié
   
📋 Pour valider complètement:
   1. Créer la table: scripts/create-justificatifs-table.sql
   2. Créer le bucket: Supabase Dashboard > Storage
   3. Configurer RLS: scripts/create-justificatifs-rls.sql
   4. Se connecter à l'application
   5. Tester l'upload via l'interface
   6. Vérifier dans GedViewer
`);

// ============================================
// EXPORT POUR UTILISATION DANS L'APP
// ============================================
export const JustificatifsTests = {
  testCategory: (montant: number) => JustificatifService.determineCategory(montant),
  testValidation: (file: File) => ({
    type: JustificatifService.isValidFileType(file),
    size: JustificatifService.isValidFileSize(file)
  }),
  testPath: (clientId: string, category: 'achats' | 'ventes', fileName: string) => 
    JustificatifService.getStoragePath(clientId, category, fileName),
  formatSize: (bytes: number) => JustificatifService.formatFileSize(bytes)
};
