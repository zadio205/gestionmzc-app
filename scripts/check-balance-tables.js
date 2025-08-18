#!/usr/bin/env node

/**
 * Script simple pour vérifier les tables de cache de balance dans Supabase
 * 
 * Usage: node scripts/check-balance-tables.js
 */

const fs = require('fs');
const path = require('path');

async function checkBalanceTables() {
  console.log('🔍 Vérification des tables de cache de balance...\n');
  
  // Lire le fichier .env pour obtenir l'URL Supabase
  let supabaseUrl = '';
  let supabaseKey = '';
  
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1];
      }
      if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseKey = line.split('=')[1];
      }
    }
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables d\'environnement manquantes dans .env:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
      return;
    }
    
    console.log('✅ Variables d\'environnement trouvées');
    console.log('📍 URL Supabase:', supabaseUrl);
    
  } catch (error) {
    console.error('❌ Erreur lecture .env:', error.message);
    return;
  }
  
  // Test de connexion
  console.log('\n🔗 Test de connexion à Supabase...');
  try {
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ Connexion Supabase réussie');
    } else {
      console.error('❌ Erreur de connexion Supabase:', testResponse.status);
      return;
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return;
  }
  
  // Vérifier les tables
  console.log('\n🔍 Vérification des tables...');
  
  try {
    // Test table balance_cache
    console.log('📋 Test table balance_cache...');
    const checkCache = await fetch(`${supabaseUrl}/rest/v1/balance_cache?limit=1`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
    // Test table balance_last_period
    console.log('📋 Test table balance_last_period...');
    const checkPeriod = await fetch(`${supabaseUrl}/rest/v1/balance_last_period?limit=1`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
    console.log('\n📊 État des tables:');
    console.log('   - balance_cache:', checkCache.ok ? '✅ Existe' : `❌ Manquante (${checkCache.status})`);
    console.log('   - balance_last_period:', checkPeriod.ok ? '✅ Existe' : `❌ Manquante (${checkPeriod.status})`);
    
    if (checkCache.ok && checkPeriod.ok) {
      console.log('\n🎉 Toutes les tables existent !');
      console.log('✅ Le système de cache de balance est prêt.');
    } else {
      console.log('\n⚠️  Certaines tables sont manquantes.');
      console.log('\n📋 Pour créer les tables manquantes:');
      console.log('   1. Ouvrez votre dashboard Supabase');
      console.log('   2. Allez dans "SQL Editor"');
      console.log('   3. Copiez-collez le contenu du fichier:');
      console.log('      scripts/create-balance-cache-tables.sql');
      console.log('   4. Exécutez le script');
      
      // Afficher le contenu du script SQL
      try {
        const sqlPath = path.join(__dirname, 'create-balance-cache-tables.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        console.log('\n📄 Contenu du script SQL à exécuter:');
        console.log('-------------------------------------------');
        console.log(sqlContent.substring(0, 500) + '...');
        console.log('-------------------------------------------');
      } catch (error) {
        console.log('❌ Impossible de lire le script SQL:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des tables:', error.message);
  }
}

// Exécuter le script
checkBalanceTables().then(() => {
  console.log('\n✨ Vérification terminée');
}).catch(error => {
  console.error('❌ Erreur:', error);
});
