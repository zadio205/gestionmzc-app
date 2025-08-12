/**
 * Simple in-memory cache for LLM responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class LLMCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key for justification messages
  static justificationKey(context: {
    clientName: string;
    amount: number;
    type: string;
    description: string;
  }): string {
    return `justification:${context.type}:${context.amount}:${this.hashString(context.description)}`;
  }

  // Generate cache key for analysis
  static analysisKey(description: string, amount: number): string {
    return `analysis:${amount}:${this.hashString(description)}`;
  }

  // Simple string hash function
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Singleton instance
export const llmCache = new LLMCache();