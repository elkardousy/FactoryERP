# Security Gate

The Security Gate must pass before any release. It may be run at sprint completion when auth, permissions, or data access patterns change.

**Gate result: PASS, CONDITIONAL, or FAIL.**

---

## Gate Checks

### Check 1 — Guard Stack Integrity

```bash
# Verify global guard registration order in app.module.ts or main.ts:
grep -A 20 "APP_GUARD" src/app.module.ts
# Expected order: ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
```

Any change to guard registration order → FAIL

### Check 2 — No Raw SQL Injection Risk

```bash
# Find all raw SQL calls:
grep -rn "\$queryRawUnsafe\|queryRawUnsafe" src/ --include="*.ts"
# Expected: no output (empty)

grep -rn "\$queryRaw" src/ --include="*.ts"
# Review each result: must use tagged template literals (Prisma.sql`` or $queryRaw`...`)
# NOT: $queryRaw('SELECT * FROM ... WHERE id = ' + id)
```

Any `$queryRawUnsafe` → FAIL
Any `$queryRaw` with string concatenation → FAIL

### Check 3 — Password Security

```bash
grep -rn "bcrypt.hash\|bcrypt.genSalt" src/ --include="*.ts"
# Verify salt rounds ≥ 12 in all calls
```

Salt rounds < 12 → FAIL

### Check 4 — No Secrets in Logs

```bash
grep -rn "logger\.\(log\|info\|debug\|warn\|error\)" src/ --include="*.ts" \
  | grep -i "password\|token\|secret\|authorization"
# Expected: no output
```

Any sensitive value logged → FAIL

### Check 5 — @Public() Scope

```bash
grep -rn "@Public()" src/ --include="*.ts"
# Review each result: @Public() is only acceptable on:
# - Login endpoint
# - Refresh token endpoint
# - Health check endpoints
# - Public asset/metadata endpoints
```

`@Public()` on any protected business endpoint → FAIL

### Check 6 — npm Audit

```bash
npm audit --audit-level=high
```

Any high or critical vulnerability → FAIL

---

## Scoring

| Result | Meaning |
|--------|---------|
| PASS | All 6 checks clean |
| CONDITIONAL | Check 5 has one borderline case documented; Check 6 has a vulnerability with an accepted workaround |
| FAIL | Any Check 1–4 violation; Check 6 high/critical with no workaround |

FAIL blocks the release. CONDITIONAL requires sign-off before release.
