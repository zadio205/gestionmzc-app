import { BaseCache, CacheItem, CacheOptions, CacheStats } from './BaseCache';

/**
 * In-memory cache implementation
 * Fastest but volatile (lost on restart)
 */
export class MemoryCache<T = any> extends BaseCache<T> {
  private hits = 0;
  private misses = 0;

  async get(key: string): Promise<T | undefined> {
    const item = this.cache.get(key);

    if (!item) {
      this.misses++;
      return undefined;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return item.value;
  }

  async set(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const item = this.createCacheItem(value, options);
    this.cache.set(key, item);

    // Cleanup if needed
    if (this.cache.size > this.options.maxSize) {
      this.cleanup();
    }
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async getStats(): Promise<CacheStats> {
    const now = Date.now();
    let totalAge = 0;
    let expiredItems = 0;
    let memoryUsage = 0;

    for (const [key, item] of this.cache.entries()) {
      totalAge += now - item.timestamp;

      if (this.isExpired(item)) {
        expiredItems++;
      }

      // Rough estimation of memory usage
      memoryUsage += key.length * 2; // UTF-16 characters
      memoryUsage += JSON.stringify(item.value).length * 2;
      memoryUsage += 64; // Overhead estimation
    }

    const averageAge = this.cache.size > 0 ? totalAge / this.cache.size : 0;
    const hitRate = this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0;

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      expiredItems,
      hitRate,
      memoryUsage,
      averageAge,
    };
  }
}