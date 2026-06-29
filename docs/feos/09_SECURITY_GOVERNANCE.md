# 09 — Security Governance

**Document:** FEOS-09  
**Category:** Security  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per major phase completion  
**Related FEOS:** FEOS-03 (Architecture Governance), FEOS-07 (Code Governance)  
**Related KEB:** KEB-02 (Architecture Baseline), KEB-11 (Risk Register)

---

## Purpose

This document governs authentication, authorization, secrets management, audit logging, sensitive data handling, and security review requirements for FactoryERP. It defines what the security model is, how it is enforced, and what constitutes a security violation.

## Scope

All endpoints, services, database credentials, environment variables, and data handling in FactoryERP.

## Audience

All engineers and AI agents. Security rules in this document carry the same weight as architectural rules.

---

## Authentication Architecture

### JWT Authentication

FactoryERP uses JWT (JSON Web Tokens) with Passport.js for authentication:

| Property | Value |
|----------|-------|
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| Token algorithm | HS256 (HMAC SHA-256) |
| Strategy | `JwtStrategy` (`passport-jwt`) |
| Guard | `JwtAuthGuard` |
| Public endpoints | `/v1/auth/login`, `/v1/auth/refresh` |

### Token Flow

1. Client sends credentials to `POST /v1/auth/login`.
2. `AuthService` verifies credentials against hashed password.
3. On success, `TokenService` issues access token + refresh token pair.
4. Client uses access token in `Authorization: Bearer <token>` header.
5. On access token expiry, client calls `POST /v1/auth/refresh` with refresh token.
6. On logout, `SessionService` marks the session as revoked.

### Authentication Rules

1. Every endpoint requires authentication unless decorated with `@Public()`.
2. `@Public()` must be explicitly declared — the default is authenticated.
3. JWT secret is read from `ConfigService` at namespace `jwt.secret` — never from `process.env.JWT_SECRET` directly.
4. Expired tokens are rejected — no grace periods.
5. Token signatures are not bypassed for any reason in any environment.

---

## Authorization Architecture

### Role-Based Authorization

FactoryERP has 5 roles defined in `RoleEnum`:

| Role | Privileges |
|------|-----------|
| `SUPER_ADMIN` | Full access |
| `ADMIN` | Administrative operations |
| `MANAGER` | Management operations |
| `SUPERVISOR` | Supervisory operations |
| `OPERATOR` | Standard operator access |

Role assignments are stored in the `user_roles` table. A user may have multiple roles.

### Screen Permission Authorization

Beyond roles, FactoryERP enforces screen-level CRUD permissions:

- Each screen (functional area) has a `screen_name`.
- Each permission is a combination of `screen_name` + `action` (CREATE, READ, UPDATE, DELETE).
- Permissions are granted per role and stored in the `role_permissions` table.
- `ScreenPermissionGuard` checks the required screen + action before allowing the request.

### Guard Stack

All guards run in this order:

```
ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
```

A request failing any guard is rejected with the appropriate error before reaching the controller.

### Permission Cache

`MemoryPermissionCache` stores role permissions in memory to avoid repeated database lookups. Cache staleness is an open risk (GAP-008, RISK-006 in KEB). If roles or permissions change in the database, the cache does not automatically invalidate. This limitation is documented and must be resolved before production deployment.

### Authorization Rules

1. Every controller (except auth controllers) must have `@ApiBearerAuth('JWT')`.
2. Role restrictions use `@Roles()` decorator.
3. Screen restrictions use `@ScreenPermission()` decorator.
4. No hardcoded role checks in business logic — use the guard system.
5. No endpoint may bypass the permission check by catching `ForbiddenException`.

---

## Secrets Management

### Environment Variables

FactoryERP requires these secrets in environment variables (validated by Joi at startup):

| Variable | Purpose | Required |
|----------|---------|---------|
| `NODE_ENV` | Environment (`development`/`production`) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | Access token expiry (e.g., `15m`) | Yes |
| `REFRESH_EXPIRES_IN` | Refresh token expiry (e.g., `7d`) | Yes |

### Secrets Rules

1. Secrets are never committed to the repository.
2. Secrets are not logged, even at debug level.
3. `JWT_SECRET` must be a cryptographically random value, minimum 32 characters.
4. Database passwords must not appear in git history.
5. The `postgres` superuser password must never appear in a connection URL in any committed file (use `PGPASSWORD` env var only).
6. `.env` files are in `.gitignore` and must never be committed.
7. Prisma CLI commands that require `DATABASE_URL` use the shell environment variable only.

### Configuration Validation

`src/core/config/env.validation.ts` validates all required environment variables using Joi at application startup. Missing or invalid variables cause startup failure with a clear error message — they never silently default to undefined.

---

## Audit Logging

### AuditModule

`AuditModule` is global. `AuditService` logs to the `audit_events` table. All sensitive operations must be audited.

### What Must Be Audited

At minimum:
- Login attempts (success and failure).
- Logout events.
- Token refresh.
- Any data mutation (CREATE, UPDATE, DELETE) on business entities.
- Permission changes (role assignments, permission grants).

### Audit Event Fields

| Field | Purpose |
|-------|---------|
| `event_id` | Unique identifier |
| `occurred_at` | Composite PK with `event_id` |
| `user_id` | Who performed the action |
| `action` | What was done |
| `entity_type` | What was acted upon |
| `entity_id` | ID of the entity |
| `payload` | JSON details of the change |
| `ip_address` | Source IP (Unsupported("inet") — raw SQL needed) |

---

## Sensitive Data Handling

### What Is Sensitive

- Passwords (always bcrypt-hashed, never stored in plaintext).
- JWT tokens (not logged).
- Session tokens (not logged).
- IP addresses (stored in audit log, not in application logs).
- User personal identifiable information (names, emails).

### Automatic Header Redaction

The logging configuration (via `nestjs-pino`) automatically redacts these headers:

- `authorization`
- `cookie`
- `set-cookie`

These headers never appear in application logs.

### Password Handling

Passwords are hashed with `bcrypt` via `PasswordService`. Rules:

1. Plain-text passwords never leave the `PasswordService`.
2. Password hashes are never returned in API responses.
3. Password comparison uses `bcrypt.compare()` — no manual hash comparison.

---

## CORS Policy

CORS is enabled in `main.ts`. At FEOS 1.0, allowed origins use default settings (GAP-021 in KEB-19). Before production deployment, CORS must be configured with:

1. An explicit allowed origins whitelist.
2. Credentials policy aligned with the frontend's cookie/header approach.

---

## Rate Limiting

`ThrottlerModule` is configured globally: 60 requests per 60 seconds per IP address. This is the first guard in the stack. Rate limit violations return HTTP 429.

Rules:
- The rate limit configuration is in `AppModule` and must not be removed.
- Rate limit values may be adjusted for production needs, but reducing them below 60/60 requires an ADR.
- Public endpoints (login, refresh) are rate-limited — authentication attempts are not exempt.

---

## Security Review Requirements

Before a new module goes to production:

1. Verify all endpoints have authentication guards applied.
2. Verify all mutating endpoints have screen permission checks.
3. Verify all sensitive fields are excluded from response DTOs.
4. Verify audit logging is wired to all data mutation use cases.
5. Verify no hardcoded credentials exist in the module.
6. Verify no sensitive data appears in log statements.

---

## Compliance Rules

### Rule S-001 — All Endpoints Authenticated

**Classification:** MANDATORY  
**Statement:** Every endpoint must be protected by `JwtAuthGuard` unless explicitly decorated with `@Public()`. There are no implicitly public endpoints.  
**Violation Impact:** Unauthenticated access to business data.  
**Risk:** Data breach.  
**Recovery:** Add authentication guard or explicit `@Public()` with documented justification.  
**Approval Required:** Architect approval for any `@Public()` endpoint beyond auth endpoints.

### Rule S-002 — Secrets Not Committed

**Classification:** MANDATORY  
**Statement:** No secret, password, or token may appear in any committed file. `.env` files are in `.gitignore`.  
**Violation Impact:** Credential exposure in git history.  
**Risk:** Unauthorized database or system access.  
**Recovery:** Rotate exposed credentials immediately. Remove from git history using `git filter-repo`.  
**Approval Required:** Chief Software Architect for git history rewriting.

### Rule S-003 — Passwords Hashed

**Classification:** MANDATORY  
**Statement:** User passwords are always stored as bcrypt hashes. Plain-text passwords must never be written to the database.  
**Violation Impact:** Password exposure in database breach.  
**Risk:** Mass credential compromise.  
**Recovery:** Migrate all plain-text passwords to bcrypt hashes. Force password reset for affected users.  
**Approval Required:** None — this is a technical requirement.

### Rule S-004 — Permission Cache Staleness Acknowledged

**Classification:** MANDATORY  
**Statement:** Until a cache invalidation mechanism is implemented, all role and permission changes to the database must be followed by an application restart to ensure the in-memory cache is cleared.  
**Violation Impact:** Stale permissions — users may retain or lose access incorrectly.  
**Risk:** Unauthorized access or inappropriate access denial.  
**Recovery:** Restart the application after any role/permission change.  
**Approval Required:** None — operational requirement until cache invalidation is implemented.

### Rule S-005 — No Sensitive Data in Logs

**Classification:** MANDATORY  
**Statement:** Passwords, tokens, session IDs, and personal data must not appear in log messages at any level.  
**Violation Impact:** Sensitive data exposure in log files.  
**Risk:** Credential or PII exposure.  
**Recovery:** Remove the sensitive data from the log statement.  
**Approval Required:** None.
