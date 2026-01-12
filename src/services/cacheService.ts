import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 60) {
    // TTL par défaut de 60 secondes
    // checkperiod: fréquence de nettoyage des clés expirées
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: 120 });
  }

  /**
   * Récupère une valeur du cache
   * @param key Clé unique
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Stocke une valeur dans le cache
   * @param key Clé unique
   * @param value Donnée à stocker
   * @param ttl (Optionnel) Durée de vie en secondes spécifique pour cette clé
   */
  set(key: string, value: any, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Efface une clé (Invalidation de cache)
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Vide tout le cache (A utiliser avec précaution)
   */
  flush(): void {
    this.cache.flushAll();
  }
}

// Singleton : On exporte une instance unique partagée
export const cacheService = new CacheService(60); // TTL par défaut 1 minute
