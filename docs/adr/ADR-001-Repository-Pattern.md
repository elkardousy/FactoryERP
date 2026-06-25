# ADR-001 — Repository Pattern

**Status:** Accepted
**Date:** 2026-06-26
**Deciders:** Principal Architect
**Applies to:** All modules, all database access

---

## Context

The application requires a structured approach to database access. Without explicit boundaries, application code can become tightly coupled to the database client, making it difficult to test, evolve the schema, or change the ORM.

NestJS services can inject `PrismaClient` (via `PrismaService`) directly. Nothing prevents a controller from bypassing the service layer and querying the database itself. As the ERP grows to 20+ modules, uncontrolled database access becomes a maintenance liability.

The specific constraints in this project:

- Prisma 6 is used as the ORM. It does not have a native repository abstraction.
- Some Prisma model types cannot be imported directly (models with `Unsupported` fields require `GetPayload` workarounds).
- Transactions need to be available across the codebase without every use-case knowing the Prisma transaction API.
- The PostgreSQL `multiSchema` feature is active — all tables live in the `factory` schema.

---

## Decision

Implement a **Repository Pattern** using an abstract `BaseRepository` class.

**Rules:**

1. `PrismaService` is only injected into classes that extend `BaseRepository`. No service, use case, or controller may inject `PrismaService` directly.
2. Every domain entity that requires database access has a dedicated repository class.
3. Repositories are placed in `src/modules/<module>/repositories/`.
4. All repositories extend `BaseRepository`, which provides `protected get db()` (alias for `this.prisma`) and `async executeInTransaction<T>()`.
5. Repositories expose typed, named methods (`findById`, `create`, `updateLastLogin`). They do not expose the raw Prisma client.

**`BaseRepository` implementation:**

```typescript
export abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaService) {}

  protected get db(): PrismaService { return this.prisma; }

  async executeInTransaction<T>(
    callback: (tx: PrismaService) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => callback(tx as PrismaService));
  }
}
```

The `tx as PrismaService` cast is intentional — it gives the callback the same API surface as the full service while Prisma's runtime transaction semantics still apply.

---

## Alternatives Considered

### A — Inject PrismaService directly everywhere
Faster to write initially. Rejected because it couples all layers to the ORM, makes unit testing harder (must mock PrismaService), and produces no clear encapsulation of query logic.

### B — NestJS TypeORM-style generic repository (`Repository<Entity>`)
TypeORM's generic repository provides `findOne`, `save`, `delete` with typed generics. Prisma's model API is not generic in the same way — each model has its own namespace (`this.db.users`, `this.db.user_sessions`). A generic wrapper would require complex factory patterns that add abstraction without value.

### C — Custom ORM / Query Builder
Rejected entirely. Prisma 6 is the ORM of choice.

---

## Consequences

**Positive:**
- Every database query is encapsulated in a named method with clear intent.
- Unit tests for services and use-cases mock repositories (simple objects), not PrismaService (complex).
- Schema changes are isolated to the repository that owns the affected model.
- `executeInTransaction` is available uniformly without knowing Prisma's `$transaction` API.
- The `Unsupported("inet")` workaround (`Prisma.user_sessionsGetPayload<object>`) is contained inside the repository; callers use the `UserSession` type alias.

**Negative / Trade-offs:**
- More files — each model requires a repository class even for simple CRUD.
- The `tx as PrismaService` cast loses compile-time guarantees about which operations are available inside a transaction (Prisma's `TransactionClient` is a subset of `PrismaClient`).
- Repositories expose only the methods they implement. Any new query pattern requires adding a method explicitly — there is no "escape hatch" to the raw client from outside the repository.
