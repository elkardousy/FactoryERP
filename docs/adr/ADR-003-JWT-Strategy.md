# ADR-003 — JWT Strategy and Per-Request Validation

**Status:** Accepted
**Date:** 2026-06-26
**Deciders:** Principal Architect
**Applies to:** `src/modules/auth/strategies/jwt.strategy.ts`

---

## Context

NestJS Passport's `JwtStrategy` base class, by default, performs only signature verification and expiry checking. If the JWT is valid and not expired, the user is considered authenticated. No database query is made.

This is sufficient for many applications but presents a gap for enterprise ERP requirements:

1. A user whose account is locked after login would still have a valid, unexpired access token. Without DB verification, that token would grant access until it expires (default: 15 minutes).
2. An admin who deactivates a user mid-session would have no immediate effect.
3. There is no mechanism to detect forced logouts or admin-initiated revocations during an active access token window.

The decision is: **how much validation should happen on every authenticated request?**

---

## Decision

`JwtStrategy.validate()` performs a **live database query on every authenticated request** in addition to JWT signature verification.

```typescript
async validate(payload: JwtPayload): Promise<JwtPayload> {
  const user = await this.authService.findActiveById(payload.sub);

  if (!user) {
    throw new UnauthorizedException('Account is inactive, locked, or no longer exists.');
  }

  if (user.locked_at !== null) {
    throw new UnauthorizedException('Account is locked.');
  }

  return payload;
}
```

**What is checked:**
- `is_active = true` and `status = 'ACTIVE'` (via `UsersRepository.findActiveById`)
- `locked_at IS NULL`

**What is not checked:**
- Session revocation status — a future enhancement (requires loading the session on every request)
- Permission changes — handled at authorization layer (future sprint)

**The payload is returned unmodified** from `validate()`. This means `@CurrentUser()` returns the `JwtPayload` object, not the full `users` record. This avoids passing sensitive data (password hash, etc.) through the request context.

---

## Alternatives Considered

### A — Signature-only validation (default Passport behavior)
Minimal per-request overhead. Rejected for the ERP use case because a locked or deactivated account retains full access for up to the access token TTL. For an ERP handling financial and inventory data, this window is unacceptable.

### B — Validate signature + session status in one query
Join `user_sessions` on `session_id` claim and verify `status = 'ACTIVE'` in one query. This would close the session-revocation gap. Rejected at this stage because:
- `session_id` is in the JWT payload but the current strategy loads the user only.
- Adding session verification doubles the query complexity.
- The immediate priority is account-level revocation (lock/deactivate). Session-level revocation is Sprint 9 scope.

### C — Token blocklist (Redis/in-memory)
Maintain a set of revoked token JTIs. On every request, check if the JTI is blocklisted. This enables sub-TTL revocation without a DB query on every request. Rejected because:
- Introduces Redis as an infrastructure dependency not yet in scope.
- The ERP access token TTL is 15 minutes — this is short enough that account-level DB checks are preferred over a distributed blocklist.
- The blocklist must be distributed across all instances — adds operational complexity.

### D — Reduce access token TTL to ~1 minute
A very short TTL means revocation propagates quickly without DB checks. Rejected because:
- 1-minute TTL forces very frequent refresh token rotation.
- Poor UX for ERP users with long-running workflows.
- The 15-minute default balances security and usability.

---

## Consequences

**Positive:**
- Account deactivation and lock take effect within the current request — not after the token expires.
- No sensitive user data flows through the request context (payload only).
- `@CurrentUser()` is type-safe — it always resolves to `JwtPayload`.
- Compatible with future session-level revocation (add session query to `validate()`).

**Negative / Trade-offs:**
- One extra database query per authenticated request. At scale, this adds latency and database load.
- `findActiveById` currently loads the `roles` relation unnecessarily (Sprint 9 optimization: use `select` to fetch only `locked_at`, `is_active`, `status`).
- A user whose account was locked between token issuance and expiry will see a 401 on their next request, with no indication in the JWT itself that the account is locked — the error comes from the DB check, not from JWT validation. This is correct behavior but may be surprising in debugging.
- Session revocation (via `POST /logout` or admin force-logout) does NOT immediately invalidate the access token. The token remains cryptographically valid until expiry. The next refresh attempt will fail (session is REVOKED). This is the current gap — future enhancement tracked in Sprint 9.
