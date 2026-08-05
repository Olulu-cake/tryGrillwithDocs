export class CacheService {
  private activeFetches = new Map<string, Promise<any>>();
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // 1. Check cache
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      if (entry.expiresAt > Date.now()) {
        console.log(`Cache hit for key: ${key}`);
        return entry.value;
      }
      this.cache.delete(key);
      console.log(`Cache expired for key: ${key}`);
    }

    // 2. Stampede Guard
    if (this.activeFetches.has(key)) {
      console.log(`Stampede guard hit for key: ${key}`);
      return this.activeFetches.get(key)!;
    }

    console.log(`Cache miss for key: ${key}`);
    // 3. Fetch
    const fetchPromise = fetcher().then((value) => {
        // Caching:
        // Negative: null/undefined for 30s
        // Success: value for 5m
        const ttl = (value === null || value === undefined) ? 30000 : 300000;
        this.cache.set(key, { value, expiresAt: Date.now() + ttl });
        console.log(`Cached value for key: ${key}`);

        return value;
    }).finally(() => {
      this.activeFetches.delete(key);
    });

    this.activeFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

export const cacheService = new CacheService();

