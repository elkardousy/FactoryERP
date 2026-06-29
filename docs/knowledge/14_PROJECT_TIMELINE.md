# 14 — Project Timeline

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Phase Overview

```
Phase 0: Database Foundation (SQL)
    ↓ COMPLETE
Phase 1: Project Foundation (NestJS)
    ↓ COMPLETE
Phase 2: Business Foundation (Auth + Master Data)
    ↓ COMPLETE — v0.3.0-business-foundation
Phase 3: Transaction & Execution Engine
    ↓ IN PROGRESS — Sprint 11.3 complete
Phase 4: [Future — Operational Modules]
    ↓ NOT STARTED
Phase 5: [Future — Reporting & Analytics]
    ↓ NOT STARTED
```

---

## Phase 0: Database Foundation

**Status:** COMPLETE (pre-Prisma era)  
**What happened:**  
- SQL Phase 0–20 scripts created the complete factory schema in PostgreSQL
- All tables, enums, indexes, functions, and triggers created as postgres superuser
- Schema ownership by `postgres` — `elkardousy` cannot alter it
- This explains the non-standard migration workflow (no `prisma migrate deploy`)

**Artifacts:**
- 20+ SQL phase scripts (not present in current git history — pre-dated project init)
- `prisma/migrations/20260627000000_initial_schema/migration.sql` — first recorded migration

---

## Phase 1: Project Foundation

**Status:** COMPLETE  
**Key commits:** `375e249` → `5696a36` → ... → `732b0a8`  
**Duration:** Multiple sprints

**What was built:**
- NestJS 11 project structure
- TypeScript configuration (`isolatedModules`, `ES2023`, `nodenext`)
- ESLint flat config + Prettier
- PrismaModule (`@Global()`)
- LoggerModule (`@Global()`, nestjs-pino)
- ConfigModule (namespaced, Joi-validated)
- ResponseInterceptor (BigInt serialization)
- GlobalValidationPipe
- AllExceptionsFilter + PrismaExceptionFilter
- CorrelationIdMiddleware
- AuditModule (`@Global()`)
- DocumentNumberingModule (`@Global()`)
- DatabaseHealthService
- BaseRepository abstract class

---

## Phase 2: Business Foundation

**Status:** COMPLETE  
**Release tag:** `v0.3.0-business-foundation`  
**Key commit:** `732b0a8`

### Auth Module
- JWT strategy + Passport.js integration
- Access token (15m) + refresh token (7d)
- Login, logout, refresh endpoints
- PasswordService (bcrypt), TokenService, SessionService
- `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`

### Authorization Module
- RolesGuard — checks `@Roles()` decorator
- ScreenPermissionGuard — fine-grained CRUD per screen
- PermissionResolverService + MemoryPermissionCache
- 4-guard global stack: ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard

### Business Modules (all CRUD + soft-delete)
- **Customers** → `GET/POST/PATCH/DELETE /v1/customers`
- **Suppliers** → `GET/POST/PATCH/DELETE /v1/suppliers`
- **Garment Models** (3 controllers: models, parts, colors+sizes)
- **Measurements** (colors + sizes)
- **Organization** (departments + working shifts)
- **Production Setup** (lines + stages)
- **Warehouses**

---

## Phase 3: Transaction & Execution Engine

**Status:** IN PROGRESS

### Phase 3 Sprint 0: Schema Hardening + Readiness Gates

**Status:** COMPLETE  
**Commit:** `bdc901c`  
**What happened:**
- Reviewed Phase 3 readiness (docs/reviews/PHASE3_READINESS_REVIEW.md)
- Resolved 7 gate conditions (G-4, G-5, G-6, G-7 explicitly mentioned in commit)
- Two Prisma migrations applied: initial_schema + inventory_schema_hardening
- AI Engineering Operating System v1.0 added (`51cfd6c`)
- Sprint 11-ready checkpoint tagged (`v0.4.0-sprint11-ready`)
- Migration workflow documented + `prisma db pull` prohibition added to CLAUDE.md

### Sprint 11.1: Inventory Module Foundation

**Status:** COMPLETE  
**Commit:** `6434cdd`  
**Delivered:**
- InventoryModule wiring
- Repository skeletons (4 repos)
- InventoryController skeleton
- Basic DTOs
- InventoryService skeleton

### Sprint 11.2: Inventory Transaction Engine

**Status:** COMPLETE  
**Commit:** `2d9bb87`  
**Delivered:**
- 5 command objects
- 8 use cases (receive, issue, transfer, adjust, list, get, bag history, list-by-warehouse)
- 4 DTOs (request, response, filter, history)
- 4 services (factory, mapper, validator, service)
- InventoryValidationRepository (new)
- Enhanced InventoryTransactionsRepository + PhysicalBagsRepository
- 8 REST endpoints
- 26 unit tests
- Build + lint + test all passing

### Sprint 11.3: Physical Bag Reservation Engine

**Status:** COMPLETE  
**Commit:** `5a5e3d6`  
**Delivered:**
- 4 command objects
- 8 use cases (create, release, cancel, expire, get, list, list-by-bag, list-by-order)
- 4 DTOs (request, response, filter, history)
- 4 services (factory, mapper, validator, service)
- Enhanced PhysicalBagReservationsRepository (7 new methods)
- 8 REST endpoints
- 29 unit tests
- Build + lint + test all passing

---

## Planned Future Phases (Inferred from Schema)

Based on the 98-model schema, the following capabilities are not yet implemented:

### Sprint 12 (Likely Next): Container Receiving Engine

**Expected scope:**
- Container management (CRUD)
- Packaging list (expected items)
- Receiving audit (actual items counted)
- Discrepancy tracking
- Physical bag creation from received items

### Sprint 13: Production Order Lifecycle

**Expected scope:**
- Production order CRUD
- Order part management
- Material release groups
- Release group lines

### Sprint 14: WIP Tracking Engine

**Expected scope:**
- Production stage logging
- Scrap records
- Incomplete item records
- WIP inventory management

### Sprint 15: Packing Engine

**Expected scope:**
- Packing patterns
- Packing orders
- Dozen assembly (pattern-based)
- Packing verification
- Finished goods bags

### Sprint 16+: CMO, Shipping, Analytics

**Expected scope:**
- Customer Manufacturing Orders
- Shipping orders, vehicle loading
- Delivery notes, proof of delivery
- Employee management
- Machine tracking
- Workflow approval engine
- KPI and OEE reporting
- Supplementary material requests

---

## ERP Architecture Vision

From `docs/architecture/adr/ADR-025-ERP-Architecture-Vision.md`:

The project targets a **Full ERP** covering:
1. Material receiving and inventory management ← Current focus
2. Production execution and tracking
3. Quality control and packing
4. Customer delivery and shipping
5. HR, attendance, and workforce management
6. Machine OEE and maintenance
7. Supplementary material accountability
8. Workflow approval chains
9. KPI reporting and analytics

---

## Current Sprint Progress

At HEAD (`5a5e3d6`):

| Category | Count | Notes |
|----------|-------|-------|
| Implemented NestJS modules | 10 | auth, authorization, customers, suppliers, garment-models, measurements, organization, production-setup, warehouses, inventory |
| Implemented Prisma models (accessible) | ~15 | users, roles, warehouses, models, model_parts, customers, suppliers, inventory_bags, inventory_transactions, physical_bags, physical_bag_movements, physical_bag_reservations, production_orders (read-only), colors, sizes |
| Unimplemented Prisma models | ~83 | All production, packing, HR, machine, workflow, CMO, shipping, investigation domains |
| Schema completion | 100% | All 98 models defined |
| API completion | ~15% | 10 of ~70 planned modules implemented |
| Test suite | 197 tests | All passing |
