/**
 * Script pour vérifier les policies RLS de la table profiles
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
  console.log('\n🔍 Vérification des policies RLS pour la table profiles\n');
  console.log('═'.repeat(60));
  
  // Requête pour récupérer les policies
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        policyname,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'profiles'
      ORDER BY policyname;
    `
  });
  
  // Si RPC n'existe pas, utiliser une requête directe
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('policyname, cmd, qual, with_check')
    .eq('tablename', 'profiles')
    .order('policyname');
  
  if (policiesError) {
    console.log('⚠️  Impossible de lire les policies via la table pg_policies');
    console.log('   Cela nécessite des permissions spéciales.\n');
    console.log('Pour vérifier manuellement, exécutez dans l\'éditeur SQL de Supabase:\n');
    console.log('SELECT policyname, cmd FROM pg_policies WHERE tablename = \'profiles\';');
    return;
  }
  
  if (!policies || policies.length === 0) {
    console.log('❌ AUCUNE POLICY TROUVÉE !');
    console.log('\nLa table profiles n\'a pas de policies RLS.');
    console.log('Cela signifie que PERSONNE ne peut lire la table avec la clé publique.\n');
    console.log('Solution: Exécutez le script SQL de création des policies:');
    console.log('   scripts/create-profiles-table.sql\n');
    return;
  }
  
  console.log(`✓ ${policies.length} policy(ies) trouvée(s):\n`);
  
  for (const policy of policies) {
    console.log(`Policy: ${policy.policyname}`);
    console.log(`  Command: ${policy.cmd}`);
    console.log(`  Using: ${policy.qual || '(none)'}`);
    console.log(`  With check: ${policy.with_check || '(none)'}`);
    console.log('');
  }
  
  console.log('═'.repeat(60));
}

checkPolicies();
