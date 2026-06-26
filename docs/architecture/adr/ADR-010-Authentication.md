# ADR-010 — Authentication

## Title

Stateful JWT Authentication with Device-Tracked Session Management

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The ERP requires authentication that:

1. **Supports session revocation**: An administrator must be able to force-log a user out (e.g., suspected compromise, termination). Stateless JWTs alone cannot support this — a valid token remains valid until expiry regardless of server-side state.

2. **Tracks device context**: Security audits require knowing which device initiated each session. ERP access from unknown devices is a security risk.

3. **Handles account states**: Users can be locked, have passwords that require changing, or be deactivated. These states must affect authentication on every request, not just at login.

4. **Supports mandatory password rotation**: ERP users must be able to be flagged for mandatory password change without losing their current session immediately.

5. **Scales without shared state**: The authentication system must work correctly if the backend is deployed as multiple instances (no shared in-memory session state).

---

## Decision

A **stateful JWT + refresh token** authentication model with device-tracked sessions.

### Authentication Flow

```
POST /v1/auth/login
  ↓
LoginUseCase.execute(dto, context)
  ↓ (1) Validate credentials
AuthService.validateUser(username, password)
  → UsersRepository.findByUsername()
  → PasswordService.compare(password, hash)
  → Check: user active, not locked
  ↓ (2) Generate placeholder token pair
TokenService.generateTokenPair({ sub, username, roleId, sessionId: 0n })
  ↓ (3) Hash refresh token for storage
PasswordService.hashToken(rawRefreshToken)
  ↓ (4) Create session record
SessionService.createSession(userId, tokenPair, hash, { deviceId, devicePlatform })
  → UserSessionsRepository.create() → returns session with real session_id
  ↓ (5) Re-sign access token with real session_id
TokenService.generateAccessToken({ sub, username, roleId, sessionId: session.session_id })
  ↓ (6) Compose composite refresh token
refreshToken = `${session.session_id}:${rawRefreshToken}`
  ↓ (7) Return LoginResult
{ sessionId, tokens: { accessToken, refreshToken, expiresAt }, mustChangePassword }
  ↓ (8) Fire-and-forget audit
AuditService.log({ eventType: 'AUTH_LOGIN', ... })
```

### Session-Embedded Refresh Token

The refresh token returned to the client is a composite string: `{sessionId}:{rawUUID}`. This embeds the session identifier in the token itself, enabling the refresh endpoint to:
1. Extract the `sessionId` from the token
2. Load the session from the database (validating it is active)
3. Compare the `rawUUID` portion against the stored hash
4. Reject requests if the session has been revoked server-side

This design allows session revocation without maintaining a token blacklist.

### JWT Payload

```typescript
interface JwtPayload {
  sub: bigint;        // user_id
  username: string;
  roleId: bigint;
  sessionId: bigint;  // embedded for per-request session validation
}
```

The `sessionId` in the JWT enables the JWT strategy to validate the session on every request.

### JwtStrategy — Per-Request Validation

The Passport JWT strategy (`src/modules/auth/strategies/jwt.strategy.ts`) validates on every authenticated request:

```typescript
async validate(payload: JwtSignPayload): Promise<JwtPayload> {
  const user = await this.authService.findActiveById(BigInt(payload.sub));
  if (!user) throw new UnauthorizedException('User not found or inactive.');
  // Returns typed payload with BigInt conversions
  return {
    sub: BigInt(payload.sub),
    username: payload.username,
    roleId: BigInt(payload.roleId),
    sessionId: BigInt(payload.sessionId),
  };
}
```

This means deactivated users are rejected on their next request, not just at login.

### JwtAuthGuard — Public Route Bypass

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context) as Promise<boolean>;
  }
}
```

The `@Public()` decorator sets `IS_PUBLIC_KEY` metadata. This is checked at both handler and class level, allowing entire controllers to be public.

### Session Lifecycle

- **Creation**: On successful login; tied to `device_id`, `device_platform`
- **Refresh**: Refresh endpoint validates composite token against session, issues new token pair, updates session
- **Revocation**: Admin or user can revoke specific sessions (`ended_at` + `status: REVOKED`)
- **Force-logout**: `revokeAllSessions(userId)` invalidates all sessions for a user

---

## Rationale

**Why stateful sessions instead of purely stateless JWTs?**

Purely stateless JWTs cannot be revoked. For an ERP handling financial and manufacturing data:
- An employee whose account is suspended must lose access immediately
- An administrator must be able to force-log users out in security incidents
- Sessions linked to device IDs provide accountability for access patterns

The storage overhead of session records is negligible compared to these security requirements.

**Why embed `sessionId` in the JWT payload?**

Embedding `sessionId` enables the JWT strategy to perform session validation on every request without passing the session ID as a separate header. The JWT is self-contained: the recipient can extract and validate the session in one token verification step.

**Why the composite refresh token format `{sessionId}:{rawUUID}`?**

Alternatives considered:
- A database-stored opaque token → requires additional lookup by token value
- JWT as refresh token → cannot be revoked without a blacklist
- UUIDs as refresh tokens → no embedded session reference; requires full token scan

The composite format encodes the session reference in the token itself, enabling O(1) session lookup while maintaining the property that the raw UUID portion must be validated against a stored hash.

**Why bcrypt for refresh token hashing?**

The refresh token is effectively a password — it grants long-lived access. Using bcrypt ensures that a database read of the `user_sessions` table does not yield usable refresh tokens.

**Why `mustChangePassword` in `LoginResult` instead of forcing a redirect?**

The server cannot force a redirect that the client must follow. Instead, the API signals `mustChangePassword: true` in the login response. The client is responsible for enforcing the password change before accessing other features. This design is frontend-framework agnostic.

---

## Consequences

**Positive:**
- Session revocation works without token blacklists
- Per-request user status validation catches deactivated accounts immediately
- Device tracking enables security audit of access patterns
- Composite refresh token is self-contained — no token registry required

**Negative:**
- Session table adds a database write on every login and token refresh (minor overhead)
- Per-request user lookup in JWT strategy adds one database read per authenticated request (mitigated by database connection pooling)
- Session records accumulate and require periodic cleanup (expired sessions)

**Trade-offs:**
- The per-request user lookup trades minor latency for strong security guarantees. For an ERP, this is the correct trade-off.

**Future Implications:**
- Session invalidation can be implemented as a targeted cache layer (e.g., Redis set of revoked session IDs) to eliminate the per-request database hit
- Multi-factor authentication can be integrated as an additional step in `LoginUseCase.execute()`
- OAuth 2.0 / SSO integration can be added as an alternative authentication strategy alongside the existing username/password flow

---

## Related Components

- `src/modules/auth/use-cases/login/login.use-case.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/modules/auth/guards/jwt-auth.guard.ts`
- `src/modules/auth/services/auth.service.ts`
- `src/modules/auth/services/session.service.ts`
- `src/modules/auth/services/password.service.ts`
- `src/modules/auth/services/token.service.ts`
- `src/modules/auth/repositories/users.repository.ts`
- `src/modules/auth/repositories/user-sessions.repository.ts`

---

## Alternatives Considered

### Purely Stateless JWTs

Rejected. Cannot be revoked. Unacceptable for ERP security requirements.

### OAuth 2.0 Authorization Code Flow

Considered for future integration with identity providers. Not adopted for the initial phase because:
- No external identity provider requirement exists currently
- Adds infrastructure complexity (authorization server)
- Internal username/password with session management is sufficient

### Session Cookies

Rejected for the current architecture because:
- REST API with JWT is more compatible with mobile clients and non-browser consumers
- Cookie-based sessions require CSRF protection
- JWT with session tracking provides equivalent revocability with better interoperability

---

## Future Evolution

- **MFA**: Multi-factor authentication can be added as a new step in the login use-case
- **SSO/SAML**: Enterprise SSO can be integrated as a parallel JWT strategy
- **Token refresh sliding window**: Currently each refresh issues a new token pair; a sliding window can extend sessions based on activity without requiring full re-authentication
- **Biometric device authentication**: Mobile clients can store refresh tokens in secure enclaves and use device biometrics as an additional verification step

---

## References

- `src/modules/auth/use-cases/login/login.use-case.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`
- ADR-011 (JWT and Refresh Tokens) — token generation details
- ADR-023 (Security Principles) — broader security context
