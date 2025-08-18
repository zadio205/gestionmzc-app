/**
 * Script de test pour vérifier le fonctionnement de la persistance balance
 */

import { supabaseBrowser } from '@/lib/supabase/client';
import type { BalanceItem } from '@/types/accounting';
import { 
  getBalanceLocalCache, 
  setBalanceLocalCache, 
  clearBalanceLocalCache,
  getResolvedBalanceTable 
} from '@/lib/balanceRealCache';

export const testBalancePersistence = async () => {
  console.log('🧪 Test de persistance de la balance - Début');
  
  const testClientId = 'test-client-123';
  const testPeriod = '2024-01';
  
  const testData: BalanceItem[] = [
    {
      _id: '1',
      accountNumber: '411000',
      accountName: 'Clients',
      debit: 1000,
      credit: 0,
      balance: 1000,
      clientId: testClientId,
      period: testPeriod,
      importIndex: 1,
      originalDebit: 1000,
      originalCredit: 0,
      createdAt: new Date()
    },
    {
      _id: '2',
      accountNumber: '401000',
      accountName: 'Fournisseurs',
      debit: 0,
      credit: 500,
      balance: -500,
      clientId: testClientId,
      period: testPeriod,
      importIndex: 1,
      originalDebit: 0,
      originalCredit: 500,
      createdAt: new Date()
    }
  ];

  try {
    // 1. Test de vérification de la table
    console.log('📋 Vérification de la table balance...');
    const table = await getResolvedBalanceTable();
    const { data: tableCheck, error: tableError } = await supabaseBrowser
      .from(table)
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erreur table:', tableError);
      return { success: false, error: 'Table balance inaccessible' };
    }
    
  console.log(`✅ Table ${table} accessible`);

    // 2. Test d'insertion
    console.log('💾 Test d\'insertion...');
    await setBalanceLocalCache(testClientId, testPeriod, testData);
    console.log('✅ Insertion réussie');

    // 3. Test de lecture
    console.log('📖 Test de lecture...');
    const retrieved = await getBalanceLocalCache(testClientId, testPeriod);
    console.log('✅ Lecture réussie:', retrieved?.length || 0, 'éléments');
    
    // Vérification des données
    if (!retrieved || retrieved.length !== testData.length) {
      throw new Error(`Nombre d'éléments incorrect: attendu ${testData.length}, reçu ${retrieved?.length || 0}`);
    }

    // 4. Test de suppression
    console.log('🗑️ Test de suppression...');
    await clearBalanceLocalCache(testClientId, testPeriod);
    console.log('✅ Suppression réussie');

    // 5. Vérification que la suppression a fonctionné
    console.log('🔍 Vérification suppression...');
    const afterClear = await getBalanceLocalCache(testClientId, testPeriod);
    if (afterClear && afterClear.length !== 0) {
      throw new Error(`Suppression échouée: ${afterClear.length} éléments restants`);
    }
    console.log('✅ Suppression vérifiée');

    console.log('🎉 Tous les tests de persistance ont réussi !');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Erreur dans les tests:', error);
    return { success: false, error: error.message };
  }
};

// Test en mode développement
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testBalancePersistence = testBalancePersistence;
}
