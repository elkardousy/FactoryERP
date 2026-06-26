# ADR-001 — Repository Pattern

## Title

Repository Pattern as the Exclusive Data Access Abstraction

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The ERP requires a consistent and testable way to access the database. Without a defined data access pattern, individual developers will write database queries directly in services, use-cases, or controllers — making the codebase unpredictable, difficult to test, and tightly coupled to a specific ORM version.

Specific problems that needed solving:

1. **Testability**: How do you unit-test business logic without a real database connection?
2. **Consistency**: How do you ensure all database access follows the same patterns (pagination, filtering, soft deletes)?
3. **Transaction support**: How do use-cases that span multiple repository operations remain atomically consistent?
4. **Query encapsulation**: How do you prevent ad-hoc queries from being spread across the codebase?

---

## Decision

A **Repository Pattern** was adopted as the single mechanism for all database access in the FactoryERP.

### BaseRepository

An abstract `BaseRepository` class (`src/core/database/repositories/base/base.repository.ts`) provides the foundation for all repositories:

```typescript
export abstract class BaseRepository {
  protected readonly db: PrismaService;  // alias for this.prisma

  constructor(protected readonly prisma: PrismaService) {
    this.db = prisma;
  }

  protected async executeInTransaction<T>(
    fn: (tx: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => fn(tx as unknown as PrismaService)
    );
  }
}
```

### Repository Implementation Pattern

Every business repository:
- Extends `BaseRepository`
- Is decorated with `@Injectable()`
- Defines strongly-typed input interfaces (e.g., `CreateCustomerData`, `UpdateCustomerData`, `CustomerFilter`)
- Exposes a consistent method surface: `create`, `update`, `findById`, `findByCode`, `findAllWithPagination`, `softDelete`, `restore`
- Uses `this.db` (never direct Prisma imports) for all queries
- Wraps concurrent operations (count + findMany) in `$transaction` for consistency

### Pagination Consistency

All list operations return `PaginatedResult<T>` using the shared `buildPaginationMeta(page, limit, total)` helper, ensuring consistent pagination metadata across every endpoint.

### Registration

Each repository is declared as a provider in its parent module and injected via constructor into use-cases. No cross-module repository injection is permitted.

---

## Rationale

**Why Repository Pattern over direct Prisma usage in services/use-cases?**

Direct Prisma usage in use-cases or services would make unit testing impossible without a database. The repository layer creates an injectable abstraction that can be replaced with a mock in tests.

**Why abstract BaseRepository instead of an interface?**

An abstract class was chosen over an interface because:
1. It provides the concrete `executeInTransaction` implementation that all repositories need
2. It enforces constructor injection of `PrismaService` without repetition
3. TypeScript abstract classes enable runtime dependency injection; pure interfaces do not

**Why is `this.db` an alias for `this.prisma`?**

The `db` shorthand reduces verbosity inside repository method bodies while preserving the semantically clear `prisma` name for the constructor parameter. Both refer to the same `PrismaService` instance.

**Why are input types defined as local interfaces per repository?**

Repositories define their own `CreateXxxData`, `UpdateXxxData`, and `XxxFilter` interfaces locally. This keeps input contracts close to their consumers and avoids leaking ORM types (`Prisma.CustomersCreateInput`) into the use-case layer.

---

## Consequences

**Positive:**
- Use-cases can be unit-tested with mocked repositories — no database required
- All query logic is colocated with the aggregate it belongs to
- Pagination and filter logic follows a consistent pattern across all business modules
- `executeInTransaction` provides a safe way to coordinate multi-repo operations without exposing Prisma transaction internals to use-cases

**Negative:**
- Repository files require boilerplate for each new entity (typically 80-120 lines)
- The `tx as unknown as PrismaService` cast in `executeInTransaction` is a necessary workaround for the fact that Prisma's `TransactionClient` type is not the same as `PrismaService`; the cast must be treated as `Prisma.TransactionClient` inside the callback body

**Trade-offs:**
- The pattern adds one layer of indirection compared to calling Prisma directly. This indirection pays back in testability and consistency.

**Future Implications:**
- Future repositories for new ERP modules must extend `BaseRepository` and follow the same method surface conventions
- If Prisma is ever replaced with a different ORM, only repository files need to change — use-cases and higher layers are unaffected

---

## Related Components

- `src/core/database/repositories/base/base.repository.ts`
- `src/common/interfaces/paginated-result.interface.ts`
- All `src/modules/*/repositories/*.repository.ts` files
- All use-cases that inject repositories
- Test files using `jest.Mocked<XxxRepository>`

---

## Alternatives Considered

### Active Record Pattern (as in Ruby on Rails / TypeORM Active Record)

Rejected. Active Record mixes data access with business logic in the model class. This makes unit testing difficult and violates separation of concerns. NestJS with Prisma does not naturally support Active Record anyway.

### Data Mapper Pattern Without Abstraction (direct Prisma in services)

Rejected. This was the "no pattern" option. Without abstraction, services become untestable without a real database. As the team learned on prior projects, testing overhead compounds rapidly as the codebase grows.

### Generic Repository with Type Parameters

Considered. A `GenericRepository<T>` with common CRUD methods could reduce boilerplate. Rejected because:
- Prisma's model types are auto-generated and don't share a common interface
- Each entity has unique query patterns (different filter fields, different pagination strategies)
- The marginal boilerplate reduction was not worth the loss of type safety and explicitness

### CQRS with Separate Read/Write Repositories

Considered for future phases. Not adopted initially because the current read patterns do not justify the complexity of maintaining separate read/write models. The `findAllWithPagination` methods provide adequate read performance without CQRS overhead.

---

## Future Evolution

As the ERP grows:

- **Multi-tenancy**: `executeInTransaction` can be extended to pass a `tenantId` discriminator without changing repository call sites
- **Read replicas**: The `db` getter could be augmented to return a read-replica connection for `findAll*` methods while preserving write connection for mutations
- **CQRS**: If read complexity grows significantly, read repositories can be split into dedicated query handlers without changing the write repository interface
- **Soft-delete filter injection**: A global Prisma middleware could automatically add `is_active: true` filters, eliminating the need for explicit filter in every repository query

---

## References

- `src/core/database/repositories/base/base.repository.ts`
- `src/modules/customers/repositories/customers.repository.ts` — representative implementation
- `src/common/interfaces/paginated-result.interface.ts`
- `CLAUDE.md` — Layer ordering rules
- ADR-002 (Clean Architecture) — Why repositories sit below services
- ADR-022 (Dependency Rules) — Which layers may use which layers
