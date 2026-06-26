# ADR-022 — Dependency Rules

## Title

Formal Dependency Rules Between Application Layers

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

Without explicit, enforced dependency rules, NestJS applications gradually develop hidden coupling between layers. Common violations observed in real-world NestJS ERP projects:

1. Controllers importing repositories directly (bypassing use-cases)
2. Services injecting other services from unrelated modules
3. Use-cases importing `PrismaService` directly
4. Repositories injecting cross-module entities

These violations destroy the benefits of layered architecture: testability, modifiability, and reasoning about change impact.

The FactoryERP needs formal dependency rules that are documented, understood, and enforced during code review.

---

## Decision

### Layer Dependency Matrix

| Layer | May Depend On | Must NOT Depend On |
|-------|---------------|-------------------|
| Controllers | Use Cases, DTOs | Repositories, PrismaService, other module's services |
| Use Cases | Repositories (own module), Services (own or global) | Controllers, PrismaService directly, other module's repositories |
| Services (cross-cutting) | Repositories (own module), other Services | Controllers, Use Cases |
| Repositories | PrismaService only | Controllers, Use Cases, Services, other Repositories |
| PrismaService | Prisma Client, ConfigService | Everything above |

### Dependency Flow Diagram

```
HTTP Request
     ↓
Controller          (validates input, delegates to use-case)
     ↓
Use Case            (business logic, coordinates repo + services)
     ↓    ↓
Repository   Service    (data access)   (reusable capabilities)
     ↓
PrismaService       (database client)
     ↓
PostgreSQL
```

### Cross-Module Rules

**Rule CM-1: No cross-module repository injection**
A repository from `CustomersModule` must never be injected into `SuppliersModule`. This applies even if the query seems simple.

*Rationale*: Cross-module repository injection creates hidden schema coupling. Customer table changes break Supplier code.

**Rule CM-2: Cross-module data access goes through a service**
If `GarmentModelsModule` needs to verify customer existence, a `CustomersService` method is exported from `CustomersModule`. The `GarmentModelsModule` imports `CustomersModule` and injects the service.

*Rationale*: Service APIs are stable contracts. Repository schemas are internal implementation details.

**Rule CM-3: Global modules are an exception**
`PrismaModule`, `LoggerModule`, `AuditModule`, `DocumentNumberingModule` are `@Global()`. Their exports are available everywhere without following Rule CM-2. These are infrastructure, not domain modules.

### Global Services Rules

**Rule GS-1: `AuditService.log()` is always fire-and-forget**
```typescript
void this.auditService.log({ ... });  // Correct
await this.auditService.log({ ... }); // Wrong — blocks on audit
```

**Rule GS-2: `LoggerService` is used instead of `console.log`**
No production code uses `console.log`, `console.error`, or `console.warn`. All logging goes through `LoggerService`.

**Rule GS-3: No direct PrismaService injection in non-repository classes**
```typescript
// Correct — in a Repository:
constructor(prisma: PrismaService) { super(prisma); }

// Wrong — in a Use Case or Service:
constructor(private readonly db: PrismaService) {}
```

### Configuration Rules

**Rule CFG-1: No `process.env` in application code**
Configuration is accessed via `ConfigService.getOrThrow()` or `ConfigService.get()`. The two known exceptions (`PrismaService` constructor and `loggerConfig`) are documented in `CLAUDE.md` and this document.

### DTO Rules

**Rule DTO-1: Controller input is always a DTO class**
HTTP body, query parameters, and route parameters are always declared as DTO classes with `class-validator` decorators. Raw `string` or `number` parameters without DTO wrapping are not permitted.

**Rule DTO-2: Update DTOs derive from Create DTOs**
```typescript
export class UpdateXxxDto extends PartialType(CreateXxxDto) {}
```
Fields are not duplicated between create and update DTOs.

**Rule DTO-3: `OmitType` is from `@nestjs/swagger`, not `@nestjs/mapped-types`**
See ADR-009 for the rationale.

---

## Rationale

**Why formally document these rules?**

Dependency rules are often tacit. New developers joining the project make reasonable local decisions that violate the rules because no one told them. Documenting the rules explicitly:
1. Enables code review to reference a standard
2. Enables new developers to orient themselves quickly
3. Creates an audit trail when rules are intentionally relaxed

**Why separate cross-module rules from within-module rules?**

Within-module coupling is controlled by the layer matrix. Cross-module coupling requires additional rules because NestJS's DI system makes it technically easy to inject anything into anything — the compiler does not prevent it. Rules CM-1 through CM-3 address this.

**Why is `PrismaService` the absolute bottom of the dependency chain?**

`PrismaService` wraps the database. Allowing direct injection above the repository layer would make use-cases or services responsible for query logic — a repository concern. This violates separation of concerns and destroys testability (you cannot mock `PrismaService` as easily as you can mock a repository).

---

## Consequences

**Positive:**
- Dependency violations are identifiable and correctable
- The layer matrix provides a checklist for code review
- Cross-module data access is explicit and discoverable
- Tests remain viable because dependencies are mockable

**Negative:**
- Strict rules require discipline. Pressure to ship quickly can lead to "temporary" violations that become permanent.
- Exporting services from modules to support CM-2 increases inter-module coupling slightly (though via a stable API rather than a raw repository)

**Trade-offs:**
- Strictness vs. velocity: The rules add overhead per feature. This overhead pays back in long-term maintainability.

**Future Implications:**
- **Automated enforcement**: Tools like `eslint-plugin-boundaries` can enforce module boundary rules automatically in CI
- **Architecture fitness functions**: Automated tests that verify no direct repository injection across module boundaries can be added to the CI pipeline
- **Domain grouping**: As module count grows, domain groups (Production Domain, Finance Domain) may add another layer of cross-domain rules

---

## Related Components

- All `src/modules/` files (subject to these rules)
- `CLAUDE.md` — Summary of layer ordering
- `src/app.module.ts` — Composition root
- `src/core/config/env.validation.ts` — CFG-1 implementation

---

## Alternatives Considered

### Architecture ArchUnit Tests (Java-style)

Java projects use ArchUnit to write architectural fitness function tests that automatically fail when rules are violated. TypeScript equivalent tools (ts-archunit, eslint-plugin-boundaries) exist. Not adopted for the current phase because:
- Adds tooling complexity
- Code review enforcement is sufficient for current team size
- Can be added as the team grows

### Event-Driven Architecture (No Direct Module Dependencies)

Replacing direct service-to-service calls with domain events (via NestJS EventEmitter or a message broker) eliminates cross-module coupling entirely. Rejected for the Business Foundation phase because:
- Significant architecture overhead
- Debugging event-driven flows is harder than explicit calls
- Current requirements do not justify the complexity

---

## Future Evolution

- **eslint-plugin-boundaries**: Automate boundary enforcement — repositories cannot import services, controllers cannot import repositories
- **Module dependency graph**: Generate a visual module dependency graph in CI to detect unexpected dependencies
- **Domain packages**: In a Nx monorepo, each domain becomes a library with explicit public API — only exported members are accessible to consumers

---

## References

- `CLAUDE.md` — Strict layer ordering section
- ADR-000 (Architecture Principles) — P-1 Strict Layer Ordering
- ADR-001 (Repository Pattern) — Repository isolation rules
- ADR-002 (Clean Architecture) — Layer definitions
- ADR-003 (NestJS Module Boundaries) — Module-level rules
