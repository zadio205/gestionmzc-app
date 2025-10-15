#!/usr/bin/env node

/**
 * Script de vérification du système de rôles
 * 
 * Vérifie que tous les composants nécessaires sont en place
 * 
 * Usage:
 *   node scripts/check-roles-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification du système de rôles utilisateurs\n');

const checks = [];

// Fonction helper pour vérifier l'existence d'un fichier
function checkFile(filePath, name) {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  checks.push({
    name,
    status: exists ? '✅' : '❌',
    exists,
  });
  return exists;
}

// Fonction helper pour vérifier le contenu d'un fichier
function checkFileContent(filePath, searchString, name) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    checks.push({ name, status: '❌', exists: false });
    return false;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const hasContent = content.includes(searchString);
  checks.push({
    name,
    status: hasContent ? '✅' : '⚠️',
    exists: hasContent,
  });
  return hasContent;
}

console.log('📂 Vérification des fichiers...\n');

// 1. Script SQL
console.log('1. Script de base de données');
checkFile('scripts/create-profiles-table.sql', '  - Script SQL profiles');

// 2. Types TypeScript
console.log('\n2. Types TypeScript');
checkFile('src/types/auth.ts', '  - Types auth.ts');
checkFileContent('src/types/auth.ts', 'UserRole', '  - Type UserRole défini');
checkFileContent('src/types/auth.ts', 'ROLE_PERMISSIONS', '  - Matrice de permissions');

// 3. Services
console.log('\n3. Services');
checkFile('src/services/authService.ts', '  - Service authService.ts');
checkFileContent('src/services/authService.ts', 'createUser', '  - Fonction createUser');
checkFileContent('src/services/authService.ts', 'hasPermission', '  - Fonction hasPermission');

// 4. Hooks
console.log('\n4. Hooks React');
checkFile('src/hooks/useAuth.ts', '  - Hook useAuth.ts');
checkFile('src/hooks/usePermissions.ts', '  - Hook usePermissions.ts');
checkFileContent('src/hooks/useAuth.ts', 'fetchUserProfile', '  - Récupération profil');
checkFileContent('src/hooks/usePermissions.ts', 'hasPermission', '  - Vérification permissions');

// 5. Middleware
console.log('\n5. Middleware');
checkFile('src/middleware.ts', '  - Middleware.ts');
checkFileContent('src/middleware.ts', 'PROTECTED_ROUTES', '  - Routes protégées définies');

// 6. Composants
console.log('\n6. Composants');
checkFile('src/components/admin/UserManagement.tsx', '  - UserManagement');
checkFile('src/components/admin/UserCard.tsx', '  - UserCard');
checkFile('src/components/admin/CreateUserModal.tsx', '  - CreateUserModal');
checkFile('src/components/auth/ProtectedRoute.tsx', '  - ProtectedRoute');

// 7. Variables d'environnement
console.log('\n7. Configuration');
const envLocalExists = fs.existsSync('.env.local');
checks.push({
  name: '  - Fichier .env.local',
  status: envLocalExists ? '✅' : '❌',
  exists: envLocalExists,
});

if (envLocalExists) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  
  checks.push({
    name: '  - NEXT_PUBLIC_SUPABASE_URL',
    status: hasSupabaseUrl ? '✅' : '❌',
    exists: hasSupabaseUrl,
  });
  checks.push({
    name: '  - NEXT_PUBLIC_SUPABASE_ANON_KEY',
    status: hasAnonKey ? '✅' : '❌',
    exists: hasAnonKey,
  });
  checks.push({
    name: '  - SUPABASE_SERVICE_ROLE_KEY',
    status: hasServiceKey ? '✅' : '❌',
    exists: hasServiceKey,
  });
}

// 8. Documentation
console.log('\n8. Documentation');
checkFile('GUIDE_ROLES_UTILISATEURS.md', '  - Guide complet');
checkFile('QUICK_START_ROLES.md', '  - Démarrage rapide');

// Résumé
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ');
console.log('='.repeat(60));

const total = checks.length;
const passed = checks.filter(c => c.status === '✅').length;
const failed = checks.filter(c => c.status === '❌').length;
const warnings = checks.filter(c => c.status === '⚠️').length;

console.log(`Total des vérifications: ${total}`);
console.log(`✅ Réussies: ${passed}`);
console.log(`❌ Échouées: ${failed}`);
console.log(`⚠️  Avertissements: ${warnings}`);
console.log('='.repeat(60));

if (failed === 0 && warnings === 0) {
  console.log('\n🎉 Excellent ! Tous les composants sont en place.');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Exécutez le script SQL dans Supabase Dashboard');
  console.log('   2. Créez votre premier super admin');
  console.log('   3. Testez la création d\'utilisateurs');
  console.log('\n📖 Consultez QUICK_START_ROLES.md pour plus de détails\n');
} else if (failed === 0) {
  console.log('\n⚠️  Le système est installé mais nécessite quelques ajustements.');
  console.log('   Vérifiez les éléments marqués avec ⚠️');
} else {
  console.log('\n❌ Des composants essentiels sont manquants.');
  console.log('   Vérifiez les éléments marqués avec ❌');
  console.log('\n   Pour réinstaller, consultez GUIDE_ROLES_UTILISATEURS.md\n');
}

// Liste détaillée si des erreurs
if (failed > 0 || warnings > 0) {
  console.log('\n📋 Détails:');
  checks.forEach(check => {
    if (check.status !== '✅') {
      console.log(`${check.status} ${check.name}`);
    }
  });
  console.log('');
}

process.exit(failed > 0 ? 1 : 0);
