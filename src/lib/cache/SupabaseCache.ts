import { BaseCache, CacheItem, CacheOptions, CacheStats } from './BaseCache';
import { supabaseServer } from '@/lib/supabase';

/**
 * Supabase cache implementation
 * Persistent across sessions and clients
 */
export class SupabaseCache<T = any> extends BaseCache<T> {
  private readonly tableName: string;
  private hits = 0;
  private misses = 0;

  constructor(tableName: string, options: CacheOptions = {}) {
    super(options);
    this.tableName = tableName;
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const { data, error } = await supabaseServer()
        .from(this.tableName)
        .select('value, expires_at')
        .eq('cache_key', key)
        .single();

      if (error || !data) {
        this.misses++;
        return undefined;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await this.delete(key);
        this.misses++;
        return undefined;
      }

      const value = typeof data.value === 'string'
        ? JSON.parse(data.value)
        : data.value;

      // Update in-memory cache
      const item: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: this.options.ttl,
      };
      this.cache.set(key, item);

      this.hits++;
      return value;
    } catch (error) {
      console.warn('SupabaseCache get error:', error);
      this.misses++;
      return undefined;
    }
  }

  async set(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.options.ttl;
      const expiresAt = new Date(Date.now() + ttl);
      const serializedValue = JSON.stringify(value);

      // Update in-memory cache
      const item = this.createCacheItem(value, options);
      this.cache.set(key, item);

      // Upsert to Supabase
      const { error } = await supabaseServer()
        .from(this.tableName)
        .upsert({
          cache_key: key,
          value: serializedValue,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.warn('SupabaseCache set error:', error);
      }
    } catch (error) {
      console.warn('SupabaseCache set error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseServer()
        .from(this.tableName)
        .select('expires_at')
        .eq('cache_key', key)
        .single();

      if (error || !data) return false;

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const { error } = await supabaseServer()
        .from(this.tableName)
        .delete()
        .eq('cache_key', key);

      this.cache.delete(key);
      return !error;
    } catch (error) {
      return false;
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (!pattern) {
        // Clear all cache items
        const { error } = await supabaseServer()
          .from(this.tableName)
          .delete()
          .neq('cache_key', ''); // Delete all

        if (!error) {
          this.cache.clear();
        }
        return;
      }

      // Use LIKE for pattern matching
      const { error } = await supabaseServer()
        .from(this.tableName)
        .delete()
        .like('cache_key', pattern.replace(/\*/g, '%'));

      if (!error) {
        // Also clear from memory cache
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.cache.keys()) {
          if (regex.test(key)) {
            this.cache.delete(key);
          }
        }
      }
    } catch (error) {
      console.warn('SupabaseCache clear error:', error);
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const { data, error } = await supabaseServer()
        .from(this.tableName)
        .select('cache_key, value, created_at, expires_at');

      if (error || !data) {
        return {
          size: this.cache.size,
          maxSize: this.options.maxSize,
          expiredItems: 0,
          hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
          memoryUsage: 0,
          averageAge: 0,
        };
      }

      const now = Date.now();
      let totalAge = 0;
      let expiredItems = 0;
      let memoryUsage = 0;

      for (const row of data) {
        const age = now - new Date(row.created_at).getTime();
        totalAge += age;

        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          expiredItems++;
        }

        // Rough estimation of memory usage
        memoryUsage += row.cache_key.length * 2;
        memoryUsage += (row.value?.length || 0) * 2;
        memoryUsage += 64;
      }

      const averageAge = data.length > 0 ? totalAge / data.length : 0;
      const hitRate = this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0;

      return {
        size: data.length,
        maxSize: this.options.maxSize,
        expiredItems,
        hitRate,
        memoryUsage,
        averageAge,
      };
    } catch (error) {
      console.warn('SupabaseCache getStats error:', error);
      return {
        size: this.cache.size,
        maxSize: this.options.maxSize,
        expiredItems: 0,
        hitRate: 0,
        memoryUsage: 0,
        averageAge: 0,
      };
    }
  }

  /**
   * Clean up expired items in Supabase
   */
  async cleanupExpired(): Promise<number> {
    try {
      const { data, error } = await supabaseServer()
        .from(this.tableName)
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('cache_key');

      if (error) {
        console.warn('SupabaseCache cleanup error:', error);
        return 0;
      }

      const count = data?.length || 0;

      // Also clean up memory cache
      for (const [key, item] of this.cache.entries()) {
        if (this.isExpired(item)) {
          this.cache.delete(key);
        }
      }

      return count;
    } catch (error) {
      console.warn('SupabaseCache cleanup error:', error);
      return 0;
    }
  }
}