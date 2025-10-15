/**
 * Module de cache pour les balances - Version consolidée
 */

export interface BalanceTableData {
  clientId: string;
  period: string;
  entries: any[];
  lastUpdated: Date;
}

// Cache en mémoire pour la session
const balanceMemoryCache = new Map<string, BalanceTableData>();

/**
 * Génère une clé de cache unique
 */
function generateCacheKey(clientId: string, period: string): string {
  return `${clientId}_${period}`;
}

/**
 * Récupère la dernière période utilisée pour un client
 */
export async function getLastUsedPeriod(clientId: string): Promise<string | null> {
  try {
    const stored = localStorage.getItem(`last-period-${clientId}`);
    return stored || null;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde la dernière période utilisée pour un client
 */
export async function setLastUsedPeriod(clientId: string, period: string): Promise<void> {
  try {
    localStorage.setItem(`last-period-${clientId}`, period);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Récupère les données de balance depuis le cache
 */
export function getResolvedBalanceTable(clientId: string, period: string): BalanceTableData | null {
  const key = generateCacheKey(clientId, period);
  return balanceMemoryCache.get(key) || null;
}

/**
 * Stocke les données de balance dans le cache
 */
export function setResolvedBalanceTable(clientId: string, period: string, data: BalanceTableData): void {
  const key = generateCacheKey(clientId, period);
  balanceMemoryCache.set(key, {
    ...data,
    lastUpdated: new Date()
  });
}

/**
 * Nettoie le cache pour un client spécifique
 */
export function clearBalanceCache(clientId: string): void {
  const keys = Array.from(balanceMemoryCache.keys()).filter(key => key.startsWith(`${clientId}_`));
  keys.forEach(key => balanceMemoryCache.delete(key));
}

/**
 * Nettoie tout le cache
 */
export function clearAllBalanceCache(): void {
  balanceMemoryCache.clear();
}

/**
 * Teste la persistance des données de balance
 */
export async function testBalancePersistence(clientId: string, period: string): Promise<boolean> {
  try {
    const testData: BalanceTableData = {
      clientId,
      period,
      entries: [{ test: true }],
      lastUpdated: new Date()
    };
    
    setResolvedBalanceTable(clientId, period, testData);
    const retrieved = getResolvedBalanceTable(clientId, period);
    
    return retrieved !== null && retrieved.clientId === clientId;
  } catch {
    return false;
  }
}