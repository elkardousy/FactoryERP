# 17 — Engineering Metrics

**Document:** FEOS-17  
**Category:** Metrics  
**Authority:** RECOMMENDED  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per sprint completion  
**Related FEOS:** FEOS-01 (Constitution), FEOS-08 (Test Governance), FEOS-18 (Checklists)  
**Related KEB:** KEB-18 (Repository Statistics), KEB-20 (Engineering Baseline)

---

## Purpose

This document defines the engineering KPIs, repository health indicators, and quality metrics that measure the health of the FactoryERP engineering practice.

## Scope

All quantifiable aspects of the FactoryERP codebase and engineering process.

## Audience

Architects and engineers assessing project health and sprint quality.

---

## Baseline Metrics (FEOS 1.0 — Sprint 11.3)

The following metrics are verified at commit `5a5e3d6`:

| Metric | Baseline Value |
|--------|---------------|
| Total tests | ~197 |
| Test pass rate | 100% |
| Build errors | 0 |
| Lint errors | 0 |
| Spec files | 22 |
| API endpoints | ~87 |
| Prisma models | 98 |
| Schema API coverage | ~17% (17/98 models) |
| Applied migrations | 2 |
| ADRs | 27 |
| Engineering maturity | 7.75/10 |
| Repository health | 9/10 |

---

## Quality Gate Metrics

### Build Health

| Indicator | Target | Current |
|-----------|--------|---------|
| Build exit code | 0 | 0 (PASSING) |
| TypeScript errors | 0 | 0 |
| Compilation warnings | 0 | 0 |

Build health is measured at every sprint. A non-zero exit code is a sprint blocker.

### Lint Health

| Indicator | Target | Current |
|-----------|--------|---------|
| ESLint errors | 0 | 0 (CLEAN) |
| ESLint warnings | 0 | 0 |

Lint health is measured at every sprint.

### Test Health

| Indicator | Target | Current |
|-----------|--------|---------|
| Test failures | 0 | 0 (PASSING) |
| Tests (total) | Growing | ~197 |
| Use case coverage | 100% | 100% |
| Repository coverage | >0% | 0% (GAP-018) |
| E2E coverage | >0% | ~0% (skeleton) |

---

## Business Domain Coverage

Tracks the percentage of the full data model accessible via the API:

| Metric | Sprint 11.3 | Target (Sprint 16+) |
|--------|------------|---------------------|
| Schema models | 98 | 98 |
| Models with API | ~17 | ~80 |
| API coverage % | ~17% | ~82% |

### Coverage by Domain

| Domain | Schema | API | Tests |
|--------|--------|-----|-------|
| Auth / Sessions | 100% | 100% | 100% |
| Authorization | 100% | — | 100% |
| Customers | 100% | 100% | 100% |
| Suppliers | 100% | 100% | 100% |
| Garment Models | 100% | 100% | 100% |
| Colors & Sizes | 100% | 100% | 100% |
| Organization | 100% | 100% | 100% |
| Production Setup | 100% | 100% | 100% |
| Warehouses | 100% | 100% | 100% |
| Inventory (Transactions) | 100% | 100% | 100% |
| Inventory (Reservations) | 100% | 100% | 100% |
| Containers | 100% | 0% | 0% |
| Production Orders | 100% | 0% | 0% |
| WIP Tracking | 100% | 0% | 0% |
| Packing | 100% | 0% | 0% |
| CMO / Shipping | 100% | 0% | 0% |
| Employees / HR | 100% | 0% | 0% |
| Machines / OEE | 100% | 0% | 0% |
| Workflows | 100% | 0% | 0% |
| Supplementary | 100% | 0% | 0% |
| Investigations | 100% | 0% | 0% |

---

## Architecture Health Metrics

| Dimension | Indicator | Current |
|-----------|-----------|---------|
| Layer compliance | Controllers → UseCases → Services → Repos → Prisma | COMPLIANT |
| Global module usage | No re-imports of PrismaModule, LoggerModule, etc. | COMPLIANT |
| Guard stack | ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard | COMPLIANT |
| Filter order | PrismaExceptionFilter before AllExceptionsFilter | COMPLIANT |
| Response envelope | Unified { data, statusCode, timestamp, path } | COMPLIANT |
| BigInt serialization | serializeBigInts() applied in ResponseInterceptor | COMPLIANT |
| Circular imports | None | CLEAN |

---

## Technical Debt Metrics

| Debt Item | Severity | Source |
|-----------|----------|--------|
| No repository unit tests | MEDIUM | GAP-018 / RISK-009 |
| Permission cache has no invalidation | HIGH | GAP-008 / RISK-006 |
| Available qty race condition unresolved | MEDIUM | RISK-005 |
| Optimistic locking not yet verified as implemented | HIGH | GAP-015 |
| inventory_bags ledger update not verified | HIGH | GAP-013 |
| Physical bag status update not verified | HIGH | GAP-014 |
| WebSocket packages unused | LOW | RISK-013 |
| Empty module stubs (config, exceptions) | LOW | GAP-002 |
| CORS origin whitelist not configured | LOW | GAP-021 |

---

## Sprint Velocity Metrics

Tracks work delivered per sprint (historical):

| Sprint | Features | Use Cases | Tests Added | Status |
|--------|---------|-----------|------------|--------|
| Phase 2 Auth | 1 | ~5 | ~20 | COMPLETE |
| Phase 2 Authorization | 1 | ~5 | ~25 | COMPLETE |
| Phase 2 Business (6 modules) | 6 | ~30 | ~80 | COMPLETE |
| Phase 3 Sprint 0 | Schema hardening | 0 | 0 | COMPLETE |
| Sprint 11.1 | Inventory foundation | 0 | 0 | COMPLETE |
| Sprint 11.2 | Transaction engine | 8 use cases | 26 | COMPLETE |
| Sprint 11.3 | Reservation engine | 8 use cases | 29 | COMPLETE |

**Average use cases per sprint (Sprints 11.2-11.3):** 8  
**Average tests per sprint:** ~27

---

## Documentation Metrics

| Document Type | Count | Target |
|--------------|-------|--------|
| ADRs | 27 | All decisions documented |
| Architecture docs | 14 | Current |
| KEB documents | 22 | Current (FEOS 1.0) |
| FEOS documents | 21 | Current (FEOS 1.0) |
| Sprint reports | 2 | 1 per sprint |
| Release notes | 1 (v0.3.0) | 1 per minor release |

---

## Engineering Maturity Score

Scored at FEOS 1.0 baseline (from KEB-20):

| Dimension | Score | Assessment |
|-----------|-------|------------|
| Architecture | 9/10 | Clean, well-enforced |
| Code Quality | 8/10 | Lint clean, consistent patterns |
| Testing | 6/10 | Good use case coverage, no repo/E2E tests |
| Documentation | 8/10 | Extensive ADRs and architecture docs |
| Security | 7/10 | Auth/AuthZ solid, cache gap open |
| Database Design | 9/10 | 98 well-modeled tables |
| Developer Experience | 7/10 | Manual migration workflow is friction |
| API Design | 8/10 | RESTful, versioned, Swagger-documented |

**Overall Engineering Maturity: 7.75/10 (HIGH)**

---

## Metric Trends (Expected)

As future sprints complete, the following metrics should trend in these directions:

| Metric | Expected Trend | Reason |
|--------|---------------|--------|
| Total tests | ↑ | New modules add use case tests |
| Schema API coverage % | ↑ | New modules expose more models |
| Technical debt count | ↓ | Known gaps resolved over time |
| Engineering maturity | ↑ | Testing and security improvements |
| Repository coverage % | ↑ | Repository tests added |
| Documentation count | ↑ | ADRs and sprint reports accumulate |

Any metric trending opposite to expectations is a signal for architect review.
