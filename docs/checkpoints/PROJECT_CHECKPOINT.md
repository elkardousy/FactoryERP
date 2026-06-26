# PROJECT_CHECKPOINT.md

> Sprint-level checkpoint snapshot. Read `docs/PROJECT_MEMORY.md` for the full operational context.

---

## Checkpoint: Sprint 10.5 — Business Foundation Acceptance

**Date:** 2026-06-26
**Git branch:** main
**Git tag (recommended):** v0.3.0-business-foundation
**Status:** ACCEPTED

---

## What Was Completed in This Checkpoint

### Code
- 9 domain modules: auth, authorization, customers, garment-models, measurements, organization, production-setup, suppliers, warehouses
- 62 use cases, 18 repositories, 13 controllers, 12 services
- 20 test suites, 142 tests — all passing
- Lint: 0 errors. Build: clean.

### Infrastructure
- 4 global modules: PrismaModule, LoggerModule, AuditModule, DocumentNumberingModule
- Complete guard stack: ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
- BigInt serialization via `serializeBigInts()` in ResponseInterceptor
- Template-based atomic document numbering
- Fire-and-forget audit with JSONB payloads

### Documentation
- 26 ADRs (ADR-000 through ADR-025)
- Complete architecture documentation suite in `docs/architecture/`
- `docs/PROJECT_MEMORY.md` — permanent project memory

---

## What Is NOT Done (Next Sprint Dependencies)

1. **No database migrations** — `prisma/migrations/` does not exist. Must run `npx prisma migrate dev` before any integration work.
2. **AuditRepository in AuthModule** — TD-1, must be resolved in Sprint 11.
3. **Missing schema fields** — `@updatedAt`, `deactivated_at`, `deactivated_by` pending on several entities.
4. **No CMO module** — Customer Manufacturing Orders are the next domain to implement.

---

## Verification Commands

Run these to confirm the checkpoint is valid:

```bash
npm run lint          # Must exit 0
npm run build         # Must succeed
npm run test          # Must show 20 suites / 142 tests passing
npx prisma validate   # Must show schema is valid
```

---

## Next Checkpoint Target

**Sprint 11 — Database Foundation + CMO Phase Bootstrap**

Expected deliverables:
- `prisma/migrations/` with initial migration applied to a live database
- All Sprint 10.5 technical debt resolved
- CMO module implemented with full test coverage
- Test count ≥ 180

Expected tag: `v0.4.0-cmo-foundation`
