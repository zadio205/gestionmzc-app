#!/usr/bin/env node

/**
 * Script d'initialisation des profils
 * Crée les profils manquants avec les bons rôles
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function initProfiles() {
  console.log('🚀 Initialisation des profils\n');

  try {
    // Récupérer tous les utilisateurs
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Erreur:', usersError.message);
      return false;
    }

    console.log(`📋 ${users.length} utilisateur(s) trouvé(s):\n`);

    // Afficher les utilisateurs
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id})`);
    });

    console.log('\n');

    // Demander quel utilisateur doit être super admin
    const superAdminEmail = await question('📧 Email du super admin: ');
    const superAdminUser = users.find(u => u.email === superAdminEmail);

    if (!superAdminUser) {
      console.error('❌ Utilisateur non trouvé');
      rl.close();
      return false;
    }

    console.log('\n🔧 Création des profils...\n');

    // Créer le profil super admin
    const { error: superAdminError } = await supabase
      .from('profiles')
      .upsert({
        id: superAdminUser.id,
        role: 'superadmin',
        full_name: superAdminUser.email.split('@')[0],
        admin_id: null,
        metadata: {},
      });

    if (superAdminError) {
      console.error('❌ Erreur création super admin:', superAdminError.message);
      rl.close();
      return false;
    }

    console.log(`✅ Super admin créé: ${superAdminUser.email}`);

    // Créer les autres profils en tant qu'admin
    for (const user of users) {
      if (user.id === superAdminUser.id) continue;

      const { error: userError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: 'admin',
          full_name: user.email.split('@')[0],
          admin_id: null, // admin n'a pas de parent
          metadata: {},
        });

      if (userError) {
        console.error(`❌ Erreur pour ${user.email}:`, userError.message);
      } else {
        console.log(`✅ Admin créé: ${user.email}`);
      }
    }

    console.log('\n✅ Initialisation terminée!\n');
    
    // Afficher le résumé
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role, full_name');

    if (profiles) {
      console.log('📊 Résumé:');
      const counts = profiles.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
      }, {});

      Object.entries(counts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });
    }

    rl.close();
    return true;

  } catch (error) {
    console.error('❌ Erreur:', error);
    rl.close();
    return false;
  }
}

// Exécution
initProfiles()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
