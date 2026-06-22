import { LRUCache } from "lru-cache";

/**
 * Generic short-lived in-process cache for read-heavy endpoints.
 * Not a replacement for Redis — single-instance only. Safe to use for
 * data that can tolerate up to `ttl` ms of staleness.
 */
export function createCache<V extends {}>(opts: { max?: number; ttlMs?: number } = {}) {
  return new LRUCache<string, V>({
    max: opts.max ?? 500,
    ttl: opts.ttlMs ?? 30_000,
    allowStale: false,
    updateAgeOnGet: false,
  });
}

/**
 * Wrap an async loader with cache + in-flight de-duplication so concurrent
 * requests for the same key only trigger one underlying fetch.
 */
export function memoizeAsync<V extends {}>(
  cache: LRUCache<string, V>,
  loader: (key: string) => Promise<V>,
) {
  const inflight = new Map<string, Promise<V>>();
  return async (key: string): Promise<V> => {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const existing = inflight.get(key);
    if (existing) return existing;
    const p = loader(key)
      .then((v) => {
        cache.set(key, v);
        return v;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  };
}
