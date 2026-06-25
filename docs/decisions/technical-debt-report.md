# Technical Debt Report — Foundation Freeze

**Date:** 2026-06-26
**Scope:** Full source tree audit (`src/`)
**Methodology:** Static analysis — file inventory, grep, manual code review

This report catalogues known issues without making code changes. Each item is classified by severity and assigned a recommended action.

---

## Summary

| Category | Count |
|---|---|
| Empty stub files | 9 |
| Dead code (unused methods) | 2 |
| Deprecated code (kept by design) | 1 |
| Duplicate files | 1 |
| Unused constants | 2 |
| Critical runtime defects | 1 |
| Minor issues | 4 |

---

## 1. Empty Stub Files

Nine files exist in the `src/` tree with zero bytes. They were created as placeholders during architectural scaffolding and have not been implemented.

| File | Intended Purpose | Status |
|---|---|---|
| `src/core/interceptors/response.interceptor.ts` | Response envelope wrapper (`{ data, statusCode, timestamp }`) | **Sprint 9 — critical** |
| `src/core/responses/success-response.ts` | `SuccessResponse` class matching the success shape | **Sprint 9 — depends on interceptor** |
| `src/core/responses/api-response.interface.ts` | `ApiResponse<T>` interface for success shape | **Sprint 9 — depends on interceptor** |
| `src/core/config/config.module.ts` | Duplicate of `ConfigModule.forRoot()` in AppModule | **Delete** — functionality exists inline in `AppModule` |
| `src/core/exceptions/exceptions.module.ts` | Intended to register filters as DI providers | **Delete or implement** — filters currently registered imperatively in `main.ts` |
| `src/core/database/transactions/transaction.service.ts` | Custom transaction orchestration | **Delete** — `BaseRepository.executeInTransaction` covers this |
| `src/core/logger/logger.interceptor.ts` | HTTP request logging interceptor | **Delete** — HTTP logging handled automatically by `pinoHttp` in `loggerConfig` |
| `src/core/logger/logger.interface.ts` | Logger interface contract | **Delete or implement** — `LoggerService` works without it |
| `src/core/database/prisma/prisma-exception.filter.ts` | Originally housed the Prisma exception filter | **Delete** — canonical version is at `src/core/exceptions/filters/prisma-exception.filter.ts` |

**Impact:** None at runtime (empty files export nothing and import nothing). However, they pollute `ts-jest` coverage reports and create confusion about what is implemented.

---

## 2. Dead Code — Unused Methods

### 2a. `AuthService.login()`

**File:** [src/modules/auth/services/auth.service.ts](../../src/modules/auth/services/auth.service.ts) — line 64

```typescript
/** Kept so existing callers that pass a LoginDto still compile. */
async login(dto: LoginDto): Promise<users> {
  return this.validateUser(dto.username, dto.password);
}
```

**Issue:** This method has no callers anywhere in the codebase. `LoginUseCase` calls `validateUser()` directly. The comment references "existing callers" that no longer exist.

**Risk:** None at runtime. Risk is misleading future developers into thinking this method has a purpose.

**Recommended action:** Delete in Sprint 9. If a DTO-accepting entry point is needed, add it to the use case layer, not the service.

---

### 2b. `TokenService.verifyRefreshToken()`

**File:** [src/modules/auth/services/token.service.ts](../../src/modules/auth/services/token.service.ts) — line 52

```typescript
/** @deprecated Use compareRefreshToken — kept for backward compatibility */
async verifyRefreshToken(token: string, hash: string): Promise<boolean> {
  return this.compareRefreshToken(token, hash);
}
```

**Issue:** No callers anywhere in the codebase. `RefreshUseCase` uses `compareRefreshToken()` directly.

**Risk:** None at runtime. The `@deprecated` tag is accurate but unnecessary given there are no callers.

**Recommended action:** Delete in Sprint 9.

---

## 3. Deprecated Code (Retained by Design)

### 3a. `multiSchema` preview feature in `prisma/schema.prisma`

```prisma
generator client {
  previewFeatures = ["multiSchema"]
}
```

**Issue:** Prisma 6 deprecated the `multiSchema` preview feature flag — the functionality is now stable and the flag is no longer required. `npx prisma validate` emits a deprecation warning.

**Risk:** None at runtime. Prisma generates successfully. The warning will appear in every `prisma generate` and `prisma validate` call.

**Recommended action:** Remove `previewFeatures = ["multiSchema"]` from `schema.prisma` in Sprint 9 pre-work. Verify schema validates after removal.

---

## 4. Duplicate File

### 4a. `PrismaExceptionFilter` defined in two locations

| Location | Status |
|---|---|
| `src/core/exceptions/filters/prisma-exception.filter.ts` | **Canonical** — this is the version imported by `main.ts` |
| `src/core/database/prisma/prisma-exception.filter.ts` | **Empty file** — zero bytes, but the path implies it should contain the filter |

**Issue:** The empty file at the database path was the original location. The implementation was moved to `core/exceptions/filters/` during architectural cleanup but the empty placeholder was not removed.

**Risk:** No runtime impact (empty file). Confusing during codebase exploration.

**Recommended action:** Delete `src/core/database/prisma/prisma-exception.filter.ts`.

---

## 5. Unused Constants

### 5a. `ACCESS_TOKEN_MINUTES` and `REFRESH_TOKEN_DAYS`

**File:** [src/core/constants/auth.constants.ts](../../src/core/constants/auth.constants.ts)

```typescript
export const ACCESS_TOKEN_MINUTES = 15;
export const REFRESH_TOKEN_DAYS = 7;
```

**Issue:** Neither constant is imported or used anywhere. `TokenService` reads token lifetimes from `ConfigService` (`jwt.expiresIn`, `jwt.refreshExpiresIn`) as string values (e.g., `"15m"`, `"7d"`). The numeric constants serve no purpose.

**Risk:** None at runtime.

**Recommended action:** Delete in Sprint 9 if the `ms`-based config approach is confirmed as the canonical pattern. Alternatively, if numeric constants are needed for `ms()` conversions, wire them into the config factory.

---

## 6. Critical Runtime Defect

### 6a. BigInt fields in HTTP responses

**Affected files:**
- [src/modules/auth/use-cases/login/contracts/login-result.interface.ts](../../src/modules/auth/use-cases/login/contracts/login-result.interface.ts)
- [src/modules/auth/use-cases/login/contracts/jwt-payload.interface.ts](../../src/modules/auth/use-cases/login/contracts/jwt-payload.interface.ts)

**Issue:** `LoginResult.user.userId`, `LoginResult.user.roleId`, `LoginResult.sessionId` are typed as `bigint`. The `JwtPayload` fields `sub`, `roleId`, `sessionId` are also `bigint`.

Node.js `JSON.stringify` throws `TypeError: Do not know how to serialize a BigInt` when it encounters a BigInt value. NestJS serializes HTTP responses via `JSON.stringify`. `@nestjs/jwt`'s `signAsync()` also uses `JSON.stringify` internally.

**Result:** `POST /v1/auth/login` will throw a 500 Internal Server Error on every call in a live environment.

**Why tests pass:** Unit tests mock `TokenService.generateAccessToken()` and `SessionService.createSession()` — they never exercise HTTP serialization or JWT signing with real BigInt values.

**Why the build passes:** TypeScript `bigint` is a valid type; there is no compile-time check for JSON serializability.

**Recommended fix (Sprint 9, Phase 1):**
1. Add `BigInt.prototype.toJSON = function() { return this.toString(); }` in `main.ts` bootstrap before `NestFactory.create()`.
2. Implement `ResponseInterceptor` with a BigInt-aware JSON replacer.
3. Convert `LoginResult` and `JwtPayload` BigInt fields to `string` at the serialization boundary.
4. Add an integration test that calls `POST /v1/auth/login` against a live NestJS app (with mocked Prisma) and asserts the response body parses as valid JSON.

**Priority:** This must be resolved before Sprint 9 proceeds. No auth endpoint is functional without this fix.

---

## 7. Minor Issues

### 7a. `findActiveById` loads unnecessary `roles` relation

**File:** [src/modules/auth/repositories/users.repository.ts](../../src/modules/auth/repositories/users.repository.ts) — line 20

```typescript
async findActiveById(userId: bigint): Promise<users | null> {
  return this.db.users.findFirst({
    where: { user_id: userId, is_active: true, status: UserStatusEnum.ACTIVE },
    include: { roles: true },   // ← unnecessary for JwtStrategy
  });
}
```

`findActiveById` is called by `JwtStrategy.validate()` on every authenticated request. The strategy only checks `locked_at !== null`. Loading the full `roles` record is wasted I/O.

**Recommended action:** Replace `include: { roles: true }` with `select: { user_id: true, locked_at: true, is_active: true, status: true }`. Sprint 9 optimization.

---

### 7b. `AuthModule` exports `JwtService` prematurely

**File:** [src/modules/auth/auth.module.ts](../../src/modules/auth/auth.module.ts) — line 71

```typescript
exports: [AuthService, JwtAuthGuard, JwtService, UsersRepository],
```

`JwtService` (the wrapper over `@nestjs/jwt`) is exported but no other module currently imports it. This export is defensive rather than required.

**Recommended action:** Keep for now (export overhead is zero). Remove if Sprint 9 confirms no module needs it.

---

### 7c. CORS allows all origins

**File:** [src/main.ts](../../src/main.ts) — line 23

```typescript
app.enableCors({ exposedHeaders: ['X-Correlation-ID'] });
```

No `origin` option specified — defaults to `*` (all origins allowed). Acceptable for development. A production ERP should restrict origins.

**Recommended action:** Add `ALLOWED_ORIGINS` to `env.validation.ts`. Sprint 9 improvement.

---

### 7d. Session revocation does not invalidate outstanding access tokens

By design, `POST /v1/auth/logout` marks the session as REVOKED in the database. The outstanding access token continues to be valid (JWT signature and expiry intact) until it expires. `JwtStrategy` currently validates only account status (`is_active`, `locked_at`) — not session status.

An access token issued to a user who then logs out will continue to pass `JwtStrategy.validate()` until the token expires (default: up to 15 minutes).

This is a known architectural gap documented in ADR-003. The mitigation is the 15-minute access token TTL. Full session-level invalidation requires checking session status in `JwtStrategy` — tracked for Sprint 9.

---

## Recommended Resolution Order

| Sprint | Action |
|---|---|
| Sprint 9 Pre-work | Fix BigInt serialization (6a) — **blocks all HTTP testing** |
| Sprint 9 Pre-work | Remove `multiSchema` preview flag (3a) |
| Sprint 9 Phase 1 | Delete 9 empty stub files (1) |
| Sprint 9 Phase 1 | Delete duplicate Prisma filter file (4a) |
| Sprint 9 Phase 1 | Delete dead methods `login()` and `verifyRefreshToken()` (2a, 2b) |
| Sprint 9 Phase 2 | Implement `ResponseInterceptor` and `SuccessResponse` |
| Sprint 9 Phase 3 | Optimize `findActiveById` select clause (7a) |
| Sprint 9 Phase 3 | Add session revocation check to `JwtStrategy` (7d) |
| Sprint 9 Phase 4 | Add `ALLOWED_ORIGINS` env config (7c) |
| Sprint 9 Phase 4 | Remove or wire `ACCESS_TOKEN_MINUTES` constants (5a) |
