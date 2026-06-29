# 00 — Production Module Master Execution Contract

| Field | Value |
|---|---|
| **Purpose** | Authoritative contract governing all Production Module implementation |
| **Scope** | All source code, tests, migrations, and documentation for the Production domain |
| **Audience** | Implementation agent(s), architects, technical leads, QA |
| **Status** | ACTIVE |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Per-sprint |
| **Version** | 1.0 |

**Dependencies:** Platform Completion Phase (F01–F05) — COMPLETE  
**Related FEOS:** FEOS-01, FEOS-04, FEOS-08, FEOS-11  
**Related KEB:** KEB-03, KEB-04, KEB-10, KEB-19  

---

## 1. Mission

Implement the Production Module — the core manufacturing execution system of FactoryERP. The module transforms reserved inventory (bags of cut fabric parts) into assembled garments, tracking every stage of production from material release through packing and finished goods. This is the highest-complexity module in the system.

---

## 2. Authority Order

When any implementation decision is ambiguous, resolve it in this order:

1. **FEOS** (`docs/feos/`) — engineering constitution; overrides everything
2. **KEB** (`docs/knowledge/`) — business and database knowledge
3. **Existing repository** — established patterns in completed modules
4. **ADRs** (documented in KEB-10) — frozen architectural decisions
5. **This contract** — implementation guidance
6. **Executing agent judgment** — last resort, must be documented

---

## 3. Absolute Prohibitions

These rules are unconditional. Violation is a STOP condition.

| Prohibition | Reference |
|---|---|
| `prisma db pull` is FORBIDDEN | CLAUDE.md, KEB-04 |
| `prisma migrate deploy` is FORBIDDEN | CLAUDE.md |
| `process.env` direct access (except PrismaService constructor, loggerConfig) | CLAUDE.md |
| Services injecting `PrismaService` directly | CLAUDE.md architecture |
| `console.log` — use `LoggerService` methods only | CLAUDE.md |
| Force-push to `main` | General safety |
| Redesigning frozen ADRs | FEOS-01 Article V |
| Implementing source code without passing quality gates | FEOS-01 Rule C-001/C-002/C-003 |
| Re-importing global modules (Prisma, Logger, Audit, DocumentNumbering) | CLAUDE.md architecture |

---

## 4. Quality Gates (Mandatory — All Must Pass Before Commit)

Per FEOS-01 Article III (Definition of Done):

| Gate | Command | Threshold |
|---|---|---|
| C-001 Build | `npm run build` | Zero TypeScript errors |
| C-002 Lint | `npm run lint` | Zero ESLint errors |
| C-003 Tests | `npm run test` | All existing tests pass + new tests added for feature |
| Prisma | `DATABASE_URL="..." npx prisma validate` | Schema is valid |

**`DATABASE_URL` prefix is required on ALL Prisma CLI commands.** See CLAUDE.md.

---

## 5. Architecture Contract

### 5.1 Layer Ordering (Strict)

```
Controllers → Use Cases → Services → Repositories → PrismaService
```

- Repositories are the **only** layer that touches `PrismaService`
- Use Cases hold all business logic for a feature
- Services provide reusable cross-cutting capabilities only
- Controllers: validate input → call one use case → return result

### 5.2 Module Path

```
src/modules/production/
  controllers/
    production.controller.ts
    material-release.controller.ts
    production-stages.controller.ts
    quality-output.controller.ts
    packing.controller.ts
    supplementary.controller.ts
  repositories/
    production-orders.repository.ts
    material-release.repository.ts
    production-stages.repository.ts
    wip-inventory.repository.ts
    quality-output.repository.ts
    return-transactions.repository.ts
    packing.repository.ts
    finished-goods.repository.ts
    supplementary.repository.ts
  services/
    (cross-cutting only — most logic belongs in use cases)
  use-cases/
    <feature>/
      <name>.use-case.ts
      dto/
      contracts/
      index.ts
  events/
    production.events.ts
    production-event.publisher.ts
    production-event.listener.ts
  production.module.ts
```

### 5.3 BigInt Rules

All primary keys are `BigInt`. Repositories receive `bigint` internally; controllers and DTOs use `string`. Mappers call `.toString()` on IDs going out and `BigInt(id)` on IDs coming in.

### 5.4 Composite PK Tables

These production tables have composite PKs (`@@id`) and **must use `findFirst()`, NEVER `findUnique()`**:

- `production_stage_logs` — `@@unique([order_id, stage_id])` (but this is unique, not PK; still use findFirst for partial lookups by order_id alone)

Tables with `@@id` (composite PK) in the schema require `findFirst()` for lookups by a single field.

### 5.5 Optimistic Locking

These tables have a `version` field requiring optimistic lock pattern (read-check-update):

| Table | Concurrent Risk |
|---|---|
| `wip_inventory` | Multiple stage completions updating same WIP record |
| `quality_output_boxes` | Packing consuming from multiple threads |
| `customer_manufacturing_order_lines` | Material release reducing remaining_dozens |

Pattern: read `version`, update with `WHERE version = :read_version`, check `count === 1`, retry on failure.

### 5.6 Document Numbering

`production_orders.order_number` and `supplementary_material_requests.request_number` must be generated by `DocumentNumberingService` (global module, do not re-import). See GAP-016 in KEB-19 for current gap status.

### 5.7 Inventory Integration

The Production Module triggers inventory transactions. All inventory side effects must be executed via `InventoryTransactionService` or the relevant repository method — never raw Prisma writes to `inventory_transactions` or `inventory_bags`. Specifically:

| Production Event | Inventory Transaction Type |
|---|---|
| Material released from bag | `RELEASE` |
| WIP consumed in stage | `WIP_CONSUMPTION` |
| Quality output recorded | `QUALITY_OUTPUT` |
| Packing executed | `PACKING` |
| Material returned | `RETURN` |
| Supplementary released | `SUPPLEMENTARY_RELEASE` |

### 5.8 Event Bus

Production domain events must be emitted via `ProductionEventPublisher` (to be created in `src/modules/production/events/`), which wraps `EventEmitter2`. Services never call `EventEmitter2` directly. See ADR-025 (KEB-10).

---

## 6. Feature Queue Overview

Features are ordered by dependency. No feature may begin implementation until its listed dependencies are committed and quality gates pass.

| ID | Feature | Dependencies |
|---|---|---|
| P01 | Production Order Management | Platform F01–F05 |
| P02 | Material Release | P01 |
| P03 | Production Stage Tracking | P02 |
| P04 | WIP Inventory Management | P03 |
| P05 | Scrap & Incomplete Recording | P03 |
| P06 | Quality Output | P04, P05 |
| P07 | Return to Warehouse | P02 |
| P08 | Packing Execution | P06 |
| P09 | Finished Goods Management | P08 |
| P10 | Supplementary Material Requests | P02 |
| P11 | Production Reporting | P01–P09 |

See `02_PRODUCTION_FEATURE_QUEUE.md` for full per-feature specification.

---

## 7. Feature Lifecycle (State Machine)

Each feature must pass through these states before being recorded as DONE:

```
BLOCKED → READY → IN_PROGRESS → REVIEW → DONE
```

| State | Entry Condition |
|---|---|
| READY | All dependencies are DONE; Definition of Ready met (FEOS-01 Article II) |
| IN_PROGRESS | Feature work has begun |
| REVIEW | Implementation complete; quality gates run |
| DONE | All quality gates pass; documented in progress tracker |

A feature reverts to IN_PROGRESS if any quality gate fails after moving to REVIEW.

---

## 8. Stop Rules

Execution stops immediately if:

1. Any prohibited command is about to be executed
2. Build gate fails and cannot be fixed within the current feature scope
3. An existing test suite is broken and the break is not caused by the current feature
4. A schema change is required that was not planned in this contract
5. A business rule conflict is discovered that requires KEB updates
6. An ADR conflict is discovered (ADR-001 through ADR-026 are frozen per FEOS-01 Article V)

On STOP: document the blocker in `08_PRODUCTION_PROGRESS_TEMPLATE.md`, record status as BLOCKED, and return a blocked report.

---

## 9. Completion Rules

The Production Module is COMPLETE when:

1. All eleven features (P01–P11) are in state DONE
2. All quality gates pass on the final build
3. All production endpoints are documented in Swagger (`/api/docs`)
4. All domain events are documented in `05_PRODUCTION_EVENT_SPECIFICATION.md`
5. All acceptance criteria in `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` are verified
6. `10_PRODUCTION_FINAL_ACCEPTANCE.md` is signed off
7. No TODOs, FIXMEs, or placeholder implementations remain in production source

---

## 10. Module Governance Rules

Per FEOS-11 (Module Governance):

- Every new use case must have a corresponding spec file
- No barrel file re-exports `export { Foo }` for a pure interface — use `export type { Foo }`
- Classes and enums use plain `export { }`
- All controller routes must include `@ApiBearerAuth('JWT')`, `@ApiOperation`, and `@ApiResponse` decorators
- All DTOs must have `@ApiProperty()` decorators
- Route versioning: `@Controller({ path: '...', version: '1' })`
- All protected routes must declare `@Roles(...)` from `authorization/decorators/roles.decorator`

---

## 11. Final Acceptance Gate

See `10_PRODUCTION_FINAL_ACCEPTANCE.md` for the complete sign-off checklist. The Production Module is not shipped until that document is fully checked.
