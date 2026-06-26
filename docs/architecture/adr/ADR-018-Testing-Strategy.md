# ADR-018 — Testing Strategy

## Title

Unit Testing with NestJS Testing Module and Mocked Repository Layer

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The ERP codebase requires a testing strategy that:

1. **Verifies business logic without a database**: Tests that require live database connections are slow, brittle, and difficult to run in CI environments
2. **Tests guards and middleware**: Authorization guards have complex branching logic that must be verified independently
3. **Does not over-mock**: Tests that mock so much they only verify that mocks are called are not valuable
4. **Covers edge cases**: Business rules (idempotency, conflict detection, soft-delete lifecycle) must be tested explicitly
5. **Runs fast**: The full test suite must complete in under 30 seconds to support developer feedback loops

---

## Decision

**Unit tests using Jest with the NestJS Testing Module (`@nestjs/testing`)**, with repositories and external services mocked.

### Test Architecture

The testing architecture follows the application's layer separation:

```
Tested:   Use Cases → (mocked repositories + mocked services)
Tested:   Guards → (mocked services, mocked ExecutionContext)
Tested:   Pure functions (buildPaginationMeta, DocumentNumberingService)
```

### NestJS Testing Module Pattern

Use-case tests instantiate a minimal NestJS DI context with mock providers:

```typescript
function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateCustomerUseCase,
      {
        provide: CustomersRepository,
        useValue: {
          findByCode: jest.fn(),
          findById: jest.fn(),
          create: jest.fn(),
          softDelete: jest.fn(),
          restore: jest.fn(),
        },
      },
      {
        provide: AuditService,
        useValue: { log: jest.fn().mockResolvedValue(undefined) },
      },
    ],
  }).compile();
}
```

Each test suite creates a fresh DI context and gets typed mocks:

```typescript
beforeEach(async () => {
  const m = await buildModule();
  useCase = m.get(CreateCustomerUseCase);
  repo = m.get(CustomersRepository);
  repo.findByCode.mockResolvedValue(null);
  repo.create.mockResolvedValue(MOCK_CUSTOMER);
});
```

### Test Coverage Requirements

The following are tested with unit tests:

| Component | What is Tested |
|-----------|---------------|
| Use Cases | Happy path, entity-not-found (NotFoundException), duplicate code (ConflictException), already-active/inactive state (BadRequestException), audit invocation |
| Guards | Allow/deny decisions for all metadata combinations, public route bypass, system role bypass, role matching |
| Pure Infrastructure | `buildPaginationMeta` edge cases (0 total, first/last page), `DocumentNumberingService` template substitution |

### Fire-and-Forget Testing Pattern

Use-cases call `void this.auditService.log(...)`. Testing this is non-trivial because:
1. The Promise is not awaited — the test cannot `await` the audit call
2. Using `mockRejectedValue` causes an unhandled Promise rejection in Node.js 24, crashing the Jest worker

The correct test pattern:
```typescript
it('calls auditService.log fire-and-forget on successful login', async () => {
  await useCase.execute({ username: 'alice', password: 'pass' }, CTX);
  expect(auditService.log).toHaveBeenCalledWith(
    expect.objectContaining({ eventType: 'AUTH_LOGIN' }),
  );
});
// Do NOT use mockRejectedValue for fire-and-forget methods
```

### ESLint Overrides for Test Files

Test files have relaxed ESLint rules:
```javascript
{
  files: ['**/*.spec.ts', '**/*.test.ts'],
  rules: {
    '@typescript-eslint/unbound-method': 'off',     // expect(mock.fn) pattern
    '@typescript-eslint/no-unsafe-assignment': 'off', // as any in mock setups
    '@typescript-eslint/no-unsafe-argument': 'off',   // as any in mock setups
    '@typescript-eslint/no-unsafe-member-access': 'off', // mock property access
  }
}
```

The `unbound-method` rule fires for `expect(mock.method).toHaveBeenCalled()` — a standard Jest pattern. The override is scoped to test files only.

### Test File Location Convention

Tests are colocated with the code they test:
- `login.use-case.ts` → `login.use-case.spec.ts` (same directory)
- `roles.guard.ts` → `roles.guard.spec.ts` (same directory)
- `customers.use-cases.spec.ts` (one file per module, multiple suites)

### What is NOT Tested in Unit Tests

- Repository implementations (require database)
- Controller HTTP routing (require full NestJS application)
- End-to-end flows (require database + HTTP server)

These are reserved for future integration and E2E test suites.

---

## Rationale

**Why the NestJS Testing Module instead of direct class instantiation?**

The Testing Module resolves dependencies via NestJS DI. This ensures:
- The same DI configuration used in production is used in tests
- Circular dependency detection works in tests
- Module-level setup (`onModuleInit`) runs in tests

Direct instantiation (`new CreateCustomerUseCase(mockRepo, mockAuditService)`) bypasses the DI container. If the constructor changes (new dependency added), tests using direct instantiation fail at runtime rather than being caught by DI resolution.

**Why mock repositories rather than use an in-memory database?**

In-memory database alternatives (e.g., SQLite with Prisma) require:
- Maintaining a test database schema
- Running migrations in tests
- Handling data setup/teardown between tests
- Prisma incompatibilities between SQLite and PostgreSQL feature sets

Mock repositories avoid all of this. The trade-off is that repository queries are not tested, but repositories are simple query wrappers — the interesting logic lives in use-cases.

**Why not mock at the module level (jest.mock())?**

`jest.mock()` mocks entire modules at the file level, affecting all tests in a file. NestJS provider mocks (`useValue: { ... }`) scope the mock to the specific DI context. This makes test isolation cleaner and prevents mock state from leaking between describe blocks.

**Why colocate test files instead of a separate `test/` directory?**

Colocated test files:
- Are discovered by IDE "go to test" shortcuts
- Are naturally maintained alongside the code they test
- Reduce the risk of orphaned test files after code refactoring

A separate `test/unit/` directory was considered and rejected because it creates navigation overhead when working on a specific file.

**Why no integration tests currently?**

Integration tests requiring a real database are the highest value tests to add next. They are deferred to the next sprint because:
- They require a test database setup (not currently automated)
- Unit tests cover the critical business logic
- Integration tests can be added incrementally without restructuring existing tests

---

## Consequences

**Positive:**
- Full test suite runs in under 10 seconds
- No database dependency for test execution
- Tests are independent of database state
- Business logic edge cases are systematically covered

**Negative:**
- Repository queries are not tested (a bug in a complex Prisma query would not be caught)
- The interaction between multiple use-cases (e.g., creating then deactivating) is not tested
- End-to-end flows are not verified in CI

**Trade-offs:**
- Unit tests vs. integration tests: Unit tests are fast but cannot catch database-layer bugs. Integration tests catch more bugs but are slower and require infrastructure. Both are needed for a production ERP; unit tests are the foundation.

**Future Implications:**
- **Integration tests**: Prisma with a dedicated test database (Docker Compose) for repository-level tests
- **E2E tests**: Supertest-based HTTP tests against a fully-booted NestJS application
- **Contract tests**: If the ERP exposes an API consumed by external systems, consumer-driven contract tests ensure API compatibility

---

## Related Components

- All `src/**/*.spec.ts` files
- `eslint.config.mjs` — test file ESLint overrides
- `package.json` — Jest configuration
- `jest.config.ts` or inline Jest config

---

## Alternatives Considered

### Supertest E2E Tests Only

Some teams skip unit tests and test exclusively through HTTP calls. Rejected because:
- E2E tests are slow (require full application boot + database)
- Business logic edge cases are harder to isolate and test
- A broken guard does not surface clearly in an E2E test

### In-Memory Database (SQLite/Prisma Test Driver)

Considered. Prisma supports SQLite for testing. Rejected because:
- PostgreSQL-specific features (`factory` schema, `Timestamptz`, JSONB, `multiSchema`) are not supported in SQLite
- Migration compatibility issues between SQLite and PostgreSQL are a known problem
- The mock repository approach is simpler and sufficient for current needs

### Snapshot Testing

Not adopted for business logic tests — snapshots test "the output doesn't change" rather than "the output is correct." For a rapidly evolving ERP, snapshots would require frequent updates without providing genuine value.

---

## Future Evolution

- **Integration tests (Sprint N+1)**: Repository tests against a real PostgreSQL instance using Docker Compose
- **E2E tests (Sprint N+2)**: HTTP-level tests against a fully-booted test application
- **Test data builders**: Fluent builder pattern for constructing complex test fixtures (e.g., a customer with models and parts)
- **Coverage gates**: CI pipeline enforces minimum coverage thresholds per module

---

## References

- All `src/**/*.spec.ts` files
- `eslint.config.mjs`
- ADR-001 (Repository Pattern) — why mocked repositories work
- ADR-002 (Clean Architecture) — why use-cases are the primary unit test target
