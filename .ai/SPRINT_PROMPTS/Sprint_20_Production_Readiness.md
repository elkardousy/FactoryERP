# Sprint 20 — Production Readiness

**Version target:** v1.0.0
**Prerequisite:** All Sprints 11–19 complete

---

## Objectives

Prepare FactoryERP for production deployment. This sprint adds no ERP features. It delivers: Docker containerization, CI/CD pipeline, Redis integration (session cache + permission cache), E2E test suite, performance testing, security audit, and monitoring configuration.

---

## Scope

### No new ERP modules — infrastructure only

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| `Dockerfile` | Multi-stage build: build stage + production stage |
| `docker-compose.yml` | Local dev: app + postgres + redis |
| `docker-compose.prod.yml` | Production: app + nginx reverse proxy |
| `.github/workflows/ci.yml` | GitHub Actions CI: lint + build + test |
| `.github/workflows/release.yml` | GitHub Actions release: tag triggers GitHub release |
| `RedisPermissionCache` | `IPermissionCache` implementation using Redis |
| `RedisSessionCache` | Optional session validation cache |
| `test/e2e/` | E2E tests for all major API flows |
| `k6/` | Load test scripts for inventory + production endpoints |
| Prometheus metrics endpoint | `/metrics` for monitoring |
| Health check endpoint | `GET /health` with DB + Redis connectivity check |

---

## Architecture Constraints

- `RedisPermissionCache` must implement the existing `IPermissionCache` interface — one provider change, no application code changes
- Docker image must be non-root, minimal (Alpine-based), reproducible
- CI must run on every push to `main`; release pipeline runs on tag push
- E2E tests run against a real PostgreSQL + Redis instance (Docker Compose in CI)
- `prisma migrate deploy` (not `migrate dev`) in Docker entrypoint
- Health check must return 200 only when DB and Redis are reachable

---

## Files Expected to Change / Create

```
Dockerfile
docker-compose.yml
docker-compose.prod.yml
.github/workflows/ci.yml
.github/workflows/release.yml
src/core/cache/redis-permission-cache.ts
src/core/cache/redis-session-cache.ts
src/app.module.ts                (register Redis cache conditionally by config)
test/e2e/
  auth.e2e-spec.ts
  customers.e2e-spec.ts
  inventory.e2e-spec.ts
  production.e2e-spec.ts
k6/
  inventory-load-test.js
  production-load-test.js
src/core/health/app.health.ts
```

---

## Testing Requirements

- E2E test suite covers: login → CMO creation → production order → inventory consumption → shipment
- All existing 142+ unit tests must pass
- Load tests demonstrate: 100 concurrent users, < 500ms p95 response time on read endpoints
- `RedisPermissionCache` must have unit tests verifying the `IPermissionCache` contract

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0, `npm run build` clean, all unit tests passing
- [ ] `docker-compose up` starts a working local environment
- [ ] `docker-compose -f docker-compose.prod.yml up` starts a production-grade stack
- [ ] CI pipeline runs on every push and fails on lint/build/test failure
- [ ] E2E tests pass in CI Docker environment
- [ ] Health endpoint returns 200 with healthy DB + Redis
- [ ] Load test: p95 < 500ms at 100 concurrent users
- [ ] Security audit: no critical or high findings
- [ ] ADR-035 written (Production Infrastructure)
- [ ] ADR-036 written (Redis Integration)

---

## Exit Criteria

Sprint 20 complete when all acceptance criteria checked, quality gates pass, `v1.0.0` released.

**v1.0.0 is the first production release of FactoryERP.**
