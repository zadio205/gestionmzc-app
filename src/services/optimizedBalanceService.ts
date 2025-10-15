import { supabaseServer } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { createCacheFromPreset } from '@/lib/cache';
import { balanceCache } from '@/lib/cache/unified/BalanceCache';
import type { BalanceItem } from '@/types/accounting';

/**
 * Service optimisé pour la gestion de la balance comptable
 * Utilise le cache unifié et des requêtes SQL optimisées
 */
export class OptimizedBalanceService {
  private readonly cacheKey = 'balance-service';

  /**
   * Récupère la balance pour un client et une période donnés
   * Utilise le cache intelligent avec invalidation sélective
   */
  async getBalance(
    clientId: string,
    period?: string,
    forceRefresh: boolean = false
  ): Promise<BalanceItem[]> {
    try {
      // Vérifier le cache si pas de forçage
      if (!forceRefresh) {
        const cached = await balanceCache.get(clientId, period);
        if (cached) {
          logger.debug('Balance retrieved from cache', { clientId, period });
          return cached;
        }
      }

      // Requête SQL optimisée avec CTE
      const { data, error } = await supabaseServer()
        .rpc('get_balance_data', {
          p_client_id: clientId,
          p_period: period || null
        });

      if (error) {
        // Fallback vers la requête simple si la fonction n'existe pas
        return this.getFallbackBalance(clientId, period);
      }

      const balanceItems: BalanceItem[] = data?.map((item: any) => ({
        originalDebit: item.debit,
        originalCredit: item.credit,
        _id: item.id || `${item.client_id}-${item.account}-${Date.now()}`,
        accountNumber: item.account,
        accountName: item.label,
        account: item.account,
        label: item.label,
        debit: parseFloat(item.debit) || 0,
        credit: parseFloat(item.credit) || 0,
        balance: parseFloat(item.balance) || 0,
        type: item.type,
        category: item.category,
        period: item.period,
        clientId: item.client_id,
        createdAt: new Date(item.last_updated || new Date()),
      })) || [];

      // Mettre en cache avec TTL par défaut (15 minutes)
      await balanceCache.set(clientId, balanceItems, period);

      logger.info('Balance retrieved and cached', {
        clientId,
        period,
        itemCount: balanceItems.length
      });

      return balanceItems;

    } catch (error) {
      logger.error('Error fetching balance:', { clientId, period }, error as Error);
      return [];
    }
  }

  /**
   * Fallback pour la balance si la fonction SQL n'existe pas
   */
  private async getFallbackBalance(clientId: string, period?: string): Promise<BalanceItem[]> {
    try {
      let query = supabaseServer()
        .from('balance_data')
        .select('*')
        .eq('client_id', clientId);

      if (period) {
        query = query.eq('period', period);
      }

      const { data, error } = await query.order('account', { ascending: true });

      if (error) throw error;

      const balanceItems: BalanceItem[] = data?.map((item: any) => ({
        originalDebit: item.debit,
        originalCredit: item.credit,
        _id: item.id || `${item.client_id}-${item.account}-${Date.now()}`,
        accountNumber: item.account,
        accountName: item.label,
        account: item.account,
        label: item.label,
        debit: parseFloat(item.debit) || 0,
        credit: parseFloat(item.credit) || 0,
        balance: parseFloat(item.balance) || 0,
        type: item.type,
        category: item.category,
        period: item.period,
        clientId: item.client_id,
        createdAt: new Date(item.last_updated || new Date()),
      })) || [];

      return balanceItems;

    } catch (error) {
      logger.error('Error in fallback balance:', { clientId, period }, error as Error);
      return [];
    }
  }

  /**
   * Récupère plusieurs balances en parallèle (batch processing)
   */
  async getMultipleBalances(
    requests: Array<{ clientId: string; period?: string }>
  ): Promise<Map<string, BalanceItem[]>> {
    try {
      // Vérifier d'abord le cache pour toutes les requêtes
      const cacheResults = await balanceCache.getBatch(requests);
      const uncachedRequests = requests.filter(req =>
        !cacheResults.has(balanceCache.generateKey(req.clientId, req.period))
      );

      // Si tout est en cache, retourner les résultats
      if (uncachedRequests.length === 0) {
        return cacheResults;
      }

      // Récupérer les données manquantes en parallèle
      const balancePromises = uncachedRequests.map(req =>
        this.getBalance(req.clientId, req.period)
      );

      const balanceResults = await Promise.all(balancePromises);

      // Combiner les résultats du cache et des nouvelles requêtes
      const finalResults = new Map(cacheResults);

      uncachedRequests.forEach((req, index) => {
        const key = balanceCache.generateKey(req.clientId, req.period);
        finalResults.set(key, balanceResults[index]);
      });

      return finalResults;

    } catch (error) {
      logger.error('Error fetching multiple balances:', { requests }, error as Error);
      return new Map();
    }
  }

  /**
   * Invalide le cache de balance pour un client spécifique
   */
  async invalidateBalance(clientId: string, period?: string): Promise<void> {
    await balanceCache.clear(clientId, period);
    logger.info('Balance cache invalidated', { clientId, period });
  }

  /**
   * Invalide tout le cache de balance pour un client
   */
  async invalidateAllClientBalances(clientId: string): Promise<void> {
    await balanceCache.clearClient(clientId);
    logger.info('All client balance cache invalidated', { clientId });
  }

  /**
   * Calcule les statistiques de la balance
   */
  async getBalanceStatistics(
    clientId: string,
    period?: string
  ): Promise<{
    totalDebit: number;
    totalCredit: number;
    totalBalance: number;
    accountCount: number;
    categoryBreakdown: Record<string, { debit: number; credit: number; balance: number }>;
  }> {
    const balance = await this.getBalance(clientId, period);

    const stats = {
      totalDebit: 0,
      totalCredit: 0,
      totalBalance: 0,
      accountCount: balance.length,
      categoryBreakdown: {} as Record<string, { debit: number; credit: number; balance: number }>,
    };

    balance.forEach(item => {
      stats.totalDebit += item.debit;
      stats.totalCredit += item.credit;
      stats.totalBalance += item.balance;

      const category = item.category || 'Uncategorized';
      if (!stats.categoryBreakdown[category]) {
        stats.categoryBreakdown[category] = {
          debit: 0,
          credit: 0,
          balance: 0,
        };
      }

      stats.categoryBreakdown[category].debit += item.debit;
      stats.categoryBreakdown[category].credit += item.credit;
      stats.categoryBreakdown[category].balance += item.balance;
    });

    return stats;
  }

  /**
   * Compare deux périodes de balance
   */
  async comparePeriods(
    clientId: string,
    currentPeriod: string,
    previousPeriod: string
  ): Promise<{
    current: BalanceItem[];
    previous: BalanceItem[];
    variations: Array<{
      account: string;
      label: string;
      currentBalance: number;
      previousBalance: number;
      variation: number;
      variationPercent: number;
    }>;
  }> {
    const [current, previous] = await Promise.all([
      this.getBalance(clientId, currentPeriod),
      this.getBalance(clientId, previousPeriod),
    ]);

    const variations = current.map(currentItem => {
      const previousItem = previous.find(p => p.account === currentItem.account);
      const previousBalance = previousItem?.balance || 0;
      const variation = currentItem.balance - previousBalance;
      const variationPercent = previousBalance !== 0
        ? (variation / Math.abs(previousBalance)) * 100
        : 0;

      return {
        account: currentItem.account || '',
        label: currentItem.label || '',
        currentBalance: currentItem.balance,
        previousBalance,
        variation,
        variationPercent,
      };
    });

    return {
      current,
      previous,
      variations,
    };
  }

  /**
   * Extrait les comptes avec des variations significatives
   */
  async getSignificantVariations(
    clientId: string,
    currentPeriod: string,
    previousPeriod: string,
    thresholdPercent: number = 20
  ): Promise<Array<{
    account: string;
    label: string;
    currentBalance: number;
    previousBalance: number;
    variation: number;
    variationPercent: number;
    significance: 'high' | 'medium' | 'low';
  }>> {
    const comparison = await this.comparePeriods(clientId, currentPeriod, previousPeriod);

    return comparison.variations
      .filter(v => Math.abs(v.variationPercent) > thresholdPercent)
      .map(v => ({
        ...v,
        significance: (Math.abs(v.variationPercent) > 50 ? 'high' :
                      Math.abs(v.variationPercent) > 30 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      }))
      .sort((a, b) => Math.abs(b.variationPercent) - Math.abs(a.variationPercent));
  }

  /**
   * Vérifie l'équilibre de la balance (débit = crédit)
   */
  async validateBalance(clientId: string, period?: string): Promise<{
    isValid: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
    accountsWithErrors: string[];
  }> {
    const balance = await this.getBalance(clientId, period);

    const totalDebit = balance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = balance.reduce((sum, item) => sum + item.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);

    const isValid = difference < 0.01; // Tolérance de 1 centime

    const accountsWithErrors = balance
      .filter(item => {
        const expectedBalance = item.debit - item.credit;
        return Math.abs(expectedBalance - item.balance) > 0.01;
      })
      .map(item => item.account || '');

    return {
      isValid,
      totalDebit,
      totalCredit,
      difference,
      accountsWithErrors,
    };
  }

  /**
   * Exporte la balance au format CSV
   */
  async exportBalanceToCSV(
    clientId: string,
    period?: string
  ): Promise<string> {
    const balance = await this.getBalance(clientId, period);

    const headers = [
      'Compte',
      'Libellé',
      'Débit',
      'Crédit',
      'Solde',
      'Type',
      'Catégorie',
      'Période'
    ];

    const rows = balance.map(item => [
      item.account,
      `"${item.label}"`,
      item.debit.toFixed(2),
      item.credit.toFixed(2),
      item.balance.toFixed(2),
      item.type,
      item.category,
      item.period || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Génère le cache pour une période complète
   */
  async warmupCache(clientIds: string[], periods: string[]): Promise<void> {
    const requests: Array<{ clientId: string; period?: string }> = [];

    clientIds.forEach(clientId => {
      periods.forEach(period => {
        requests.push({ clientId, period });
      });
    });

    logger.info('Starting balance cache warmup', {
      clientCount: clientIds.length,
      periodCount: periods.length,
      totalRequests: requests.length
    });

    await this.getMultipleBalances(requests);

    logger.info('Balance cache warmup completed');
  }

  /**
   * Nettoie le cache expiré
   */
  async cleanupExpiredCache(): Promise<number> {
    // Cette méthode sera implémentée quand la fonctionnalité de cleanup
    // sera ajoutée au cache unifié
    logger.info('Starting balance cache cleanup');
    return 0;
  }
}

// Export du singleton
export const optimizedBalanceService = new OptimizedBalanceService();