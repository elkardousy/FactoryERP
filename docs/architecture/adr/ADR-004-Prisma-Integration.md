# ADR-004 — Prisma Integration

## Title

Prisma ORM as the Exclusive Database Access Layer

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The ERP needs a type-safe, migration-managed, and developer-productive ORM for PostgreSQL. Key requirements:

1. **Type safety**: Query parameters and results must be fully typed to catch schema mismatches at compile time
2. **Schema migrations**: Database schema changes must be version-controlled and applied deterministically
3. **PostgreSQL features**: The ERP uses PostgreSQL-specific features (JSONB, Timestamptz, multi-schema, Decimal)
4. **Transaction support**: Multi-table operations must be atomic
5. **Multi-schema support**: All ERP tables must live in the `factory` PostgreSQL schema, not `public`

---

## Decision

**Prisma 6** is the chosen ORM. It is integrated via a `PrismaService` that extends `PrismaClient` directly, wrapped in a global `PrismaModule`.

### PrismaService Design

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> { await this.$connect(); }
  async onModuleDestroy(): Promise<void> { await this.$disconnect(); }
  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => { void app.close(); });
  }
}
```

The service-as-client pattern (extending PrismaClient) was chosen over wrapping it in a property because:
- `PrismaService` itself can be passed as a transaction client in `$transaction` callbacks
- Repositories receive `PrismaService` and use it directly without additional indirection
- The `this.db` getter in `BaseRepository` is a direct reference to the same object

### Schema Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["factory"]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}
```

All models include `@@schema("factory")` to enforce schema isolation.

### BigInt Primary Keys

Every model uses `BigInt @id @default(autoincrement())` for its primary key, regardless of expected table size. This is a uniform policy, not a per-table decision.

### Decimal Precision

Production quantities use `Decimal(12,3)` for exact arithmetic. This prevents floating-point rounding errors in manufacturing calculations (dozen counts, piece counts).

### Timestamptz(6)

All timestamp columns use `DateTime @db.Timestamptz(6)` for microsecond-precision, timezone-aware storage.

### Soft Delete Pattern

Entities with business lifecycle (customers, suppliers, warehouses, departments, etc.) use `is_active Boolean @default(true)` rather than physical deletion. Deleted entities are queryable for audit and reporting purposes.

### Migration Strategy

- **Development**: `npx prisma migrate dev` — creates and applies migrations, regenerates client
- **Production**: `npx prisma migrate deploy` — applies pending migrations without interactive prompts
- **Client regeneration**: `npx prisma generate` — regenerates TypeScript client after schema changes (does not require database connection)

### Transaction Pattern in Repositories

```typescript
// Consistent count + query transaction
const [items, total] = await this.db.$transaction([
  this.db.customers.findMany({ where, skip, take }),
  this.db.customers.count({ where }),
]);
```

```typescript
// Use-case-level atomic operations
await this.executeInTransaction(async (tx) => {
  const record = await tx.customers.create({ data });
  await tx.audit_events.create({ data: auditData });
  return record;
});
```

---

## Rationale

**Why Prisma over TypeORM?**

TypeORM was the earlier NestJS standard but has significant issues in 2024-2026:
- Active Record pattern encourages mixing data access with business logic
- Generated queries are often inefficient
- Migration reliability has been a recurring community pain point
- TypeScript type inference is weaker than Prisma's

Prisma generates a complete type-safe client from the schema, provides excellent DX, and has strong PostgreSQL support.

**Why extend PrismaClient rather than inject it as a property?**

Extending allows `PrismaService` to be passed directly as a Prisma transaction client inside `$transaction` callbacks. If it were a wrapper, the cast `tx as PrismaService` in `executeInTransaction` would not be semantically valid.

**Why `multiSchema` preview feature?**

The `factory` schema isolation is a hard requirement. Without `multiSchema`, Prisma cannot reference tables outside the default `public` schema. The preview status was accepted because schema isolation is essential and the feature has been stable in practice.

**Why BigInt for all PKs, even small tables?**

Uniformity eliminates the need for per-table decisions. The overhead of a 64-bit integer over 32-bit is negligible for PostgreSQL, but the benefit of never needing to migrate an ID column type is permanent.

---

## Consequences

**Positive:**
- Complete type safety on all database operations — Prisma generates TypeScript types from schema
- Schema is the single source of truth for data types
- Migration history is version-controlled in `prisma/migrations/`
- `@updatedAt` on selected entities automates `updated_at` column management

**Negative:**
- `previewFeatures = ["multiSchema"]` may have version-specific behavior when upgrading Prisma
- BigInt IDs do not serialize to JSON numbers natively — requires explicit `serializeBigInts()` conversion (see ADR-021)
- The `tx as unknown as PrismaService` cast in `executeInTransaction` is technically unsound — the transaction client lacks methods like `$connect`, `$disconnect`, `$transaction` that exist on `PrismaService`. This is a known limitation that callers must respect.

**Trade-offs:**
- Prisma is opinionated about raw SQL access. Complex queries (window functions, CTEs, recursive queries) require `$queryRaw` with manual type casting. This is acceptable for current needs but should be documented for future complex reporting.

**Future Implications:**
- Prisma Accelerate (connection pooling proxy) can be introduced without changing repository code
- Read replica connections can be introduced via Prisma's datasource extension features
- Row-level security could be implemented at the PostgreSQL layer independently of Prisma

---

## Related Components

- `prisma/schema.prisma` — complete database schema
- `src/core/database/prisma/prisma.service.ts` — PrismaService implementation
- `src/core/database/prisma/prisma.module.ts` — global PrismaModule
- `src/core/database/repositories/base/base.repository.ts` — BaseRepository using PrismaService
- All `src/modules/*/repositories/*.repository.ts` — concrete repository implementations

---

## Alternatives Considered

### TypeORM

Rejected. Weaker TypeScript inference, Active Record pattern conflicts with Clean Architecture, migration reliability concerns.

### Drizzle ORM

Considered. Drizzle is schema-first and type-safe. Rejected because:
- Less mature ecosystem at time of decision
- Migration tooling less integrated than Prisma
- Team familiarity with Prisma was stronger

### Raw SQL with pg Driver

Rejected. Manual SQL maintenance in a complex schema with 50+ tables is not sustainable. The lack of compile-time type checking for SQL queries is a permanent source of runtime errors.

### MikroORM

Considered. Supports Unit of Work and Identity Map patterns. Rejected because:
- These patterns are better suited to DDD aggregates which are not adopted at this phase
- Less community traction than Prisma for NestJS

---

## Future Evolution

- **Prisma Pulse**: Real-time database event streaming can be added for live dashboard updates
- **Prisma Accelerate**: Serverless edge deployment would benefit from connection pooling at the Prisma layer
- **Partitioned tables**: The composite primary keys on time-series tables (`audit_events`, `inventory_transactions`) are designed for future PostgreSQL table partitioning by time range

---

## References

- `prisma/schema.prisma`
- `src/core/database/prisma/prisma.service.ts`
- Prisma documentation: https://www.prisma.io/docs
- ADR-001 (Repository Pattern) — how PrismaService is used by repositories
- ADR-021 (BigInt Serialization) — handling BigInt in JSON responses
