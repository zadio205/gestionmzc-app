/**
 * Script de vérification de l'état du système de persistance
 */

import { supabaseBrowser } from '@/lib/supabase/client';
import { getResolvedBalanceTable } from '@/lib/balanceRealCache';

export const checkBalancePersistenceStatus = async () => {
  console.log('🔍 Vérification de l\'état du système de persistance...');
  
  const status = {
    supabaseConnection: false,
    balanceTableExists: false,
    balanceTableStructure: false,
    permissions: false,
    summary: '',
    details: [] as string[]
  };

  try {
    // 1. Test de connexion Supabase
    console.log('🔌 Test de connexion Supabase...');
  const resolved = process.env.NEXT_PUBLIC_BALANCE_TABLE || 'balance_items';
    const { data: connectionTest, error: connectionError } = await supabaseBrowser
      .from(resolved)
      .select('count')
      .limit(0);
    
    if (connectionError) {
      status.details.push(`❌ Connexion Supabase échouée: ${connectionError.message}`);
    } else {
      status.supabaseConnection = true;
      status.details.push('✅ Connexion Supabase établie');
    }

    // 2. Test d'existence de la table balance
    console.log('📋 Vérification de la table balance...');
    const { data: tableData, error: tableError } = await supabaseBrowser
      .from(resolved)
      .select('*')
      .limit(1);

    if (tableError) {
      status.details.push(`❌ Table balance inaccessible: ${tableError.message}`);
    } else {
      status.balanceTableExists = true;
      status.details.push('✅ Table balance accessible');
      
      // 3. Vérification de la structure (si on a des données)
      if (tableData && tableData.length > 0) {
        const sampleRow = tableData[0];
  const expectedFields = ['id', 'account_number', 'account_name', 'debit', 'credit', 'client_id', 'period'];
        const missingFields = expectedFields.filter(field => !(field in sampleRow));
        
        if (missingFields.length === 0) {
          status.balanceTableStructure = true;
          status.details.push('✅ Structure de table validée');
        } else {
          status.details.push(`⚠️ Champs manquants: ${missingFields.join(', ')}`);
        }
      } else {
        status.details.push('ℹ️ Table vide - structure non vérifiable');
        status.balanceTableStructure = true; // On assume que c'est OK
      }
    }

    // 4. Test des permissions (insert)
    console.log('🔐 Test des permissions...');
    try {
      const testData = {
        account_number: '__TEST__',
        account_name: '__TEST__',
        debit: 0,
        credit: 0,
        balance: 0,
        client_id: '__TEST__',
        period: '__TEST__',
        import_index: -1
      };

      const { error: insertError } = await supabaseBrowser
        .from(resolved)
        .insert(testData);

      if (insertError) {
        status.details.push(`⚠️ Permissions d'insertion limitées: ${insertError.message}`);
      } else {
        status.permissions = true;
        status.details.push('✅ Permissions d\'insertion OK');
        
        // Nettoyer le test
        await supabaseBrowser
          .from(resolved)
          .delete()
          .eq('account_number', '__TEST__')
          .eq('client_id', '__TEST__');
      }
    } catch (permError: any) {
      status.details.push(`❌ Test de permissions échoué: ${permError.message}`);
    }

    // 5. Résumé
    const allGood = status.supabaseConnection && status.balanceTableExists && status.balanceTableStructure && status.permissions;
    
    if (allGood) {
      status.summary = '🎉 Système de persistance complètement fonctionnel !';
    } else if (status.supabaseConnection && status.balanceTableExists) {
      status.summary = '⚠️ Système partiellement fonctionnel - vérifiez les permissions';
    } else {
      status.summary = '❌ Système non fonctionnel - problèmes de configuration';
    }

    console.log(status.summary);
    status.details.forEach(detail => console.log(detail));

    return status;

  } catch (error: any) {
    status.summary = `❌ Erreur critique: ${error.message}`;
    status.details.push(status.summary);
    console.error(status.summary);
    return status;
  }
};

// Export pour utilisation dans la console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).checkBalancePersistenceStatus = checkBalancePersistenceStatus;
}
