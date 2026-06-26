# Code Quality Review Prompt

**Purpose:** Verify code quality standards — naming, structure, comment hygiene, test quality, and adherence to coding standards.

---

## Review Process

### Step 1 — Automated Checks

```bash
npm run lint    # Must exit 0
npm run build   # Must exit 0
npm run test    # All suites pass
```

All three must pass before manual review begins.

### Step 2 — Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `CreateCustomerUseCase` |
| Files | kebab-case | `create-customer.use-case.ts` |
| Interfaces | PascalCase with `I` prefix | `IPermissionCache` |
| DTO fields | snake_case | `customer_name` |
| Route paths | kebab-case | `/production-lines` |
| Env vars | UPPER_SNAKE_CASE | `JWT_SECRET` |
| Audit actions | UPPER_SNAKE_CASE | `CUSTOMER_CREATED` |

- [ ] All new files follow kebab-case naming
- [ ] All new classes follow PascalCase naming
- [ ] DTO field names match database column names (snake_case)

### Step 3 — Comment Hygiene

Comments are permitted only for:
- Non-obvious WHY (hidden constraint, workaround, subtle invariant)
- `// eslint-disable-next-line` with explicit reason

The following are **not** acceptable:
- Comments describing what the code does
- TODO comments left in committed code
- References to specific tickets, PRs, or tasks

- [ ] No "what" comments found
- [ ] No uncommitted TODO comments
- [ ] All `eslint-disable` comments have an explanation

### Step 4 — Test Quality

For each new test suite:
- [ ] Uses `Test.createTestingModule` from `@nestjs/testing`
- [ ] All external dependencies are mocked
- [ ] Tests are descriptive: `it('throws NotFoundException when customer does not exist', ...)`
- [ ] Tests cover both happy path and all error scenarios
- [ ] No `expect(true).toBe(true)` placeholder tests
- [ ] No `as any` casts in tests

### Step 5 — DTO Quality

- [ ] All DTOs have `@ApiProperty()` or `@ApiPropertyOptional()`
- [ ] `@ApiProperty({ example: '...' })` provides realistic example values
- [ ] Numeric IDs documented as `@ApiProperty({ type: String })` (BigInt-safe)
- [ ] `CreateXxxDto` and `UpdateXxxDto` do not duplicate fields
- [ ] Response DTOs do not expose internal implementation details

### Step 6 — Use Case Quality

- [ ] Each use case has a single `execute()` method
- [ ] Business logic is in the use case, not in the repository or controller
- [ ] Exceptions are NestJS HTTP exceptions, not plain `Error`
- [ ] Async flow: no unnecessary `await` on synchronous operations

---

## Scoring

| Area | Pass Threshold |
|------|---------------|
| Automated checks | 100% — no exceptions |
| Naming conventions | ≥ 95% compliant |
| Comment hygiene | 100% — no what-comments |
| Test quality | All use cases covered |
| DTO quality | 100% Swagger-annotated |

---

## Output Report

```
Code Quality Review — Sprint {N} — {Date}

AUTOMATED CHECKS: [PASS / FAIL]
NAMING: [PASS / PARTIAL] ({N} violations)
COMMENT HYGIENE: [PASS / FAIL] ({N} violations)
TEST QUALITY: [PASS / PARTIAL] ({N} suites)
DTO QUALITY: [PASS / PARTIAL] ({N} DTOs missing annotations)

OVERALL: [PASS / CONDITIONAL / FAIL]
```

---

## Final Recommendation

- **PASS**: Code quality meets standards
- **CONDITIONAL**: Minor issues documented; proceed with acknowledgment
- **FAIL**: Automated checks failing or systematic quality violations — fix before release
