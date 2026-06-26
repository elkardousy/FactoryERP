# Architecture Review Prompt

**Purpose:** Verify that all implementation decisions comply with Clean Architecture invariants, dependency rules, and established ADRs.

---

## Inputs Required

- Diff or list of changed files
- Current sprint prompt from `.ai/SPRINT_PROMPTS/`
- `docs/architecture/ADR_INDEX.md`

---

## Review Process

### Step 1 — Layer Ordering Check

For every new file, confirm it is in the correct layer:

```
Check each import statement:
- Controller imports: only use cases and DTOs
- Use Case imports: only repositories (own module), services, global module services
- Service imports: only repositories (own module), other services
- Repository imports: only PrismaService (via super constructor)
```

**Blocking violation:** Any layer importing from a layer above it or skipping a layer.

### Step 2 — PrismaService Isolation

```bash
# Run this and verify zero results outside repository files:
grep -r "PrismaService" src/ --include="*.ts" \
  | grep -v "\.repository\.ts" \
  | grep -v "prisma\.module\.ts" \
  | grep -v "prisma\.service\.ts" \
  | grep -v "base\.repository\.ts"
```

**Blocking violation:** Any result output.

### Step 3 — Cross-Module Dependency Check

For each module that imports another module, verify:
- Only services are imported (not repositories)
- The imported module explicitly exports the service
- Import is declared in the consuming module's `imports` array

### Step 4 — Authorization Check

```bash
# Find controllers without @Roles or @Public:
grep -r "@Controller" src/modules --include="*.controller.ts" -l
# For each, verify @Roles() is present on the class or all methods
```

**Blocking violation:** Any controller method that has neither `@Roles()` nor `@Public()`.

### Step 5 — Audit Check

```bash
# Find state-changing use cases:
grep -r "\.create\|\.update\|\.delete\|\.deactivate" \
  src/modules --include="*.use-case.ts" -l
# For each, verify: void this.auditService.log(
```

**Blocking violation:** A write use case without a fire-and-forget audit call.

### Step 6 — ADR Compliance Check

For each new architectural decision:
- Is there an existing ADR that covers this decision?
- Does the implementation comply with that ADR?
- If a new decision was made that is NOT covered by an ADR, is a new ADR required?

---

## Evaluation Criteria

| Criterion | Weight | Pass Threshold |
|-----------|--------|---------------|
| Layer ordering | Critical | Zero violations |
| PrismaService isolation | Critical | Zero violations |
| Cross-module rules | Critical | Zero violations |
| Authorization coverage | Critical | Zero violations |
| Audit coverage | Critical | Zero violations |
| ADR compliance | High | All decisions documented |
| Naming conventions | Medium | ≥ 95% compliant |
| Comment hygiene | Low | No what-comments |

---

## Scoring

| Score | Meaning |
|-------|---------|
| PASS | Zero Critical violations; all High violations documented as debt |
| FAIL | Any Critical violation |

---

## Blocking Issues

The following issues block merge until resolved:

1. Any controller method without `@Roles()` or `@Public()`
2. PrismaService injected outside a repository
3. Use case importing from another module's repository directly
4. State-changing use case without audit event
5. Implementation contradicting an Accepted ADR without a superseding ADR

---

## Output Report

```
Architecture Review — Sprint {N} — {Date}

LAYER ORDERING: [PASS / FAIL]
  Violations: {list or "none"}

PRISMASERVICE ISOLATION: [PASS / FAIL]
  Violations: {list or "none"}

CROSS-MODULE RULES: [PASS / FAIL]
  Violations: {list or "none"}

AUTHORIZATION COVERAGE: [PASS / FAIL]
  Violations: {list or "none"}

AUDIT COVERAGE: [PASS / FAIL]
  Violations: {list or "none"}

ADR COMPLIANCE: [PASS / FAIL]
  New decisions requiring ADR: {list or "none"}

OVERALL: [PASS / FAIL]
```

---

## Final Recommendation

- **PASS**: Proceed to Security Review
- **FAIL**: Return to implementation. Do not proceed until all Critical violations are resolved.
