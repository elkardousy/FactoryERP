# 00 — Repository Inventory

**Generated:** 2026-06-28  
**Commit:** 5a5e3d6 (Sprint 11.3 — Physical Bag Reservation Engine)

---

## Root Directory Structure

```
.
├── .ai/                        # AI Engineering Operating System (EOS v1.0)
│   ├── AI_SESSION/
│   ├── CHECKLISTS/
│   ├── PLAYBOOKS/
│   ├── QUALITY_GATES/
│   ├── RELEASE_PROMPTS/
│   ├── REVIEW_PROMPTS/
│   ├── SPRINT_PROMPTS/
│   └── TEMPLATES/
├── .claude/                    # Claude Code configuration
├── docker/                     # Docker configuration (not yet active)
├── docs/                       # Architecture documentation
│   ├── adr/                    # Legacy ADR directory (5 files)
│   ├── api/                    # API documentation
│   ├── architecture/           # Current architecture documents (26+ files)
│   │   └── adr/                # ADR-000 to ADR-026 (27 ADRs)
│   ├── checkpoints/            # Sprint checkpoint snapshots
│   ├── decisions/              # Technical debt reports
│   ├── knowledge/              # THIS DIRECTORY — KEB output
│   ├── releases/               # Release notes
│   ├── reviews/                # Readiness reviews
│   └── sprint-reports/         # Sprint-level reports
├── logs/                       # Application log output directory
├── prisma/
│   ├── migrations/
│   │   ├── 20260627000000_initial_schema/migration.sql
│   │   └── 20260627000001_inventory_schema_hardening/migration.sql
│   ├── migration_lock.toml
│   └── schema.prisma           # 2229 lines, 98 models, 32 enums
├── scripts/                    # Utility scripts directory
├── src/                        # Application source (NestJS)
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/                 # Shared DTOs and interfaces
│   ├── core/                   # Infrastructure (global modules)
│   └── modules/                # Business domain modules
├── temp/                       # Temporary file storage
├── test/                       # E2E test directory
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
└── uploads/                    # File upload storage directory
```

---

## Root-Level Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (not committed) |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore rules |
| `.prettierrc` | Prettier configuration |
| `CLAUDE.md` | Claude Code project instructions |
| `README.md` | Project readme |
| `README_ARCHITECTURE.md` | Architecture readme |
| `architecture-tree.txt` | Legacy folder structure snapshot |
| `eslint.config.mjs` | ESLint flat config (TypeScript + Prettier) |
| `nest-cli.json` | NestJS CLI config (`deleteOutDir: true`) |
| `package.json` | npm manifest |
| `package-lock.json` | Lockfile |
| `prisma.config.ts` | Prisma config — skips .env loading (CRITICAL) |
| `tsconfig.json` | TypeScript compiler options |
| `tsconfig.build.json` | TypeScript build overrides |

---

## Source Module Directory Inventory

### Core Infrastructure (`src/core/`)

| Directory | Contents |
|-----------|---------|
| `audit/` | AuditService, AuditRepository, AuditModule |
| `config/` | app/database/jwt/logger config factories, env validation, swagger |
| `constants/` | auth.constants.ts, system-roles.constants.ts |
| `database/health/` | DatabaseHealthService |
| `database/migrations/` | Migration utilities |
| `database/prisma/` | PrismaService, PrismaModule, PrismaExceptionFilter |
| `database/repositories/base/` | BaseRepository abstract class |
| `database/seed/` | Seed data utilities |
| `database/transactions/` | TransactionService |
| `document-numbering/` | DocumentNumberingService, Repository, Module |
| `exceptions/filters/` | AllExceptionsFilter, PrismaExceptionFilter |
| `interceptors/` | ResponseInterceptor (with BigInt serialization) |
| `interfaces/` | JwtConfigInterface |
| `logger/` | LoggerService, LoggerModule, LoggerInterceptor |
| `middleware/` | CorrelationIdMiddleware |
| `pipes/` | GlobalValidationPipe |
| `responses/` | ErrorResponse, ApiError, SuccessResponse |
| `tokens/` | DI token constants |
| `types/` | Shared TypeScript type definitions |
| `utils/` | bigint-serializer.ts |

### Business Domain Modules (`src/modules/`)

| Module | Controller(s) | Status |
|--------|--------------|--------|
| `auth/` | auth.controller.ts | Complete |
| `authorization/` | (guard-only, no controller) | Complete |
| `customers/` | customers.controller.ts | Complete |
| `garment-models/` | models.controller.ts, model-parts.controller.ts, model-colors-sizes.controller.ts | Complete |
| `inventory/` | inventory.controller.ts | Complete (Sprint 11.1–11.3) |
| `measurements/` | colors.controller.ts, sizes.controller.ts | Complete |
| `organization/` | departments.controller.ts, working-shifts.controller.ts | Complete |
| `production-setup/` | production-lines.controller.ts, production-stages.controller.ts | Complete |
| `suppliers/` | suppliers.controller.ts | Complete |
| `warehouses/` | warehouses.controller.ts | Complete |

---

## Test Files Inventory

| Spec File | Module |
|-----------|--------|
| `src/modules/auth/services/password.service.spec.ts` | Auth |
| `src/modules/auth/strategies/jwt.strategy.spec.ts` | Auth |
| `src/modules/auth/use-cases/login/login.use-case.spec.ts` | Auth |
| `src/modules/auth/services/token.service.spec.ts` | Auth |
| `src/modules/authorization/cache/memory-permission-cache.spec.ts` | Authorization |
| `src/modules/authorization/guards/roles.guard.spec.ts` | Authorization |
| `src/modules/authorization/guards/screen-permission.guard.spec.ts` | Authorization |
| `src/modules/authorization/services/authorization.service.spec.ts` | Authorization |
| `src/modules/authorization/services/permission-resolver.service.spec.ts` | Authorization |
| `src/modules/customers/use-cases/customers.use-cases.spec.ts` | Customers |
| `src/modules/garment-models/use-cases/models.use-cases.spec.ts` | Garment Models |
| `src/modules/measurements/use-cases/colors/colors.use-cases.spec.ts` | Measurements |
| `src/modules/organization/use-cases/departments/departments.use-cases.spec.ts` | Organization |
| `src/modules/organization/use-cases/working-shifts/working-shifts.use-cases.spec.ts` | Organization |
| `src/modules/production-setup/use-cases/production-lines/production-lines.use-cases.spec.ts` | Production Setup |
| `src/modules/suppliers/use-cases/suppliers.use-cases.spec.ts` | Suppliers |
| `src/modules/warehouses/use-cases/warehouses.use-cases.spec.ts` | Warehouses |
| `src/modules/inventory/use-cases/inventory-transactions.use-cases.spec.ts` | Inventory |
| `src/modules/inventory/use-cases/reservations.use-cases.spec.ts` | Inventory |
| `src/core/document-numbering/document-numbering.service.spec.ts` | Core |
| `src/core/interceptors/response.interceptor.spec.ts` | Core |
| `src/common/interfaces/paginated-result.spec.ts` | Common |

**Total spec files: 22**

---

## Documentation Files Inventory

### docs/architecture/adr/ (27 ADRs)

ADR-000 through ADR-026, all status: Accepted.  
See [10_ENGINEERING_DECISIONS.md](10_ENGINEERING_DECISIONS.md) for full list.

### docs/architecture/ (key files)

- `ARCHITECTURE_PRINCIPLES.md` — 14 governing principles
- `ARCHITECTURE_SUMMARY.md` — one-page overview
- `ARCHITECTURE_TIMELINE.md` — evolution history
- `CODING_STANDARDS.md` — code style rules
- `CONCURRENCY_STRATEGY.md` — optimistic locking strategy
- `DEPENDENCY_RULES.md` — import/dependency constraints
- `INVENTORY_ARCHITECTURE.md` — inventory module design
- `INVENTORY_DOMAIN_MODEL.md` — inventory entity model
- `INVENTORY_EVENT_FLOW.md` — transaction event flows
- `PERFORMANCE_TARGETS.md` — performance SLOs
- `REPOSITORY_RULES.md` — repository pattern rules
- `SPRINT11_CONTRACT.md` — Sprint 11 gate conditions
- `TECHNOLOGY_DECISIONS.md` — tech stack rationale
- `TRANSACTION_BOUNDARIES.md` — DB transaction design
