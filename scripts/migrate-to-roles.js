#!/usr/bin/env node

/**
 * Script de migration pour le système de rôles utilisateurs
 * 
 * Ce script aide à migrer les utilisateurs existants vers le nouveau système
 * en créant les profils manquants dans la table profiles
 * 
 * Usage:
 *   node scripts/migrate-to-roles.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateUsers() {
  console.log('🚀 Début de la migration des utilisateurs...\n');

  try {
    // 1. Récupérer tous les utilisateurs auth
    console.log('📥 Récupération des utilisateurs...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
    }

    console.log(`   ✅ ${users.length} utilisateurs trouvés\n`);

    // 2. Récupérer les profils existants
    console.log('📥 Vérification des profils existants...');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      throw new Error(`Erreur lors de la récupération des profils: ${profilesError.message}`);
    }

    const existingIds = new Set(existingProfiles.map(p => p.id));
    console.log(`   ✅ ${existingIds.size} profils existants\n`);

    // 3. Créer les profils manquants
    let created = 0;
    let skipped = 0;

    for (const user of users) {
      if (existingIds.has(user.id)) {
        console.log(`⏭️  Utilisateur ${user.email}: profil existe déjà`);
        skipped++;
        continue;
      }

      // Déterminer le rôle depuis les métadonnées ou par défaut
      const metadata = user.user_metadata || {};
      const role = metadata.role || 'client'; // Rôle par défaut

      console.log(`📝 Création du profil pour ${user.email}...`);

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          role: role,
          full_name: metadata.full_name || metadata.name || user.email.split('@')[0],
          admin_id: metadata.admin_id || null,
          client_id: metadata.client_id || null,
          avatar_url: metadata.avatar_url || null,
          metadata: metadata,
        });

      if (insertError) {
        console.error(`   ❌ Erreur: ${insertError.message}`);
      } else {
        console.log(`   ✅ Profil créé avec rôle: ${role}`);
        created++;
      }
    }

    // 4. Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(50));
    console.log(`Total utilisateurs:  ${users.length}`);
    console.log(`Profils créés:       ${created}`);
    console.log(`Profils existants:   ${skipped}`);
    console.log('='.repeat(50));

    if (created > 0) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('   1. Vérifiez les rôles attribués dans Supabase Dashboard');
      console.log('   2. Créez votre premier super admin avec:');
      console.log('      UPDATE public.profiles SET role = \'superadmin\', admin_id = NULL');
      console.log('      WHERE id = (SELECT id FROM auth.users WHERE email = \'votre-email@example.com\');');
    }

    console.log('\n✅ Migration terminée avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

// Fonction pour afficher les profils
async function listProfiles() {
  console.log('📋 Liste des profils:\n');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        full_name,
        admin_id,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (profiles.length === 0) {
      console.log('   Aucun profil trouvé');
      return;
    }

    profiles.forEach(profile => {
      console.log(`📌 ${profile.full_name || 'Sans nom'}`);
      console.log(`   Rôle: ${profile.role}`);
      console.log(`   Admin ID: ${profile.admin_id || 'N/A'}`);
      console.log(`   Créé le: ${new Date(profile.created_at).toLocaleDateString('fr-FR')}`);
      console.log('');
    });

    console.log(`Total: ${profiles.length} profil(s)\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  if (command === 'list') {
    await listProfiles();
  } else if (command === 'migrate' || !command) {
    await migrateUsers();
  } else {
    console.log('Usage:');
    console.log('  node scripts/migrate-to-roles.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  migrate (default) - Migrer les utilisateurs existants');
    console.log('  list              - Afficher la liste des profils');
  }
})();
