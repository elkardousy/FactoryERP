# 09 — Testing Baseline

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| Runner | Jest ^30.0.0 |
| TypeScript transformer | ts-jest ^29.2.5 |
| Test root | `src/` |
| Test pattern | `.*\\.spec\\.ts$` |
| Environment | node |
| E2E config | `test/jest-e2e.json` |
| Coverage directory | `../coverage` |
| HTTP testing | supertest ^7.0.0 |

---

## Test Commands

```bash
npm run test                           # Run all unit tests
npm run test:watch                     # Watch mode
npm run test:cov                       # With coverage
npm run test:e2e                       # E2E tests (test/jest-e2e.json)
npm run test -- --testPathPattern=auth # Run tests matching pattern
npm run test -- --testPathPattern=inventory # Run inventory tests only
```

---

## All Spec Files (22 total)

### Core Infrastructure Tests (2)

| File | What It Tests |
|------|---------------|
| `src/core/document-numbering/document-numbering.service.spec.ts` | DocumentNumberingService — sequence generation |
| `src/core/interceptors/response.interceptor.spec.ts` | ResponseInterceptor — response wrapping, BigInt serialization |

### Common Tests (1)

| File | What It Tests |
|------|---------------|
| `src/common/interfaces/paginated-result.spec.ts` | PaginatedResult interface shape |

### Auth Tests (4)

| File | What It Tests |
|------|---------------|
| `src/modules/auth/services/password.service.spec.ts` | bcrypt hash/compare |
| `src/modules/auth/services/token.service.spec.ts` | Refresh token generation/validation |
| `src/modules/auth/strategies/jwt.strategy.spec.ts` | JwtStrategy.validate() |
| `src/modules/auth/use-cases/login/login.use-case.spec.ts` | Login orchestration |

### Authorization Tests (5)

| File | What It Tests |
|------|---------------|
| `src/modules/authorization/cache/memory-permission-cache.spec.ts` | In-memory cache set/get/invalidate |
| `src/modules/authorization/guards/roles.guard.spec.ts` | RolesGuard — role checking |
| `src/modules/authorization/guards/screen-permission.guard.spec.ts` | ScreenPermissionGuard |
| `src/modules/authorization/services/authorization.service.spec.ts` | AuthorizationService |
| `src/modules/authorization/services/permission-resolver.service.spec.ts` | PermissionResolverService |

### Business Module Tests (8)

| File | Module |
|------|--------|
| `src/modules/customers/use-cases/customers.use-cases.spec.ts` | Customers |
| `src/modules/garment-models/use-cases/models.use-cases.spec.ts` | Garment Models |
| `src/modules/measurements/use-cases/colors/colors.use-cases.spec.ts` | Measurements |
| `src/modules/organization/use-cases/departments/departments.use-cases.spec.ts` | Organization |
| `src/modules/organization/use-cases/working-shifts/working-shifts.use-cases.spec.ts` | Organization |
| `src/modules/production-setup/use-cases/production-lines/production-lines.use-cases.spec.ts` | Production Setup |
| `src/modules/suppliers/use-cases/suppliers.use-cases.spec.ts` | Suppliers |
| `src/modules/warehouses/use-cases/warehouses.use-cases.spec.ts` | Warehouses |

### Inventory Tests (2)

| File | Test Count | What It Tests |
|------|------------|---------------|
| `src/modules/inventory/use-cases/inventory-transactions.use-cases.spec.ts` | 26 | All 8 transaction use cases |
| `src/modules/inventory/use-cases/reservations.use-cases.spec.ts` | 29 | All 8 reservation use cases |

---

## Test Approach

### Testing Strategy

All unit tests follow the **NestJS Testing Module** pattern:

```typescript
const module = await Test.createTestingModule({
  providers: [
    UseCase,
    { provide: Repository, useValue: mockRepository },
    { provide: LoggerService, useValue: mockLogger },
  ],
}).compile();
```

### What Is Tested

- **Use cases:** Fully tested via unit tests with mocked repositories/services
- **Services/Validators/Factories/Mappers:** Covered implicitly through use case tests
- **Guards:** Dedicated guard spec files (authorization module)
- **Interceptors:** Dedicated spec file (ResponseInterceptor)
- **Repositories:** NOT unit tested (they are DB-dependent)
- **Controllers:** NOT unit tested (thin layer, E2E coverage only)

### What Is NOT Tested

- Repository implementations (require live database)
- Controller layer (tested via E2E only)
- Database migrations
- Integration between modules
- Prisma client behavior

---

## Mock Patterns Used

### Standard Repository Mock

```typescript
const mockRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};
```

### Transaction Mock Fix (Sprint 11.2 lint fix)

```typescript
// CORRECT (after lint fix)
executeInTransaction: jest.fn().mockImplementation(
  (cb: (tx: unknown) => Promise<unknown>) => cb({})
)

// WRONG (caused lint error)
executeInTransaction: jest.fn().mockImplementation((cb: any) => cb({}))
```

### Logger Mock

```typescript
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
```

---

## Test Coverage (Known)

### Inventory Transaction Tests (26 tests in inventory-transactions.use-cases.spec.ts)

Tests cover:
- `ReceiveInventoryUseCase.execute()` — success + validation failures
- `IssueInventoryUseCase.execute()` — success + missing warehouse/order
- `TransferInventoryUseCase.execute()` — success + same-warehouse error
- `AdjustInventoryUseCase.execute()` — success + zero qty error
- `ListInventoryTransactionsUseCase.execute()` — paginated list
- `GetInventoryTransactionUseCase.execute()` — found + not found
- `CreateInventoryTransactionUseCase.execute()` — all operation types + default error
- `GetBagTransactionHistoryUseCase.execute()` — history retrieval

### Inventory Reservation Tests (29 tests in reservations.use-cases.spec.ts)

Tests cover:
- `CreateReservationUseCase.execute()` — success + bag not found + order not found + duplicate + insufficient qty
- `ReleaseReservationUseCase.execute()` — success + not found + not ACTIVE
- `CancelReservationUseCase.execute()` — success + not found + not ACTIVE
- `ExpireReservationUseCase.execute()` — success + not found + not ACTIVE
- `GetReservationUseCase.execute()` — found + not found
- `ListReservationsUseCase.execute()` — paginated list
- `ListReservationsByBagUseCase.execute()` — list by bag
- `ListReservationsByOrderUseCase.execute()` — list by order

---

## E2E Tests

`test/app.e2e-spec.ts` — basic application startup test.  
Full E2E API coverage is NOT implemented (only skeleton exists).

---

## Known Testing Gaps

1. **Repository layer** — no tests for Prisma queries
2. **Controller layer** — no unit or integration tests
3. **E2E tests** — only skeleton, not full API coverage
4. **Database integration tests** — not present
5. **Transaction atomicity tests** — not verified at test level (relies on DB constraint)
6. **Authorization guard integration** — guard tests exist but not wired to API tests
7. **Performance tests** — not implemented

---

## Test Count Summary

| Category | Estimated Tests |
|----------|----------------|
| Core (interceptor, numbering, common) | ~10 |
| Auth (4 spec files) | ~20 |
| Authorization (5 spec files) | ~25 |
| Business modules (8 spec files) | ~80 |
| Inventory transactions | 26 |
| Inventory reservations | 29 |
| **Total** | **~190–200** |

**Reported at Sprint 11.3 completion:** 197 tests passing.
