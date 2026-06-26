# ADR-003 — NestJS Module Boundaries

## Title

Module Boundary Rules and Global Module Strategy

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

NestJS organizes code into modules. Without explicit rules about what constitutes a module boundary, developers may:
- Create overly granular modules (one module per use-case)
- Create monolithic modules (one module for the entire ERP)
- Inject repositories from one module into services of another, creating implicit cross-module dependencies
- Scatter shared infrastructure across multiple modules

The ERP needed a clear policy for:
1. What belongs in a module vs. in core infrastructure
2. Which modules are global vs. feature-scoped
3. Whether cross-module repository injection is allowed
4. How module providers are structured

---

## Decision

### Module Classification

**Global Modules** — infrastructure available to all modules without explicit import:
- `PrismaModule` — database connection
- `LoggerModule` — structured logging
- `AuditModule` — audit event service
- `DocumentNumberingModule` — document sequence service

Global modules are marked with `@Global()` and imported once in `AppModule`. All other modules receive their exports automatically.

**Feature Modules** — one module per business domain:
- `AuthModule` — authentication (login, session, token management)
- `AuthorizationModule` — RBAC, screen permissions, guards
- `OrganizationModule` — departments, working shifts
- `WarehousesModule` — warehouse management
- `ProductionSetupModule` — production lines, production stages
- `CustomersModule` — customer management, garment models
- `SuppliersModule` — supplier management
- `MeasurementsModule` — colors, sizes

Each feature module owns its use-cases, services, repositories, and controllers. Nothing is shared between feature modules at the repository or use-case level.

### Boundary Rules

**Rule 1: No cross-module repository injection**
A repository from `CustomersModule` must never be injected into a use-case or service in `SuppliersModule`. If cross-module data access is needed, a shared service must be created and properly exported.

**Rule 2: Services may be shared, repositories may not**
Core services (Audit, DocumentNumbering, Logger) are global. Feature services may be exported if genuinely needed by other modules. Repositories are always private to their module.

**Rule 3: Controllers declare their version**
Every controller specifies `version: '1'` in `@Controller({ path: '...', version: '1' })`. URI versioning is enforced at the controller level, not application-wide defaults.

**Rule 4: Module providers are exhaustive**
Every use-case, service, and repository used within a module must be declared in its `providers` array. No implicit injection from parent modules.

### Module Structure

Each feature module follows a consistent file structure:
```
src/modules/{domain}/
  controllers/
    {entity}.controller.ts
  use-cases/
    create-{entity}.use-case.ts
    update-{entity}.use-case.ts
    list-{entities}.use-case.ts
    deactivate-{entity}.use-case.ts
    reactivate-{entity}.use-case.ts
  repositories/
    {entity}.repository.ts
  dto/
    {entity}.dto.ts
  {domain}.module.ts
```

### AppModule

`AppModule` is the composition root. It:
- Imports all global infrastructure modules
- Imports all feature modules
- Registers all global guards as `APP_GUARD` providers
- Registers the response interceptor as `APP_INTERCEPTOR`
- Applies `CorrelationIdMiddleware` globally

---

## Rationale

**Why global modules for infrastructure?**

Injecting `AuditService` requires it to be importable. Without `@Global()`, every single module would need to import `AuditModule`. With ~15+ feature modules in a full ERP, this creates enormous repetition and makes adding a new infrastructure module expensive.

**Why no cross-module repository injection?**

Repository injection between modules creates hidden coupling. Module A's use-cases now depend on Module B's database schema layout. When Module B's schema changes, Module A breaks — without any compile-time indication. This coupling was observed to be the most damaging form of spaghetti in existing NestJS ERP codebases.

**Why one module per business domain?**

One module per domain provides:
- A natural boundary for team ownership
- An explicit list of all providers in the module (module files double as dependency maps)
- Clean isolation for testing (module can be compiled independently for integration tests)

**Why `@Global()` for `PrismaModule`, `LoggerModule`, `AuditModule`, `DocumentNumberingModule`?**

These services are used by virtually every module in the application. Making them global eliminates repetitive imports while keeping them explicitly defined. The `@Global()` designation is a deliberate architectural choice, not a laziness shortcut.

---

## Consequences

**Positive:**
- Feature modules are self-contained — removing a module removes all its dependencies cleanly
- Global infrastructure is available everywhere without import boilerplate
- Module files serve as dependency inventories
- Cross-module coupling is explicitly prevented

**Negative:**
- Module files require manual maintenance as new use-cases are added
- `@Global()` modules are slightly harder to mock in isolation tests (they are always provided)
- The rule against cross-module repositories occasionally requires creating a thin cross-cutting service

**Trade-offs:**
- Explicitness vs. convenience: More boilerplate in module files, but the explicit provider list is invaluable when debugging DI resolution failures.

**Future Implications:**
- As the ERP grows to 25+ modules, the single `AppModule` import list will grow correspondingly. Module federation or lazy loading may be needed at that scale.
- Domain grouping (e.g., `ProductionModule` composing multiple sub-modules) becomes natural at larger scale.

---

## Related Components

- `src/app.module.ts` — composition root
- `src/core/database/prisma/prisma.module.ts` — global PrismaModule
- `src/core/logger/logger.module.ts` — global LoggerModule
- `src/core/audit/audit.module.ts` — global AuditModule
- `src/core/document-numbering/document-numbering.module.ts` — global DocumentNumberingModule
- All `src/modules/*/{domain}.module.ts` files

---

## Alternatives Considered

### Monorepo with Separate Packages per Domain

Considered for a large ERP where team size > 10. Separate packages would provide hard compilation boundaries. Rejected because:
- Current team size and module count don't justify the build complexity
- NestJS module boundaries provide soft isolation that is sufficient
- Can be introduced via Nx or similar monorepo tooling if needed

### Micro-services per Domain

Rejected for the initial platform. Manufacturing ERPs have strong transactional requirements (inventory updates must be atomic with production order state changes). Distributing these operations across services would require distributed transactions, which are considerably more complex than local transactions. Monolith-first is the correct approach.

### Module-per-Use-Case

Rejected as extreme over-engineering. Module overhead (providers array, imports, exports) is not justified per use-case.

---

## Future Evolution

- **Module grouping**: Related modules can be grouped under a parent module (e.g., `ProductionDomainModule` importing `ProductionLinesModule`, `ProductionStagesModule`, `ProductionOrdersModule`)
- **Lazy loading**: NestJS supports lazy module loading; heavy modules can be loaded on first use
- **Feature flags**: Module imports can be made conditional to support feature-flag-driven deployment of ERP functionality

---

## References

- `src/app.module.ts`
- `CLAUDE.md` — Module layout section
- ADR-000 (Architecture Principles) — P-3 Security by Default governs global guard registration
- ADR-010 (Authentication) — AuthModule boundary
- ADR-012 (Authorization Architecture) — AuthorizationModule boundary
