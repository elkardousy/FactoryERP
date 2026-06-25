# ADR-002 — Authentication Architecture

**Status:** Accepted
**Date:** 2026-06-26
**Deciders:** Principal Architect
**Applies to:** `src/modules/auth/`

---

## Context

The ERP system requires a secure, enterprise-grade authentication mechanism. The application is a multi-user, role-based system where each user session must be individually trackable and revocable. Requirements:

1. Users authenticate with username and password.
2. Authenticated state is carried via short-lived tokens (not server-side sessions).
3. Long-lived access must be supported without requiring frequent re-login (refresh tokens).
4. A single compromised credential must not persist indefinitely — sessions must be revocable.
5. Audit trail for all authentication events.
6. Account security: lock detection, failed login tracking, forced password change.

The key architectural question is **where to put business logic** — in services, in controllers, or in a dedicated layer.

---

## Decision

Implement a **Use Case layer** between controllers and services. Each authentication operation (login, refresh, logout) has a dedicated use-case class that owns the full flow end-to-end.

**Layer assignments:**

| Layer | Class | Responsibility |
|---|---|---|
| Controller | `AuthController` | Parse request, call one use case, return result |
| Use Case | `LoginUseCase` | Orchestrate the login flow (7 steps) |
| Use Case | `RefreshUseCase` | Orchestrate token rotation (7 steps) |
| Use Case | `LogoutUseCase` | Orchestrate session revocation |
| Service | `AuthService` | Reusable: credential validation, account lookup |
| Service | `TokenService` | Reusable: JWT generation, refresh token hashing |
| Service | `SessionService` | Reusable: session lifecycle management |
| Service | `PasswordService` | Reusable: bcrypt hash and verify |
| Service | `JwtService` | Thin wrapper over `@nestjs/jwt` |
| Repository | `UsersRepository` | DB access: users table |
| Repository | `UserSessionsRepository` | DB access: user_sessions table |
| Repository | `AuditRepository` | DB access: audit_events table (append-only) |

**Composite refresh token format:** `"<sessionId>:<rawUUID>"`

The session ID prefix enables O(1) session lookup by primary key. The raw UUID suffix is compared against the bcrypt hash stored in `user_sessions.refresh_token_hash`. The full composite string is sent to the client and returned on refresh; only the hash is persisted server-side.

**Two-pass JWT signing at login:**

Session creation requires a DB `INSERT` before the `session_id` is known. The access token payload requires `sessionId`. Therefore:
1. Generate a token pair with `sessionId: BigInt(0)` as a placeholder.
2. Create the session — the DB returns the real `session_id`.
3. Re-sign the access token with the correct `sessionId` in the payload.

**Audit events are best-effort:**

All `AuditRepository.create()` calls are wrapped in `try/catch` with an empty catch block. An audit write failure must never block the authentication response.

---

## Alternatives Considered

### A — Put all login logic directly in AuthService
Simple at first. Rejected because a single `AuthService` accumulates all auth responsibilities over time (login, refresh, logout, password change, MFA, social login). The service becomes untestable as a unit and difficult to extend without affecting existing callers.

### B — Put all logic in the Controller
Rejected outright. Controllers handle HTTP — they should not contain business rules.

### C — One giant use case class for all auth operations
Rejected. A `AuthUseCase` with `login()`, `refresh()`, `logout()` methods is just a renamed service. The use case pattern works best when each class has a single, testable flow.

### D — Stateless refresh tokens (no DB storage)
Refresh tokens can be implemented as long-lived JWTs with a separate secret. This eliminates the `user_sessions` table. Rejected because:
- Per-session revocation becomes impossible without a blocklist.
- Token theft has no server-side mitigation.
- ERP audit requirements demand a session audit trail.

---

## Consequences

**Positive:**
- Each use case is independently testable with simple mocks (no HTTP, no database).
- The 7-step login flow is fully visible in one file (`login.use-case.ts`).
- Services (`TokenService`, `SessionService`) are reusable across multiple use cases.
- Audit events are recorded for every auth operation without coupling to any single class.
- Session revocation (`revokeAllByUserId`) is available for forced-logout scenarios.

**Negative / Trade-offs:**
- More files and more classes than a simpler service-only approach.
- The two-pass JWT signing (placeholder then re-sign) is non-obvious. Documented in comments and sprint reports.
- `AuditRepository` is injected into use cases rather than being a cross-cutting concern (AOP). This means audit calls are scattered across use-case implementations. Acceptable at this scale.
- BigInt fields in `LoginResult` and `JwtPayload` will cause `JSON.stringify` errors at runtime. Tracked as a critical known limitation (Sprint 9 backlog: implement `ResponseInterceptor` with BigInt serializer).
