import { migrateFromLocalStorage } from '@/lib/balanceSupabaseCache';

/**
 * Script de migration pour transférer les données de balance 
 * depuis localStorage vers Supabase
 */
export async function runBalanceCacheMigration(): Promise<void> {
  try {
    console.log('🚀 Début de la migration des données de balance...');
    await migrateFromLocalStorage();
    console.log('✅ Migration terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Fonction utilitaire pour nettoyer localStorage après migration réussie
export function cleanupLocalStorageAfterMigration(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('balanceCache:') || key.startsWith('balanceCache:lastPeriod:')
    );
    
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    
    console.log(`🧹 Nettoyage localStorage terminé: ${keys.length} clés supprimées`);
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage localStorage:', error);
  }
}

// Fonction d'aide pour vérifier si une migration est nécessaire
export function checkIfMigrationNeeded(): boolean {
  if (typeof window === 'undefined') return false;
  
  const keys = Object.keys(localStorage).filter(key => 
    key.startsWith('balanceCache:')
  );
  
  return keys.length > 0;
}
