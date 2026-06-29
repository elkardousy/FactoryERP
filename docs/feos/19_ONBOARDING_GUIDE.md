# 19 — Onboarding Guide

**Document:** FEOS-19  
**Category:** Onboarding  
**Authority:** RECOMMENDED  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-01 (Constitution), FEOS-03 (Architecture), FEOS-07 (Code), FEOS-12 (AI)  
**Related KEB:** KEB-02 (Architecture Baseline), KEB-07 (Module Status), KEB-15 (Glossary)

---

## Purpose

This document provides onboarding guidance for all new contributors to FactoryERP: human engineers, reviewers, architects, and AI agents. It provides a structured introduction to the codebase, engineering practices, and critical rules.

## Scope

Repository orientation, contribution workflow, and critical rules for new contributors.

## Audience

New human engineers, reviewers, architects, and AI agents beginning their first session on FactoryERP.

---

## For AI Agents — Start Here

If you are an AI agent, this is the mandatory sequence before doing any work:

1. Read `docs/feos/12_AI_GOVERNANCE.md` — this is your primary governance document.
2. Read `docs/feos/01_ENGINEERING_CONSTITUTION.md` — the highest authority.
3. Read `docs/knowledge/13_AI_EXECUTION_RULES.md` — specific technical rules.
4. Read `docs/knowledge/02_ARCHITECTURE_BASELINE.md` — for codebase context.
5. Read `docs/feos/05_DATABASE_GOVERNANCE.md` — critical for Prisma and migration rules.
6. Read `docs/feos/06_PRISMA_GOVERNANCE.md` — `prisma db pull` is prohibited.

**Before writing a single line of code, confirm the approved sprint scope with the engineer.**

Key things AI agents must know immediately:

| Rule | What It Means |
|------|--------------|
| Never run `prisma db pull` | Destroys `prisma/schema.prisma` — critical |
| Never use `this.logger.log()` | Method doesn't exist — use `.info()` |
| `inventory_transactions` uses `findFirst()` | Composite PK — `findUnique()` throws |
| BigInt IDs are `string` in DTOs | Convert with `BigInt()` before queries |
| `ReservationStatusEnum` has no `EXPIRED` | Expire maps to `CANCELLED` |
| Never commit without instruction | AI does not self-initiate commits |
| Mock callbacks: `(cb: (tx: unknown) => Promise<unknown>)` | Not `cb: any` |

---

## For New Human Engineers

### What FactoryERP Is

FactoryERP is a backend system for managing garment manufacturing operations. It covers:
- Inventory management (physical bags of garments, transactions, reservations)
- Production orders and WIP tracking
- Container receiving, quality control
- CMO (Customer Manufacturing Orders) and shipping
- Machine monitoring and OEE
- HR and attendance

The backend is a NestJS 11 monolith written in TypeScript, connected to a PostgreSQL 18 database with 98 data models.

### Environment Setup

1. **Prerequisites:** Node.js v18+, PostgreSQL 18, npm.
2. **Install dependencies:** `npm install`.
3. **Set up environment:** Copy `.env.example` to `.env` and fill in the required variables.
4. **Generate Prisma client:**
   ```bash
   DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
   ```
5. **Verify build:** `npm run build`.
6. **Verify tests:** `npm run test`.
7. **Start development server:** `npm run start:dev`.

### Navigating the Codebase

| Location | What's There |
|----------|-------------|
| `src/app.module.ts` | Application root — global guards, interceptors, all module imports |
| `src/main.ts` | Bootstrap — global filters registered here |
| `src/core/` | Infrastructure shared by all modules |
| `src/modules/` | Business domain modules |
| `prisma/schema.prisma` | The full data model (2229 lines, 98 models) |
| `docs/architecture/adr/` | All 27 architecture decisions |
| `docs/knowledge/` | 22 KEB documents explaining the codebase |
| `docs/feos/` | 21 FEOS governance documents (this directory) |

### Key Glossary Terms

From KEB-15 (Engineering Glossary):

- **Bag:** Physical unit of garment inventory (dozens of a specific model/color/size).
- **Container:** Incoming shipment of bags from a supplier.
- **Dozens:** Unit of measure (12 garments).
- **CMO:** Customer Manufacturing Order.
- **Reservation:** A hold on available bag quantity for a specific purpose.
- **TRANSFER:** Two-record atomic transaction (RELEASE from source + RECEIVING at destination).
- **BaseRepository:** Abstract base class for all repositories — provides `this.db` and `executeInTransaction()`.
- **Use Case:** NestJS injectable that implements exactly one business command or query.

See KEB-15 for the complete glossary.

---

## Repository Tour

### How a Request Flows

```
HTTP Request → Controller → Use Case → Service(s) → Repository → Prisma → PostgreSQL
                    ↓                                    ↓
              (validates DTO)                    (queries factory schema)
                    ↓
              (returns response via ResponseInterceptor → BigInt serialized → Envelope wrapped)
```

### Finding What You Need

| What you want | Where to look |
|--------------|--------------|
| Data model for an entity | `prisma/schema.prisma` — find the model by name |
| API endpoints for a domain | `src/modules/<domain>/controllers/` |
| Business logic for a feature | `src/modules/<domain>/use-cases/` |
| Database queries for a model | `src/modules/<domain>/repositories/` |
| Validation rules | `src/modules/<domain>/services/<domain>.validator.ts` |
| Test coverage | `src/modules/<domain>/use-cases/<domain>.use-cases.spec.ts` |
| Architecture decisions | `docs/architecture/adr/ADR-NNN-*.md` |

---

## How to Contribute

### Starting a Feature Sprint

1. Read FEOS-01 (Constitution) and FEOS-04 (Implementation Governance).
2. Verify prerequisites in KEB-07 (Module Status).
3. Define and confirm the sprint scope with the architect.
4. Implement following the module structure in FEOS-11.
5. Run all three quality gates before any commit.
6. Write the sprint report.
7. Create the git tag.

### Adding a New Use Case

1. Identify the right module and use-case directory.
2. Create the command/query class.
3. Create the use case class with `execute()` method.
4. Add the repository method if needed.
5. Wire to a controller endpoint.
6. Add tests.
7. Register in the module's `providers` array.
8. Verify with `npm run build && npm run lint && npm run test`.

### Adding a New Module

Follow FEOS-11 (Module Governance) exactly. The Inventory module at `src/modules/inventory/` is the canonical reference.

---

## How Not to Break the Project

### Top 10 Things That Break FactoryERP

1. **Running `prisma db pull`** — destroys the schema file. **Recovery:** `git checkout HEAD -- prisma/schema.prisma && npx prisma generate && npm run build`.

2. **Using `findUnique()` on `inventory_transactions` or `audit_events`** — composite PKs require `findFirst()`.

3. **Using `this.logger.log()`** — method doesn't exist. Use `.info()`.

4. **Exporting a TypeScript interface without `type`** — `export { Foo }` → `export type { Foo }` (isolatedModules).

5. **Injecting `PrismaService` outside a repository** — violates layer ordering; breaks testability.

6. **Adding `EXPIRED` to `ReservationStatusEnum`** — the enum has no EXPIRED value.

7. **Forgetting `DATABASE_URL=...` prefix on Prisma CLI** — commands connect to nothing.

8. **Running DDL as `elkardousy`** — lacks privileges; migrations fail.

9. **Using `BigInt()` for string serialization** — BigInt → JSON throws; use `serializeBigInts()` in the mapper.

10. **Importing a global module** (PrismaModule, LoggerModule, etc.) **in a feature module** — duplicate providers.

---

## For Reviewers

When reviewing code contributions:

1. Use FEOS-18, Checklist 06 (Code Review) as your review template.
2. Verify layer ordering (FEOS-03).
3. Verify test completeness (FEOS-08).
4. Verify Swagger annotations (FEOS-07).
5. Verify BigInt and Decimal handling (FEOS-06).
6. Verify security: authentication on all endpoints, no sensitive data in responses (FEOS-09).
7. Verify ADRs for any new architectural decisions (FEOS-10).

---

## For Architects

When making architectural decisions:

1. Write an ADR before implementing the decision.
2. Verify the decision does not conflict with frozen decisions in FEOS-01, Article V.
3. Update KEB-02 (Architecture Baseline) if the decision changes the verified architecture.
4. Consider the impact on the existing 22 spec files — new patterns must be test-friendly.
5. Consider the migration workflow impact — any new pattern that requires DDL must account for the superuser-only DDL privilege.

---

## Key Documents Quick Reference

| Need | Read |
|------|------|
| What can I do? | FEOS-12 (AI Governance) |
| Architecture rules | FEOS-03 (Architecture Governance) |
| Database rules | FEOS-05, FEOS-06 |
| Code standards | FEOS-07 (Code Governance) |
| Test requirements | FEOS-08 (Test Governance) |
| Security rules | FEOS-09 (Security Governance) |
| Git rules | FEOS-10 (Git Governance) |
| New module template | FEOS-11 (Module Governance) |
| Recovery from failure | FEOS-15 (Recovery Playbook) |
| Sprint checklists | FEOS-18 (Engineering Checklists) |
| What is this codebase? | KEB-02 (Architecture Baseline) |
| Which modules exist? | KEB-07 (Module Status) |
| What models exist? | KEB-04 (Database Knowledge) |
| What does "bag" mean? | KEB-15 (Engineering Glossary) |
