# ADR-011 — JWT and Refresh Tokens

## Title

Token Pair Architecture with Composite Refresh Token and Re-Signing on Session Creation

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The authentication system requires two types of tokens:

1. **Access token**: Short-lived, carries user identity and session reference for every authenticated request
2. **Refresh token**: Long-lived, used to obtain new access tokens without re-authentication

Several non-trivial design problems existed:

1. **The chicken-and-egg problem**: The access token must contain the `sessionId`, but the session is only created after the access token is generated. The session's ID is assigned by the database.

2. **Refresh token revocability**: A raw refresh token stored in a cookie or localStorage cannot be revoked server-side. Storing the raw token in the database creates a lookup-by-value requirement.

3. **Refresh token station identification**: The refresh endpoint must know which session to validate against. This requires either a separate session ID header or a session reference embedded in the token.

4. **Type safety with BigInt**: JWT payloads are JSON. BigInt values cannot be serialized to JSON directly. The signed payload must use string representations, but application code needs BigInt.

---

## Decision

### Token Pair Generation

`TokenService` generates two tokens: an access token (JWT) and a refresh token (UUID):

```typescript
// Access token: signed JWT with JwtPayload
async generateAccessToken(payload: JwtPayload): Promise<string> {
  const signPayload: JwtSignPayload = {
    sub: payload.sub.toString(),           // BigInt → string for JWT
    username: payload.username,
    roleId: payload.roleId.toString(),     // BigInt → string for JWT
    sessionId: payload.sessionId.toString(), // BigInt → string for JWT
  };
  return this.jwt.generateAccessToken(signPayload);
}

// Refresh token: cryptographically random UUID
generateRefreshToken(): string {
  return crypto.randomUUID();
}
```

### JwtSignPayload vs JwtPayload

Two interfaces separate the JWT wire format from the application type:

```typescript
// Wire format (JSON-serializable)
interface JwtSignPayload {
  sub: string;       // String representation of BigInt
  username: string;
  roleId: string;    // String representation of BigInt
  sessionId: string; // String representation of BigInt
}

// Application type (after JWT validation)
interface JwtPayload {
  sub: bigint;
  username: string;
  roleId: bigint;
  sessionId: bigint;
}
```

The `JwtStrategy.validate()` method converts `JwtSignPayload` → `JwtPayload` by parsing strings to BigInt.

### The Re-Signing Pattern

The chicken-and-egg problem is solved with a deliberate re-sign step:

```typescript
// LoginUseCase.execute():

// Step 1: Generate token pair with placeholder sessionId = 0n
const tokens = await this.tokenService.generateTokenPair({
  sub: user.user_id, username: user.username, roleId: user.role_id, sessionId: 0n,
});

// Step 2: Hash refresh token
const hash = await this.passwordService.hashToken(tokens.refreshToken);

// Step 3: Create session → get real session_id from database
const session = await this.sessionService.createSession(user.user_id, tokens, hash, ctx);

// Step 4: Re-sign access token with real session_id
const finalAccessToken = await this.tokenService.generateAccessToken({
  sub: user.user_id, username: user.username,
  roleId: user.role_id, sessionId: session.session_id,
});
```

The re-sign step issues a second JWT with the real `sessionId`. The first JWT (with `sessionId: 0`) is discarded — only the re-signed token is returned to the client.

### Composite Refresh Token

The refresh token returned to the client is a composite string:

```
{sessionId}:{rawUUID}
```

For example: `42:550e8400-e29b-41d4-a716-446655440000`

This composite format:
- **Embeds the session reference** in the token itself — no separate session ID header needed
- **Enables hash-based validation** — the server extracts `sessionId`, loads the session, and bcrypt-compares the `rawUUID` portion against the stored hash
- **Supports revocation** — if the session is revoked server-side, the `rawUUID` comparison succeeds but the session status check fails

### Token Storage Strategy

| Token Type | Returned to Client | Stored in DB |
|------------|-------------------|--------------|
| Access token | Full JWT string | Not stored |
| Refresh token | `{sessionId}:{rawUUID}` | bcrypt hash of `rawUUID` only |

The raw refresh UUID is never stored — only its hash. This prevents a database breach from yielding usable refresh tokens.

### Token Expiry Configuration

Both expiry durations are configurable via environment variables:
```
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
```

These are passed to `ms()` for conversion to milliseconds when computing `expiresAt` timestamps.

---

## Rationale

**Why re-sign instead of pre-computing the sessionId?**

Pre-computing the session ID would require knowing the database-assigned primary key before inserting the row. This is not reliably possible with auto-increment BigInt PKs. The re-sign approach is a deliberate two-JWT design that solves the sequencing problem cleanly.

**Why `crypto.randomUUID()` for the refresh token?**

`crypto.randomUUID()` uses cryptographically secure random bytes (CSPRNG). Version 4 UUIDs generated this way have 122 bits of entropy — sufficient for a refresh token. It is part of the Node.js standard library (no additional dependency needed).

**Why `crypto.randomUUID()` as synchronous (not async)?**

The native `crypto.randomUUID()` is synchronous. There is no async variant. The original implementation had an `async` wrapper that added no value. This was corrected: the method is synchronous.

**Why bcrypt for refresh token hashing instead of SHA-256?**

bcrypt adds computational cost (configurable salt rounds), making brute-force attacks against a stolen database significantly more expensive. SHA-256 is fast to compute — a stolen DB with SHA-256 hashes could be attacked quickly. For tokens that are effectively long-lived credentials, bcrypt's cost factor provides meaningful protection.

**Why string conversion in JWT payload instead of just using numbers?**

JSON.stringify converts JavaScript numbers to JSON numbers. BigInt values above 2^53 - 1 (Number.MAX_SAFE_INTEGER) cannot be represented precisely as JSON numbers. Using string representations ensures no precision loss regardless of ID magnitude.

---

## Consequences

**Positive:**
- Access tokens contain a session reference enabling per-request session validation
- Refresh tokens can be revoked without a token blacklist
- No raw credentials stored in the database
- Token types are explicitly separated (JwtPayload for app, JwtSignPayload for wire)

**Negative:**
- The re-signing step issues two JWTs on every login — a minor performance consideration
- The composite refresh token format is non-standard and requires documentation for new developers
- bcrypt comparison adds latency to the refresh endpoint (intentional — security trade-off)

**Trade-offs:**
- Two JWT signs per login vs. a single JWT sign with a pre-known sessionId. The extra sign is negligible in latency terms but eliminates a chicken-and-egg architectural problem.

**Future Implications:**
- **Refresh token rotation**: The refresh endpoint can implement token rotation (issue a new refresh token, invalidate the old one) without changing the composite format
- **Token family detection**: Multiple refresh uses of a revoked token can be detected and used to trigger account lockdown (detection of token theft)

---

## Related Components

- `src/modules/auth/services/token.service.ts`
- `src/modules/auth/services/jwt.service.ts`
- `src/modules/auth/use-cases/login/login.use-case.ts`
- `src/modules/auth/use-cases/login/contracts/jwt-payload.interface.ts`
- `src/modules/auth/use-cases/login/contracts/token-pair.interface.ts`
- `src/modules/auth/contracts/jwt-sign-payload.interface.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`

---

## Alternatives Considered

### Opaque Refresh Tokens Stored in Database

Rejected. Storing raw tokens (even hashed) requires lookup by token value, which requires a full table scan or token-indexed query. The composite format enables O(1) session lookup.

### JWT as Refresh Token

Rejected. JWTs cannot be revoked without a blacklist. A long-lived JWT is indistinguishable from a stolen JWT without server-side session state.

### Pre-Generated Session IDs (Client-Generated UUID as sessionId)

Considered. If the session ID were a client-generated UUID rather than a database auto-increment, the sessionId would be known before DB insert. Rejected because:
- Client-generated IDs add unpredictable entropy that complicates audit queries
- Sequence-based IDs are more sortable and partition-friendly
- Database auto-increment BigInt is the uniform policy for all PKs (ADR-000 P-7)

---

## Future Evolution

- **Refresh token rotation**: On each refresh, issue a new refresh token and invalidate the old one. This detects refresh token theft (if an old token is used after rotation, it indicates theft)
- **Short-lived sessions for sensitive operations**: High-risk operations could require a fresh access token with `sessionId` validated against a recent activity timestamp
- **Device fingerprinting**: The composite token format could be extended with a device fingerprint segment for additional binding

---

## References

- `src/modules/auth/services/token.service.ts`
- `src/modules/auth/use-cases/login/login.use-case.ts`
- ADR-010 (Authentication) — broader login flow
- ADR-023 (Security Principles) — security context
