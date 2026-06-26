# ADR-013 — Permission Resolution

## Title

Lazy Permission Resolution with Composite Resolved Permissions Contract

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The authorization system requires resolving a user's permissions on every authenticated request. The permissions are stored across multiple database tables:
- Role assignments (user → role)
- Permission codes (role → permission_codes)
- Screen permissions (role → screen_code + permission_type + is_granted)
- Approval permissions (role → workflow_template + valid_from + valid_to)

Querying all of these tables on every request would add significant database load, especially for high-frequency operations like dashboard polling or inventory lookups.

At the same time, permissions change infrequently (typically only when an administrator modifies role configurations). Pre-loading all permissions at startup is not appropriate because:
- User-role assignments are per-user, not global
- There may be thousands of users with different role assignments
- A new user's permissions must be resolvable immediately after account creation

---

## Decision

**Lazy permission resolution** with an injectable `PermissionResolverService`:

### PermissionResolverService

On first access for a given `(userId, roleId)` pair:

```typescript
async resolve(user: JwtPayload): Promise<ResolvedPermissions> {
  // Check cache first
  const cached = await this.cache.get(user.sub, user.roleId);
  if (cached) return cached;

  // Load from database
  const role = await this.authzRepo.findRoleWithPermissions(user.roleId);
  const screenPerms = await this.authzRepo.findScreenPermissions(user.roleId);
  const approvalPerms = await this.authzRepo.findApprovalPermissions(user.roleId);

  const resolved: ResolvedPermissions = {
    userId: user.sub,
    roleId: user.roleId,
    roleCode: role.role_code,
    isSystemRole: role.is_system_role,
    permissionCodes: role.role_permissions.map(p => p.permission_code),
    screenPermissions: screenPerms,
    approvalPermissions: approvalPerms,
    resolvedAt: new Date(),
  };

  await this.cache.set(user.sub, user.roleId, resolved);
  return resolved;
}
```

### ResolvedPermissions Contract

The `ResolvedPermissions` interface is the single comprehensive permission object passed around within the authorization layer:

```typescript
interface ResolvedPermissions {
  userId: bigint;
  roleId: bigint;
  roleCode: string;
  isSystemRole: boolean;
  permissionCodes: string[];
  screenPermissions: Array<{
    screenCode: string;
    permissionType: string;
    isGranted: boolean;
  }>;
  approvalPermissions: Array<{
    workflowTemplateCode: string;
    validFrom: Date;
    validTo: Date;
  }>;
  resolvedAt: Date;
}
```

### System Role Short-Circuit

System roles bypass permission resolution entirely in guards:

```typescript
// RolesGuard:
async isSystemRole(user: JwtPayload): Promise<boolean> {
  const permissions = await this.permissionResolver.resolve(user);
  return permissions.isSystemRole;
}
```

When `isSystemRole === true`, `ScreenPermissionGuard` and role checks are bypassed.

### Cache Invalidation

The resolved permissions cache is invalidated when:
1. A user's role is changed (triggers `PermissionResolverService.invalidateForUser(userId)`)
2. A role's permissions are modified (triggers `PermissionResolverService.invalidateForRole(roleId)`)
3. The TTL (5 minutes) expires naturally

---

## Rationale

**Why lazy resolution instead of eager loading?**

Eager loading at startup requires knowing all users and their roles. With a growing user base, this becomes impractical. Lazy loading resolves permissions only when a user is actually accessing the system, with caching to amortize the cost.

**Why a composite `ResolvedPermissions` object rather than separate service calls?**

Separate calls (one for role check, one for screen permission) would require multiple cache lookups and potentially multiple database queries per request. A composite object resolves all permissions in one query set, cached as one unit. Guards receive the complete picture in one call.

**Why include `resolvedAt` in the resolved permissions?**

The `resolvedAt` timestamp enables cache debugging and time-based cache invalidation strategies. It can also be logged alongside authorization decisions for audit trail purposes.

**Why is approval permission validation time-bounded with `validFrom`/`validTo`?**

Manufacturing ERP approval workflows have temporal constraints. A temporary approver (e.g., covering for a manager on leave) must have their authorization automatically expire. Storing validity windows in the database means the permission resolver handles expiry naturally — expired windows are simply not included in the resolved permissions.

**Why a separate `AuthorizationRepository` rather than using the users repository?**

Permission-related queries (role_permissions, screen_permissions, approval_permissions joins) are logically distinct from user authentication queries. Separating them into `AuthorizationRepository` follows the single-responsibility principle and keeps the user repository focused on authentication concerns.

---

## Consequences

**Positive:**
- First request per user incurs one permission resolution (3 database queries); subsequent requests are served from cache
- All guards access the same resolved object — no redundant database reads within a single request
- Time-bounded approval permissions expire without requiring administrative cleanup
- The composite `ResolvedPermissions` contract is stable across guard implementations

**Negative:**
- Cache invalidation must be explicitly triggered when role configurations change
- If the cache is not invalidated after a permission change, users may retain old permissions for up to the TTL (5 minutes)
- The 3 database queries on first access add latency for cold cache requests

**Trade-offs:**
- 5-minute permission cache TTL is a conservative trade-off between performance and security. Lowering it reduces the window for stale permissions but increases database load.

**Future Implications:**
- **Distributed cache**: When deployed across multiple instances, the in-memory cache must be replaced with a distributed cache (Redis) to prevent permission inconsistency between instances
- **Permission streaming**: Real-time permission updates could be pushed to clients/servers via WebSockets or Server-Sent Events, triggering immediate cache invalidation

---

## Related Components

- `src/modules/authorization/services/permission-resolver.service.ts`
- `src/modules/authorization/repositories/authorization.repository.ts`
- `src/modules/authorization/contracts/resolved-permissions.interface.ts`
- `src/modules/authorization/guards/screen-permission.guard.ts`
- `src/modules/authorization/guards/roles.guard.ts`
- `src/modules/authorization/cache/memory-permission-cache.ts`
- `prisma/schema.prisma` — `role_permissions`, `screen_permissions`, `approval_permissions` tables

---

## Alternatives Considered

### Eager Loading at Startup

Rejected. Does not scale with user count. Permission changes require service restart to take effect.

### Per-Request Database Query (No Cache)

Viable at small scale. At 100+ concurrent users and 100+ requests/second, the ~3 extra database queries per request become a measurable bottleneck. The cache is not premature optimization — it is planned infrastructure.

### ABAC (Attribute-Based Access Control) Library

Libraries like CASL compute permissions from rules applied to resource attributes. Considered for resource-level permissions (e.g., "user can only see their own department's orders"). Not adopted because screen-based permissions cover current requirements. Can be layered on top of the current system.

---

## Future Evolution

- **Redis-backed permission cache**: Replace `MemoryPermissionCache` with a `RedisPermissionCache` implementation using the same `IPermissionCache` interface — zero impact on guards or `PermissionResolverService`
- **Permission change notifications**: Pub/sub messages when role permissions change can trigger immediate cache invalidation across all instances
- **Granular resource permissions**: The `approvalPermissions` section of `ResolvedPermissions` can be extended to include resource-level access rules

---

## References

- `src/modules/authorization/services/permission-resolver.service.ts`
- `src/modules/authorization/contracts/resolved-permissions.interface.ts`
- ADR-012 (Authorization Architecture) — guard stack context
- ADR-014 (Permission Cache) — cache implementation details
