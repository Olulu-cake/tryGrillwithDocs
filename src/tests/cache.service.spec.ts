
import { CacheService } from '../shared/cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Cache Stampede Guard', () => {
    it('should execute fetcher exactly once for concurrent requests on cache miss', async () => {
      const fetcher = jest.fn().mockResolvedValue('data');
      const key = 'test-key';

      // Simulate concurrent calls
      const promises = [
        cacheService.get(key, fetcher),
        cacheService.get(key, fetcher),
        cacheService.get(key, fetcher),
      ];

      await Promise.all(promises);

      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('Negative Caching (Cache Penetration Guard)', () => {
    it('should cache null/undefined results for a short TTL', async () => {
      const fetcher = jest.fn().mockResolvedValue(null);
      const key = 'missing-key';

      // First call - cache miss
      const result1 = await cacheService.get(key, fetcher);
      expect(result1).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second call - should return cached null immediately
      const result2 = await cacheService.get(key, fetcher);
      expect(result2).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1); // Should not be called again

      // Fast forward past 30s
      jest.advanceTimersByTime(31000);

      // Third call - should call fetcher again
      const result3 = await cacheService.get(key, fetcher);
      expect(result3).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Invalidation', () => {
    it('should remove the key from cache when invalidated', async () => {
      const fetcher = jest.fn().mockResolvedValue('data');
      const key = 'test-key';

      // First call - cache miss
      await cacheService.get(key, fetcher);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second call - should be cached
      await cacheService.get(key, fetcher);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Invalidate
      await cacheService.invalidate(key);

      // Third call - should trigger new fetch
      await cacheService.get(key, fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
