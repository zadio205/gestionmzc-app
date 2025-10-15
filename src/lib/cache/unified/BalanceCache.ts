import { createCacheFromPreset } from '../index';
import type { BalanceItem } from '@/types/accounting';

/**
 * Unified Balance Cache using the new cache system
 * Replaces the old balanceCache.ts implementation
 */
class BalanceCacheManager {
  private cache = createCacheFromPreset<BalanceItem[]>('balance', 'balance');

  /**
   * Get balance items from cache
   */
  async get(clientId: string, period?: string): Promise<BalanceItem[] | undefined> {
    const key = this.generateKey(clientId, period);
    return this.cache.get(key);
  }

  /**
   * Set balance items in cache
   */
  async set(clientId: string, entries: BalanceItem[], period?: string): Promise<void> {
    const key = this.generateKey(clientId, period);
    await this.cache.set(key, entries);
  }

  /**
   * Clear cache for specific client/period
   */
  async clear(clientId: string, period?: string): Promise<void> {
    const key = this.generateKey(clientId, period);
    await this.cache.delete(key);
  }

  /**
   * Clear all balance cache
   */
  async clearAll(): Promise<void> {
    await this.cache.clear('balance:*');
  }

  /**
   * Clear cache for a specific client (all periods)
   */
  async clearClient(clientId: string): Promise<void> {
    const pattern = `balance:${clientId}:*`;
    await this.cache.clear(pattern);
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    return this.cache.getStats();
  }

  /**
   * Generate cache key
   */
  public generateKey(clientId: string, period?: string): string {
    return `balance:${clientId}:${period || ''}`;
  }

  /**
   * Batch get multiple clients/periods
   */
  async getBatch(
    requests: Array<{ clientId: string; period?: string }>
  ): Promise<Map<string, BalanceItem[]>> {
    const results = new Map<string, BalanceItem[]>();
    const promises = requests.map(async ({ clientId, period }) => {
      const key = this.generateKey(clientId, period);
      const data = await this.cache.get(key);
      if (data) {
        results.set(key, data);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Batch set multiple clients/periods
   */
  async setBatch(
    entries: Array<{
      clientId: string;
      period?: string;
      data: BalanceItem[];
    }>
  ): Promise<void> {
    const promises = entries.map(({ clientId, period, data }) =>
      this.set(clientId, data, period)
    );

    await Promise.all(promises);
  }
}

// Singleton instance
export const balanceCache = new BalanceCacheManager();

// Legacy exports for backward compatibility
export const getBalanceCache = (clientId: string, period?: string) =>
  balanceCache.get(clientId, period);

export const setBalanceCache = (clientId: string, entries: BalanceItem[], period?: string) =>
  balanceCache.set(clientId, entries, period);

export const clearBalanceCache = (clientId: string, period?: string) =>
  balanceCache.clear(clientId, period);