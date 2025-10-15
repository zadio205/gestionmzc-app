import { BaseCache, CacheOptions } from './BaseCache';
import { MemoryCache } from './MemoryCache';
import { LocalStorageCache } from './LocalStorageCache';
import { SupabaseCache } from './SupabaseCache';

export type CacheType = 'memory' | 'local' | 'supabase' | 'hybrid';

export interface CacheConfig {
  type: CacheType;
  options?: CacheOptions;
  tableName?: string; // For Supabase cache
  prefix?: string; // For LocalStorage cache
}

/**
 * Factory for creating different types of cache instances
 */
export class CacheFactory {
  private static instances = new Map<string, BaseCache>();

  /**
   * Create or get a cache instance
   */
  static create<T = any>(
    name: string,
    config: CacheConfig
  ): BaseCache<T> {
    const key = `${name}:${config.type}`;

    // Return existing instance if available
    if (this.instances.has(key)) {
      return this.instances.get(key) as BaseCache<T>;
    }

    // Create new instance based on type
    let cache: BaseCache<T>;

    switch (config.type) {
      case 'memory':
        cache = new MemoryCache<T>(config.options);
        break;

      case 'local':
        cache = new LocalStorageCache<T>(
          config.prefix || name,
          config.options
        );
        break;

      case 'supabase':
        if (!config.tableName) {
          throw new Error('Table name is required for Supabase cache');
        }
        cache = new SupabaseCache<T>(config.tableName, config.options);
        break;

      case 'hybrid':
        // Hybrid cache tries LocalStorage first, then falls back to Memory
        try {
          cache = new LocalStorageCache<T>(
            config.prefix || name,
            config.options
          );
        } catch (error) {
          console.warn('LocalStorage not available, falling back to Memory cache:', error);
          cache = new MemoryCache<T>(config.options);
        }
        break;

      default:
        throw new Error(`Unknown cache type: ${config.type}`);
    }

    this.instances.set(key, cache);
    return cache;
  }

  /**
   * Get existing cache instance
   */
  static get<T = any>(name: string, type: CacheType): BaseCache<T> | undefined {
    const key = `${name}:${type}`;
    return this.instances.get(key) as BaseCache<T>;
  }

  /**
   * Clear all cache instances
   */
  static async clearAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map(cache =>
      cache.clear().catch(error =>
        console.warn('Error clearing cache instance:', error)
      )
    );

    await Promise.allSettled(promises);
    this.instances.clear();
  }

  /**
   * Get statistics for all cache instances
   */
  static async getAllStats(): Promise<Array<{
    name: string;
    type: CacheType;
    stats: any;
  }>> {
    const stats = [];

    for (const [key, cache] of this.instances.entries()) {
      try {
        const [name, type] = key.split(':');
        const cacheStats = await cache.getStats();
        stats.push({ name, type: type as CacheType, stats: cacheStats });
      } catch (error) {
        console.warn(`Error getting stats for cache ${key}:`, error);
      }
    }

    return stats;
  }

  /**
   * Destroy all cache instances
   */
  static destroyAll(): void {
    for (const cache of this.instances.values()) {
      try {
        cache.destroy();
      } catch (error) {
        console.warn('Error destroying cache instance:', error);
      }
    }
    this.instances.clear();
  }

  /**
   * Predefined cache configurations for common use cases
   */
  static presets = {
    // Short-lived, fast cache for temporary data
    session: {
      type: 'memory' as const,
      options: {
        ttl: 30 * 60 * 1000, // 30 minutes
        maxSize: 500,
      },
    },

    // Medium-lived cache for user-specific data
    user: {
      type: 'local' as const,
      options: {
        ttl: 2 * 60 * 60 * 1000, // 2 hours
        maxSize: 200,
      },
      prefix: 'user',
    },

    // Long-lived cache for application data
    application: {
      type: 'supabase' as const,
      options: {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        maxSize: 1000,
      },
      tableName: 'app_cache',
    },

    // Cache for balance calculations (very important for performance)
    balance: {
      type: 'hybrid' as const,
      options: {
        ttl: 15 * 60 * 1000, // 15 minutes
        maxSize: 100,
      },
      prefix: 'balance',
    },

    // Cache for ledger entries
    ledger: {
      type: 'supabase' as const,
      options: {
        ttl: 30 * 60 * 1000, // 30 minutes
        maxSize: 500,
      },
      tableName: 'ledger_cache',
    },
  };

  /**
   * Create cache using preset configuration
   */
  static createFromPreset<T = any>(
    name: string,
    presetName: keyof typeof CacheFactory.presets,
    overrides?: Partial<CacheConfig>
  ): BaseCache<T> {
    const preset = this.presets[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    const config = { ...preset, ...overrides };
    return this.create<T>(name, config);
  }
}

/**
 * Helper function to quickly create caches
 */
export function createCache<T = any>(
  name: string,
  type: CacheType,
  options?: CacheOptions
): BaseCache<T> {
  return CacheFactory.create<T>(name, { type, options });
}

/**
 * Helper function to create cache from preset
 */
export function createCacheFromPreset<T = any>(
  name: string,
  presetName: keyof typeof CacheFactory.presets
): BaseCache<T> {
  return CacheFactory.createFromPreset<T>(name, presetName);
}