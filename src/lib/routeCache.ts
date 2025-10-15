/**
 * Système de cache intelligent pour les routes
 * Garde en mémoire les 5 dernières pages visitées
 */

interface CacheEntry {
  route: string;
  timestamp: number;
  data?: any;
}

class RouteCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize = 5;
  private history: string[] = [];

  set(route: string, data?: any) {
    const entry: CacheEntry = {
      route,
      timestamp: Date.now(),
      data,
    };

    this.cache.set(route, entry);
    
    // Ajouter à l'historique
    if (!this.history.includes(route)) {
      this.history.push(route);
    }

    // Nettoyer si trop grand
    if (this.cache.size > this.maxSize) {
      this.cleanup();
    }
  }

  get(route: string): CacheEntry | undefined {
    return this.cache.get(route);
  }

  has(route: string): boolean {
    return this.cache.has(route);
  }

  private cleanup() {
    // Garder seulement les routes récentes
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    this.cache.clear();
    sortedEntries.slice(0, this.maxSize).forEach(([key, value]) => {
      this.cache.set(key, value);
    });

    // Mettre à jour l'historique
    this.history = sortedEntries
      .slice(0, this.maxSize)
      .map(([key]) => key);
  }

  getHistory(): string[] {
    return [...this.history];
  }

  clear() {
    this.cache.clear();
    this.history = [];
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(e => e.timestamp)),
      newestEntry: Math.max(...Array.from(this.cache.values()).map(e => e.timestamp)),
    };
  }
}

// Instance singleton
export const routeCache = new RouteCache();

// Middleware pour tracker les routes visitées
export function trackRoute(route: string) {
  routeCache.set(route);
}

// Vérifier si une route est en cache
export function isRouteCached(route: string): boolean {
  return routeCache.has(route);
}

// Récupérer l'historique de navigation
export function getNavigationHistory(): string[] {
  return routeCache.getHistory();
}

// Stats de cache pour debug
export function getCacheStats() {
  return routeCache.getStats();
}
