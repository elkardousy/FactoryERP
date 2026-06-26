# Performance Gate

The Performance Gate verifies that no performance anti-patterns have been introduced. Run before every sprint release and whenever new query patterns or list endpoints are added.

**Gate result: PASS, CONDITIONAL, or FAIL.**

---

## Gate Checks

### Check 1 — N+1 Query Detection

```bash
# Find loops that may contain Prisma calls:
grep -rn "\.forEach\|for (" src/modules/ --include="*.ts" -A 5 \
  | grep -B 3 "this\.db\.\|this\.prisma\.\|repository\."
# Any result indicates a potential N+1 — review each one
```

Confirmed N+1 inside a loop → FAIL

### Check 2 — Unbounded findMany

```bash
# Find findMany calls without take/limit:
grep -rn "\.findMany(" src/modules/ --include="*.repository.ts" -A 5 \
  | grep -v "take\|limit\|pagination"
# Review each result — findMany without pagination is dangerous on large tables
```

Any `findMany` with no `take` and no `skip` and no clear justification → CONDITIONAL or FAIL depending on the table size expectation.

### Check 3 — Pagination DTO Enforcement

```bash
# Verify list use cases accept PaginationDto:
grep -rn "findAll\|getAll\|listAll" src/modules/ --include="*.use-case.ts" -l
# For each file found, confirm PaginationDto is in the parameter list
```

List use case without `PaginationDto` → CONDITIONAL

### Check 4 — $queryRaw Parameterization

```bash
grep -rn "\$queryRaw" src/ --include="*.ts" -A 3
# Verify: uses template literal (Prisma.sql`...`) not string concatenation
```

String concatenation in `$queryRaw` → FAIL (also a security issue → Security Gate FAIL)

### Check 5 — Response Size Limits

```bash
# Check @Max decorators on limit fields in DTOs:
grep -rn "@Max" src/ --include="*.dto.ts"
# Verify: at least one @Max(100) or similar on pagination limit fields
```

No max enforced on pagination DTOs → CONDITIONAL

---

## Scoring

| Result | Meaning |
|--------|---------|
| PASS | All checks clean |
| CONDITIONAL | Check 2, 3, or 5 has a justified exception documented in code comment or ADR |
| FAIL | Check 1 confirmed N+1; Check 4 any violation |

FAIL blocks the sprint. CONDITIONAL must be documented.
