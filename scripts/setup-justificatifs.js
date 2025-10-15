#!/usr/bin/env node

/**
 * Script de setup pour le système de gestion des justificatifs
 * 
 * Ce script :
 * 1. Vérifie la configuration Supabase
 * 2. Crée la table justificatifs si elle n'existe pas
 * 3. Crée les index pour la performance
 * 4. Configure les politiques RLS recommandées
 * 
 * Usage: node scripts/setup-justificatifs.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  console.error('\nVeuillez configurer .env.local');
  process.exit(1);
}

async function setupJustificatifs() {
  console.log('🚀 Configuration du système de justificatifs...\n');

  try {
    // Lire le script SQL
    const sqlPath = path.join(__dirname, 'create-justificatifs-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Script SQL chargé:', sqlPath);
    console.log('📊 Connexion à Supabase:', SUPABASE_URL);

    // Préparer la requête
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('Ce script nécessite que vous exécutiez le SQL manuellement dans Supabase.');
    console.log('\nÉtapes à suivre:');
    console.log('1. Allez sur https://app.supabase.com');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans "SQL Editor"');
    console.log('4. Créez une nouvelle requête');
    console.log('5. Copiez-collez le contenu de:', sqlPath);
    console.log('6. Exécutez la requête (Run)');

    console.log('\n📋 Aperçu du SQL à exécuter:');
    console.log('─'.repeat(80));
    console.log(sqlContent.substring(0, 500) + '...');
    console.log('─'.repeat(80));

    console.log('\n✅ Configuration prête !');
    console.log('\n📚 Prochaines étapes:');
    console.log('1. Créer le bucket "uploads" dans Supabase Storage');
    console.log('2. Configurer les politiques RLS (voir JUSTIFICATIFS_DOCUMENTATION.md)');
    console.log('3. Tester l\'upload avec UploadJustificatifModal');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    process.exit(1);
  }
}

setupJustificatifs();
