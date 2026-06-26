# MASTER PROMPT — FactoryERP AI Engineering Policy

> **Status: Immutable**
> Changes to this document require Architecture Board approval, a new ADR, and a full Acceptance Review.
> This document governs every AI session that contributes to FactoryERP.

---

## 1. Project Identity

You are an AI engineer contributing to **FactoryERP** — a garment manufacturing Enterprise Resource Planning system.

FactoryERP manages the full manufacturing lifecycle: customer orders, material procurement, inventory management, production tracking, quality control, and operational reporting. It is built for factory-floor operations: barcode tracking, multi-shift scheduling, supplier relationships, and customer order fulfillment.

**Technology stack:**
- NestJS 11 — API framework
- Prisma 6 — ORM (PostgreSQL, `factory` schema)
- TypeScript (strict mode, `isolatedModules: true`)
- Jest — unit testing
- nestjs-pino — structured logging
- @nestjs/swagger — OpenAPI documentation

**Current release:** v0.3.0-business-foundation
**Current phase:** CMO / Inventory Engine development
**API versioning:** All routes under `/v1/`
**Swagger UI:** `/api/docs`

---

## 2. Architecture Invariants

These rules are non-negotiable. Violating them is a build-blocking defect.

### 2.1 Layer Ordering

```
Controllers → Use Cases → Services → Repositories → PrismaService → PostgreSQL
```

- **Controllers**: thin HTTP adapters. Validate input (DTO), call exactly one use case, return the result. Zero business logic.
- **Use Cases**: own all business logic. Coordinate repositories and services. Emit audit events. Throw NestJS HTTP exceptions.
- **Services**: reusable, stateless capabilities (PasswordService, JwtService, TokenService, etc.). No business orchestration.
- **Repositories**: the only layer that may inject `PrismaService`. Implement all database queries.
- **PrismaService**: database client. No business logic.

### 2.2 Repository Pattern

All repositories extend `BaseRepository` (`src/core/database/repositories/base/`). Every new domain repository must:
```typescript
@Injectable()
export class FooRepository extends BaseRepository {
  constructor(prisma: PrismaService) { super(prisma); }
}
```

### 2.3 Cross-Module Rules

- **CM-1**: No cross-module repository injection. Module B cannot inject Module A's repository.
- **CM-2**: Cross-module data access goes through exported services.
- **CM-3**: Global modules (PrismaModule, LoggerModule, AuditModule, DocumentNumberingModule) are exceptions.

### 2.4 No PrismaService Outside Repositories

`PrismaService` is injected only in repository constructors. Never in use cases, services, or controllers.

---

## 3. Authorization Policy

- Guard stack: `ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard`
- **Deny by default**: every endpoint without `@Roles()` is system-admin-only.
- Every protected endpoint must declare `@Roles(UserRole.xxx, ...)`.
- `@Public()` is required for unauthenticated endpoints (login, health check).
- Screen permissions provide fine-grained UI access beyond role-level control.

---

## 4. Audit Policy

Every state-changing use case emits an audit event:
```typescript
void this.auditService.log({
  action: 'ENTITY_CREATED',
  entityType: 'customer',
  entityId: result.customer_id,
  userId: currentUser.userId,
  payload: { ... },
});
```

- **Always fire-and-forget**: `void this.auditService.log()`. Never `await`.
- Use consistent `action` naming: `{ENTITY}_{VERB}` in UPPER_SNAKE_CASE.
- Include `entityId`, `userId`, and a meaningful `payload`.

---

## 5. Validation Policy

- All HTTP input is typed as DTO classes with `class-validator` decorators.
- `GlobalValidationPipe` is already configured: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Never accept raw `string` or `number` parameters without DTO wrapping.
- `PartialType` and `OmitType` come from `@nestjs/swagger`, not `@nestjs/mapped-types`.
- Update DTOs must extend `PartialType(CreateXxxDto)` — never duplicate fields.

---

## 6. Database Policy

- **Schema first**: every feature begins with `prisma/schema.prisma` changes.
- All tables in the `factory` PostgreSQL schema: `@@schema("factory")`.
- All PKs are `BigInt @id @default(autoincrement())`.
- All DateTimes are `@db.Timestamptz(6)`.
- Quantities are `Decimal(12,3)`.
- Soft-delete uses `is_active Boolean @default(true)`.
- Hard-delete is used only for pure lookup tables (colors, sizes, production stages).
- Schema changes go through `npx prisma migrate dev`, never raw SQL.
- Run `npx prisma generate` after every schema change.

---

## 7. Testing Policy

- **Every Use Case class must have a unit test suite.**
- Repositories are mocked — no real database connections in unit tests.
- Use `@nestjs/testing` `Test.createTestingModule` for all NestJS unit tests.
- Test both the happy path and all error scenarios.
- Tests live alongside the code they test (`*.use-case.spec.ts` next to `*.use-case.ts`).
- The test suite count and test count must never decrease sprint over sprint.

---

## 8. Serialization Policy

- BigInt fields serialize to strings via `serializeBigInts()` in `ResponseInterceptor`.
- All IDs in API responses are strings. Document this in Swagger with `@ApiProperty({ type: String })`.
- Prisma `Decimal` fields must be converted to string before JSON serialization.
- Never cast BigInt to `number`.

---

## 9. Logging Policy

- Use `LoggerService` from `src/core/logger/` everywhere.
- No `console.log`, `console.error`, or `console.warn` in production code.
- `LoggerModule` is `@Global()` — no import needed.
- Sensitive headers (`authorization`, `cookie`, `set-cookie`) are automatically redacted.

---

## 10. Configuration Policy

- No `process.env` in application code. Use `ConfigService.getOrThrow()`.
- Two documented exceptions: `PrismaService` constructor and `loggerConfig` constant.
- All new environment variables must be added to `src/core/config/env.validation.ts` (Joi schema).
- Config namespaces: `app`, `database`, `jwt`, `logger`.

---

## 11. TypeScript Policy

- `isolatedModules: true`: interface/type re-exports must use `export type { Foo }`.
- `strictNullChecks: true`: always handle `null` and `undefined` explicitly.
- Never use `as any`. Use `as unknown` as a stepping stone.
- All IDs are `BigInt` — never `number`.
- Enum values are `snake_case` (e.g., `UserRole.factory_manager`).

---

## 12. Documentation Policy

- Every significant architectural decision gets an ADR in `docs/architecture/adr/`.
- ADRs use the template in `.ai/TEMPLATES/ADR_Template.md`.
- New ADRs are added to `docs/architecture/ADR_INDEX.md`.
- Every sprint completion updates `docs/PROJECT_MEMORY.md` and `docs/checkpoints/PROJECT_CHECKPOINT.md`.
- Release notes go in `docs/releases/v{version}.md`.

---

## 13. Code Quality Policy

- `npm run lint` must exit 0 before any commit.
- `npm run build` must succeed before any commit.
- `npm run test` must show 0 failures before any commit.
- No `eslint-disable` comments except in documented exceptional cases (e.g., the `require-await` suppression for interface-satisfying async methods).
- Comments in code only when the **why** is non-obvious. Never comment what the code does.

---

## 14. AI Behavior Policy

**Before any implementation:**
1. Read all six mandatory startup documents (see `.ai/README.md`)
2. Verify repository health: `npm run lint && npm run build && npm run test`
3. Identify the current sprint from `docs/PROJECT_MEMORY.md`
4. Read the relevant sprint prompt from `.ai/SPRINT_PROMPTS/`
5. Check for open technical debt in `docs/PROJECT_MEMORY.md`

**During implementation:**
- Follow the layer ordering invariant — every time, without exception
- One use case per business operation
- One test suite per use case
- Audit every write
- Declare roles on every controller

**After implementation:**
- Verify all quality gates in `.ai/QUALITY_GATES/`
- Update `docs/PROJECT_MEMORY.md`
- Update `docs/checkpoints/PROJECT_CHECKPOINT.md`
- Execute session end procedure from `.ai/AI_SESSION/SESSION_END.md`

**Never:**
- Skip tests because "it's obvious it works"
- Inject `PrismaService` outside a repository
- Leave a controller without `@Roles()`
- Use `console.log` in production code
- Create a migration manually (always use `prisma migrate dev`)
- Contradict an existing ADR without first writing a superseding ADR

---

## 15. Sprint Lifecycle

Each sprint follows this sequence:
1. Read sprint prompt from `.ai/SPRINT_PROMPTS/`
2. Schema changes → `prisma migrate dev` → `prisma generate`
3. Repositories → Use Cases → Controllers → Module registration
4. Tests for all use cases
5. Lint → Build → Test verification
6. Documentation updates (PROJECT_MEMORY, CHECKPOINT, new ADRs if needed)
7. Acceptance review
8. Release preparation

---

## 16. Escalation Policy

If any of the following arise, stop implementation and document the issue:
- An architectural decision contradicts an existing ADR
- A business requirement cannot be satisfied within the Clean Architecture constraints
- A database schema change would require modifying an existing migration
- A performance issue is discovered that requires architectural changes
- A security vulnerability is identified

Document in `docs/PROJECT_MEMORY.md` under Current Risks before proceeding.
