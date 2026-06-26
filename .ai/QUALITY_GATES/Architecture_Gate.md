# Architecture Gate

The Architecture Gate verifies that the codebase maintains the strict Clean Architecture layer ordering and all cross-module rules defined in MASTER_PROMPT and the ADRs.

**Gate result: PASS, CONDITIONAL, or FAIL.**

---

## Gate Checks

Run all commands. Record each result.

### Check 1 — PrismaService Isolation

```bash
# Services must NOT inject PrismaService:
grep -r "PrismaService" src/modules/ --include="*.service.ts" -l
# Expected: no output (empty)

# Use Cases must NOT inject PrismaService:
grep -r "PrismaService" src/modules/ --include="*.use-case.ts" -l
# Expected: no output (empty)

# Controllers must NOT inject PrismaService:
grep -r "PrismaService" src/modules/ --include="*.controller.ts" -l
# Expected: no output (empty)
```

Violation → FAIL

### Check 2 — Repository Layer Boundary

```bash
# Repositories should only appear in use-case or service constructors, not controllers:
grep -rn "Repository" src/modules/ --include="*.controller.ts"
# Expected: no output (empty)
```

Violation → FAIL

### Check 3 — Cross-Module Repository Rule (CM-1)

```bash
# No module should import another module's repository:
# (Manual check) Inspect each module's providers array — repositories must not be
# imported from other modules. Services may be exported and imported; repositories must not.
grep -rn "from '.*modules\/.*/repositories" src/modules/ --include="*.module.ts"
# Any result where the importing module ≠ the repository's module → FAIL
```

Violation → FAIL

### Check 4 — Auth Coverage (Deny-by-Default)

```bash
# Every controller must have @Roles() or @Public():
grep -rL "@Roles\|@Public" src/modules/ --include="*.controller.ts"
# Expected: no output (empty)
```

Violation → FAIL

### Check 5 — Audit Coverage

```bash
# Every state-changing use case should fire audit:
grep -rL "auditService\|AuditService" src/modules/ --include="*.use-case.ts" \
  | grep -v "query\|search\|find\|get\|list\|read"
# Review any results — mutation use cases without audit are suspicious
```

Violation → CONDITIONAL (must be justified)

### Check 6 — BigInt Serialization

```bash
# Any controller returning BigInt fields must use serializeBigInts:
grep -rn "serializeBigInts\|BigInt" src/modules/ --include="*.controller.ts"
# Review: responses containing BigInt that are NOT serialized → FAIL
```

---

## Scoring

| Result | Meaning |
|--------|---------|
| PASS | Checks 1–4 and 6 all clean; Check 5 clean or justified |
| CONDITIONAL | Check 5 has 1–2 unjustified results with documented plan to fix |
| FAIL | Any Check 1–4 or 6 violation |

FAIL blocks the sprint. CONDITIONAL must be resolved before release.
