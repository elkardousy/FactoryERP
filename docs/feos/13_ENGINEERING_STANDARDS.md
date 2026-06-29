# 13 — Engineering Standards

**Document:** FEOS-13  
**Category:** Standards  
**Authority:** MANDATORY (performance, reliability) / RECOMMENDED (scalability, maintainability)  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-07 (Code Governance), FEOS-08 (Test Governance), FEOS-17 (Engineering Metrics)  
**Related KEB:** KEB-01 (Technology Stack), KEB-20 (Engineering Baseline)

---

## Purpose

This document defines the engineering quality standards for FactoryERP across performance, reliability, maintainability, scalability, observability, documentation, and code quality dimensions.

## Scope

All source code, database queries, API endpoints, and operational configuration in FactoryERP.

## Audience

Engineers and AI agents producing or reviewing FactoryERP code.

---

## Performance Standards

### API Response Time

| Endpoint Category | Target | Maximum |
|-------------------|--------|---------|
| Simple reads (single entity) | < 100ms | 500ms |
| List queries (paginated) | < 200ms | 1000ms |
| Write operations | < 200ms | 1000ms |
| Complex queries (aggregates) | < 500ms | 2000ms |
| Reservation creation (transaction) | < 300ms | 1000ms |

These targets apply to warm-path requests with a properly indexed database. Cold-start latency is excluded.

### Database Query Standards

1. **Index compliance:** All WHERE clauses filtering high-cardinality columns must use indexed columns. Verify with `EXPLAIN ANALYZE` when introducing new filter patterns.
2. **Pagination required:** All list endpoints that return variable numbers of records must use `PaginationDto` (`skip`, `take`). Maximum `take` is 100 unless explicitly documented.
3. **No SELECT *:** Prisma `select` must specify only the fields needed when fetching large records. Do not use `findMany()` without a field selection when the model has heavy JSON payload fields.
4. **N+1 prohibition:** Repository methods must use Prisma `include` or `select` to fetch relations in a single query. Never call a repository method inside a loop.

### Rate Limiting

Global rate limit: 60 requests per 60 seconds per IP. This is enforced by `ThrottlerGuard` and is non-negotiable. Endpoints that naturally receive higher traffic may require route-level configuration with architect approval.

---

## Reliability Standards

### Error Handling

1. All thrown exceptions must be NestJS HTTP exceptions from `@nestjs/common`.
2. Unexpected errors are caught by `AllExceptionsFilter` — do not suppress them.
3. Prisma errors (duplicate key, not found, foreign key) are mapped by `PrismaExceptionFilter`.
4. No HTTP 500 may be the intended response — if a business rule is violated, throw the appropriate 4xx.
5. Catch blocks that re-throw must log the error first (with context).

### Transaction Integrity

All multi-record atomic operations must use `executeInTransaction()`. A sequence of Prisma calls outside a transaction is not atomic and is a reliability risk. The TRANSFER transaction (RELEASE + RECEIVING) is the canonical example of required transaction use.

### Availability

The application must be deployable at the `main` branch HEAD at all times. Breaking changes may not be committed without a corresponding fix in the same commit.

---

## Maintainability Standards

### Code Duplication

Duplication of business logic across use cases is prohibited. If two use cases share significant business logic, the shared logic belongs in a service.

Duplication of type definitions is prohibited. If a type is used in multiple files, it must be defined in one place and imported.

### File Size

| File Type | Recommended Max Lines | Hard Max |
|-----------|----------------------|---------|
| Controller | 100 lines | 200 lines |
| Use case | 50 lines | 100 lines |
| Repository | 100 lines | 200 lines |
| Service (validator/mapper/factory) | 75 lines | 150 lines |
| Module file | 30 lines | 60 lines |
| Spec file | 300 lines | 500 lines |

If a file exceeds the hard max, it must be split. The Inventory controller at 406 lines is an acknowledged exception — it contains 16 endpoints and is within the spirit of the rule.

### Dependency Injection

All injectable classes must receive dependencies via constructor injection. Property injection is not permitted.

### No Dead Code

Unused imports, unused variables, and unreachable code are forbidden. ESLint catches most of these. Any `// TODO` comment must have a linked issue or sprint reference.

---

## Scalability Standards

### Module Independence

Modules must remain independently testable. A module's unit tests must not require other feature modules to be loaded.

### Repository Abstraction

Repositories must abstract the data access technology. If Prisma is ever replaced, only repository files should need to change. Use cases and services must not contain Prisma-specific types or method names.

### Horizontal Scaling Readiness

The application must be stateless at the application layer. The only stateful component is the in-memory permission cache (`MemoryPermissionCache`), which is a known gap (RISK-006 in KEB-11). Before production, this must be replaced with a distributed cache (Redis or database-backed).

---

## Observability Standards

### Structured Logging

All logs must be structured (key-value pairs), produced by `LoggerService` using the pino transport. No plain-text or multi-line log entries in production.

### Log Levels

| Level | Usage |
|-------|-------|
| `info` | Business operation completed successfully |
| `warn` | Recoverable issue, unexpected but handled condition |
| `error` | Unexpected failure, caught exception |
| `debug` | Diagnostic, development-only (suppressed in production) |

### Correlation IDs

`CorrelationIdMiddleware` attaches a correlation ID to every request. All log entries for a request must include this correlation ID. Do not create log entries outside request context without noting the lack of correlation ID.

### Health Checks

`DatabaseHealthService` provides database connectivity health checks. This endpoint must remain functional at all times and must not be protected by `JwtAuthGuard`.

---

## Documentation Standards

### Required Documentation per Sprint

| Document Type | Required | Location |
|--------------|---------|---------|
| ADR (for architectural decisions) | Yes | `docs/architecture/adr/` |
| Sprint report | Yes | `docs/sprint-reports/` |
| Swagger annotations | Yes | Source code decorators |
| KEB update | Yes (if applicable) | `docs/knowledge/` |
| FEOS update | No (only for governance changes) | `docs/feos/` |

### ADR Completeness

ADRs must contain:
- Context (why the decision was needed)
- Decision (what was decided)
- Consequences (what trade-offs were accepted)
- Status (Accepted / Superseded)

An ADR that is incomplete or vague is not accepted.

### Code Comments

Code comments are not required and generally not desired. Comments are only appropriate when:
- The WHY is non-obvious (a hidden constraint, a workaround for a specific bug, a subtle invariant).
- The behavior would surprise a future reader.
- A mathematical formula or algorithm requires explanation.

Comments explaining WHAT code does are redundant and must not be added.

---

## Code Quality Standards

### TypeScript Strictness

| Setting | Value | Implication |
|---------|-------|-------------|
| `strictNullChecks` | `true` | All optional values must be checked before use |
| `noImplicitAny` | `false` | `any` is allowed but should be avoided |
| `strictBindCallApply` | `false` | Relaxed bind/call/apply checking |
| `isolatedModules` | `true` | Type-only re-exports must use `export type` |

### ESLint Rules (Enforced)

The ESLint flat config at `eslint.config.mjs` enforces:
- `@typescript-eslint/no-explicit-any` — no `any` type
- `no-console` — no `console.*` in production code
- NestJS-specific rules from `@nestjs/eslint-plugin`

Violations fail the lint gate.

### Prettier Formatting

All files formatted with `npm run format` (prettier). The formatter must be run before committing. Unformatted code is a lint gate failure.

---

## Compliance Rules

### Rule E-001 — No N+1 Queries

**Classification:** MANDATORY  
**Statement:** Repository methods must not be called inside loops. Use Prisma `include`, `select`, or `findMany` with `where` conditions to fetch related data in a single query.  
**Violation Impact:** Performance degradation proportional to result set size.  
**Risk:** Timeout failures, database overload.  
**Recovery:** Rewrite the query using `include` or a `findMany` with `whereIn`.  
**Approval Required:** None.

### Rule E-002 — Pagination on List Endpoints

**Classification:** MANDATORY  
**Statement:** All list endpoints must accept `PaginationDto` (skip/take) and must not return unbounded result sets.  
**Violation Impact:** Memory exhaustion on large datasets.  
**Risk:** Service outage.  
**Recovery:** Add pagination to the endpoint.  
**Approval Required:** None.

### Rule E-003 — Structured Logging

**Classification:** MANDATORY  
**Statement:** All log entries must be produced via `LoggerService` with structured arguments. No `console.*` in production code.  
**Violation Impact:** Unstructured logs, lint gate failure.  
**Risk:** Lost operational context.  
**Recovery:** Replace `console.*` with `this.logger.<level>()`.  
**Approval Required:** None.

### Rule E-004 — No Dead Code

**Classification:** MANDATORY  
**Statement:** Unused imports, unused variables, and unreachable code are forbidden. ESLint enforces this automatically.  
**Violation Impact:** Lint gate failure.  
**Risk:** Code rot, maintenance burden.  
**Recovery:** Remove unused code.  
**Approval Required:** None.
