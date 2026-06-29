# 11 — Risk Register

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Risk Severity Scale

| Level | Description |
|-------|-------------|
| CRITICAL | Could block deployment or cause data loss |
| HIGH | Significant impact if triggered |
| MEDIUM | Notable impact, mitigable |
| LOW | Minor concern, cosmetic or long-term |

---

## Active Risks

### RISK-001: Composite PK on inventory_transactions (CRITICAL)

**Description:** `inventory_transactions` uses `@@id([txn_id, executed_at])`. Any code using `findUnique({ where: { txn_id } })` will throw a runtime error because Prisma requires ALL PK fields for `findUnique`.  
**Current mitigation:** `findById` method in `InventoryTransactionsRepository` uses `findFirst({ where: { txn_id } })`.  
**Residual risk:** New developers may incorrectly use `findUnique` when adding new repository methods.  
**Status:** Mitigated in Sprint 11.2; pattern documented.

---

### RISK-002: BigInt JSON Serialization (HIGH)

**Description:** JavaScript `BigInt` cannot be serialized by `JSON.stringify()` natively (throws `TypeError: Do not know how to serialize a BigInt`).  
**Current mitigation:** `ResponseInterceptor` calls `serializeBigInts()` on every response payload.  
**Residual risk:**  
- Any code path that bypasses `ResponseInterceptor` will fail
- Error responses that include BigInt fields in their payload will fail
- Stream responses or WebSocket messages are not covered  
**Status:** Mitigated for REST responses. WebSocket not yet active.

---

### RISK-003: prisma db pull Destroys Schema (CRITICAL)

**Description:** Running `prisma db pull` overwrites `schema.prisma` from live database, destroying:
- `ReservationStatusEnum` (raw string in DB introspection)
- `@updatedAt` directives
- Custom relation names (6+ TypeScript errors)
- Custom indexes
- GIN index comments  
**Current mitigation:** CLAUDE.md explicitly prohibits `prisma db pull`. Recovery procedure documented.  
**Residual risk:** Developer unfamiliar with CLAUDE.md runs the command.  
**Status:** Documented, process risk.

---

### RISK-004: postgres Superuser Password in Shell Commands (MEDIUM)

**Description:** The postgres superuser password contains `??` which is URL-unsafe. If accidentally placed in a DATABASE_URL string (instead of PGPASSWORD env var), the URL parser will fail or silently truncate.  
**Current mitigation:** CLAUDE.md documents this: "use PGPASSWORD env var only, never in DATABASE_URL".  
**Residual risk:** Commands in CLAUDE.md may be copy-pasted incorrectly.  
**Status:** Documented.

---

### RISK-005: Available Quantity Race Condition (MEDIUM)

**Description:** The reservation validator checks available qty with `sumActiveReservedDozens()` at validation time, but does NOT hold a database lock. Two concurrent reservation requests for the same bag could both pass validation and both be created (if they overlap in time).  
**Current mitigation:**  
- DB-level `@@unique([bag_id, order_id])` prevents duplicate reservations for same bag+order pair.
- No distributed lock is in place for same bag, different orders.  
**Residual risk:** Over-reservation possible if two different orders simultaneously reserve from the same bag.  
**Status:** OPEN — no distributed lock implemented.

---

### RISK-006: Permission Cache Staleness (MEDIUM)

**Description:** `MemoryPermissionCache` holds permissions in memory. If roles or screen permissions are changed in the database, cached permissions remain stale until the application restarts.  
**Current mitigation:** Manual restart or cache invalidation call required.  
**Residual risk:** Security changes to roles/permissions don't take effect immediately.  
**Status:** OPEN — no cache invalidation event implemented.

---

### RISK-007: multiSchema Preview Feature (LOW)

**Description:** `previewFeatures = ["multiSchema"]` is used in Prisma. Preview features may have breaking changes between Prisma major versions.  
**Current mitigation:** Pinned to `^6.16.2`. No known breaking changes.  
**Residual risk:** Future Prisma upgrade may require schema/migration changes.  
**Status:** OPEN — tracked as technical debt.

---

### RISK-008: elkardousy User Limited Privileges (HIGH)

**Description:** Application user `elkardousy` cannot run DDL (`ALTER TABLE`, `CREATE TYPE`, etc.) on the `factory` schema (owned by `postgres`). This means `prisma migrate deploy` cannot be used.  
**Current mitigation:** All DDL executed as `postgres` superuser via psql. Prisma records migration as applied via `migrate resolve --applied`.  
**Residual risk:** Any CI/CD pipeline that uses `prisma migrate deploy` will fail.  
**Status:** OPEN — migration workflow is manual.

---

### RISK-009: No Repository Unit Tests (MEDIUM)

**Description:** Repository implementations have no unit or integration tests. Bugs in Prisma queries (wrong field names, missing conditions, incorrect relation joins) can only be caught in E2E tests or production.  
**Current mitigation:** Code review.  
**Residual risk:** Query bugs not caught until runtime.  
**Status:** OPEN — known testing gap.

---

### RISK-010: EXPIRE Maps to CANCELLED Without DB Record (LOW)

**Description:** The `ExpireReservation` API endpoint sets status to `CANCELLED` (same as cancel). There is no `EXPIRED` enum value. The distinction between a manually cancelled vs expired reservation is lost in the database.  
**Current mitigation:** API provides separate `/expire` endpoint for semantic clarity.  
**Residual risk:** Reporting cannot distinguish expired vs cancelled reservations without additional metadata (e.g., a `cancel_reason` field).  
**Status:** OPEN — design limitation.

---

### RISK-011: Unsupported `inet` Type (LOW)

**Description:** `audit_events.ip_address` and `user_sessions.ip_address` use `Prisma.Unsupported("inet")`. These fields cannot be read or written via Prisma Client.  
**Current mitigation:** These fields are written via raw SQL or not written at all.  
**Residual risk:** IP address tracking in audit logs may be incomplete.  
**Status:** OPEN — known Prisma limitation with PostgreSQL `inet` type.

---

### RISK-012: Empty Module Stubs (LOW)

**Description:** Two files exist as empty stubs:
- `src/core/config/config.module.ts` (1 line)
- `src/core/exceptions/exceptions.module.ts` (1 line)  
**Impact:** Low — these are not imported anywhere functionally.  
**Status:** OPEN — cosmetic technical debt.

---

### RISK-013: WebSocket Packages Declared but Unused (LOW)

**Description:** `@nestjs/websockets`, `@nestjs/platform-socket.io`, and `socket.io` are declared in `package.json` but not wired in the application.  
**Impact:** Adds ~3MB to node_modules unnecessarily.  
**Status:** OPEN — future feature preparation.

---

## Risks from docs/decisions/technical-debt-report.md

### Critical Issue: BigInt Serialization Defect (RISK-002 above)

**From technical debt report:**  
"1 critical BigInt serialization defect" — confirmed mitigated by `serializeBigInts()` in `ResponseInterceptor`.

### Additional Technical Debt Items

1. **9 empty stub files** — `config.module.ts`, `exceptions.module.ts`, and others
2. **2 dead methods** — methods defined but never called
3. **Deprecated multiSchema flag** — Prisma preview feature (RISK-007)
4. **Duplicate Prisma filter** — duplicate exception filter registration (UNKNOWN — needs verification)
5. **Unused constants** — `ACCESS_TOKEN_MINUTES`, `REFRESH_TOKEN_DAYS` in `auth.constants.ts` (declared but not used — actual token expiry comes from config)

---

## Risk Summary

| Risk | Severity | Status |
|------|----------|--------|
| RISK-001: Composite PK findUnique | CRITICAL | Mitigated |
| RISK-002: BigInt serialization | HIGH | Mitigated |
| RISK-003: prisma db pull | CRITICAL | Documented |
| RISK-004: Superuser password unsafe in URL | MEDIUM | Documented |
| RISK-005: Reservation race condition | MEDIUM | OPEN |
| RISK-006: Permission cache staleness | MEDIUM | OPEN |
| RISK-007: multiSchema preview | LOW | OPEN |
| RISK-008: elkardousy limited privileges | HIGH | OPEN (process) |
| RISK-009: No repository tests | MEDIUM | OPEN |
| RISK-010: EXPIRE → CANCELLED no metadata | LOW | OPEN |
| RISK-011: Unsupported inet type | LOW | OPEN |
| RISK-012: Empty module stubs | LOW | OPEN |
| RISK-013: Unused WebSocket packages | LOW | OPEN |
