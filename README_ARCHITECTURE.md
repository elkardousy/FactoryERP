# FactoryERP — Architecture Entry Point

> **This is the official entry point for the repository.**
> Every developer, architect, reviewer, and AI session must read this document first.
> Do not begin implementation before reading the documents listed in the [Required Reading](#6-required-reading) section.

---

## 1. Project Overview

**FactoryERP** is a garment manufacturing Enterprise Resource Planning system. It manages the full production lifecycle: customer orders, material procurement, inventory, production scheduling, and quality tracking — all tailored to garment factory operations.

| Field | Value |
|-------|-------|
| **Business Domain** | Garment manufacturing — customer orders through finished goods |
| **Target Users** | Factory managers, production managers, warehouse staff, accountants, operators |
| **Architecture** | NestJS 11 monolith, Clean Architecture, Prisma 6, PostgreSQL |
| **API Style** | REST, URI-versioned (`/v1/`), OpenAPI 3.0 at `/api/docs` |
| **Current Version** | 0.0.1 (functional milestone: v0.3.0-business-foundation) |
| **Current Phase** | Business Foundation — Complete. Entering CMO phase. |
| **Architecture Status** | Stable. 26 ADRs document all significant decisions. |
| **ERP Readiness** | Master data layer complete. Transactional layers (orders, inventory, production) in roadmap. |

The Business Foundation — all master data entities required to run manufacturing operations — is implemented, tested, and documented. The Prisma schema covers the full ERP domain (98 models), but application code for transactional domains (customer orders, inventory, production) has not yet been written.

---

## 2. Quick Start

### For Developers and Architects

Read in this order before making any changes:

| # | Document | Purpose |
|---|----------|---------|
| 1 | [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md) | Full operational context — status, metrics, risks, technical debt, next sprint |
| 2 | [docs/checkpoints/PROJECT_CHECKPOINT.md](docs/checkpoints/PROJECT_CHECKPOINT.md) | Sprint-level snapshot — what is done, what is not, verification commands |
| 3 | [docs/architecture/ADR_INDEX.md](docs/architecture/ADR_INDEX.md) | Index of all 26 architectural decisions |
| 4 | [docs/sprint-reports/foundation-freeze-report.md](docs/sprint-reports/foundation-freeze-report.md) | Latest acceptance review — platform and business foundation |
| 5 | [docs/architecture/ARCHITECTURE_TIMELINE.md](docs/architecture/ARCHITECTURE_TIMELINE.md) | Sprint-by-sprint architectural history |
| 6 | [docs/architecture/ARCHITECTURE_SUMMARY.md](docs/architecture/ARCHITECTURE_SUMMARY.md) | One-page architecture overview |
| 7 | [CLAUDE.md](CLAUDE.md) | Commands, module layout, key invariants for working in this repo |

**Do not begin implementation before reading these documents.**

### For AI Sessions

See [Section 9 — For Future AI Sessions](#9-for-future-ai-sessions) for the mandatory startup procedure.

### Development Commands

```bash
npm run start:dev       # development watch mode
npm run build           # production build (dist/)
npm run test            # all unit tests
npm run lint            # ESLint with auto-fix
npm run format          # Prettier

npx prisma generate     # regenerate client after schema changes
npx prisma migrate dev  # create and apply a new migration
npx prisma studio       # visual database browser
```

---

## 3. Repository Navigation

```
FactoryERP/
│
├── README_ARCHITECTURE.md      ← YOU ARE HERE — official entry point
├── README.md                   ← NestJS scaffold readme
├── CLAUDE.md                   ← AI/developer commands and invariants
│
├── src/
│   ├── app.module.ts           ← Root module: registers all domain modules + global guards
│   ├── main.ts                 ← Bootstrap: Helmet, CORS, versioning, global pipes/filters
│   ├── core/                   ← Infrastructure shared by all modules
│   │   ├── config/             ← ConfigModule factories + Joi env validation
│   │   ├── database/           ← PrismaService (global), BaseRepository, health check
│   │   ├── audit/              ← AuditService (global), fire-and-forget event logging
│   │   ├── document-numbering/ ← DocumentNumberingService (global), atomic sequences
│   │   ├── exceptions/         ← AllExceptionsFilter, PrismaExceptionFilter
│   │   ├── interceptors/       ← ResponseInterceptor (response envelope + BigInt serialize)
│   │   ├── logger/             ← LoggerModule (global), LoggerService wrapping nestjs-pino
│   │   ├── middleware/         ← CorrelationIdMiddleware
│   │   ├── pipes/              ← GlobalValidationPipe
│   │   ├── responses/          ← ErrorResponse class
│   │   └── utils/              ← serializeBigInts(), buildPaginationMeta()
│   ├── common/
│   │   └── dto/                ← Shared DTOs: PaginationDto, DateRangeDto, IdParamDto
│   └── modules/
│       ├── auth/               ← Login, logout, refresh, JWT, session management
│       ├── authorization/      ← Guards, roles, screen permissions, permission cache
│       ├── customers/          ← Customer master with auto-generated codes
│       ├── suppliers/          ← Supplier master with auto-generated codes
│       ├── garment-models/     ← Product catalog: models, parts, color-size assignments
│       ├── measurements/       ← Colors and sizes lookup tables
│       ├── organization/       ← Departments and work shifts
│       ├── production-setup/   ← Production lines and production stages
│       └── warehouses/         ← Warehouse locations
│
├── prisma/
│   └── schema.prisma           ← Single source of truth: 98 models, factory schema
│
├── test/
│   ├── app.e2e-spec.ts         ← E2E test stub (not yet written)
│   └── jest-e2e.json
│
└── docs/
    ├── PROJECT_MEMORY.md           ← Permanent operational memory (read first)
    ├── architecture/
    │   ├── ADR_INDEX.md            ← Index of all 26 ADRs
    │   ├── ARCHITECTURE_SUMMARY.md ← One-page architecture reference
    │   ├── ARCHITECTURE_PRINCIPLES.md ← 14 governing principles + checklist
    │   ├── ARCHITECTURE_TIMELINE.md ← Sprint-by-sprint history
    │   ├── TECHNOLOGY_DECISIONS.md ← Technology choices and rationale
    │   ├── DEPENDENCY_RULES.md     ← Layer matrix, cross-module rules
    │   ├── REPOSITORY_RULES.md     ← Git workflow, commits, migrations
    │   ├── CODING_STANDARDS.md     ← TypeScript/NestJS patterns, naming, testing
    │   └── adr/                    ← ADR-000 through ADR-025
    ├── checkpoints/
    │   └── PROJECT_CHECKPOINT.md   ← Sprint-level snapshot
    ├── sprint-reports/
    │   ├── foundation-freeze-report.md  ← Platform acceptance review
    │   └── sprint-08-authentication.md  ← Authentication acceptance review
    └── decisions/
        └── technical-debt-report.md
```

---

## 4. Current Project Status

| Concern | Status |
|---------|--------|
| **Completed Phases** | Platform Foundation, Authentication, Authorization, Business Foundation, Architecture Documentation |
| **Current Milestone** | Business Foundation Acceptance — Complete |
| **Latest Stable Tag** | `v0.3.0-business-foundation` |
| **Recommended Next Tag** | `v0.4.0-cmo-foundation` |
| **Latest Acceptance Review** | Foundation Freeze — Accepted ([report](docs/sprint-reports/foundation-freeze-report.md)) |
| **Architecture Maturity** | Stable. 26 ADRs, complete documentation suite. |
| **Business Foundation** | 9 domain modules — all implemented, tested, documented |
| **Testing** | 20 suites / 142 tests — all passing |
| **Build** | Clean (`npm run build` exits 0) |
| **Lint** | 0 errors, 0 warnings (`npm run lint` exits 0) |
| **Documentation** | Complete — 26 ADRs + 9 architecture docs + PROJECT_MEMORY + checkpoint |
| **Database Migrations** | **Pending** — `prisma/migrations/` does not exist; must run `npx prisma migrate dev` against a live PostgreSQL instance before integration work |
| **Repository Health** | 8 / 10 — excellent foundation; transactional ERP layers not yet implemented |

---

## 5. Architecture at a Glance

### Clean Architecture

Strict four-layer ordering enforced by convention and code review. No layer may import from a layer above it or skip a layer.

```
Controllers → Use Cases → Services → Repositories → PrismaService → PostgreSQL
```

See [ADR-002](docs/architecture/adr/ADR-002-Clean-Architecture.md).

### Repository Pattern

All repositories extend `BaseRepository`. `PrismaService` is injected **only** in repository constructors — nowhere else in the application. See [ADR-001](docs/architecture/adr/ADR-001-Repository-Pattern.md).

### NestJS Modules

9 domain modules + 4 global infrastructure modules (`PrismaModule`, `LoggerModule`, `AuditModule`, `DocumentNumberingModule`). Global modules are available everywhere without explicit import. See [ADR-003](docs/architecture/adr/ADR-003-NestJS-Module-Boundaries.md).

### Prisma

PostgreSQL accessed exclusively via Prisma 6. Schema in `prisma/schema.prisma`. All 98 models in the `factory` schema. All PKs are `BigInt`. All DateTimes are `Timestamptz(6)`. Quantities are `Decimal(12,3)`. See [ADR-004](docs/architecture/adr/ADR-004-Prisma-Integration.md).

### Authentication

JWT access tokens (short-lived) + bcrypt-hashed refresh tokens (long-lived). Composite refresh token: `{sessionId}:{rawUUID}`. Per-request session validation in `JwtStrategy` catches deactivated accounts immediately. See [ADR-010](docs/architecture/adr/ADR-010-Authentication.md), [ADR-011](docs/architecture/adr/ADR-011-JWT-and-Refresh-Tokens.md).

### Authorization

Guard stack registered as global `APP_GUARD` in `AppModule`:

```
ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
```

**Deny by default:** no `@Roles()` annotation = system admin access only. See [ADR-012](docs/architecture/adr/ADR-012-Authorization-Architecture.md), [ADR-013](docs/architecture/adr/ADR-013-Permission-Resolution.md).

### Audit

`AuditModule` is `@Global()`. Every state-changing use case calls:
```typescript
void this.auditService.log({ action: 'ENTITY_ACTION', ... });
```
Always fire-and-forget — never `await`. JSONB payloads. Composite keys enable future table partitioning. See [ADR-016](docs/architecture/adr/ADR-016-Audit-Architecture.md).

### Validation

`GlobalValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. All HTTP input is DTO classes with `class-validator` decorators. See [ADR-006](docs/architecture/adr/ADR-006-Validation-Strategy.md).

### Response Serialization

`ResponseInterceptor` wraps all responses in `{ data, statusCode, timestamp, path }`. Calls `serializeBigInts()` before wrapping — all `BigInt` fields become strings in API responses. See [ADR-015](docs/architecture/adr/ADR-015-Response-Serialization.md), [ADR-021](docs/architecture/adr/ADR-021-BigInt-Serialization.md).

### Document Numbering

`DocumentNumberingService` generates atomic, template-based codes via `UPDATE ... RETURNING`. Template: `{YYYY}-{MM}-{SEQ:N}`. Adding new document types requires only a DB row — no code deployment. See [ADR-017](docs/architecture/adr/ADR-017-Document-Numbering.md).

### Testing Strategy

Unit tests only at this stage. All 62 use cases and all infrastructure services have test suites. Repositories are mocked — no real database connections in unit tests. See [ADR-018](docs/architecture/adr/ADR-018-Testing-Strategy.md).

### Shared Infrastructure

Four `@Global()` modules provide zero-configuration access everywhere:

| Module | Service | Purpose |
|--------|---------|---------|
| `PrismaModule` | `PrismaService` | Database client |
| `LoggerModule` | `LoggerService` | Structured logging (nestjs-pino) |
| `AuditModule` | `AuditService` | Fire-and-forget audit events |
| `DocumentNumberingModule` | `DocumentNumberingService` | Atomic sequence generation |

See [ADR-020](docs/architecture/adr/ADR-020-Shared-Infrastructure.md).

---

## 6. Required Reading

### Tier 1 — Read Before Anything Else

| Document | Purpose |
|----------|---------|
| [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md) | Full operational memory: status, metrics, risks, technical debt, next sprint |
| [docs/checkpoints/PROJECT_CHECKPOINT.md](docs/checkpoints/PROJECT_CHECKPOINT.md) | Sprint snapshot: what is done, what is not, verification commands |
| [docs/architecture/ADR_INDEX.md](docs/architecture/ADR_INDEX.md) | All 26 architectural decisions, indexed by topic |

### Tier 2 — Architecture Understanding

| Document | Purpose |
|----------|---------|
| [docs/architecture/ARCHITECTURE_SUMMARY.md](docs/architecture/ARCHITECTURE_SUMMARY.md) | One-page architecture overview |
| [docs/architecture/ARCHITECTURE_PRINCIPLES.md](docs/architecture/ARCHITECTURE_PRINCIPLES.md) | 14 governing principles + implementation checklist |
| [docs/architecture/ARCHITECTURE_TIMELINE.md](docs/architecture/ARCHITECTURE_TIMELINE.md) | Sprint-by-sprint architectural history |
| [docs/architecture/TECHNOLOGY_DECISIONS.md](docs/architecture/TECHNOLOGY_DECISIONS.md) | Why each technology was chosen |

### Tier 3 — Engineering Rules

| Document | Purpose |
|----------|---------|
| [docs/architecture/DEPENDENCY_RULES.md](docs/architecture/DEPENDENCY_RULES.md) | Layer matrix, cross-module rules, global service rules |
| [docs/architecture/CODING_STANDARDS.md](docs/architecture/CODING_STANDARDS.md) | TypeScript, NestJS, DTO, testing patterns |
| [docs/architecture/REPOSITORY_RULES.md](docs/architecture/REPOSITORY_RULES.md) | Git workflow, branch naming, commit conventions, migrations |
| [CLAUDE.md](CLAUDE.md) | Commands, module layout, key invariants |

### Tier 4 — Acceptance Reviews, Releases, and History

| Document | Purpose |
|----------|---------|
| [docs/releases/v0.3.0-business-foundation.md](docs/releases/v0.3.0-business-foundation.md) | **Current release notes** — v0.3.0-business-foundation |
| [docs/sprint-reports/foundation-freeze-report.md](docs/sprint-reports/foundation-freeze-report.md) | Platform and Business Foundation acceptance review |
| [docs/sprint-reports/sprint-08-authentication.md](docs/sprint-reports/sprint-08-authentication.md) | Authentication system acceptance review |

### Reference — Architecture Decision Records

All 26 ADRs: [docs/architecture/adr/](docs/architecture/adr/) — see [ADR_INDEX.md](docs/architecture/ADR_INDEX.md) for the full list.

---

## 7. Development Rules

These rules are permanent. They are enforced by code review and do not require consensus to apply.

**Architecture**
- Repositories are the only layer that may inject `PrismaService`
- Use Cases own all business logic — Controllers are thin HTTP adapters
- Controllers call exactly one Use Case and return the result
- No cross-module repository injection — cross-module data access via exported services only

**Authorization**
- Every protected endpoint must declare `@Roles()` — no annotation = system admin only
- `ThrottlerGuard` always runs first in the guard stack

**Audit**
- Every state-changing Use Case emits an audit event
- Audit writes are always fire-and-forget: `void this.auditService.log()`

**Validation and Serialization**
- All HTTP input is DTO classes with `class-validator` decorators
- `PartialType` and `OmitType` come from `@nestjs/swagger`, not `@nestjs/mapped-types`
- Update DTOs use `PartialType(CreateXxxDto)` — no field duplication

**TypeScript**
- `export type { Foo }` for interface/type re-exports (`isolatedModules: true`)
- All IDs are `BigInt` — never cast to `number`
- No `process.env` in application code — `ConfigService.getOrThrow()` only

**Logging and Testing**
- Use `LoggerService` — no `console.log` in production code
- Every Use Case class has a unit test suite

Full rules with rationale: [ARCHITECTURE_PRINCIPLES.md](docs/architecture/ARCHITECTURE_PRINCIPLES.md), [DEPENDENCY_RULES.md](docs/architecture/DEPENDENCY_RULES.md), [CODING_STANDARDS.md](docs/architecture/CODING_STANDARDS.md).

---

## 8. Current Roadmap

### Completed

| Milestone | Tag | Summary |
|-----------|-----|---------|
| Platform Foundation | `foundation-v1` | NestJS + Prisma + logging + validation + error handling |
| Authentication | `v0.1.0-auth-foundation` | JWT, sessions, bcrypt, refresh tokens |
| Authorization | _(same tag)_ | Guard stack, roles, screen permissions, deny-by-default |
| Business Foundation | _(pending tag)_ | 9 domain modules, 62 use cases, 142 tests |
| Architecture Documentation | _(same sprint)_ | 26 ADRs + complete docs suite + PROJECT_MEMORY |

### Current Milestone

**Business Foundation Acceptance** — tagged as `v0.3.0-business-foundation`.

### Immediate Next Sprint — Sprint 11

**Objective:** Database Foundation + CMO Phase Bootstrap

1. Apply Prisma schema to a live PostgreSQL database (`npx prisma migrate dev --name initial-schema`)
2. Resolve all outstanding technical debt (see [PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md))
3. Implement the Customer Manufacturing Orders (CMO) module

**Expected deliverables:** `prisma/migrations/`, CMO module with 20+ tests, technical debt resolved, tag `v0.4.0-cmo-foundation`.

### Long-Term Roadmap

| Phase | Domains |
|-------|---------|
| Phase 3 | Customer Manufacturing Orders, Purchase Orders, Receiving, Physical Bags |
| Phase 4 | Inventory Bags, Transactions, Stock Reservations |
| Phase 5 | Production Orders, Stage Tracking, Workflow Engine, Defects |
| Phase 6 | E2E tests, Docker, CI/CD, Redis integration, security audit |
| Phase 7 | v1.0 Release |

Full roadmap: [docs/PROJECT_MEMORY.md — Long-Term Roadmap](docs/PROJECT_MEMORY.md#long-term-roadmap).

---

## 9. For Future AI Sessions

**This section is mandatory reading for every AI session.**

### Startup Procedure

Before writing any code, every AI session must read the following documents in order:

1. **[docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md)** — Understand the current phase, completed milestones, active technical debt, known risks, and the immediate next sprint plan.
2. **[docs/checkpoints/PROJECT_CHECKPOINT.md](docs/checkpoints/PROJECT_CHECKPOINT.md)** — Understand the sprint snapshot: what was done, what was not done, and the verification commands to confirm repository health.
3. **[docs/architecture/ADR_INDEX.md](docs/architecture/ADR_INDEX.md)** — Understand which architectural decisions are in effect. Every significant decision has an ADR. Do not contradict an ADR without creating a superseding ADR.
4. **[docs/sprint-reports/foundation-freeze-report.md](docs/sprint-reports/foundation-freeze-report.md)** — Understand the latest acceptance review outcome.
5. **This file (README_ARCHITECTURE.md)** — Confirm the current repository structure and rules.

**Only after reading all five documents should implementation begin.**

### Before Making Changes

- Verify current repository health: `npm run lint && npm run build && npm run test`
- Check `docs/PROJECT_MEMORY.md` for the current technical debt list — address high-priority items before adding new features
- If a proposed change contradicts an existing ADR, write a superseding ADR first

### When Completing a Sprint

Update the following documents:
- `docs/PROJECT_MEMORY.md` — update status, metrics, completed milestones, technical debt
- `docs/checkpoints/PROJECT_CHECKPOINT.md` — replace with the new sprint snapshot
- `docs/architecture/ADR_INDEX.md` — add any new ADRs
- `docs/architecture/ARCHITECTURE_TIMELINE.md` — add the completed milestone

Create an acceptance review document in `docs/sprint-reports/`.

### Context Restoration

If a session begins without prior conversation history, `docs/PROJECT_MEMORY.md` is the complete context. It contains: phase, metrics, risks, technical debt, next sprint, and long-term roadmap. No prior chat history is required to resume the project.

---

## 10. Repository Governance

**The repository documentation is the single source of truth.**

If repository documentation conflicts with any previous conversation, the repository documentation takes precedence. Repository documents reflect what was actually implemented; conversations reflect what was discussed.

**New architectural decisions** must be documented as ADRs in `docs/architecture/adr/` and indexed in `docs/architecture/ADR_INDEX.md` before implementation begins.

**New milestones** must update:
- `docs/PROJECT_MEMORY.md`
- `docs/checkpoints/PROJECT_CHECKPOINT.md`
- `docs/architecture/ADR_INDEX.md` (if new ADRs were created)
- `docs/architecture/ARCHITECTURE_TIMELINE.md`
- A new document in `docs/sprint-reports/`

This governance is permanent and applies to all future development sessions.

---

## 11. Final Repository State

| Category | Status |
|----------|--------|
| **Architecture** | Stable. Clean Architecture with strict layer ordering. 26 ADRs accepted. |
| **Business Foundation** | Complete. 9 modules, 62 use cases, all passing. |
| **Documentation** | Complete. 26 ADRs + 9 architecture docs + PROJECT_MEMORY + checkpoint + this file. |
| **Testing** | 20 suites / 142 tests passing. Unit coverage only — no integration or E2E tests. |
| **Build** | Clean. |
| **Lint** | 0 errors, 0 warnings. |
| **Database** | Schema complete (98 models). Migrations not yet generated. |
| **Repository Health** | 8 / 10 |
| **ERP Readiness** | 4 / 10 — master data complete; transactional ERP not yet implemented |
| **Recommended Next Phase** | Sprint 11 — Database Foundation + CMO Phase Bootstrap |
| **Recommended Next Tag** | `v0.3.0-business-foundation` |

---

*Last updated: 2026-06-26 — Sprint 10.5 Business Foundation Acceptance*
