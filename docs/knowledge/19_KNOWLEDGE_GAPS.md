# 19 — Knowledge Gaps

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Classification

| Level | Meaning |
|-------|---------|
| VERIFIED | Confirmed from source code/schema/docs |
| PARTIAL | Some information available, gaps exist |
| UNKNOWN | Cannot be verified from available sources |
| INFERRED | Reasonable inference from available evidence (not confirmed) |

---

## Architecture Gaps

### GAP-001: Actual .ai/ Content (UNKNOWN)

**What is unknown:** The exact contents of `.ai/SPRINT_PROMPTS/`, `.ai/PLAYBOOKS/`, `.ai/TEMPLATES/`, `.ai/CHECKLISTS/`, `.ai/QUALITY_GATES/` were not read.  
**Impact:** Cannot document the AI Engineering Operating System in detail.  
**Mitigation:** Directory structure is documented. Contents accessible via Read tool when needed.

### GAP-002: Two Empty Module Stubs (PARTIAL)

**What is unknown:** What `src/core/config/config.module.ts` and `src/core/exceptions/exceptions.module.ts` are intended to contain.  
**Current state:** Both are 1-line stubs — no exported providers.  
**Impact:** Low — neither is imported by any active module.

### GAP-003: AuditService Implementation Details (PARTIAL)

**What is known:** AuditModule is `@Global()`, AuditService logs to `audit_events` table.  
**What is unknown:** Which entity operations trigger audit events, what payload shape is used, whether it uses `Unsupported("inet")` fields.  
**Impact:** Medium — affects compliance and audit trail completeness.

### GAP-004: DocumentNumberingService Sequence Patterns (PARTIAL)

**What is known:** DocumentNumberingService exists, uses `number_sequences` table.  
**What is unknown:** What document types are configured (CMO numbers, PO numbers, etc.), what pattern templates look like, what reset frequency is used.  
**Impact:** Low — internal numbering concern.

---

## Implementation Gaps

### GAP-005: Repository Implementations (PARTIAL)

**What is known:** Repository method signatures from the inventory module.  
**What is unknown:** Full implementation of all repositories (especially non-inventory ones: CustomersRepository, WarehousesRepository, etc.).  
**Impact:** Cannot verify query correctness without reading implementation.

### GAP-006: Auth Module Services - Full Implementation (PARTIAL)

**What is known:** Service classes exist (PasswordService, TokenService, SessionService, JwtService, AuthService), tests exist.  
**What is unknown:** Full implementation of session revocation, token rotation, concurrent session handling per `session_policy` table.  
**Impact:** Medium — security-relevant.

### GAP-007: InventoryService (Base Class) (UNKNOWN)

**What is known:** `InventoryService` is registered in `InventoryModule` as a provider.  
**What is unknown:** What `InventoryService` does — it was listed in Sprint 11.1 skeleton files but its role in the current module is unclear (most logic is in domain-specific services: `InventoryTransactionService`, `ReservationService`).  
**Impact:** May be an empty/stub service.

### GAP-008: Permission Cache Invalidation (UNKNOWN)

**What is known:** `MemoryPermissionCache` stores permissions in memory.  
**What is unknown:** Whether there is any mechanism to invalidate the cache when roles/permissions change in the database.  
**Impact:** HIGH — stale permissions are a security concern.

---

## Database Gaps

### GAP-009: Complete Migration SQL Content (PARTIAL)

**What is known:** Two migrations exist (`20260627000000_initial_schema`, `20260627000001_inventory_schema_hardening`).  
**What is unknown:** Full content of the migration SQL files. Initial schema migration may be very large (all 98 tables).  
**Impact:** Cannot verify DDL matches Prisma schema exactly.

### GAP-010: GIN Index SQL (UNKNOWN)

**What is known:** Three GIN indexes are mentioned in `prisma/schema.prisma` comments:
- `idx_models_code_trgm` on `models.model_code`
- `idx_prod_orders_number_trgm` on `production_orders.order_number`
- `idx_audit_payload` on `audit_events.payload`  
**What is unknown:** Whether these were actually created in the migration SQL.  
**Impact:** Full-text search may not work if indexes don't exist.

### GAP-011: Triggers and Functions (UNKNOWN)

**What is known:** Several computed columns use `@default(dbgenerated())` which may reference PostgreSQL functions.  
**What is unknown:** Whether the initial SQL scripts created the necessary triggers/functions for computed columns (e.g., `variance_dozens`, `duration_minutes`, `net_pieces`).  
**Impact:** Computed columns may not work if DB functions don't exist.

### GAP-012: inet Column Handling (UNKNOWN)

**What is known:** `audit_events.ip_address` and `user_sessions.ip_address` use `Prisma.Unsupported("inet")`.  
**What is unknown:** How (if at all) these fields are written — possibly via raw SQL in AuditService.  
**Impact:** IP tracking may be broken or not implemented.

---

## Business Logic Gaps

### GAP-013: inventory_bags Update Logic (UNKNOWN)

**What is known:** `inventory_bags` is an aggregate ledger tracking `dozens_on_hand`. `InventoryBagsRepository` has findBy/upsert-style methods.  
**What is unknown:** Whether `inventory_bags.dozens_on_hand` is updated when inventory transactions are created (in `InventoryTransactionService`), or if it's updated separately.  
**Impact:** If ledger is not updated, `inventory_bags.dozens_on_hand` will be stale.

### GAP-014: Physical Bag Status Updates (UNKNOWN)

**What is known:** Physical bags have a status lifecycle (RECEIVED → AVAILABLE → RESERVED, etc.).  
**What is unknown:** Whether bag status is updated when reservations are created/released. Sprint 11.3 creates reservations but the `ReservationService` code doesn't appear to update `physical_bags.status`.  
**Impact:** Physical bag status may lag behind reservation status.

### GAP-015: Version (Optimistic Lock) Usage (UNKNOWN)

**What is known:** `inventory_bags`, `wip_inventory`, `quality_output_boxes`, `customer_manufacturing_order_lines` have `version BigInt` fields.  
**What is unknown:** Whether any current code actually implements optimistic locking using these version fields (check-and-increment pattern).  
**Impact:** Concurrent updates may cause data consistency issues if optimistic locking is not implemented.

### GAP-016: Document Number Assignment (UNKNOWN)

**What is known:** `DocumentNumberingService` exists for generating document numbers.  
**What is unknown:** Whether it is used in any current implementation (inventory transactions have `txn_reference` which is provided by the caller, not generated).  
**Impact:** `production_orders.order_number`, `supplementary_material_requests.request_number`, etc. may not have auto-numbering implemented.

---

## Testing Gaps

### GAP-017: E2E Test Coverage (PARTIAL)

**What is known:** `test/app.e2e-spec.ts` exists.  
**What is unknown:** Whether it contains meaningful E2E tests or just a stub.  
**Impact:** No API integration testing confirmed.

### GAP-018: Repository Test Coverage (UNKNOWN)

**What is known:** No `*.spec.ts` files exist for any repository.  
**What is unknown:** Whether repositories are tested indirectly via integration tests.  
**Impact:** Repository query bugs not caught by automated tests.

---

## Infrastructure Gaps

### GAP-019: WebSocket Implementation (UNKNOWN)

**What is known:** `@nestjs/websockets`, `socket.io`, `@nestjs/platform-socket.io` are declared in package.json.  
**What is unknown:** Whether any WebSocket gateway is implemented. No WebSocket files found in scan.  
**Impact:** WebSocket packages increase bundle size for unused functionality.

### GAP-020: CorrelationIdMiddleware Behavior (PARTIAL)

**What is known:** `CorrelationIdMiddleware` is applied to all routes.  
**What is unknown:** Full implementation — does it generate a new UUID if not present, read from header, propagate to downstream services, or add to logs?  
**Impact:** Unknown effectiveness for distributed tracing.

### GAP-021: CORS Configuration Details (PARTIAL)

**What is known:** CORS is enabled with `exposedHeaders: ['X-Correlation-ID']`.  
**What is unknown:** Allowed origins, credentials policy, HTTP methods — not configured in `main.ts` (using defaults).  
**Impact:** Potentially permissive CORS in production (no origin whitelist visible).

### GAP-022: Docker Configuration (UNKNOWN)

**What is known:** A `docker/` directory exists.  
**What is unknown:** What Docker configurations exist, whether Docker Compose is configured, container strategy.  
**Impact:** Deployment method not documented.

---

## Summary of Gap Severity

| Severity | Gaps |
|----------|------|
| HIGH | GAP-008 (permission cache), GAP-013 (inventory_bags update), GAP-014 (bag status update), GAP-015 (optimistic lock usage) |
| MEDIUM | GAP-003 (audit), GAP-006 (auth services), GAP-009 (migration SQL), GAP-011 (DB triggers/functions) |
| LOW | GAP-001 (.ai content), GAP-002 (stub modules), GAP-004 (doc numbering), GAP-005 (repo impl), GAP-007 (InventoryService), GAP-010 (GIN indexes), GAP-012 (inet), GAP-016 (doc numbers), GAP-017 (E2E), GAP-018 (repo tests), GAP-019 (WebSocket), GAP-020 (correlation), GAP-021 (CORS), GAP-022 (Docker) |

**Total knowledge gaps identified: 22**
