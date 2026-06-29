# 18 — Repository Statistics

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Source Code Statistics

### File Counts by Type

| Type | Count |
|------|-------|
| TypeScript source files (`.ts`) | ~150+ (estimated) |
| Spec files (`.spec.ts`) | 22 |
| Module files (`*.module.ts`) | 17 |
| Controller files (`*.controller.ts`) | 14 |
| Repository files (`*.repository.ts`) | 18+ |
| Migration SQL files | 2 |
| Documentation markdown files (docs/) | 40+ |
| ADR files | 27 |

### Lines of Code (Key Files)

| File | Lines |
|------|-------|
| `prisma/schema.prisma` | 2229 |
| `src/modules/inventory/controllers/inventory.controller.ts` | 406 |
| `src/modules/inventory/use-cases/inventory-transactions.use-cases.spec.ts` | ~280 (estimated) |
| `src/modules/inventory/use-cases/reservations.use-cases.spec.ts` | ~350 (estimated) |
| `src/app.module.ts` | 67 |
| `src/main.ts` | 41 |
| `src/core/database/repositories/base/base.repository.ts` | 17 |

---

## Database Schema Statistics

| Metric | Count |
|--------|-------|
| Total Prisma models | 98 |
| Total PostgreSQL enums | 32 |
| Models with composite PK | 2 (`inventory_transactions`, `audit_events`) |
| Models with soft-delete (`is_active`) | ~15 |
| Models with optimistic locking (`version`) | 4 |
| Models with `@updatedAt` | ~8 |
| Models with `dbgenerated()` columns | 8 |
| Models with `Unsupported("inet")` | 2 |
| Junction tables (composite PK, no surrogate) | 2 (`role_permissions`) |
| Indexed columns / groups | 50+ |
| GIN indexes (SQL-managed) | 3 |

---

## Test Statistics

| Metric | Count |
|--------|-------|
| Total spec files | 22 |
| Total tests (Sprint 11.3 completion) | ~197 |
| Inventory transaction tests | 26 |
| Inventory reservation tests | 29 |
| Auth tests | ~20 |
| Authorization tests | ~25 |
| Business module tests | ~80 |
| Core tests | ~10 |
| E2E spec files | 1 (skeleton only) |

---

## Module Statistics

| Metric | Count |
|--------|-------|
| NestJS feature modules | 10 |
| Global infrastructure modules | 5 (Prisma, Logger, Audit, DocNumbering, Config) |
| Controllers | 14 |
| Repositories | 18+ |
| Services | 20+ |
| Use cases | 40+ |
| Commands | ~13 |
| Queries | ~12 |
| DTOs | 30+ |

---

## API Statistics

| Metric | Count |
|--------|-------|
| Total REST endpoints (estimated) | ~87 |
| Auth endpoints | 3 |
| Inventory endpoints | 16 |
| Other business module endpoints | ~68 |
| Public endpoints (no JWT required) | 2 (login, refresh) |
| Versioned endpoints (`/v1/`) | All |

---

## Git Statistics

| Metric | Count |
|--------|-------|
| Total commits | 26 |
| Tags | 5 |
| Conventional commit types used | 6 (feat, fix, refactor, chore, docs, release) |
| Contributors | 1 (elkardousy) |
| Branches | 1 (main) |
| Migrations | 2 |

---

## Documentation Statistics

| Location | Files |
|----------|-------|
| `docs/architecture/` | 14 architecture docs |
| `docs/architecture/adr/` | 27 ADRs |
| `docs/adr/` (legacy) | 5 ADRs |
| `docs/checkpoints/` | 1 checkpoint |
| `docs/decisions/` | 1 (technical debt report) |
| `docs/releases/` | 1 (v0.3.0 release notes) |
| `docs/reviews/` | 1 (Phase 3 readiness review) |
| `docs/sprint-reports/` | 2 sprint reports |
| `docs/api/` | 1 (authentication doc) |
| `docs/knowledge/` (this KEB) | 22 documents (when complete) |
| Total docs | ~76 |

---

## Dependency Statistics

| Category | Count |
|----------|-------|
| Runtime npm dependencies | 22 |
| Dev npm dependencies | 21 |
| Total npm dependencies | 43 |
| NestJS packages | 10 |
| Prisma packages | 2 |
| Security packages | 5 (bcrypt, helmet, passport, passport-jwt, joi) |
| Logging packages | 3 (nestjs-pino, pino, pino-pretty) |

---

## AI Engineering Platform

| Metric | Count |
|--------|-------|
| `.ai/` subdirectories | 8 |
| `.claude/` configs | 1+ |
| CLAUDE.md size | ~250 lines |
| Sprint prompts | Unknown (not read) |
| Playbooks | Unknown (not read) |

---

## Schema Complexity Metrics

### Models by Domain Group

| Domain | Model Count |
|--------|-------------|
| Security / Auth / Session | 11 |
| Organization / HR | 7 |
| Garment & Measurements | 6 |
| Receiving / Containers | 4 |
| Production | 7 |
| Inventory (bags + transactions) | 7 |
| WIP & Quality | 3 |
| Packing & Finished Goods | 6 |
| Machines | 5 |
| Employees & Attendance | 5 |
| Workflows | 4 |
| Supplementary | 3 |
| CMO & Shipping | 9 |
| Investigations & Accountability | 2 |
| System / Infrastructure | 14 |
| Customers / Suppliers | 2 |
| Reference (colors, sizes, etc.) | 3 |
| **Total** | **98** |

### Models Accessible via NestJS APIs (Currently)

| Domain | Accessible Models |
|--------|------------------|
| Auth | users, roles (read-only via JWT) |
| Customers | customers |
| Suppliers | suppliers |
| Garment Models | models, model_parts, model_colors, model_sizes |
| Measurements | colors, sizes |
| Organization | departments, working_shifts |
| Production Setup | production_lines, production_stages |
| Warehouses | warehouses |
| Inventory | inventory_bags, inventory_transactions, physical_bags (history), physical_bag_movements (history), physical_bag_reservations |
| **Total accessible** | **~17 models** |

**Schema coverage by API:** 17/98 = **~17%** (83% of schema awaits future sprints)
