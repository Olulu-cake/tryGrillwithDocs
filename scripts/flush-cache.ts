
import { cacheService } from '../src/shared/cache.service';

async function flushProductCache() {
  console.log("Attempting to invalidate all product keys...");
  // Since the current CacheService is a simple in-memory Map, 
  // 'invalidating' effectively means clearing the Map or filtering keys.
  // The current implementation doesn't expose a 'list keys' or 'clear all', 
  // but we can manually invalidate if we know the keys.
  // Assuming we want to clear everything for now as a fix.
  
  // As a temporary fix for the in-memory cache:
  // @ts-ignore
  cacheService.cache.clear(); 
  console.log("All cache keys cleared.");
}

flushProductCache().catch(console.error);
