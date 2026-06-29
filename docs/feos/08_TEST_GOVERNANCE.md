# 08 — Test Governance

**Document:** FEOS-08  
**Category:** Testing  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-04 (Implementation Governance), FEOS-07 (Code Governance)  
**Related KEB:** KEB-09 (Testing Baseline)

---

## Purpose

This document governs the testing strategy, coverage requirements, mocking standards, test quality gates, and regression policy for FactoryERP. It defines what must be tested, how it must be tested, and what constitutes an acceptable test suite.

## Scope

All test files (`*.spec.ts`, `*.e2e-spec.ts`) in the FactoryERP repository.

## Audience

All engineers and AI agents writing, reviewing, or maintaining tests.

---

## Testing Pyramid

FactoryERP follows a use-case-centric testing pyramid:

```
         [E2E]               (minimal — API contract verification)
       [Integration]         (not yet implemented — planned for future phases)
    [Unit: Use Cases]        (primary test layer — MANDATORY for all use cases)
 [Unit: Services/Helpers]    (RECOMMENDED where business logic is complex)
```

At FEOS 1.0 baseline, unit tests covering use cases are the primary and mandatory test layer. Integration tests and comprehensive E2E tests are acknowledged gaps (GAP-017, GAP-018 in KEB-19) and are planned for future phases.

---

## Test Baseline

At commit `5a5e3d6` (Sprint 11.3), the test baseline is:

| Metric | Value |
|--------|-------|
| Total spec files | 22 |
| Total tests | ~197 |
| All tests passing | Yes |
| Inventory transaction use case tests | 26 |
| Inventory reservation use case tests | 29 |
| Auth module tests | ~20 |
| Authorization module tests | ~25 |
| Business module tests (6 modules) | ~80 |
| Core infrastructure tests | ~10 |
| E2E tests | 1 (skeleton only) |
| Repository tests | 0 |

---

## Mandatory Test Coverage

### Use Case Coverage (MANDATORY)

Every use case class must have unit test coverage. Minimum required tests per use case:

1. **Happy path test:** The use case executes successfully with valid input and returns the expected result.
2. **Primary failure path test:** The use case fails appropriately when the primary business constraint is violated (e.g., insufficient available quantity, not found, already exists).

Both tests are required. A use case without both tests is not accepted.

### Controller Coverage (RECOMMENDED)

Controller unit tests are recommended but not mandatory, given that controllers are thin (one use case call per action). If a controller contains conditional logic, that logic must be tested.

### Repository Coverage (KNOWN GAP)

Repository unit tests are currently absent (GAP-018 in KEB-19). This is an acknowledged debt. When repository tests are introduced:

- They must use an in-memory database or a test database — not mock the database.
- They must not mock `PrismaService` inside the repository (that defeats the purpose).

### Service Coverage (RECOMMENDED)

Complex services (validators, mappers, factories) are recommended to have unit tests when their logic is non-trivial.

---

## Mock Standards

### What to Mock in Use Case Tests

In use case unit tests:

- **Mock:** All repositories (inject mock objects).
- **Mock:** All services (inject mock objects).
- **Do NOT mock:** The use case under test.
- **Do NOT mock:** NestJS framework itself.

### Mock Object Pattern

Use Jest's `jest.fn()` for mock methods:

```typescript
const mockPhysicalBagsRepository = {
  findById: jest.fn(),
  updateStatus: jest.fn(),
};

const mockReservationsRepository = {
  findActiveByBagId: jest.fn(),
  create: jest.fn(),
};
```

### executeInTransaction Mock Pattern

When mocking `executeInTransaction` in repository mocks, the callback must be typed correctly:

```typescript
// Correct (passes ESLint lint gate):
executeInTransaction: jest.fn().mockImplementation(
  (cb: (tx: unknown) => Promise<unknown>) => cb({})
)

// Wrong (lint error: cb: any):
executeInTransaction: jest.fn().mockImplementation((cb: any) => cb({}))
```

This is a critical lint rule. The `(cb: any)` pattern triggers an ESLint `no-explicit-any` error.

### Mock Reset Pattern

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

Always reset mocks before each test. Do not rely on test order.

---

## Test File Organization

### One Spec File Per Module Domain

Use cases within the same feature domain share a single spec file:

| Domain | Spec File |
|--------|-----------|
| Inventory Transactions | `inventory-transactions.use-cases.spec.ts` |
| Inventory Reservations | `reservations.use-cases.spec.ts` |
| Auth | `auth.use-cases.spec.ts` (or similar) |

### Spec File Location

Use case spec files live in:
```
src/modules/<domain>/use-cases/<domain>.use-cases.spec.ts
```

Do not scatter individual spec files per use case. Group all use cases for a module domain in one spec file.

### Test Structure

```typescript
describe('<Domain> Use Cases', () => {
  describe('<UseCase Name>', () => {
    it('should execute successfully when input is valid', async () => { ... });
    it('should throw NotFoundException when resource does not exist', async () => { ... });
    it('should throw BadRequestException when business rule is violated', async () => { ... });
  });
  
  describe('<Another UseCase Name>', () => {
    // ...
  });
});
```

---

## Test Quality Gates

### Gate T-001 — All Tests Pass

Before sprint acceptance, `npm run test` must exit with code 0. Zero test failures are acceptable.

### Gate T-002 — No Regressions

The test count must not decrease sprint over sprint (unless tests are explicitly removed with documented justification). A decrease in test count indicates test deletion rather than test fixing.

### Gate T-003 — No Test Suppression

Tests must not be suppressed via:
- `it.skip()` — unless the test is being fixed in the same sprint
- `xit()` — same rule
- `pending()` — not acceptable
- Deleting the failing test — never acceptable

If a test is failing because of a known limitation, document the limitation in KEB-19 (Knowledge Gaps) and keep the test marked `it.todo()` with a comment explaining the gap.

### Gate T-004 — Mock Typing

All mock callbacks must be typed (not `any`). The `executeInTransaction` callback pattern in particular must use `(cb: (tx: unknown) => Promise<unknown>)`.

---

## Anti-Patterns

The following test patterns are prohibited:

| Anti-Pattern | Reason |
|-------------|--------|
| `cb: any` in mock callbacks | ESLint violation (`no-explicit-any`) |
| `jest.spyOn(process, 'exit')` | Interferes with test runner |
| Importing `PrismaService` directly in use case tests | Violates test isolation |
| Assertions without `expect` | Silent no-op tests |
| Single test per use case (only happy path) | Insufficient coverage |
| `console.log` in test output | Use Jest `jest.spyOn(logger, ...)` if needed |
| Test ordering dependencies | Each test must be independent |
| Long `describe` blocks without `beforeEach` reset | State pollution between tests |

---

## Running Tests

```bash
# All unit tests
npm run test

# Tests with coverage
npm run test:cov

# Watch mode (during development)
npm run test:watch

# Filter by path pattern
npm run test -- --testPathPattern=inventory

# Filter by test name pattern
npm run test -- --testNamePattern="CreateReservation"

# E2E tests
npm run test:e2e
```

---

## Future Test Expansion (Planned)

The following test types are planned but not yet implemented:

| Type | Target Sprint | Notes |
|------|-------------|-------|
| Repository integration tests | TBD | Requires test database |
| E2E API tests | Sprint 16+ | Requires full module coverage |
| Performance tests | Post-MVP | Load testing for reservation engine |

When repository tests are implemented, they must use a dedicated test database, not mock `PrismaService`.

---

## Compliance Rules

### Rule T-001 — Use Case Test Mandatory

**Classification:** MANDATORY  
**Statement:** Every use case must have at least one happy path test and one failure path test in the corresponding spec file.  
**Violation Impact:** Sprint not accepted.  
**Risk:** Regressions not caught.  
**Recovery:** Write the missing tests.  
**Approval Required:** None.

### Rule T-002 — No Mock Typing with `any`

**Classification:** MANDATORY  
**Statement:** Mock callback parameters must not be typed as `any`. Specifically, `executeInTransaction` mock callbacks must use `(cb: (tx: unknown) => Promise<unknown>)`.  
**Violation Impact:** ESLint error — fails lint gate.  
**Risk:** Type safety bypassed in tests.  
**Recovery:** Add proper type annotation to the callback parameter.  
**Approval Required:** None.

### Rule T-003 — Test Pass Gate

**Classification:** MANDATORY  
**Statement:** `npm run test` must exit 0 before sprint acceptance. Failed tests are blocking.  
**Violation Impact:** Sprint not accepted.  
**Risk:** Undetected regressions.  
**Recovery:** Fix the failing test or the code that caused the failure.  
**Approval Required:** None.

### Rule T-004 — No Test Deletion to Fix Failures

**Classification:** MANDATORY  
**Statement:** Failing tests must be fixed by correcting the code, not by removing the test. Deleting a test to make the suite pass is not acceptable.  
**Violation Impact:** Hidden regressions, reduced coverage.  
**Risk:** Defects reach production.  
**Recovery:** Restore the deleted test and fix the underlying code.  
**Approval Required:** Architect approval required to permanently remove a test.
