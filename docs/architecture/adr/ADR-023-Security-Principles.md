# ADR-023 — Security Principles

## Title

Defense-in-Depth Security Architecture

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

An ERP system contains:
- Business-critical inventory and production data
- Financial transaction records
- Customer and supplier contact information
- User credentials and session tokens

Security failures in an ERP are not hypothetical — they are regulatory violations, competitive intelligence leaks, and operational disasters. The security architecture must address multiple threat categories:

1. **Brute force**: Automated credential stuffing against the login endpoint
2. **Session theft**: Intercepted tokens used by unauthorized parties
3. **Privilege escalation**: Authenticated users accessing endpoints beyond their role
4. **Injection attacks**: Malicious input causing unintended query execution
5. **Sensitive data in logs**: Credentials or tokens appearing in log files
6. **Weak password storage**: Crackable credential hashes in the database

---

## Decision

Security is layered across multiple mechanisms, each addressing a different threat category:

### Layer 1: Network / Protocol (Helmet, CORS, Compression)

```typescript
app.use(helmet());       // Sets security headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(compression());  // Reduces response size
app.enableCors({ exposedHeaders: ['X-Correlation-ID'] });
```

**Helmet** sets recommended HTTP security headers automatically:
- `Content-Security-Policy`
- `X-Frame-Options: DENY` (clickjacking protection)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HTTPS enforcement)
- `X-XSS-Protection`

### Layer 2: Rate Limiting (ThrottlerGuard)

```typescript
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: () => [{ ttl: 60_000, limit: 60 }],
})
```

60 requests per 60 seconds per IP. Prevents brute-force attacks on login and other public endpoints. `ThrottlerGuard` runs as the first `APP_GUARD` — before any authentication logic.

### Layer 3: Authentication (JWT + Session Validation)

- Short-lived access tokens (default: 15 minutes)
- Long-lived refresh tokens stored as bcrypt hashes
- Per-request session status check in `JwtStrategy.validate()`
- Deactivated or locked users rejected on every request, not just at login

### Layer 4: Authorization (Guard Stack)

Role-based and screen-permission-based authorization applied to every non-public endpoint (ADR-012).

**Deny by default**: No role annotation = system admin access only.

### Layer 5: Password Security (PasswordService)

```typescript
// Password hashing: bcrypt with 12 salt rounds
async hash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Password comparison: timing-safe
async compare(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

12 salt rounds provide ~300ms computation time per hash — sufficient to make brute-force of stolen hashes computationally expensive.

### Layer 6: Input Validation (GlobalValidationPipe)

All HTTP input is validated before entering business logic:
- `whitelist: true` — unknown fields stripped
- `forbidNonWhitelisted: true` — unknown fields return 400
- `transform: true` — safe type coercion

### Layer 7: Sensitive Data Protection (Logger Redaction)

Authorization headers, cookies, and set-cookie headers are automatically redacted from all log output (ADR-008). JWT tokens never appear in logs.

### Layer 8: Credential Storage

- User passwords: stored as bcrypt hashes, never in plaintext
- Refresh tokens: stored as bcrypt hashes, never in plaintext
- JWT secrets: only in environment configuration, never in code
- Database credentials: only in environment configuration, never in code

### Layer 9: Request Correlation

Every request receives a correlation ID (`X-Correlation-ID`) assigned by `CorrelationIdMiddleware`. All logs for a request share this ID, enabling complete request tracing without user identification through logs.

---

## Rationale

**Why ThrottlerGuard as the first guard?**

Rate limiting must run before authentication logic to prevent the authentication process itself from being used as a DDoS vector. If `JwtAuthGuard` (which makes a database call) ran before `ThrottlerGuard`, an attacker could force database load by flooding the authentication endpoint.

**Why 12 bcrypt rounds?**

bcrypt round count is a time-cost parameter:
- 10 rounds: ~100ms per hash
- 12 rounds: ~300ms per hash
- 14 rounds: ~1000ms per hash

12 rounds provides a reasonable balance: fast enough that legitimate users don't notice login latency, slow enough that brute-force of stolen hashes requires substantial compute resources.

**Why short-lived access tokens (15 minutes)?**

Short-lived access tokens limit the damage window from token theft. If a token is stolen, it expires in at most 15 minutes. The refresh token mechanism allows seamless re-authentication without user intervention.

**Why session-based revocation rather than token blacklists?**

Token blacklists require storing and querying every revoked token. The set of revoked tokens grows without bound. Session-based revocation requires only updating one session record — O(1) revocation with O(1) lookup.

**Why Helmet?**

Helmet provides a comprehensive set of HTTP security headers with correct defaults. Setting these headers manually would require ongoing maintenance as security recommendations evolve. Helmet handles this automatically.

---

## Consequences

**Positive:**
- Brute-force attacks are rate-limited before reaching authentication logic
- Token theft has a limited damage window (access token expiry)
- Stolen password hashes cannot be quickly cracked
- Authorization is enforced globally — no endpoint can be accidentally unprotected
- Sensitive credentials never appear in log files

**Negative:**
- 12 bcrypt rounds add ~300ms to login latency
- Rate limiting (60 req/60s) may be too restrictive for automated testing or batch operations
- JWT validation adds one database read per authenticated request

**Trade-offs:**
- bcrypt latency: 300ms is imperceptible to humans and acceptable for an ERP login. It is not acceptable for a high-frequency API. For ERP use cases, this trade-off is correct.
- Session table reads: The per-request session check adds latency. This can be mitigated with a Redis session cache if needed.

**Future Implications:**
- **MFA**: Multi-factor authentication can be integrated at the `LoginUseCase` level without changing any of these security layers
- **IP allowlisting**: For production deployments, IP allowlisting can be added at the reverse proxy or as a NestJS guard
- **OWASP Top 10 compliance**: Current architecture addresses injection (validation), broken authentication (JWT + sessions), security misconfiguration (Helmet), sensitive data exposure (bcrypt + redaction), broken access control (guard stack), and security logging (request correlation)

---

## Related Components

- `src/main.ts` — Helmet, CORS, rate limiting setup
- `src/app.module.ts` — ThrottlerModule, guard registration
- `src/modules/auth/services/password.service.ts` — bcrypt
- `src/modules/auth/services/token.service.ts` — JWT generation
- `src/modules/auth/strategies/jwt.strategy.ts` — token validation
- `src/modules/authorization/guards/` — authorization layer
- `src/core/logger/` — sensitive header redaction

---

## Alternatives Considered

### Stateless JWT Without Session Validation

Rejected. See ADR-010 for detailed rationale. Stateless JWTs cannot be revoked.

### API Keys Instead of JWT

API keys are simpler but provide less information about the requester (no user identity in the key itself). JWT carries user identity in the payload, enabling user-specific permissions and audit trails. API keys are appropriate for machine-to-machine integrations; JWT is appropriate for user-facing APIs.

### OAuth 2.0 Resource Server

For enterprise deployments with an external identity provider, the ERP can act as an OAuth 2.0 resource server. Not adopted currently. The existing JWT strategy is compatible with externally-issued JWTs if the signing key is shared.

---

## Future Evolution

- **Security headers audit**: Regular reviews of Helmet's configuration against latest OWASP recommendations
- **SIEM integration**: Security events (failed logins, permission denials, rate limit triggers) can be forwarded to a SIEM system
- **Penetration testing**: Formal pentest before production launch
- **SOC 2 / ISO 27001**: The audit architecture (ADR-016) and logging (ADR-008) provide the foundation for compliance certification

---

## References

- `src/main.ts`
- `src/modules/auth/services/password.service.ts`
- ADR-010 (Authentication) — JWT + session security
- ADR-011 (JWT and Refresh Tokens) — token security design
- ADR-012 (Authorization Architecture) — access control
- ADR-016 (Audit Architecture) — security audit trail
- ADR-008 (Logging Architecture) — sensitive data protection
