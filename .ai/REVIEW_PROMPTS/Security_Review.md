# Security Review Prompt

**Purpose:** Verify that authentication, authorization, data protection, and input validation meet the security standards defined in ADR-023.

**When required:** New auth flows, new authorization patterns, new data access patterns, security library upgrades, or any change to `src/modules/auth/`, `src/modules/authorization/`, or `src/core/`.

---

## Inputs Required

- Changed file list
- ADR-023 (Defense-in-Depth Security Architecture)
- Current guard stack configuration in `src/app.module.ts`

---

## Review Process

### Step 1 — Authentication Integrity

- [ ] `JwtStrategy.validate()` still performs a session database check on every request
- [ ] Session invalidation is immediate — no token blacklist required
- [ ] Access token TTL has not been increased beyond the configured value
- [ ] Refresh token is stored as bcrypt hash — never in plaintext
- [ ] `@Public()` decorator is only applied to genuinely unauthenticated endpoints

### Step 2 — Authorization Integrity

- [ ] Guard order in `app.module.ts` is unchanged: ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
- [ ] No new `APP_GUARD` has been added before `ThrottlerGuard`
- [ ] No endpoint bypasses the guard stack via `@SkipDecorators()` or similar
- [ ] `@Roles()` is declared on every new controller class or method
- [ ] New roles (if any) are added to the `UserRole` enum and documented in an ADR

### Step 3 — Input Validation

- [ ] All new controller methods accept DTO inputs, not raw primitives
- [ ] No manual parsing of request body outside of class-validator DTOs
- [ ] `GlobalValidationPipe` has not been modified
- [ ] SQL injection: no raw `$queryRawUnsafe` calls; `$queryRaw` uses parameterized queries only
- [ ] XSS: API is JSON-only; no HTML rendering on the server

### Step 4 — Sensitive Data Protection

- [ ] No passwords, tokens, or secrets in log statements
- [ ] No new headers added to logger without checking for sensitive content
- [ ] New environment variables containing secrets added to `env.validation.ts` with proper typing
- [ ] `@ApiProperty()` does not expose password fields in Swagger responses
- [ ] No PII in error messages returned to the client

### Step 5 — Dependency Security

For any new `npm install`:
```bash
npm audit --audit-level=high
```
- [ ] Zero high or critical vulnerabilities
- [ ] New package license is compatible with the project

### Step 6 — OWASP Top 10 Spot Check

| Risk | Control | Status |
|------|---------|--------|
| A01 Broken Access Control | `@Roles()` deny-by-default | Check |
| A02 Cryptographic Failures | bcrypt 12 rounds, JWT secret in env | Check |
| A03 Injection | class-validator, Prisma parameterized queries | Check |
| A04 Insecure Design | Clean Architecture, audit trail | Check |
| A05 Security Misconfiguration | Helmet headers, CORS | Check |
| A06 Vulnerable Components | `npm audit` | Check |
| A07 Auth Failures | Session-based revocation, throttling | Check |
| A09 Security Logging | Fire-and-forget audit, sensitive header redaction | Check |

---

## Scoring

| Score | Meaning |
|-------|---------|
| PASS | Zero critical/high findings; medium findings documented as risks |
| CONDITIONAL PASS | Medium findings present; documented in PROJECT_MEMORY.md as risks |
| FAIL | Any critical or high finding |

---

## Output Report

```
Security Review — Sprint {N} — {Date}

AUTHENTICATION INTEGRITY: [PASS / FAIL]
AUTHORIZATION INTEGRITY: [PASS / FAIL]
INPUT VALIDATION: [PASS / FAIL]
SENSITIVE DATA PROTECTION: [PASS / FAIL]
DEPENDENCY SECURITY: [PASS / FAIL]
OWASP TOP 10: [PASS / CONDITIONAL / FAIL]

Findings:
  Critical: {list or "none"}
  High: {list or "none"}
  Medium: {list or "none"}

OVERALL: [PASS / CONDITIONAL / FAIL]
```

---

## Final Recommendation

- **PASS**: Proceed to Performance Review
- **CONDITIONAL PASS**: Document medium risks in PROJECT_MEMORY.md; proceed
- **FAIL**: Do not merge. Fix critical/high findings and re-run review.
