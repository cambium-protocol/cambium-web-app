import { describe, it, expect, vi } from 'vitest';
import { TtlCache, cached, dataCache, clearDataCache } from '@/lib/chain/cache';

describe('TtlCache', () => {
  it('stores and returns values', () => {
    const cache = new TtlCache(1000);
    cache.set('k', 42);
    expect(cache.get('k')).toBe(42);
  });

  it('expires entries after the TTL elapses', () => {
    vi.useFakeTimers();
    const cache = new TtlCache(1000);
    cache.set('k', 42);
    vi.advanceTimersByTime(1001);
    expect(cache.get('k')).toBeUndefined();
    vi.useRealTimers();
  });

  it('deletes and clears entries', () => {
    const cache = new TtlCache(1000);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});

describe('cached', () => {
  it('invokes the underlying function once for concurrent callers', async () => {
    dataCache.clear();
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `value-${calls}`;
    });

    const results = await Promise.all([
      cached('cache-test', fn),
      cached('cache-test', fn),
      cached('cache-test', fn),
    ]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['value-1', 'value-1', 'value-1']);
  });

  it('serves cached values without re-running the function', async () => {
    dataCache.clear();
    const fn = vi.fn(async () => 'first');
    await cached('cache-test-2', fn);
    const second = await cached('cache-test-2', fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(second).toBe('first');
  });

  it('evicts the key when the call fails so the next call retries', async () => {
    dataCache.clear();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    await expect(cached('cache-test-3', fn)).rejects.toThrow('boom');
    const result = await cached('cache-test-3', fn);
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('clearDataCache drops all memoized entries', async () => {
    dataCache.clear();
    const fn = vi.fn(async () => 'x');
    await cached('cache-test-4', fn);
    clearDataCache();
    await cached('cache-test-4', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
