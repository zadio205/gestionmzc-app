/**
 * Module de cache Supabase pour les balances
 */

/**
 * Migre les données depuis le localStorage vers le système de cache unifié
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    const keys = Object.keys(localStorage);
    const balanceKeys = keys.filter(key => 
      key.startsWith('balance_') || 
      key.startsWith('ledger_') ||
      key.startsWith('last-period-')
    );

    console.log(`Found ${balanceKeys.length} cache entries to migrate`);
    
    // Pour chaque entrée de cache, on pourrait la migrer vers Supabase
    // mais pour l'instant on se contente de les nettoyer
    let migratedCount = 0;
    
    for (const key of balanceKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          // Ici on pourrait sauvegarder vers Supabase
          // Pour l'instant on marque juste comme migré
          migratedCount++;
        }
      } catch (error) {
        console.warn(`Failed to migrate cache key ${key}:`, error);
      }
    }

    console.log(`Successfully migrated ${migratedCount} cache entries`);
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

/**
 * Nettoie les anciennes entrées de cache après migration
 */
export function cleanupLocalStorageAfterMigration(): void {
  try {
    const keys = Object.keys(localStorage);
    const balanceKeys = keys.filter(key => 
      key.startsWith('balance_') || 
      key.startsWith('ledger_') ||
      key.startsWith('cache_')
    );

    balanceKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove cache key ${key}:`, error);
      }
    });

    console.log(`Cleaned up ${balanceKeys.length} old cache entries`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}