# Foundation Freeze Report

**Project:** Factory ERP — Backend API
**Freeze Date:** 2026-06-26
**Baseline Commit:** `00e8e14` (refactor(auth): finalize login use case architecture)
**Status:** Foundation Frozen — ready for Authorization and ERP modules

---

## Executive Summary

The Factory ERP backend has completed its foundation phase. Sprints 1–8 delivered the infrastructure, database layer, and authentication system. The platform now has a stable, documented baseline from which ERP feature modules can be built incrementally.

One critical runtime defect is known (BigInt JSON serialization) and must be resolved as pre-work before Sprint 9 begins. All other findings are minor improvements that do not block forward progress.

---

## Platform Inventory at Freeze

### Technology Stack

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js / TypeScript | ES2023 target |
| Framework | NestJS | ^11.0.1 |
| ORM | Prisma | ^6.16.2 |
| Database | PostgreSQL | — (multiSchema via `factory` schema) |
| Authentication | Passport + JWT | `@nestjs/passport ^11`, `@nestjs/jwt ^11` |
| Validation | class-validator + class-transformer | ^0.15.1 / ^0.5.1 |
| Logging | nestjs-pino | ^4.6.1 |
| Rate Limiting | @nestjs/throttler | ^6.5.0 |
| Security | helmet + compression | ^8.2.0 / ^1.8.1 |
| API Docs | @nestjs/swagger | ^11.4.4 |
| Password Hashing | bcrypt | ^6.0.0 |
| Testing | Jest + ts-jest | — |
| Module Resolution | `nodenext` | — |

### Modules Completed

| Module | Status | Description |
|---|---|---|
| `AppModule` | Complete | Root module, global config, throttler, middleware |
| `PrismaModule` | Complete | Global DB service, health check |
| `LoggerModule` | Complete | Global structured logging (Pino) |
| `AuthModule` | Complete | Login, Refresh, Logout, JwtStrategy, Session management |

### Modules Pending (Future Sprints)

| Module | Priority |
|---|---|
| User Management | Sprint 9 |
| Roles & Permissions (Authorization) | Sprint 9 |
| Inventory | Sprint 10+ |
| Production Orders | Sprint 10+ |
| Packing | Sprint 10+ |
| Reports / KPIs | Sprint 12+ |

---

## Score Card

### Architecture — 9 / 10

The layered architecture is clean and strictly enforced: Controllers → Use Cases → Services → Repositories → PrismaService. No violations found. Module boundaries are correct. Dependency direction is inward throughout. SOLID principles are applied appropriately.

**Strengths:**
- Clean Architecture with explicit use-case layer
- Repository pattern correctly isolates all database access
- Global modules (Prisma, Logger, Config) reduce boilerplate in feature modules
- URI versioning applied consistently (`/v1/` prefix on all routes)
- `BaseRepository.executeInTransaction<T>()` provides a clean transaction API

**Deductions:**
- `ResponseInterceptor` is a stub (−0.5) — no consistent success response envelope
- One empty file at a duplicate path creates minor navigational confusion (−0.5)

---

### Security — 7.5 / 10

The security posture is solid for the foundation sprint. Core mechanisms are correctly implemented. Known gaps are documented and prioritized.

**Strengths:**
- bcrypt (cost factor 12) for passwords and refresh token hashes
- Composite refresh token format enables O(1) session lookup
- Token rotation — stale refresh tokens are immediately invalidated on next use
- JwtStrategy re-validates user account in the database on every request
- Failed login counter with reset on success
- Lock detection at login AND at per-request validation
- Helmet, CORS, rate limiting (10 req/60s on login) applied
- Sensitive headers (`Authorization`, `Cookie`, `Set-Cookie`) redacted in logs
- Audit trail for all authentication events

**Deductions:**
- No account auto-lock after N failures (−0.5) — counter is tracked but never triggers a lock
- No refresh token theft detection (−0.5) — RFC 6819 family invalidation not implemented
- Access token not invalidated on logout (−0.5) — session is revoked but valid JWTs remain usable until expiry
- CORS allows all origins in current config (−0) — acceptable for development, noted for production

---

### Maintainability — 7.5 / 10

The codebase is readable, consistently structured, and well-tested for the implemented features.

**Strengths:**
- Consistent naming conventions across all layers
- Barrel files (`index.ts`) with correct `export type {}` patterns
- 19 unit tests covering critical authentication paths
- CLAUDE.md documents key conventions and known constraints
- ADR documents capture the reasoning behind non-obvious decisions

**Deductions:**
- 9 empty stub files pollute the directory tree (−0.5)
- 2 dead methods (`AuthService.login`, `TokenService.verifyRefreshToken`) (−0.5)
- Test coverage is surface-level — no integration tests, no e2e tests (−0.5)
- BigInt serialization defect would require a future developer to discover the cause without documentation if this report did not exist (−0)

---

### Scalability — 6.5 / 10

The architecture is sound for the current load but has known bottlenecks that need addressing before production.

**Strengths:**
- Stateless JWT access tokens — horizontal scaling requires no shared session state
- Prisma connection pooling is managed by the client
- Database indices on `user_sessions(user_id, status)` and `users(user_id)` (PK)
- `revokeAllByUserId` uses `updateMany` — single query for bulk revocation

**Deductions:**
- JwtStrategy queries the database on every authenticated request with an unnecessary `roles` join (−1.0) — high-frequency path
- No caching layer (Redis) — every JWT validation is a database hit (−0.5)
- `session_policy` table (with `max_concurrent_sessions`, idle timeout) exists but is not consulted (−0.5)
- No read replicas or query optimization strategy for the reporting queries to come (−0.5)

---

### Performance — 7 / 10

Login, refresh, and logout flows execute clean single-query patterns. The per-request JwtStrategy overhead is the main concern.

**Strengths:**
- Login flow: ~4 database queries (findActiveUser, createSession, updateLastLogin, auditCreate — best-effort)
- Refresh flow: ~4 database queries (findSession, findActiveById, updateSession, auditCreate — best-effort)
- No N+1 patterns in any auth flow
- Prisma's native connection pool is active

**Deductions:**
- `findActiveById` (called on every request) loads `roles` relation — one unnecessary join per request (−1.0)
- Auth endpoints return `Date` objects in the response (`accessExpiresAt`, `refreshExpiresAt`) — serialization cost is minimal but these are computed at sign time rather than derived from JWT claims (−0)
- Pino's `autoLogging: true` logs every request + response — appropriate for development, may need sampling in production (−0)

---

### ERP Readiness — 6 / 10

The database schema is ERP-grade (80+ models, full partitioned audit table, session policy). The application layer is ready for the next module. One critical defect blocks HTTP functionality today.

**Strengths:**
- Schema covers the full ERP domain (Inventory, Production, Packing, CMO, Shipping, HRMS, Machine, Workflow)
- Audit trail table with composite PK (partitioned for scale)
- Session policy table for role-level session constraints
- Password history table for policy enforcement
- `multiSchema` PostgreSQL namespacing
- Swagger UI at `/api/docs` with JWT bearer auth

**Deductions:**
- **BigInt serialization defect** (−2.0) — application cannot complete a login request at runtime
- `ResponseInterceptor` stub — no consistent success response shape (−0.5)
- `system_config` table exists for policy-driven settings but is not wired to any application logic (−0.5)
- No health check endpoint exposed (`DatabaseHealthService` exists but no controller wraps it) (−0.5)
- CORS wildcard (−0) — acceptable for current state

---

## Overall Grade

| Dimension | Score |
|---|---|
| Architecture | 9.0 / 10 |
| Security | 7.5 / 10 |
| Maintainability | 7.5 / 10 |
| Scalability | 6.5 / 10 |
| Performance | 7.0 / 10 |
| ERP Readiness | 6.0 / 10 |
| **Weighted Average** | **7.2 / 10** |

**Grade: B+ — Frozen with one critical condition**

The architecture is excellent. The security foundation is solid. The primary blocker is the BigInt serialization defect which was discovered during the Sprint 8 acceptance review. It does not represent a design flaw — it is a missing serialization bridge between Prisma's BigInt representation and JSON output.

---

## Blocking Condition for Sprint 9

> **Fix BigInt JSON serialization before writing any Sprint 9 code.**

The minimum viable fix (one line in `main.ts`):

```typescript
// Before NestFactory.create():
Object.defineProperty(BigInt.prototype, 'toJSON', {
  get() { return () => this.toString(); },
});
```

The full recommended fix (Sprint 9 Phase 1):
1. Apply the `BigInt.prototype.toJSON` patch.
2. Implement `ResponseInterceptor` with a BigInt-safe JSON replacer registered as `APP_INTERCEPTOR`.
3. Write an integration test confirming `POST /v1/auth/login` returns parseable JSON.

---

## Non-Blocking Improvements (Sprint 9 Scope)

In priority order:

1. Remove 9 empty stub files and the duplicate `prisma-exception.filter.ts`
2. Delete `AuthService.login()` and `TokenService.verifyRefreshToken()`
3. Remove `multiSchema` preview feature flag from `schema.prisma`
4. Implement `ResponseInterceptor` and `SuccessResponse`
5. Optimize `findActiveById` to use `select` instead of `include: { roles: true }`
6. Add account auto-lock after N failed attempts (read threshold from `system_config`)
7. Add session revocation check to `JwtStrategy.validate()`
8. Restrict CORS origins via `ALLOWED_ORIGINS` env variable
9. Wire `session_policy` `max_concurrent_sessions` in `LoginUseCase`
10. Add health check endpoint exposing `DatabaseHealthService`

---

## Foundation Files Frozen at This Baseline

The following files form the authoritative foundation. Changes to these files in future sprints require an architecture review:

| File | Role |
|---|---|
| `src/main.ts` | Bootstrap — global middleware, filters, pipes, versioning |
| `src/app.module.ts` | Root module — global config, throttler, middleware wiring |
| `src/core/config/env.validation.ts` | Required environment variables — extend but do not remove |
| `src/core/config/configuration.ts` | Config factory aggregation |
| `src/core/database/prisma/prisma.service.ts` | DB connection lifecycle |
| `src/core/database/repositories/base/base.repository.ts` | Repository base class |
| `src/core/exceptions/filters/all-exceptions.filter.ts` | Global catch-all filter |
| `src/core/exceptions/filters/prisma-exception.filter.ts` | Prisma error mapping |
| `src/core/logger/logger.config.ts` | Logging configuration and redaction rules |
| `src/core/pipes/validation.pipe.ts` | Global input validation |
| `src/core/middleware/correlation-id.middleware.ts` | Request correlation |
| `src/modules/auth/auth.module.ts` | Auth module wiring |
| `prisma/schema.prisma` | Database schema — all 80+ models |
| `CLAUDE.md` | Developer conventions — update when architecture changes |
