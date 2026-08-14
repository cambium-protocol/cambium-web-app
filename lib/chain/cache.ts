/**
 * Tiny TTL cache for the event-indexer data services.
 *
 * Every page render and API request currently triggers a fresh scan of up to
 * `NEXT_PUBLIC_CHAIN_INDEX_WINDOW` ledgers against the RPC endpoint. That is
 * expensive and mostly redundant, so the public services in `service.ts`
 * memoize their results here for a short window. Concurrent callers share a
 * single in-flight promise via `cached`, and failures evict the key so the
 * next call retries against the network.
 */

const DEFAULT_TTL_MS = 15_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): T {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const dataCache = new TtlCache();

/** Drop all memoized on-chain data (e.g. after a wallet submits a change). */
export function clearDataCache(): void {
  dataCache.clear();
}

/** Memoize a promise-returning call for the cache TTL. */
export function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = dataCache.get<Promise<T>>(key);
  if (hit !== undefined) return hit;
  // Store the in-flight promise so concurrent callers share a single request.
  const pending = fn();
  dataCache.set(key, pending);
  pending.then(
    (value) => dataCache.set(key, Promise.resolve(value)),
    () => dataCache.delete(key),
  );
  return pending;
}
