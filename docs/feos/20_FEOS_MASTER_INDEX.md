# 20 — FEOS Master Index

**Document:** FEOS-20  
**Category:** Navigation  
**Authority:** Reference  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Effective:** 2026-06-29  
**Baseline Commit:** 5a5e3d6 (Sprint 11.3)

---

## FEOS Document Index

| # | Document | Category | Authority | When to Read |
|---|----------|----------|-----------|--------------|
| 00 | [FEOS Home](00_FEOS_HOME.md) | Navigation | — | Entry point, always |
| 01 | [Engineering Constitution](01_ENGINEERING_CONSTITUTION.md) | Governance | MANDATORY | Every sprint kickoff |
| 02 | [Project Governance](02_PROJECT_GOVERNANCE.md) | Governance | MANDATORY | Decision-making, escalation |
| 03 | [Architecture Governance](03_ARCHITECTURE_GOVERNANCE.md) | Architecture | MANDATORY | New features, ADR creation |
| 04 | [Implementation Governance](04_IMPLEMENTATION_GOVERNANCE.md) | Process | MANDATORY | Sprint execution |
| 05 | [Database Governance](05_DATABASE_GOVERNANCE.md) | Database | MANDATORY | Schema changes, migrations |
| 06 | [Prisma Governance](06_PRISMA_GOVERNANCE.md) | Database | MANDATORY | Any Prisma operation |
| 07 | [Code Governance](07_CODE_GOVERNANCE.md) | Code | MANDATORY | Implementation, review |
| 08 | [Test Governance](08_TEST_GOVERNANCE.md) | Testing | MANDATORY | Writing tests, quality gates |
| 09 | [Security Governance](09_SECURITY_GOVERNANCE.md) | Security | MANDATORY | Auth/AuthZ, sensitive data |
| 10 | [Git Governance](10_GIT_GOVERNANCE.md) | Version Control | MANDATORY | Commits, branching, releases |
| 11 | [Module Governance](11_MODULE_GOVERNANCE.md) | Architecture | MANDATORY | Creating new modules |
| 12 | [AI Governance](12_AI_GOVERNANCE.md) | AI | MANDATORY | Every AI session |
| 13 | [Engineering Standards](13_ENGINEERING_STANDARDS.md) | Standards | MANDATORY/RECOMMENDED | Performance, reliability |
| 14 | [Operational Playbook](14_OPERATIONAL_PLAYBOOK.md) | Operations | RECOMMENDED | Daily engineering workflow |
| 15 | [Recovery Playbook](15_RECOVERY_PLAYBOOK.md) | Recovery | MANDATORY | Failures, emergencies |
| 16 | [Release Playbook](16_RELEASE_PLAYBOOK.md) | Release | MANDATORY | Version releases |
| 17 | [Engineering Metrics](17_ENGINEERING_METRICS.md) | Metrics | RECOMMENDED | Health assessment |
| 18 | [Engineering Checklists](18_ENGINEERING_CHECKLISTS.md) | Quality | MANDATORY (gates) | Sprint gates, reviews |
| 19 | [Onboarding Guide](19_ONBOARDING_GUIDE.md) | Onboarding | RECOMMENDED | New contributors |
| 20 | [FEOS Master Index](20_FEOS_MASTER_INDEX.md) | Navigation | Reference | Cross-reference |

---

## Reading Order by Role

### AI Agent (Mandatory)

```
FEOS-12 → FEOS-01 → FEOS-03 → FEOS-05 → FEOS-06 → FEOS-07 → KEB-13 → KEB-02
```

### New Human Engineer

```
FEOS-00 → FEOS-01 → FEOS-19 → FEOS-03 → FEOS-07 → FEOS-10 → KEB-02 → KEB-07
```

### Sprint Execution

```
FEOS-04 → FEOS-11 → FEOS-08 → FEOS-18 (Checklist 04)
```

### Sprint Review / Acceptance

```
FEOS-18 (Checklist 08) → FEOS-16 (if release) → FEOS-10 (git tag)
```

### Architecture Decision

```
FEOS-03 → FEOS-01 (Article V) → write ADR → implement
```

### Database / Migration

```
FEOS-05 → FEOS-06 → FEOS-18 (Checklist 05)
```

### Failure / Recovery

```
FEOS-15 → identify section → follow procedure → FEOS-18 (gate checklists)
```

---

## Cross-Reference: FEOS ↔ KEB

| FEOS Document | Primary KEB Documents |
|---------------|-----------------------|
| FEOS-01 | KEB-01, KEB-20 |
| FEOS-02 | KEB-12, KEB-14 |
| FEOS-03 | KEB-02, KEB-10, KEB-16 |
| FEOS-04 | KEB-07, KEB-08, KEB-03 |
| FEOS-05 | KEB-04, KEB-05 |
| FEOS-06 | KEB-05, KEB-04 |
| FEOS-07 | KEB-02, KEB-17 |
| FEOS-08 | KEB-09 |
| FEOS-09 | KEB-02, KEB-11 |
| FEOS-10 | KEB-12 |
| FEOS-11 | KEB-07, KEB-02, KEB-16 |
| FEOS-12 | KEB-13, KEB-02 |
| FEOS-13 | KEB-01, KEB-20 |
| FEOS-14 | KEB-08, KEB-12 |
| FEOS-15 | KEB-11 |
| FEOS-16 | KEB-08, KEB-12 |
| FEOS-17 | KEB-18, KEB-20 |
| FEOS-18 | KEB-09, KEB-20 |
| FEOS-19 | KEB-02, KEB-07, KEB-15 |
| FEOS-20 | All |

---

## Critical Rules Quick Reference

The most critical rules across all FEOS documents:

| Rule | Document | Category |
|------|----------|---------|
| `prisma db pull` is PROHIBITED | FEOS-06 | Prisma |
| `prisma migrate deploy` is PROHIBITED | FEOS-05 | Database |
| DDL must use `postgres` superuser | FEOS-05 | Database |
| Always prefix Prisma CLI with DATABASE_URL= | FEOS-06 | Prisma |
| `findFirst()` for composite PK tables | FEOS-06, FEOS-03 | Prisma |
| `PrismaService` only in BaseRepository subclasses | FEOS-03 | Architecture |
| Controllers call exactly one use case | FEOS-03 | Architecture |
| Global modules must not be re-imported | FEOS-03 | Architecture |
| PrismaExceptionFilter before AllExceptionsFilter | FEOS-03 | Architecture |
| `this.logger.info()` not `.log()` | FEOS-07 | Code |
| No `console.log()` in production | FEOS-07 | Code |
| No `cb: any` in test mocks | FEOS-08 | Testing |
| `export type { }` for pure TypeScript interfaces | FEOS-07 | TypeScript |
| BigInt IDs: string in DTO, BigInt() before query | FEOS-07 | TypeScript |
| No `EXPIRED` in ReservationStatusEnum | FEOS-06, FEOS-03 | Domain |
| All endpoints need authentication or `@Public()` | FEOS-09 | Security |
| No secrets committed to git | FEOS-09, FEOS-10 | Security |
| No force push to main | FEOS-10 | Git |
| No commit without explicit instruction (AI) | FEOS-12 | AI |
| AI does not self-approve sprint scope | FEOS-12 | AI |

---

## Quality Gate Quick Reference

Run before every commit and sprint acceptance:

```bash
npm run build    # TypeScript compilation — must exit 0
npm run lint     # ESLint — must exit 0 (0 errors)
npm run test     # Jest — must exit 0 (0 failures)
```

---

## Prisma CLI Quick Reference

All commands require the DATABASE_URL prefix:

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma validate
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate status
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate resolve --applied "<name>"
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma studio
```

**Never run without prefix. Never run `prisma db pull`. Never run `prisma migrate deploy`.**

---

## Module Registry

| Module | Status | Controller | Sprint |
|--------|--------|-----------|--------|
| AuthModule | COMPLETE | `auth.controller.ts` | Phase 2 |
| AuthorizationModule | COMPLETE | — | Phase 2 |
| CustomersModule | COMPLETE | `customers.controller.ts` | Phase 2 |
| SuppliersModule | COMPLETE | `suppliers.controller.ts` | Phase 2 |
| GarmentModelsModule | COMPLETE | 3 controllers | Phase 2 |
| MeasurementsModule | COMPLETE | 2 controllers | Phase 2 |
| OrganizationModule | COMPLETE | 2 controllers | Phase 2 |
| ProductionSetupModule | COMPLETE | 2 controllers | Phase 2 |
| WarehousesModule | COMPLETE | `warehouses.controller.ts` | Phase 2 |
| InventoryModule | COMPLETE | `inventory.controller.ts` | Sprint 11 |
| ContainersModule | PLANNED | — | Sprint 12 |
| ProductionOrdersModule | PLANNED | — | Sprint 13 |
| WIPModule | PLANNED | — | Sprint 14 |
| PackingModule | PLANNED | — | Sprint 15 |
| CMOModule | PLANNED | — | Sprint 16+ |

---

## FEOS Completion Statement

All 21 FEOS documents have been created in `docs/feos/`:

```
docs/feos/
├── 00_FEOS_HOME.md
├── 01_ENGINEERING_CONSTITUTION.md
├── 02_PROJECT_GOVERNANCE.md
├── 03_ARCHITECTURE_GOVERNANCE.md
├── 04_IMPLEMENTATION_GOVERNANCE.md
├── 05_DATABASE_GOVERNANCE.md
├── 06_PRISMA_GOVERNANCE.md
├── 07_CODE_GOVERNANCE.md
├── 08_TEST_GOVERNANCE.md
├── 09_SECURITY_GOVERNANCE.md
├── 10_GIT_GOVERNANCE.md
├── 11_MODULE_GOVERNANCE.md
├── 12_AI_GOVERNANCE.md
├── 13_ENGINEERING_STANDARDS.md
├── 14_OPERATIONAL_PLAYBOOK.md
├── 15_RECOVERY_PLAYBOOK.md
├── 16_RELEASE_PLAYBOOK.md
├── 17_ENGINEERING_METRICS.md
├── 18_ENGINEERING_CHECKLISTS.md
├── 19_ONBOARDING_GUIDE.md
└── 20_FEOS_MASTER_INDEX.md
```

No source code, tests, Prisma schema, migrations, or configurations were modified.  
Primary source of truth: KEB (`docs/knowledge/`) at commit `5a5e3d6`.  
Repository state: unchanged from Sprint 11.3 baseline.

---

**FEOS COMPLETE**
