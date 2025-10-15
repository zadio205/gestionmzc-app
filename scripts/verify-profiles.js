#!/usr/bin/env node

/**
 * Script de vérification de la table profiles
 * Vérifie que la table existe et contient les bons profils
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyProfiles() {
  console.log('🔍 Vérification de la table profiles...\n');

  try {
    // 1. Vérifier si la table existe
    console.log('1️⃣ Vérification de l\'existence de la table...');
    const { data: profiles, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ La table profiles n\'existe pas ou n\'est pas accessible:');
      console.error('   ', tableError.message);
      console.log('\n💡 Solution: Exécutez le script SQL create-profiles-table.sql dans le dashboard Supabase');
      console.log('   📄 Fichier: scripts/create-profiles-table.sql');
      return false;
    }

    console.log('✅ La table profiles existe\n');

    // 2. Compter les profils
    console.log('2️⃣ Comptage des profils...');
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError.message);
      return false;
    }

    console.log(`   📊 Nombre de profils: ${count || 0}\n`);

    // 3. Récupérer tous les utilisateurs auth
    console.log('3️⃣ Vérification des utilisateurs auth...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError.message);
      return false;
    }

    console.log(`   👥 Nombre d'utilisateurs auth: ${users.length}\n`);

    // 4. Vérifier la correspondance
    console.log('4️⃣ Vérification de la correspondance...');
    const missingProfiles = [];

    for (const user of users) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        missingProfiles.push(user);
      }
    }

    if (missingProfiles.length > 0) {
      console.log(`⚠️  ${missingProfiles.length} utilisateur(s) sans profil:\n`);
      for (const user of missingProfiles) {
        console.log(`   - ${user.email} (${user.id})`);
        console.log(`     Métadonnées: role=${user.user_metadata?.role || 'non défini'}`);
      }
      console.log('\n💡 Solution: Créer les profils manquants...');
      
      // Créer les profils manquants
      for (const user of missingProfiles) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            role: user.user_metadata?.role || 'client',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url,
            metadata: user.user_metadata || {},
          });

        if (insertError) {
          console.error(`   ❌ Erreur création profil pour ${user.email}:`, insertError.message);
        } else {
          console.log(`   ✅ Profil créé pour ${user.email}`);
        }
      }
    } else {
      console.log('✅ Tous les utilisateurs ont un profil\n');
    }

    // 5. Afficher un résumé des profils
    console.log('5️⃣ Résumé des profils par rôle:\n');
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('role, full_name, created_at');

    const roleCount = {
      superadmin: 0,
      admin: 0,
      collaborateur: 0,
      client: 0,
    };

    if (allProfiles) {
      allProfiles.forEach(p => {
        roleCount[p.role] = (roleCount[p.role] || 0) + 1;
      });

      console.log(`   👑 Super Admin:   ${roleCount.superadmin}`);
      console.log(`   🔧 Admin:         ${roleCount.admin}`);
      console.log(`   👨‍💼 Collaborateur: ${roleCount.collaborateur}`);
      console.log(`   👤 Client:        ${roleCount.client}`);
    }

    console.log('\n✅ Vérification terminée avec succès!');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  }
}

// Exécution
verifyProfiles()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
