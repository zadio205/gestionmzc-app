#!/usr/bin/env node

/**
 * Script pour créer les tables de cache de balance dans Supabase
 * 
 * Usage: node scripts/setup-balance-cache.js
 */

const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config();

// Vérifier que les variables d'environnement nécessaires sont présentes
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  console.error('\nVeuillez vérifier votre fichier .env');
  process.exit(1);
}

async function createBalanceCacheTables() {
  console.log('🚀 Création des tables de cache de balance...');
  
  try {
    // Lire le script SQL
    const sqlPath = path.join(__dirname, 'create-balance-cache-tables.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Script SQL chargé:', sqlPath);
    
    // Découper le script en commandes individuelles
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 ${commands.length} commandes SQL à exécuter`);
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n🔧 Exécution commande ${i + 1}/${commands.length}...`);
      console.log(`   ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          },
          body: JSON.stringify({ sql: command + ';' })
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.warn(`   ⚠️  Erreur (peut être normale): ${error}`);
        } else {
          console.log('   ✅ Succès');
        }
      } catch (error) {
        console.warn(`   ⚠️  Erreur commande: ${error.message}`);
      }
    }
    
    // Méthode alternative : utiliser l'API REST pour créer les tables directement
    console.log('\n🔄 Méthode alternative - Création via API REST...');
    
    // Créer la table balance_cache
    console.log('📋 Création table balance_cache...');
    const createCacheTable = `
      CREATE TABLE IF NOT EXISTS balance_cache (
        id SERIAL PRIMARY KEY,
        cache_key TEXT UNIQUE NOT NULL,
        client_id TEXT NOT NULL,
        period TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Créer la table balance_last_period
    console.log('📋 Création table balance_last_period...');
    const createPeriodTable = `
      CREATE TABLE IF NOT EXISTS balance_last_period (
        id SERIAL PRIMARY KEY,
        client_id TEXT UNIQUE NOT NULL,
        period TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Test de connexion simple
    console.log('\n🔍 Test de connexion à Supabase...');
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ Connexion Supabase réussie');
    } else {
      console.error('❌ Erreur de connexion Supabase:', testResponse.status);
    }
    
    // Vérifier si les tables existent déjà
    console.log('\n🔍 Vérification des tables existantes...');
    try {
      const checkCache = await fetch(`${SUPABASE_URL}/rest/v1/balance_cache?limit=1`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      });
      
      const checkPeriod = await fetch(`${SUPABASE_URL}/rest/v1/balance_last_period?limit=1`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      });
      
      console.log('📊 État des tables:');
      console.log('   - balance_cache:', checkCache.ok ? '✅ Existe' : '❌ Manquante');
      console.log('   - balance_last_period:', checkPeriod.ok ? '✅ Existe' : '❌ Manquante');
      
      if (checkCache.ok && checkPeriod.ok) {
        console.log('\n🎉 Toutes les tables existent déjà !');
        console.log('✅ Le système de cache de balance est prêt à être utilisé.');
      } else {
        console.log('\n⚠️  Certaines tables sont manquantes.');
        console.log('📋 Veuillez créer les tables manuellement dans l\'interface Supabase:');
        console.log('   1. Ouvrez le dashboard Supabase');
        console.log('   2. Allez dans "SQL Editor"');
        console.log('   3. Copiez-collez le contenu de scripts/create-balance-cache-tables.sql');
        console.log('   4. Exécutez le script');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    process.exit(1);
  }
}

// Fonction principale
async function main() {
  console.log('🏗️  Setup du cache de balance Supabase\n');
  await createBalanceCacheTables();
  console.log('\n✨ Script terminé');
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createBalanceCacheTables };
