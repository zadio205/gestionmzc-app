/**
 * Abstract base class for all cache implementations
 * Provides a unified interface for different caching strategies
 */

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Maximum number of items in cache */
  maxSize?: number;
  /** Enable compression for large values */
  compress?: boolean;
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  compressed?: boolean;
}

export abstract class BaseCache<T = any> {
  protected options: Required<CacheOptions>;
  protected cache = new Map<string, CacheItem<T>>();
  protected cleanupInterval?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 1000,
      compress: options.compress || false,
    };

    // Start cleanup interval to remove expired items
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  abstract get(key: string): Promise<T | undefined>;

  /**
   * Set value in cache
   */
  abstract set(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Check if key exists and is not expired
   */
  abstract has(key: string): Promise<boolean>;

  /**
   * Delete specific key
   */
  abstract delete(key: string): Promise<boolean>;

  /**
   * Clear all cache or specific pattern
   */
  abstract clear(pattern?: string): Promise<void>;

  /**
   * Get cache statistics
   */
  abstract getStats(): Promise<CacheStats>;

  /**
   * Create cache item with metadata
   */
  protected createCacheItem(value: T, options: CacheOptions = {}): CacheItem<T> {
    const ttl = options.ttl || this.options.ttl;
    const compressed = options.compress || this.options.compress;

    return {
      value,
      timestamp: Date.now(),
      ttl,
      compressed,
    };
  }

  /**
   * Check if cache item is expired
   */
  protected isExpired(item: CacheItem<T>): boolean {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Clean up expired items
   */
  protected cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
      }
    }

    // Remove oldest items if cache is too large
    if (this.cache.size > this.options.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.cache.size - this.options.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.min(this.options.ttl / 4, 60000)); // Cleanup every minute or TTL/4
  }

  /**
   * Stop cleanup interval
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }

  /**
   * Generate cache key with namespace
   */
  protected generateKey(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Parse cache key
   */
  protected parseKey(key: string): string[] {
    return key.split(':');
  }
}

export interface CacheStats {
  /** Total number of items in cache */
  size: number;
  /** Maximum cache size */
  maxSize: number;
  /** Number of expired items (before cleanup) */
  expiredItems: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Total memory usage in bytes (approximate) */
  memoryUsage: number;
  /** Average item age in milliseconds */
  averageAge: number;
}