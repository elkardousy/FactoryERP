# ADR-012 — Authorization Architecture

## Title

Stacked Guard Authorization with Deny-by-Default

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

An ERP system requires multi-dimensional access control:

1. **Role-based access**: Different roles (ADMIN, MANAGER, SUPERVISOR, OPERATOR) have access to different functional areas
2. **Screen-level permissions**: Within a functional area, specific actions (CREATE, READ, UPDATE, DELETE, APPROVE) may be permitted or denied per role
3. **Workflow approval permissions**: Certain operations require explicit approval authorization with time-bounded validity windows
4. **Deny by default**: An endpoint with no role annotation must not be publicly accessible

A single `@UseGuards()` decorator per controller is insufficient — it cannot express both role requirements and screen-permission requirements simultaneously.

---

## Decision

Authorization is implemented as a **stack of four global guards** registered in `AppModule`:

```typescript
// src/app.module.ts
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },           // 1. Rate limiting
  { provide: APP_GUARD, useClass: JwtAuthGuard },             // 2. Authentication
  { provide: APP_GUARD, useClass: RolesGuard },               // 3. Role check
  { provide: APP_GUARD, useClass: ScreenPermissionGuard },    // 4. Screen permission
]
```

Guards execute in the order they are registered. Each guard that returns `false` short-circuits subsequent guards.

### Guard 1: ThrottlerGuard

Rate limits all requests globally (60 requests per 60 seconds per IP). Prevents brute-force attacks on public endpoints (login).

### Guard 2: JwtAuthGuard

Authenticates every request by validating the Bearer JWT. Skips authentication for routes decorated with `@Public()`.

### Guard 3: RolesGuard

Enforces role-based access:

```typescript
// Deny-by-default logic:
if (!roles || roles.length === 0) {
  // No @Roles() on this endpoint
  return await this.authzService.isSystemRole(user);  // Only system roles pass
}
return await this.authzService.hasRole(user, ...roles);
```

Key behaviors:
- If `@Roles()` is specified: user must have one of the listed roles
- If `@Roles()` is absent: only system role users (`is_system_role = true`) can access
- **Deny by default**: No role annotation does NOT mean "public" — it means "system admin only"
- `@Public()` routes bypass ALL guards (handled in JwtAuthGuard)

### Guard 4: ScreenPermissionGuard

Enforces fine-grained screen-level permissions for endpoints decorated with `@RequireScreenPermission()`:

```typescript
// Optional guard: only fires when metadata is present
if (!screenCode || !permissionType) return true;  // Not required, pass through

const permissions = await this.permissionResolver.resolve(user);
const granted = permissions.screenPermissions.find(
  p => p.screenCode === screenCode && p.permissionType === permissionType
)?.isGranted ?? false;

if (!granted) throw new ForbiddenException(`Permission ${permissionType} on ${screenCode} is required.`);
```

### Decorator Suite

```typescript
@Public()                                    // Bypass all auth guards
@Roles('ADMIN', 'MANAGER')                   // Require one of these roles
@RequireScreenPermission('CUSTOMERS', 'CREATE')  // Require specific screen permission
```

### System Role Concept

A role flagged as `is_system_role = true` in the database is a system-level role that bypasses permission checks. System roles are for administrators who must have unrestricted access. A SYSTEM_ADMIN user can access any route without explicit `@Roles()` annotation.

---

## Rationale

**Why four stacked guards instead of a single authorization guard?**

Each guard handles a distinct authorization concern. Combining them would violate SRP and make the guard logic more complex and harder to test. The stacked approach allows each guard to be tested, modified, or replaced independently.

**Why global guards via `APP_GUARD` instead of per-controller guards?**

Global guards ensure authorization cannot be accidentally omitted. With per-controller guards, a new controller that forgets `@UseGuards()` is silently unprotected. With global guards, every endpoint is protected by default.

**Why deny-by-default for `RolesGuard` (no `@Roles()` = only system admins)?**

The alternative — no `@Roles()` means "any authenticated user" — would mean that adding a new undecorated endpoint silently grants access to all users. In an ERP where data sensitivity varies greatly between endpoints, this default is dangerous. Deny-by-default forces developers to explicitly declare who can access each endpoint.

**Why `ThrottlerGuard` as the first guard?**

Rate limiting must run before authentication to protect against login brute-force attacks. If `JwtAuthGuard` ran first, the authentication overhead (database read, bcrypt compare) would itself be a DDoS vector.

**Why is `ScreenPermissionGuard` optional (no-op when no metadata)?**

Role-based access (Guard 3) is mandatory on all non-public routes. Screen permission (Guard 4) is a finer-grained control layer for specific operations within a screen. Not all endpoints require screen-level permissions — the guard returns `true` when no `@RequireScreenPermission()` decorator is present.

---

## Consequences

**Positive:**
- Authorization cannot be accidentally omitted from any endpoint
- Each concern (rate limit, auth, role, permission) is independently testable
- Adding a new permission type (e.g., EXPORT) requires only a new `@RequireScreenPermission()` decorator and a database record — no code changes to guards
- System roles provide unrestricted admin access without special-casing throughout the codebase

**Negative:**
- Four database reads per authenticated request (user lookup in JWT strategy, role check, permission resolution) — mitigated by the permission cache (ADR-014)
- Developers must understand the guard stack to correctly annotate new endpoints
- Guard execution order is implicit — it depends on the order of `APP_GUARD` provider declarations in `AppModule`

**Trade-offs:**
- Explicit authorization declaration on every endpoint vs. convention-based access control. Explicit is chosen for safety in an ERP context.

**Future Implications:**
- **Field-level permissions**: A future guard could check permissions at the response field level (redacting sensitive fields for lower-privilege users)
- **Approval guard**: A fifth guard for workflow approval operations is already contemplated in the schema (approval_permissions table)
- **Context-sensitive permissions**: Geographic/warehouse-based access restrictions could be implemented as additional guards

---

## Related Components

- `src/modules/authorization/guards/roles.guard.ts`
- `src/modules/authorization/guards/screen-permission.guard.ts`
- `src/modules/auth/guards/jwt-auth.guard.ts`
- `src/app.module.ts` — guard registration
- `src/modules/authorization/decorators/roles.decorator.ts`
- `src/modules/authorization/decorators/require-screen-permission.decorator.ts`
- `src/core/constants/auth.constants.ts` — `IS_PUBLIC_KEY`, `ROLES_KEY`
- `src/modules/authorization/services/authorization.service.ts`

---

## Alternatives Considered

### Role-Permission Matrix in Code

A hardcoded role-permission matrix would be fast (no database read) but inflexible. ERP role configurations change as business requirements evolve. Database-driven permissions allow runtime reconfiguration without redeployment.

### Single Monolithic Authorization Guard

Combining all checks into one guard would reduce the provider array complexity. Rejected because:
- SRP violation — the guard would be responsible for rate limiting, authentication, role checking, and permission resolution
- Harder to test each concern independently
- Harder to disable one concern without affecting others

### NestJS Casl Integration

CASL is an attribute-based access control library. It supports fine-grained rules like "user X can READ customer Y if customer.assignedTo === user.id". Considered for resource-level access control. Not adopted because:
- Current requirements are role/screen-based, not attribute-based
- CASL adds complexity not yet justified
- Can be integrated later as an additional guard without changing existing guards

---

## Future Evolution

- **Resource-level access control**: CASL can be added as a fifth guard for ownership-based access (e.g., a supervisor can only see orders from their department)
- **Dynamic permission assignment**: Permissions can be assigned at runtime without code changes — new screens, new permission types
- **Audit of authorization decisions**: Guard execution results (granted/denied) can be logged to the audit system for compliance reporting

---

## References

- `src/modules/authorization/guards/roles.guard.ts`
- `src/modules/authorization/guards/screen-permission.guard.ts`
- `src/app.module.ts`
- ADR-010 (Authentication) — JwtAuthGuard context
- ADR-013 (Permission Resolution) — how permissions are loaded
- ADR-014 (Permission Cache) — how permission reads are optimized
