# 01 — Repository Audit
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Authoritative snapshot of repository infrastructure state at Phase 4.5 entry point |
| **Scope** | All non-source-code repository artifacts: tooling, configuration, CI, Docker, VSCode |
| **Audience** | Infrastructure engineers, DevOps lead, Phase 4.5 implementation team |
| **Status** | COMPLETE — Audited 2026-07-01 |
| **Owner** | Principal DevOps Engineer |
| **Review Cycle** | Once (pre-implementation snapshot) — do not update in place |
| **Version** | 1.0 |
| **Dependencies** | Repository at commit d8b5b4b (Production Module Official Closure) |
| **Inputs** | `package.json`, `tsconfig.json`, `nest-cli.json`, `.gitignore`, `prisma/schema.prisma`, filesystem scan |
| **Outputs** | Gap analysis, risk register, readiness scores |

---

## 1. Repository Structure

```
FactoryERP/
  dist/                          # Build output (gitignored)
  docs/
    execution/
      platform/                  # Phase 4.5 framework (this directory)
      production/                # Phase 4 execution artifacts
    feos/                        # FEOS — 21 governance documents
    knowledge/                   # Knowledge Baseline — 8 documents
  node_modules/                  # Dependencies (gitignored)
  prisma/
    migrations/                  # SQL migration files
    schema.prisma                # Prisma schema (source of truth)
  src/
    core/                        # Shared infrastructure
    common/                      # Shared DTOs and interfaces
    modules/                     # Feature modules (auth, inventory, production, …)
    app.module.ts
    main.ts
  test/                          # e2e test configuration
  .gitignore
  nest-cli.json
  package.json
  package-lock.json
  tsconfig.json
  tsconfig.build.json            # (if present)
  prisma.config.ts               # Skips .env loading — DATABASE_URL required explicitly
```

**Note:** `.vscode/`, `.devcontainer/`, `.github/`, `.nvmrc`, `.editorconfig`, `.gitattributes`, `docker-compose.dev.yml`, and `scripts/` do NOT currently exist.

---

## 2. Current Tooling Inventory

### 2.1 Runtime

| Tool | Version | Source | Pinned |
|---|---|---|---|
| Node.js | 24.16.0 | Developer machine (Windows 11) | NO — no `.nvmrc`, no `engines` field |
| npm | 11.13.0 | Bundled with Node | NO |
| PostgreSQL | Unknown | Developer machine (local install) | NO — no Docker, no version lock |

### 2.2 Application Framework

| Tool | Version | Source |
|---|---|---|
| NestJS (`@nestjs/common`, `@nestjs/core`) | 11.0.1 | `package.json` |
| NestJS CLI (`@nestjs/cli`) | 11.0.0 | `package.json` devDependencies |
| NestJS Schematics | 11.0.0 | `package.json` devDependencies |
| Express platform | 11.0.1 (via `@nestjs/platform-express`) | `package.json` |
| Passport / passport-jwt | 0.7.0 / 4.0.1 | `package.json` |

### 2.3 ORM and Database

| Tool | Version | Source |
|---|---|---|
| Prisma Client (`@prisma/client`) | 6.16.2 | `package.json` |
| Prisma CLI (`prisma`) | 6.16.2 | `package.json` |
| Preview feature | `multiSchema` | `prisma/schema.prisma` line 3 |
| Database schema | `factory` | All models use `@@schema("factory")` |
| Primary key type | `BigInt` | All models — serializes to string in JSON |

### 2.4 TypeScript

| Tool | Version | Source |
|---|---|---|
| TypeScript | 5.7.3 | `package.json` devDependencies |
| ts-node | 10.9.2 | `package.json` devDependencies |
| ts-jest | 29.2.5 | `package.json` devDependencies |
| tsconfig-paths | 4.2.0 | `package.json` devDependencies |

**Key tsconfig flags:**
- `target: ES2023`
- `module: nodenext`, `moduleResolution: nodenext`
- `isolatedModules: true`
- `strictNullChecks: true`
- `noImplicitAny: false`
- `emitDecoratorMetadata: true`, `experimentalDecorators: true`
- `incremental: true` (generates `tsconfig.tsbuildinfo`)

### 2.5 Testing

| Tool | Version | Source |
|---|---|---|
| Jest | 30.0.0 | `package.json` devDependencies |
| `@types/jest` | 30.0.0 | `package.json` devDependencies |
| Supertest | 7.0.0 | `package.json` devDependencies |
| Current test count | 482 tests | 42 spec files under `src/` |
| Test environment | `node` | `package.json` jest config |

### 2.6 Code Quality

| Tool | Version | Source |
|---|---|---|
| ESLint | 9.18.0 | `package.json` devDependencies |
| eslint-config-prettier | 10.0.1 | `package.json` devDependencies |
| typescript-eslint | 8.20.0 | `package.json` devDependencies |
| Prettier | 3.4.2 | `package.json` devDependencies |

### 2.7 Application Dependencies (Relevant to Cross-Platform)

| Package | Version | Cross-Platform Risk |
|---|---|---|
| `bcrypt` | 6.0.0 | CRITICAL — requires node-gyp native compilation; platform-specific binary |
| `@nestjs/platform-express` | 11.0.1 | Low — express is cross-platform |
| `pino` / `pino-pretty` | 10.3.1 / 13.1.3 | Low — pure JS |
| `helmet` | 8.2.0 | Low — pure JS |
| `compression` | 1.8.1 | Low — pure JS |

---

## 3. npm Scripts Inventory

| Script | Command | Cross-Platform Risk |
|---|---|---|
| `build` | `nest build` | LOW — NestJS CLI is cross-platform |
| `format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` | LOW — glob patterns work on all platforms |
| `start` | `nest start` | LOW |
| `start:dev` | `nest start --watch` | LOW |
| `start:debug` | `nest start --debug --watch` | LOW |
| `start:prod` | `node dist/main` | LOW |
| `lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | LOW — brace expansion handled by ESLint |
| `test` | `jest` | LOW |
| `test:watch` | `jest --watch` | LOW |
| `test:cov` | `jest --coverage` | LOW |
| `test:debug` | `node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand` | MEDIUM — path to jest binary may differ on Windows |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | LOW |

**Risk Detail — `test:debug`:** The reference to `node_modules/.bin/jest` uses a forward-slash path and relies on the Jest shim in `.bin/`. On Windows this resolves to `node_modules\.bin\jest.cmd`. This is handled correctly by Node's `node_modules/.bin` resolution when invoked via `npm run`, but would fail if called directly from a Windows shell. Mitigation: use `npx jest` in the debug launch configuration.

---

## 4. Docker State

| Item | State |
|---|---|
| `docker-compose.dev.yml` | ABSENT |
| `docker-compose.yml` | ABSENT |
| `Dockerfile` (project root) | ABSENT |
| `.devcontainer/` | ABSENT |
| Docker version | UNKNOWN (not enforced) |
| PostgreSQL in Docker | ABSENT |

**Impact:** Developers provision their own PostgreSQL instance. No version standardization. No isolation between developer environments. Database configuration drift is a known risk.

---

## 5. VSCode State

| Item | State |
|---|---|
| `.vscode/settings.json` | ABSENT |
| `.vscode/tasks.json` | ABSENT |
| `.vscode/launch.json` | ABSENT |
| `.vscode/extensions.json` | ABSENT |
| `.gitignore` handling | `.vscode/*` is gitignored; individual files are whitelisted via `!.vscode/settings.json` etc. |

**Impact:** No shared editor configuration. Developers may have inconsistent formatter, linter, or language service settings. Debug profiles must be manually recreated per machine.

---

## 6. GitHub Actions State

| Item | State |
|---|---|
| `.github/` directory | ABSENT |
| `.github/workflows/` | ABSENT |
| CI pipeline | NONE |
| PR validation | NONE |
| Build matrix | NONE |

**Impact:** No automated quality gates on pull requests or main branch merges. Lint, test, and build validation are manual. Cross-platform CI validation does not exist.

---

## 7. Line-Ending and Encoding State

| Item | State |
|---|---|
| `.gitattributes` | ABSENT |
| `.editorconfig` | ABSENT (at project root; only in `node_modules/`) |
| Git `core.autocrlf` setting | DEVELOPER-DEPENDENT (not enforced) |
| Observed line endings in committed `.ts` files | LF (current developer on Windows with `autocrlf=input` or equivalent) |
| Risk of CRLF contamination | HIGH — no enforcement mechanism |

**Impact:** A developer with `core.autocrlf=true` (Windows default) will commit CRLF line endings. This breaks: Prisma SQL migrations on Linux CI, shell scripts inside DevContainer, `prisma.config.ts` loading.

---

## 8. Current Risks

| Risk ID | Risk | Severity | Likelihood | Mitigation in Phase 4.5 |
|---|---|---|---|---|
| R-01 | Node.js version drift between developers | HIGH | HIGH | `.nvmrc` + `engines` field |
| R-02 | CRLF contamination in `.ts` and `.sql` files | HIGH | HIGH | `.gitattributes` |
| R-03 | `bcrypt` native binary fails on clean Ubuntu/macOS | HIGH | HIGH | DevContainer pre-builds binary |
| R-04 | PostgreSQL version drift (no Docker) | MEDIUM | HIGH | `docker-compose.dev.yml` pinned image |
| R-05 | `DATABASE_URL` missing for Prisma CLI in CI | HIGH | CERTAIN | CI workflow explicit env var |
| R-06 | No CI — broken code can reach `main` | HIGH | MEDIUM | GitHub Actions pipeline |
| R-07 | No VSCode configuration — onboarding friction | MEDIUM | HIGH | `.vscode/` workspace files |
| R-08 | `test:debug` npm script fails on Windows directly | LOW | LOW | Documented in debug launch profile |
| R-09 | `node_modules/.bin/` path in test:debug not portable | LOW | MEDIUM | Replaced with `npx jest` in launch.json |
| R-10 | `tsconfig.tsbuildinfo` accumulates between platforms | LOW | MEDIUM | `.gitignore` enforcement; CI always clean build |

---

## 9. Platform Dependencies

The application currently depends on the following platform-level resources, all of which must be documented and provided by the Phase 4.5 infrastructure:

| Dependency | Required By | Provided By (Phase 4.5) |
|---|---|---|
| PostgreSQL 16.x | Prisma, application boot | `docker-compose.dev.yml` |
| Node.js 24 LTS | Application runtime | `.nvmrc`, DevContainer |
| `python3` / build tools | `bcrypt` native compilation | DevContainer base image |
| `git` | Development workflow | DevContainer base image |
| `openssl` | JWT secret generation, bcrypt | DevContainer base image |

---

## 10. Cross-Platform Blockers (Current State)

The following items will prevent the application from running correctly on a fresh Linux or macOS machine without manual intervention:

| Blocker ID | Description | Severity | Phase 4.5 Resolution |
|---|---|---|---|
| CPB-001 | No `.nvmrc` — Node version undefined | CRITICAL | F-P07: `.nvmrc` creation |
| CPB-002 | `bcrypt` native binary not portable | CRITICAL | F-P01: DevContainer pre-installs build tools |
| CPB-003 | No Docker Compose — PostgreSQL not reproducible | CRITICAL | F-P02: `docker-compose.dev.yml` |
| CPB-004 | No `.gitattributes` — CRLF contamination risk | HIGH | F-P05: `.gitattributes` |
| CPB-005 | No CI matrix — Linux/macOS untested | HIGH | F-P04: GitHub Actions |
| CPB-006 | `DATABASE_URL` not documented for CI | HIGH | F-P04: CI workflow env configuration |
| CPB-007 | No DevContainer — environment setup manual | MEDIUM | F-P01: `.devcontainer/` |
| CPB-008 | No onboarding documentation | MEDIUM | F-P09: `README.md` section |

---

## 11. Readiness Score

| Category | Score | Max | Notes |
|---|---|---|---|
| Application Code | 10 | 10 | Production module complete; all tests pass |
| Node Version Governance | 0 | 10 | No `.nvmrc`; no `engines` field |
| Line Ending Governance | 2 | 10 | No `.gitattributes`; CRLF risk present |
| Docker / PostgreSQL | 0 | 10 | No Docker files |
| DevContainer | 0 | 10 | Absent |
| CI/CD | 0 | 10 | No GitHub Actions |
| VSCode Configuration | 1 | 10 | Gitignore allows files but none committed |
| Onboarding Documentation | 1 | 10 | CLAUDE.md covers Prisma commands; no onboarding |
| Cross-Platform Testing | 0 | 10 | Tested on Windows only |
| Secrets Management | 3 | 10 | `.env` gitignored; no policy document |
| **TOTAL** | **17** | **100** | **Pre-Phase 4.5 baseline** |

**Target score after Phase 4.5:** ≥ 85 / 100

---

## 12. Compliance

This audit was conducted against:
- FEOS `01_ENGINEERING_CONSTITUTION.md` (engineering principles)
- FEOS `14_OPERATIONAL_PLAYBOOK.md` (operational state assessment)
- Repository commit `d8b5b4b` (MMCC closure)

---

## 13. Validation

This document is valid when:

- [ ] All tool versions match `package.json` at audit date
- [ ] Docker state accurately reflects filesystem (no Docker files found)
- [ ] Risk register is complete (all cross-platform blockers captured)
- [ ] Readiness scores are calibrated against the 10-point scale defined here
- [ ] No implementation recommendations are included (audit only — recommendations in 00)
