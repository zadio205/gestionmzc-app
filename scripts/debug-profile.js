/**
 * Script de debug pour vérifier l'état d'un profil utilisateur
 * Usage: node scripts/debug-profile.js [user-id]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProfile(userId) {
  console.log('\n🔍 Diagnostic du profil utilisateur\n');
  console.log('═'.repeat(60));
  
  // 1. Vérifier auth.users
  console.log('\n1. Vérification dans auth.users:');
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  
  if (authError) {
    console.error('❌ Erreur:', authError.message);
    return;
  }
  
  if (!authUser) {
    console.error('❌ Utilisateur introuvable dans auth.users');
    return;
  }
  
  console.log('✓ Utilisateur trouvé:');
  console.log('  - ID:', authUser.user.id);
  console.log('  - Email:', authUser.user.email);
  console.log('  - Created:', authUser.user.created_at);
  console.log('  - Last sign in:', authUser.user.last_sign_in_at || 'Jamais');
  console.log('  - Metadata:', JSON.stringify(authUser.user.user_metadata, null, 2));
  
  // 2. Vérifier public.profiles
  console.log('\n2. Vérification dans public.profiles:');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    console.error('❌ Erreur:', profileError.message);
    
    if (profileError.code === 'PGRST116') {
      console.log('\n⚠️  PROFIL MANQUANT - Création nécessaire');
      console.log('\nPour créer le profil, exécutez:');
      console.log(`node scripts/create-missing-profile.js ${userId}`);
    }
    return;
  }
  
  if (!profile) {
    console.error('❌ Profil introuvable');
    return;
  }
  
  console.log('✓ Profil trouvé:');
  console.log('  - ID:', profile.id);
  console.log('  - Role:', profile.role);
  console.log('  - Full name:', profile.full_name || '(non défini)');
  console.log('  - Admin ID:', profile.admin_id || '(null)');
  console.log('  - Client ID:', profile.client_id || '(null)');
  console.log('  - Created:', profile.created_at);
  console.log('  - Updated:', profile.updated_at);
  
  // 3. Vérifier les permissions RLS
  console.log('\n3. Test de lecture avec clé publique (simulation client):');
  const supabasePublic = createClient(
    supabaseUrl, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: profilePublic, error: publicError } = await supabasePublic
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (publicError) {
    console.error('❌ Erreur RLS:', publicError.message);
    console.log('⚠️  L\'utilisateur ne peut pas lire son profil (problème RLS)');
  } else if (profilePublic) {
    console.log('✓ RLS OK - Le profil est lisible avec la clé publique');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Diagnostic terminé\n');
}

// Récupérer l'ID depuis les arguments ou demander tous les profils
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node scripts/debug-profile.js [user-id]');
  console.log('\nAffichage de tous les profils:\n');
  
  supabase
    .from('profiles')
    .select('id, role, full_name, created_at')
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        console.error('Erreur:', error.message);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('❌ Aucun profil trouvé dans la base de données');
        console.log('\nVérifiez que la table profiles existe et contient des données.');
        return;
      }
      
      console.log('Profils disponibles:');
      console.table(data);
      console.log(`\nTotal: ${data.length} profil(s)`);
      console.log('\nPour diagnostiquer un profil spécifique:');
      console.log('node scripts/debug-profile.js [user-id]');
    });
} else {
  debugProfile(userId);
}
