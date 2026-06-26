# ADR-014 — Permission Cache

## Title

In-Process Memory Permission Cache with Interface-Based Abstraction

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The permission resolver (`PermissionResolverService`) must query the database on the first request for each `(userId, roleId)` pair. Without caching:
- Every authenticated request incurs 3 database queries for permission resolution
- A system with 50 concurrent users making 10 requests/second = 1,500 permission DB queries/second
- These queries add latency to every authenticated request

The caching solution needed to be:
1. Simple to implement and test
2. Safe for single-instance deployment
3. Replaceable with a distributed cache for multi-instance deployment

---

## Decision

An **interface-based permission cache** with an in-process memory implementation.

### IPermissionCache Interface

```typescript
interface IPermissionCache {
  get(userId: bigint, roleId: bigint): Promise<ResolvedPermissions | undefined>;
  set(userId: bigint, roleId: bigint, permissions: ResolvedPermissions): Promise<void>;
  invalidate(userId: bigint): Promise<void>;
  invalidateAll(): Promise<void>;
}
```

All methods are `async` (return `Promise<T>`) to be compatible with future distributed cache implementations where operations are inherently asynchronous.

### MemoryPermissionCache Implementation

```typescript
@Injectable()
export class MemoryPermissionCache implements IPermissionCache {
  private readonly store = new Map<string, CacheEntry>();
  private readonly TTL_MS = 5 * 60 * 1_000; // 5 minutes

  private cacheKey(userId: bigint, roleId: bigint): string {
    return `${userId}:${roleId}`;
  }

  async get(userId: bigint, roleId: bigint): Promise<ResolvedPermissions | undefined> {
    const entry = this.store.get(this.cacheKey(userId, roleId));
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.cacheKey(userId, roleId));
      return undefined;
    }
    return entry.permissions;
  }

  async set(userId: bigint, roleId: bigint, permissions: ResolvedPermissions): Promise<void> {
    this.store.set(this.cacheKey(userId, roleId), {
      permissions,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  async invalidate(userId: bigint): Promise<void> {
    const prefix = `${userId}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  async invalidateAll(): Promise<void> {
    this.store.clear();
  }
}
```

### Injection Token

The cache is injected via a named token, not the class directly:

```typescript
// In AuthorizationModule:
{ provide: PERMISSION_CACHE, useClass: MemoryPermissionCache }

// In PermissionResolverService:
constructor(
  @Inject(PERMISSION_CACHE) private readonly cache: IPermissionCache,
) {}
```

This `@Inject(PERMISSION_CACHE)` pattern means swapping to a `RedisPermissionCache` requires only changing the module provider — `PermissionResolverService` code is unchanged.

### Cache Key Strategy

The cache key is `{userId}:{roleId}`. Using both identifiers means:
- If the same user is assigned a different role, the old permissions are not served (different roleId = different key)
- If two users share the same role, their permissions are cached separately (they may have individual overrides in future)

### TTL Strategy

Fixed TTL of 5 minutes. On expiry, the entry is lazily evicted on the next `get()` call — there is no background cleanup thread. This is correct for a low-churn cache where most entries are accessed frequently.

---

## Rationale

**Why an interface instead of directly using `MemoryPermissionCache`?**

The interface (`IPermissionCache`) decouples permission consumers from the specific cache implementation. This is a deliberate decision to make the caching infrastructure replaceable without touching business logic:

- **Now**: Single-instance in-memory cache
- **Future**: Multi-instance Redis distributed cache

Changing the implementation requires only modifying the `AuthorizationModule` provider — one line of code.

**Why 5-minute TTL?**

5 minutes was chosen as a balance between:
- **Security**: A permission revocation takes effect within 5 minutes without requiring explicit invalidation
- **Performance**: Reduces database reads by ~99% for active users
- **Cache coherence**: Short enough that stale permissions are a minor concern

**Why lazy TTL eviction?**

A background cleanup thread would add complexity and potential race conditions. For a fixed-size permission cache, the number of entries is bounded (one per active user session). Lazy eviction on read is simpler and sufficient.

**Why `async` methods on `MemoryPermissionCache`?**

The `IPermissionCache` interface declares all methods as `async` for Redis compatibility (network I/O is inherently async). The in-memory implementation technically doesn't need async, but implementing the same interface ensures the substitute-without-change guarantee holds.

**Why `userId:roleId` as the cache key and not just `userId`?**

A user's permissions depend on their role. If a user's role changes mid-session, the new role's permissions should be resolved on the next request. Using `userId:roleId` as the key means a role change naturally results in a cache miss (the old `userId:oldRoleId` entry is not found; a new `userId:newRoleId` entry is created).

---

## Consequences

**Positive:**
- Permission resolution database queries drop from 3/request to ~0/request for active users (after first request)
- Cache implementation is hot-swappable without changing `PermissionResolverService`
- TTL provides automatic eventual consistency even without explicit invalidation

**Negative:**
- In-memory cache is not shared across multiple application instances — each instance has its own cache
- Permission changes take up to 5 minutes to propagate unless explicit invalidation is triggered
- `Map<string, CacheEntry>` grows without bound if active user count is large (mitigated by TTL eviction)

**Trade-offs:**
- Single-instance cache is adequate for the current deployment model. When horizontal scaling is required, the interface makes migration straightforward.

**Future Implications:**
- **Redis implementation**: `RedisPermissionCache implements IPermissionCache` can be swapped in with one provider change in `AuthorizationModule`
- **Cache warming**: High-frequency users' permissions can be pre-warmed at login time
- **Event-driven invalidation**: A message broker (Redis pub/sub, RabbitMQ) can broadcast permission change events to all instances for immediate invalidation

---

## Related Components

- `src/modules/authorization/cache/memory-permission-cache.ts`
- `src/modules/authorization/interfaces/permission-cache.interface.ts`
- `src/modules/authorization/services/permission-resolver.service.ts`
- `src/modules/authorization/authorization.module.ts` — `PERMISSION_CACHE` token registration

---

## Alternatives Considered

### NestJS Cache Manager

NestJS provides `@nestjs/cache-manager` with configurable stores (memory, Redis). Not adopted because:
- It is designed for HTTP response caching, not domain object caching
- The interface is more complex than needed for the permission cache use case
- The custom interface gives more control over cache key strategy and TTL

### Redis Cache from the Start

Considered and rejected for the initial phase because:
- No multi-instance deployment requirement currently exists
- Redis adds operational complexity (connection string, health checks, failover)
- The interface-based design means Redis can be added when the requirement arises — no architectural debt

### No Cache (Direct DB on Every Request)

Viable at low load. Rejected because permission resolution adds 3 DB queries per request. Even at moderate load, this becomes a significant bottleneck. The cache is necessary infrastructure, not premature optimization.

---

## Future Evolution

- **Redis migration**: Replace `MemoryPermissionCache` with a Redis-backed implementation using the same interface — zero code changes outside `AuthorizationModule`
- **Granular invalidation**: When only screen permissions for one role change, only invalidate entries for users with that role (not all users)
- **Cache metrics**: Track cache hit rate, TTL evictions, and invalidation frequency for operational monitoring

---

## References

- `src/modules/authorization/cache/memory-permission-cache.ts`
- `src/modules/authorization/interfaces/permission-cache.interface.ts`
- ADR-013 (Permission Resolution) — how the cache is used
- ADR-012 (Authorization Architecture) — guard stack context
