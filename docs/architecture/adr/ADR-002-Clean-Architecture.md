# ADR-002 — Clean Architecture

## Title

Use-Case-Driven Clean Architecture as the Application Structure

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

NestJS, out of the box, encourages a `Controller → Service → Repository` three-tier structure. This works well for simple CRUD applications but breaks down for an ERP system where:

1. **Business logic is complex**: A single "create production order" operation may involve checking customer models, validating material availability, generating a document number, updating multiple inventory tables, and sending notifications — none of which are "controller" concerns.

2. **Services grow unbounded**: A traditional `CustomersService` in an ERP easily reaches 500+ lines as it accumulates every customer-related operation. This violates SRP and makes the class difficult to test, navigate, and understand.

3. **Cross-cutting services get tangled with business logic**: Password hashing, JWT generation, and email sending are reusable concerns. Mixing them with business operations in the same service class creates implicit coupling.

4. **Testing business logic requires understanding services**: If a service contains both "check uniqueness" and "create record," testing either in isolation requires mocking the other.

---

## Decision

The FactoryERP adopts a **Use-Case-driven Clean Architecture** with the following strict layer ordering:

```
Controllers → Use Cases → Services → Repositories → PrismaService
```

### Layer Definitions

**Controllers** (`src/modules/*/controllers/`)
- Handle HTTP translation only
- Validate route parameters, query parameters, and request bodies via DTOs
- Call exactly one use-case per handler
- Return the use-case result directly (no transformation)
- Must not contain business logic

**Use Cases** (`src/modules/*/use-cases/`)
- Implement exactly one business operation each
- Own all business logic for that operation
- May inject repositories and/or reusable services
- Throw domain-appropriate HTTP exceptions (`NotFoundException`, `ConflictException`, etc.)
- Fire audit events via `AuditService.log()` (fire-and-forget)
- Named with the operation they perform: `CreateCustomerUseCase`, `DeactivateWarehouseUseCase`

**Services** (`src/modules/*/services/` and `src/core/*/`)
- Provide reusable, cross-cutting capabilities
- Must not contain business logic specific to a single entity
- Examples: `PasswordService` (bcrypt), `TokenService` (JWT), `AuditService` (event logging), `DocumentNumberingService` (sequence generation)
- May be injected by multiple use-cases across modules

**Repositories** (`src/modules/*/repositories/`)
- Sole access point to the database
- Contain all query logic
- Extend `BaseRepository`
- Must not contain business logic

**PrismaService** (`src/core/database/prisma/prisma.service.ts`)
- Raw database client
- Only injected by repositories

### Naming Convention

Use-case files follow a strict naming pattern:
- `create-{entity}.use-case.ts`
- `update-{entity}.use-case.ts`
- `list-{entities}.use-case.ts`
- `deactivate-{entity}.use-case.ts`
- `reactivate-{entity}.use-case.ts`
- `delete-{entity}.use-case.ts`

Each use-case exposes exactly one public method: `execute(...)`.

### Module Registration

All use-cases for a module are declared in the module's `providers` array. No use-case is shared between modules. If shared logic exists, it becomes a service, not a use-case.

---

## Rationale

**Why not the standard NestJS `Controller → Service` pattern?**

The standard pattern does not mandate where business logic lives. In practice, it always ends up in the service. As a service grows (customer creation, customer update, customer deactivation, customer reactivation, customer search...), it becomes a God Object. This is the most common architectural failure mode in NestJS applications.

**Why use-cases instead of commands/handlers (CQRS)?**

CQRS (Command Query Responsibility Segregation) was considered and explicitly rejected for the Business Foundation phase. CQRS introduces read/write model separation, event buses, and additional infrastructure that is not justified by the current complexity. The use-case pattern provides equivalent separation of business operations without the CQRS infrastructure overhead. CQRS remains available as a future evolution path.

**Why `execute()` as the single public method?**

A single entry point enforces the single-responsibility principle. It also makes use-case invocation predictable from controllers and makes mocking in tests trivial (mock `{ execute: jest.fn() }`).

**Why do use-cases own business logic but not services?**

Services provide reusable capabilities; use-cases own operations. The distinction is: "Can this logic reasonably be called by multiple different operations?" If yes, it is a service. If it is specific to one business operation, it belongs in a use-case.

---

## Consequences

**Positive:**
- Each business operation is independently readable, testable, and modifiable
- Services remain small and focused on a single cross-cutting capability
- Controllers become thin, predictable, and easy to review
- Adding a new business operation requires creating one new file — not modifying an existing service
- Use-case files are natural units for code review, test coverage, and audit

**Negative:**
- More files per module than the standard NestJS pattern (10-15 use-case files per major module vs. 1-2 service files)
- Developers unfamiliar with the use-case pattern need onboarding
- Module provider arrays grow with each new use-case

**Trade-offs:**
- File count vs. cognitive load: More files, but each is simple and focused. The trade-off is worth it at ERP scale.

**Future Implications:**
- Future ERP modules (production planning, logistics, HR) must follow the same use-case structure
- The use-case boundary is the natural seam for introducing async processing (moving use-cases to queue workers) when needed
- The use-case boundary is also where distributed tracing spans should be defined

---

## Related Components

- All `src/modules/*/use-cases/*.use-case.ts` files
- All `src/modules/*/controllers/*.controller.ts` files
- `src/core/audit/audit.service.ts` — cross-cutting service used by use-cases
- `src/core/document-numbering/document-numbering.service.ts` — cross-cutting service
- `src/modules/auth/services/` — auth-specific services (Password, Token, Session, Jwt)

---

## Alternatives Considered

### Standard NestJS Service Layer

Rejected. `CustomerService` with 15 methods in a 600-line file is not maintainable. The ERP will have hundreds of business operations.

### CQRS with NestJS CqrsModule

Considered for future phases. The `@nestjs/cqrs` module provides a command bus and query bus that would further decouple use-cases from their invocation sites. Rejected for the initial platform because:
- Adds infrastructure complexity (command bus, event bus)
- Requires boilerplate command/query/handler classes
- Current calling pattern (controller → use-case directly) is sufficient
- Can be introduced incrementally if needed

### Functional Use-Cases (plain functions instead of injectable classes)

Rejected. NestJS DI requires injectable classes. Plain functions cannot receive injected dependencies at runtime. Injectable classes provide the same logical encapsulation with DI support.

### Domain Services (DDD)

Considered. Domain services in DDD are stateless services that operate on multiple aggregates. In the current architecture, the use-case layer serves this role effectively. Formal DDD domain services may be introduced if inter-aggregate operations become complex.

---

## Future Evolution

- **Async use-cases**: When long-running operations (batch processing, report generation) need background execution, the `execute()` interface is the natural boundary for queue dispatch
- **Event sourcing**: If state reconstruction from events is needed, use-cases are the natural publishers of domain events
- **CQRS separation**: Read operations (`ListCustomersUseCase`) can be extracted into a separate query handler layer without affecting write use-cases
- **Workflow integration**: Complex multi-step operations (e.g., production order approval flow) can be modeled as workflow use-cases that delegate to individual atomic use-cases

---

## References

- `CLAUDE.md` — Strict layer ordering documentation
- `src/modules/customers/use-cases/` — Representative use-case implementations
- `src/modules/auth/use-cases/login/login.use-case.ts` — Complex use-case with multiple service dependencies
- ADR-001 (Repository Pattern) — Layer below use-cases
- ADR-022 (Dependency Rules) — Formal dependency constraints
