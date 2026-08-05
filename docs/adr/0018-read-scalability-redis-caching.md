# ADR 0018: Read Scalability with Redis Caching and Anti-Penetration Guards

## Status
Proposed

## Context
To support high-concurrency read operations on catalog data and prevent database bottlenecks, we require a robust caching strategy. Simple caching is insufficient; we must actively prevent cache-related failures like cache avalanches, stampedes, and penetration by malicious/invalid queries.

## Decision
We will implement a layered Redis caching strategy across the application:

### 1. Catalog Data (Cache-Aside & Invalidation)
- **Pattern**: Cache-Aside (Lazy loading).
- **TTL**: Standard TTL (e.g., 3600s) + random jitter (0-300s) to distribute expiration times and prevent cache avalanches.
- **Invalidation**: Proactive eviction triggered via events (e.g., `ProductUpdatedEvent`, `PriceUpdatedEvent`).

### 2. Inventory / Stock Level
- **Strategy**: Do NOT rely on long-TTL caching for inventory.
- **Implementation**: Atomic Redis counters (DECRBY) or Redis Hashes for real-time stock checks and atomic reservations.
- **Consistency**: Synchronized with the primary database via transactional domain events.

### 3. Cache Penetration Guard
- **Strategy**: Negative Caching.
- **Implementation**: Cache empty/null results for a short TTL (e.g., 30s) to prevent repeated requests for non-existent items from overwhelming the database.

### 4. Cache Stampede Guard (Thundering Herd)
- **Strategy**: Mutex Locks.
- **Implementation**: On cache miss, use a Redis Distributed Mutex (`SET lock:product:{id} NX PX 2000`).
- **Mechanism**: The first request acquires the lock and queries the DB. Subsequent concurrent requests wait briefly and retry the cache lookup.

## Consequences
- **Positive**: 
  - Significant reduction in database read pressure.
  - Enhanced resilience against high-traffic spikes and malicious queries.
  - Improved response times for catalog lookups.
- **Negative**:
  - Increased architectural complexity in managing cache consistency and invalidation.
  - Requirement for robust Redis error handling (e.g., circuit breakers) to prevent total system failure if Redis is unavailable.
