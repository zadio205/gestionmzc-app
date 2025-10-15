import { BaseCache, CacheItem, CacheOptions, CacheStats } from './BaseCache';

/**
 * LocalStorage cache implementation
 * Persistent across browser sessions
 */
export class LocalStorageCache<T = any> extends BaseCache<T> {
  private readonly prefix: string;
  private hits = 0;
  private misses = 0;
  private isClient: boolean;

  constructor(prefix: string = 'cache', options: CacheOptions = {}) {
    super(options);
    this.prefix = prefix;
    // Vérifier si nous sommes côté client
    this.isClient = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    
    if (this.isClient) {
      this.loadFromStorage();
    }
  }

  async get(key: string): Promise<T | undefined> {
    try {
      // Si pas côté client, utiliser seulement le cache mémoire
      if (!this.isClient) {
        const item = this.cache.get(key);
        if (!item || this.isExpired(item)) {
          this.misses++;
          return undefined;
        }
        this.hits++;
        return item.value;
      }

      const storageKey = this.getStorageKey(key);
      const serialized = localStorage.getItem(storageKey);

      if (!serialized) {
        this.misses++;
        return undefined;
      }

      const item: CacheItem<T> = JSON.parse(serialized);

      if (this.isExpired(item)) {
        localStorage.removeItem(storageKey);
        this.misses++;
        return undefined;
      }

      // Update in-memory cache
      this.cache.set(key, item);
      this.hits++;
      return item.value;
    } catch (error) {
      console.warn('LocalStorageCache get error:', error);
      this.misses++;
      return undefined;
    }
  }

  async set(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const item = this.createCacheItem(value, options);

      // Update in-memory cache
      this.cache.set(key, item);

      // Persist to localStorage seulement côté client
      if (this.isClient) {
        const storageKey = this.getStorageKey(key);
        localStorage.setItem(storageKey, JSON.stringify(item));
      }

      // Cleanup if needed
      if (this.cache.size > this.options.maxSize) {
        this.cleanup();
      }
    } catch (error) {
      console.warn('LocalStorageCache set error:', error);
      // Fallback to memory-only cache
      this.cache.set(key, this.createCacheItem(value, options));
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      // Si pas côté client, vérifier seulement le cache mémoire
      if (!this.isClient) {
        const item = this.cache.get(key);
        return item !== undefined && !this.isExpired(item);
      }

      const storageKey = this.getStorageKey(key);
      const serialized = localStorage.getItem(storageKey);

      if (!serialized) return false;

      const item: CacheItem<T> = JSON.parse(serialized);

      if (this.isExpired(item)) {
        localStorage.removeItem(storageKey);
        this.cache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      // Supprimer du cache mémoire
      this.cache.delete(key);
      
      // Supprimer de localStorage seulement côté client
      if (this.isClient) {
        const storageKey = this.getStorageKey(key);
        localStorage.removeItem(storageKey);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (!pattern) {
        // Clear memory cache
        this.cache.clear();
        
        // Clear localStorage seulement côté client
        if (this.isClient) {
          const keys = Object.keys(localStorage).filter(key =>
            key.startsWith(this.prefix)
          );
          keys.forEach(key => localStorage.removeItem(key));
        }
        return;
      }

      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      
      // Clear from memory cache
      for (const cacheKey of this.cache.keys()) {
        if (regex.test(cacheKey)) {
          this.cache.delete(cacheKey);
        }
      }

      // Clear from localStorage seulement côté client
      if (this.isClient) {
        const keys = Object.keys(localStorage).filter(key =>
          key.startsWith(this.prefix) && regex.test(key)
        );
        keys.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('LocalStorageCache clear error:', error);
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
      memoryUsage += key.length * 2;
      memoryUsage += JSON.stringify(item.value).length * 2;
      memoryUsage += 64;
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

  private getStorageKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private loadFromStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith(this.prefix)
      );

      for (const storageKey of keys) {
        const serialized = localStorage.getItem(storageKey);
        if (serialized) {
          try {
            const item: CacheItem<T> = JSON.parse(serialized);
            const key = storageKey.replace(`${this.prefix}:`, '');

            // Only load non-expired items
            if (!this.isExpired(item)) {
              this.cache.set(key, item);
            } else {
              localStorage.removeItem(storageKey);
            }
          } catch (parseError) {
            // Remove invalid items
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.warn('LocalStorageCache load error:', error);
    }
  }
}