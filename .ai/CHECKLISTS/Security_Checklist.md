# Security Checklist

Run before every Security Review and before any release.

---

## Authentication

- [ ] `JwtStrategy.validate()` queries the session database on every request
- [ ] Access token TTL has not been increased (`jwt.expiresIn`)
- [ ] Refresh tokens stored as bcrypt hash — never plaintext
- [ ] `@Public()` is only on login and health-check endpoints

## Authorization

- [ ] Guard order unchanged: ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
- [ ] No new `APP_GUARD` inserted before ThrottlerGuard
- [ ] Every controller class or method has `@Roles()` or `@Public()`
- [ ] Screen permission guard not bypassed

## Input Validation

- [ ] All controller inputs are DTO classes
- [ ] No raw `$queryRawUnsafe()` calls (SQL injection risk)
- [ ] Any `$queryRaw` uses tagged template literals (parameterized)
- [ ] `GlobalValidationPipe` configuration unchanged

## Password Security

```bash
# Verify bcrypt rounds:
grep -r "bcrypt.hash" src/ --include="*.ts"
# Must show: bcrypt.hash(password, 12) — not lower than 12
```

- [ ] bcrypt salt rounds ≥ 12
- [ ] No password stored in plaintext anywhere

## Sensitive Data

```bash
# Verify no tokens in logs:
grep -r "authorization\|password\|token\|secret" src/ --include="*.ts" \
  | grep -v "redact\|header\|swagger\|dto\|interface\|config" \
  | grep "logger\|console"
# Expected: no results
```

- [ ] No passwords, tokens, or secrets in logger calls
- [ ] Sensitive headers redacted in logger config (`authorization`, `cookie`, `set-cookie`)
- [ ] No PII in error messages returned to client

## Dependencies

```bash
npm audit --audit-level=high
```

- [ ] Zero high or critical npm vulnerabilities
- [ ] No new packages with GPL or AGPL licenses (incompatible with commercial use)

## OWASP Top 10

| Risk | Control | Status |
|------|---------|--------|
| A01 Broken Access Control | Deny-by-default, @Roles() | ☐ |
| A02 Cryptographic Failures | bcrypt 12 rounds, env-only secrets | ☐ |
| A03 Injection | class-validator, Prisma parameterized | ☐ |
| A04 Insecure Design | Clean Architecture, audit trail | ☐ |
| A05 Security Misconfiguration | Helmet, CORS, rate limiting | ☐ |
| A06 Vulnerable Components | npm audit | ☐ |
| A07 Auth Failures | Session revocation, throttling | ☐ |
| A09 Logging / Monitoring | Pino, sensitive redaction, correlation IDs | ☐ |
