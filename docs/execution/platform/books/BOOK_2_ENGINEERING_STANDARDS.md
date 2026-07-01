# BOOK 2 — ENGINEERING STANDARDS
# FactoryERP Platform Engineering
# Permanent Engineering Standards Reference

| Field | Value |
|---|---|
| **Book** | Book 2 — Engineering Standards |
| **Series** | FactoryERP Platform Engineering Books |
| **Version** | 1.0 |
| **Status** | ACTIVE |
| **Classification** | Permanent Engineering Standards |
| **Authority Level** | Level 3 — Platform Master Implementation Contract |
| **Supersedes** | PMIC §12–§22 (standards consolidated and extended here) |
| **Created** | 2026-07-01 |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Annual; or on major platform phase transition |

---

# Chapter 1: Infrastructure Engineering Standards

## 1.1 Purpose

Book 2 is the permanent engineering standards reference for all Platform engineering work at FactoryERP. Where Book 1 establishes the governance framework — the principles, processes, stop conditions, and decision policy — Book 2 establishes the engineering standards: the specific, measurable, verifiable requirements that every Platform artifact must satisfy.

Standards in this Book are either MANDATORY or RECOMMENDED. MANDATORY standards are inviolable within their defined scope. A deviation from a MANDATORY standard requires an Engineering Decision Report approved at the appropriate authority level before the deviation is implemented. RECOMMENDED standards represent the preferred engineering approach; documented rationale is sufficient to permit a deviation.

## 1.2 Applicability

Book 2 applies to:

| Scope | Applicability |
|---|---|
| All Phase 4.5 features (F02–F10) | MANDATORY |
| All future Platform phases | MANDATORY (inherited by reference) |
| Platform Engineering Book amendments | MANDATORY (amendments must comply) |
| Engineering Decision Reports | MANDATORY (EDRs reference Book 2 when deviating from it) |

Book 2 does not apply to:

| Scope | Reason |
|---|---|
| Application source code (`src/`) | Application engineering domain |
| Prisma schema and migrations | Database engineering domain, governed by FEOS migration workflow |
| Test suites (`test/`) | Application engineering domain |
| Business logic or API design | Product engineering domain |

## 1.3 Engineering Objectives

The standards in this Book pursue the following measurable engineering objectives:

| Objective | Metric | Target |
|---|---|---|
| Reproducibility | Any developer reaches a running environment on any supported OS | < 15 minutes from clean checkout |
| Determinism | Same inputs produce same environment | CI green on all three OS targets |
| Quality | Defects caught before commit | 0 quality gate failures merged to `main` |
| Auditability | Every artifact traces to a standard | 100% of committed artifacts have a governing standard |
| Maintainability | Future engineer understands artifacts without guidance | Onboarding self-sufficiency via `README.md` |
| Maturity | Repository infrastructure maturity score | ≥ 97/100 post-Phase 4.5 |

## 1.4 Infrastructure Principles

The following principles govern every standard defined in this Book. They are not restated in each chapter; they apply universally.

| Principle | Standard | Classification |
|---|---|---|
| No credentials in committed files | Credentials in `.env` only; CI via secrets mechanism | MANDATORY |
| No application-layer modifications | `src/`, `prisma/`, `test/` are protected | MANDATORY |
| All artifacts cross-platform by design | POSIX + Windows + macOS from first commit | MANDATORY |
| All committed artifacts are UTF-8-NoBOM | Encoding enforcement via `.editorconfig` and CI | MANDATORY |
| All version references are pinned | No floating versions; no `latest` tags | MANDATORY |
| All artifacts are committed atomically | No partial-feature commits on `main` | MANDATORY |
| All artifacts are documented at commit time | No documentation debt | MANDATORY |

## 1.5 Quality Principles

| Principle | Standard | Classification |
|---|---|---|
| Quality gates run before every commit | All four gates; all must pass | MANDATORY |
| Gate sequence is fixed | build → lint → test → prisma validate | MANDATORY |
| No gate is skipped | No `--no-verify`; no selective execution | MANDATORY |
| CI is the authoritative cross-platform quality gate | Local gates are necessary but not sufficient | MANDATORY |
| Test count does not decrease during Platform phases | 482 minimum throughout Phase 4.5 | MANDATORY |

## 1.6 Architecture Compatibility

All Platform artifacts must be compatible with the established FactoryERP application architecture:

| Architecture Property | Compatibility Requirement |
|---|---|
| NestJS 11 Clean Architecture | Platform artifacts do not alter the Controller → Use Case → Service → Repository → Prisma layer contract |
| Prisma 6.16.2 multi-schema | Docker PostgreSQL uses port `5432`; database name `factory_erp`; schema `factory` |
| TypeScript `isolatedModules: true` | No Platform TypeScript files that violate `isolatedModules` |
| `forceConsistentCasingInFileNames: true` | All Platform file names use lowercase-kebab-case |
| Node.js `24.16.0` | All Platform environments use exactly this version |
| `DATABASE_URL` prefix required for Prisma CLI | All invocations of `prisma generate`, `prisma validate`, `prisma migrate` prefix `DATABASE_URL=...` |

## 1.7 Validation

Every chapter in Book 2 concludes with a validation section specifying how compliance with that chapter's standards is verified. Validation methods are:

| Validation Type | Description |
|---|---|
| AUTOMATED | Enforced by a quality gate, CI step, or toolchain check that runs without manual action |
| MANUAL | Requires a human actor to execute and record the verification |
| STRUCTURAL | Verifiable by inspecting the committed artifact without execution |
| PROCEDURAL | Verifiable by confirming the execution sequence followed the defined procedure |

---

# Chapter 2: Repository Standards

## 2.1 Repository Layout

The Phase 4.5 repository introduces the following top-level additions to the existing structure:

| Path | Feature | Classification |
|---|---|---|
| `.devcontainer/` | F06 | MANDATORY |
| `.github/workflows/` | F07 | MANDATORY |
| `.vscode/` | F09 | MANDATORY |
| `scripts/` | F05 | MANDATORY |
| `docs/execution/platform/books/` | Governance | MANDATORY |
| `.editorconfig` | F02 | MANDATORY |
| `.env.example` | F03 | MANDATORY |
| `.gitattributes` | F02 | MANDATORY |
| `.nvmrc` | F01 (COMPLETE) | MANDATORY |
| `docker-compose.dev.yml` | F04 | MANDATORY |

No Phase 4.5 feature creates any top-level directory, file, or path not listed in this table without an Engineering Decision Report approved at the architect level.

## 2.2 Folder Ownership

Each path in the repository has exactly one owning feature. A non-owner feature may read but not modify an owner's artifacts without an Engineering Decision.

| Path | Owning Feature | Modification Authority |
|---|---|---|
| `.devcontainer/` | F06 | F06 only |
| `.github/workflows/` | F07 | F07 only |
| `.vscode/` | F09 | F09 only |
| `scripts/` | F05 | F05 only |
| `docs/execution/platform/` | IEF / PMIC / Books | Documentation commits from any feature |
| `docs/execution/platform/reports/` | Each feature | Each feature's own `FXX_REPORT.md` |
| `.editorconfig` | F02 | F02 only |
| `.env.example` | F03 | F03 only |
| `.gitattributes` | F02 | F02 only |
| `.nvmrc` | F01 | F01 only (COMPLETE) |
| `docker-compose.dev.yml` | F04 | F04 only |

## 2.3 Naming Standards

### 2.3.1 File and Directory Names

| Artifact | Convention | Example |
|---|---|---|
| Infrastructure directories | lowercase-kebab-case | `.devcontainer/`, `scripts/` |
| Infrastructure YAML files | lowercase-kebab-case | `docker-compose.dev.yml`, `ci.yml` |
| Shell scripts | lowercase-kebab-case with extension | `setup.sh`, `doctor.ps1` |
| VSCode configuration files | lowercase | `settings.json`, `tasks.json` |
| Feature reports | uppercase with feature ID | `F01_REPORT.md`, `F10_REPORT.md` |
| Engineering Decision Reports | uppercase with feature ID | `ENGINEERING_DECISION_REPORT_F04.md` |
| Governance books | uppercase with number | `BOOK_1_ENGINEERING_GOVERNANCE.md` |

### 2.3.2 Commit Message Naming

| Commit Type | Format | Example |
|---|---|---|
| Feature implementation | `feat(platform/FXX): <description>` | `feat(platform/F02): repository hygiene` |
| Feature documentation | `docs(platform/FXX): <description>` | `docs(platform/F02): F02 completion report` |
| Governance documentation | `docs(platform): <description>` | `docs(platform): PMIC Part 3` |
| Stop condition fix | `fix(platform/FXX): <description>` | `fix(platform/F04): docker health check` |
| Engineering Decision | `docs(platform/FXX): engineering decision report` | `docs(platform/F04): ENGINEERING_DECISION_REPORT_F04` |

All commit messages comply with the Conventional Commits specification. Scope is `platform/FXX` for feature-specific commits and `platform` for cross-feature governance commits.

## 2.4 Protected Directories

The following paths are write-protected throughout all Platform phases. No Platform feature may create, modify, or delete any file under these paths.

| Protected Path | Authority | Violation Consequence |
|---|---|---|
| `src/` | FEOS + Application Architecture | SC-005 — Class B stop condition |
| `prisma/` | FEOS + Migration Workflow | SC-030 — Class C stop condition |
| `test/` | FEOS + Application Architecture | SC-005 — Class B stop condition |
| `docs/feos/` | FEOS (supreme authority) | SC-005 + SC-009 — Class C stop condition |
| `docs/knowledge/` | KEB update policy | SC-005 — KEB updated at phase closure only |

## 2.5 Dependency Rules

### 2.5.1 npm Dependencies

**MANDATORY:** Phase 4.5 adds zero npm production or development dependencies. All Phase 4.5 features achieve their purpose through configuration files, shell scripts, YAML, and JSON — none of which require new npm packages.

Any requirement for an npm package addition triggers SC-007 and requires an Engineering Decision Report with architect approval.

### 2.5.2 Tool Dependencies

**MANDATORY:** Phase 4.5 requires the following tools to be present in the developer environment. These are verified by the doctor script (F05) and are not installed by any Phase 4.5 script.

| Tool | Minimum Version | Installed By |
|---|---|---|
| Git | 2.40.0 | Developer |
| Node.js | 24.16.0 (exact) | Developer via nvm |
| npm | 11.0.0 | Bundled with Node.js 24 |
| Docker | 24.0.0 | Developer |
| Docker Compose (v2) | 2.20.0 | Bundled with Docker Desktop |

## 2.6 Versioning

Every versioned artifact committed during Phase 4.5 uses exact version pinning:

| Artifact | Pinning Method | Permitted Range |
|---|---|---|
| Node.js | `.nvmrc`: exact version string | `24.16.0` only (no range in `.nvmrc`) |
| Node.js engine | `package.json` `engines.node` | `>=24.0.0 <25.0.0` (semver range) |
| npm engine | `package.json` `engines.npm` | `>=11.0.0` (semver range) |
| Docker images | `image: name:major.minor.patch` | Exact tag; no floating tags; no `latest` |
| GitHub Actions | `uses: action@vN` | Major version tag (e.g., `@v4`) |
| npm packages | `package-lock.json` | Managed by lock file; no direct changes in Phase 4.5 |
| Prisma CLI | `package.json` existing value | `6.16.2`; no change in Phase 4.5 |

**MANDATORY:** Version changes to any artifact beyond F01 (already COMPLETE) require an Engineering Decision Report.

## 2.7 Repository Hygiene

**MANDATORY:** At every commit boundary, the repository satisfies the following hygiene criteria:

| Criterion | Verification Method | Classification |
|---|---|---|
| No untracked non-gitignored files | `git status` shows clean tree | MANDATORY |
| No staged but uncommitted changes | `git diff --staged` is empty | MANDATORY |
| No merge conflict markers | `git grep -r "<<<<<<" -- .` returns empty | MANDATORY |
| No debug artifacts committed | `git log --name-only -1` inspection | MANDATORY |
| All committed files are UTF-8 | Encoding check (F02 + F08) | MANDATORY |
| `.gitignore` covers all generated paths | `git status` does not surface `dist/`, `coverage/`, `node_modules/` | MANDATORY |
| No binary files in committed set (unless explicitly governed) | `git diff --staged --stat` inspection | MANDATORY |

**RECOMMENDED:** Pre-commit hygiene check using the doctor script before every feature commit to catch environment inconsistencies.

## 2.8 Repository Health

The following metrics define repository health throughout Phase 4.5:

| Metric | Required State | Classification |
|---|---|---|
| Build | PASS on every commit | MANDATORY |
| Lint | PASS (0 errors) on every commit | MANDATORY |
| Tests | 482/482 PASS on every commit | MANDATORY |
| Prisma validate | PASS on every commit | MANDATORY |
| Git history | Linear; no orphaned commits; no merge commits on `main` | MANDATORY |
| Commit density | Max 3 commits per feature (implementation + documentation + exception) | MANDATORY |
| Protected paths | Unmodified throughout Phase 4.5 | MANDATORY |
| Secrets | No credentials in any committed file | MANDATORY |

## 2.9 Repository Maturity Levels

Repository maturity is assessed across ten dimensions. Each dimension is scored 0–10. The total score (0–100) represents overall maturity.

| Dimension | Score 0 | Score 5 | Score 10 |
|---|---|---|---|
| Node version governance | No `.nvmrc` | `.nvmrc` exists; engines field absent | `.nvmrc` + engines + CI enforcement |
| Line-ending governance | No `.gitattributes` | `.gitattributes` present; incomplete | `.gitattributes` complete; CI verified |
| Environment standardization | No `.env.example` | `.env.example` present; incomplete | Complete; all variables documented |
| Docker infrastructure | No Compose file | Compose present; no health checks | Full spec; health checks; named volumes |
| DevContainer | None | Basic `devcontainer.json` | Full workspace; extensions; port forwarding |
| CI/CD | No CI | CI on one OS | Matrix on 3 OS; quality gates; audit |
| Developer experience | No editor config | `.editorconfig` only | Full `.vscode/`; tasks; debug; formatting |
| Cross-platform testing | Untested | Tested on primary OS only | CI green on all 3 primary OS targets |
| Secrets management | No policy | `.env` gitignored | `.env.example`; CI secrets; DevContainer env |
| Onboarding documentation | No docs | Partial `README.md` | Verified onboarding; `< 15 min` end-to-end |

## 2.10 Validation

| Standard | Validation Type | Method |
|---|---|---|
| Repository layout | STRUCTURAL | Inspect directory tree against §2.1 |
| Folder ownership | PROCEDURAL | Review commit history per feature |
| Naming standards | STRUCTURAL | Inspect file and commit names |
| Protected paths | AUTOMATED | `git diff HEAD -- src/ prisma/ test/ docs/feos/` returns empty |
| Dependency rules | STRUCTURAL | `git diff HEAD -- package.json` shows no new dependencies |
| Version pinning | STRUCTURAL | Inspect each versioned artifact |
| Repository hygiene | AUTOMATED | `git status` clean; `git grep -r "<<<<<<" -- .` empty |
| Repository health | AUTOMATED | Four quality gates pass on HEAD |

---

# Chapter 3: Cross-Platform Standards

## 3.1 Supported Operating Systems

Phase 4.5 targets the following platforms in priority order:

| OS | Version | Architecture | Priority | Required for COMPLETE |
|---|---|---|---|---|
| Windows | 11 (build 22000+) | x64 | PRIMARY | Yes — CI required |
| Ubuntu | 24.04 LTS | x64 | PRIMARY | Yes — CI required |
| macOS | 14 Sonoma | arm64 | SECONDARY | Yes — CI required |
| Debian | 12 Bookworm | x64 | SECONDARY | Via DevContainer base image |
| Fedora | 40 | x64 | TERTIARY | Deferred — DEFER-P45-004 |

**MANDATORY:** Every MANDATORY infrastructure artifact must be verified functional on both PRIMARY platforms before the owning feature is declared COMPLETE. SECONDARY platform verification occurs in F08 (Cross-Platform Validation). TERTIARY platform verification is deferred.

## 3.2 Filesystem Compatibility

| Property | Windows (NTFS) | Linux (ext4) | macOS (APFS) | Adopted Standard |
|---|---|---|---|---|
| Case sensitivity | Case-insensitive | Case-sensitive | Case-insensitive | Case-sensitive enforced (`forceConsistentCasingInFileNames: true`) |
| Max path length | 260 chars (legacy) / 32,767 (long paths enabled) | 4,096 chars | 1,024 chars | All committed paths kept below 200 characters |
| Symlinks | Requires Developer Mode | Native | Native | Symlinks prohibited in committed paths |
| File locking | Mandatory (OS-level) | Advisory | Advisory | No file lock assumptions in scripts or configuration |
| Executable bit | Not applicable | Required for shell scripts | Required for shell scripts | Set via `chmod +x` in F05; F07 CI verifies |

## 3.3 Case Sensitivity

**MANDATORY:** All Phase 4.5 file names, directory names, and import paths use lowercase-kebab-case. CamelCase file names are not introduced by any Phase 4.5 feature.

**MANDATORY:** The existing TypeScript configuration property `forceConsistentCasingInFileNames: true` is not modified. All Phase 4.5 TypeScript references (if any) are consistent in casing with the files they reference.

**MANDATORY:** Docker service names, container names, volume names, and network names are lowercase. No uppercase characters appear in Docker Compose service definitions.

## 3.4 UTF-8 Requirements

**MANDATORY:** All text files created during Phase 4.5 are encoded as UTF-8 without BOM (UTF-8-NoBOM).

| Risk | Platform | Mitigation |
|---|---|---|
| UTF-16 LE default output | PowerShell 5.1 on Windows | All `Out-File` and `Set-Content` calls specify `-Encoding utf8` |
| UTF-8 with BOM | Some Windows editors | `.editorconfig` sets `charset = utf-8` (without BOM) |
| Mixed encoding in a single file | Any | F08 CI step verifies encoding on all governed file types |

**MANDATORY:** The `.editorconfig` file (F02) sets `charset = utf-8` for all file types. The VSCode workspace settings (F09) set `"files.encoding": "utf8"`.

## 3.5 Path Rules

**MANDATORY:** Forward slashes (`/`) are used in all committed configuration files, YAML, JSON, and shell scripts. Windows backslash notation is prohibited in committed files.

| Context | Required Separator | Notes |
|---|---|---|
| YAML files (Compose, GitHub Actions) | `/` only | YAML parsers are cross-platform |
| Shell scripts (`.sh`) | `/` only | POSIX path separator |
| PowerShell scripts (`.ps1`) | `/` preferred; `\` acceptable internally | Both are valid in PowerShell; `/` for consistency |
| JSON files (VSCode configuration, `devcontainer.json`) | `/` only | Embedded shell commands follow shell rules |
| Docker `COPY`, `WORKDIR`, `RUN` instructions | `/` only | Container OS is always Linux |
| Markdown documentation | `/` for paths | Consistency |

**MANDATORY:** Hardcoded absolute paths on any OS are prohibited in all committed artifacts. All paths are relative to a defined root (workspace root, script location, container workdir, etc.).

## 3.6 Permissions

**MANDATORY:** All shell scripts in `scripts/` carry the executable bit:

| File | Permission | Set By |
|---|---|---|
| `scripts/setup.sh` | `755` | F05 implementation |
| `scripts/doctor.sh` | `755` | F05 implementation |
| `scripts/reset.sh` | `755` | F05 implementation |

**MANDATORY:** No Phase 4.5 script requires `sudo`, administrator privileges, or elevated permissions. Any script that cannot complete without elevation constitutes SC-012 (Cross-Platform Script Failure) or SC-013 (Tool Version Incompatibility).

**MANDATORY:** The DevContainer runs as the non-root user `vscode` (UID 1000). The workspace directory `/workspaces/backend` is owned by `vscode:vscode`.

## 3.7 Environment Variables

| Rule | Classification | Detail |
|---|---|---|
| No inline `VAR=value command` in npm scripts | MANDATORY | Incompatible with Windows CMD |
| `DATABASE_URL` prefixed on all Prisma CLI invocations | MANDATORY | `prisma.config.ts` project constraint |
| No `process.env.VAR` in Platform scripts | MANDATORY | Scripts use shell variable expansion |
| `.env` sourced at the start of doctor scripts | MANDATORY | Enables variable validation without external tool dependency |
| CI variables injected via GitHub Actions `env:` block | MANDATORY | Never hardcoded in workflow YAML |
| `.env.example` is the canonical list of required variables | MANDATORY | Created by F03; never contains real values |

## 3.8 PowerShell Compatibility

All PowerShell scripts target Windows PowerShell 5.1 (the default on Windows 11). The following constructs are MANDATORY prohibitions in committed `.ps1` files:

| Prohibited Construct | Reason | Alternative |
|---|---|---|
| `&&` and `\|\|` pipeline chain operators | Not available in PS 5.1; parser error | `if ($LASTEXITCODE -ne 0) { ... }` |
| Ternary operator `?:` | Not available in PS 5.1 | Explicit `if/else` |
| Null-coalescing `??` | Not available in PS 5.1 | Explicit null check |
| `Read-Host` | Hangs in non-interactive mode | Pre-defined parameters or environment variables |
| `$env:VAR = $null` to unset | Does not unset on all versions | `[Environment]::SetEnvironmentVariable(...)` |
| `tail`, `head`, `grep`, `wc` | Unix commands; not available | PowerShell equivalents |

**MANDATORY:** All `.ps1` scripts begin with `#Requires -Version 5.1` and set `$ErrorActionPreference = "Stop"` as the first executable statement.

## 3.9 Bash Compatibility

All shell scripts (`.sh`) target POSIX sh (`/bin/sh`), not Bash. The following Bash-isms are MANDATORY prohibitions in committed `.sh` files:

| Prohibited Construct | Reason | Alternative |
|---|---|---|
| `[[ ... ]]` double bracket | Bash extension | `[ ... ]` single bracket |
| `function name() { }` syntax | Bash extension | `name() { }` |
| `$RANDOM` | Bash built-in | Not used in Platform scripts |
| Process substitution `<(...)` | Bash extension | Temporary file or pipe |
| Arrays `arr=()` | Bash extension | Positional parameters or separate variables |
| `source` keyword | Bash keyword | `. ./file` (POSIX dot command) |
| `local` variable keyword | Not POSIX | Avoid local variables; use naming prefixes |

**MANDATORY:** All `.sh` scripts begin with `#!/bin/sh` (not `#!/bin/bash`) and pass `sh -n <script>` (POSIX syntax validation) as part of F05 validation.

## 3.10 Validation Matrix

| Standard | PRIMARY: Windows | PRIMARY: Ubuntu | SECONDARY: macOS | SECONDARY: Debian | Method |
|---|---|---|---|---|---|
| UTF-8 encoding | CI | CI | CI | DevContainer CI | AUTOMATED |
| LF line endings | CI (`.gitattributes`) | CI | CI | CI | AUTOMATED |
| Forward-slash paths | Code review | Code review | Code review | Code review | MANUAL |
| No hardcoded absolute paths | Code review | Code review | Code review | Code review | MANUAL |
| Script execute bits | N/A | CI | CI | DevContainer | AUTOMATED |
| PowerShell 5.1 compatibility | CI | N/A | N/A | N/A | AUTOMATED |
| POSIX sh compatibility | N/A | CI | CI | DevContainer | AUTOMATED |
| No elevated permissions | Manual | Manual | Manual | DevContainer | MANUAL |

---

# Chapter 4: Docker Standards

## 4.1 Container Philosophy

The Docker development environment provides infrastructure services exclusively. The NestJS application MUST NOT run inside a Docker container during development. This constraint is architectural:

- The application runs as a host process, benefiting from native hot-reload (`nest start --watch`).
- The VSCode debugger attaches to the host Node.js process.
- The Docker layer provides only PostgreSQL (and optionally PgAdmin, Redis, MailHog via profiles).

**MANDATORY:** No `docker-compose.dev.yml` service runs the NestJS application. The application is always started via `npm run start:dev` on the host.

## 4.2 Container Responsibilities

| Container | Responsibility | Start Mode |
|---|---|---|
| `db` (PostgreSQL) | Persistent relational data store | Default (no profile) |
| `pgadmin` (PgAdmin) | Database administration UI | Profile `tools` |
| `redis` (Redis) | Session/cache store (reserved) | Profile `cache` |
| `mailhog` (MailHog) | Email capture for development (reserved) | Profile `mail` |

Reserved containers (Redis, MailHog) are defined but not started by default. Their implementation is complete in F04 but their use is conditional on the application developing the corresponding features.

## 4.3 Compose Architecture

**MANDATORY constraints on `docker-compose.dev.yml`:**

| Constraint | Required Value | Classification |
|---|---|---|
| Compose Specification | No `version:` key | MANDATORY |
| Single file | No `include:` or external file references | MANDATORY |
| Named network | `factory-dev-network` (bridge) | MANDATORY |
| No `network_mode: host` | Prohibited on all services | MANDATORY |
| Named volumes for stateful data | No bind mounts for database data | MANDATORY |
| No hardcoded credentials | Variable substitution only (`${VAR}`) | MANDATORY |
| Explicit container names | `container_name:` field on every service | MANDATORY |
| Explicit restart policy | `restart:` field on every service | MANDATORY |
| Profiles for optional services | Non-default services use `profiles:` | MANDATORY |

## 4.4 Network Rules

| Property | Required Value | Classification |
|---|---|---|
| Network name | `factory-dev-network` | MANDATORY |
| Network driver | `bridge` | MANDATORY |
| External | `false` — managed by this Compose file | MANDATORY |
| All services declared | Every service must list `networks:` | MANDATORY |
| No default network reliance | No service omits the `networks:` key | MANDATORY |

The default Compose network is not used. Every service explicitly declares `factory-dev-network`. A service that omits its network declaration is treated as a configuration error.

## 4.5 Volume Rules

| Rule | Classification | Detail |
|---|---|---|
| Named volumes for stateful services | MANDATORY | No bind mounts from host for database data |
| Volume names: `factory-<service>-data` | MANDATORY | `factory-postgres-data`; `factory-pgadmin-data` |
| Top-level `volumes:` block | MANDATORY | All named volumes enumerated at file root |
| `down -v` classified as destructive | MANDATORY | Documented in scripts with confirmation guard |
| Bind mounts for source code | PROHIBITED | Source is always on host; not mounted into containers |

## 4.6 Health Checks

**MANDATORY:** All stateful services (services holding persistent data or exposing a connection endpoint) must define a health check using a tool-based probe — not a `sleep`-based probe.

| Service | Health Check Command | Classification |
|---|---|---|
| PostgreSQL (`db`) | `pg_isready -U ${POSTGRES_USER:-factory_dev} -d ${POSTGRES_DB:-factory_erp}` | MANDATORY |
| Redis | `redis-cli ping` | MANDATORY (when Redis profile active) |
| PgAdmin | HTTP endpoint check | RECOMMENDED |

**MANDATORY** minimum health check configuration for all stateful services:

| Property | Required Value |
|---|---|
| `interval` | `10s` |
| `timeout` | `5s` |
| `retries` | `5` |
| `start_period` | `10s` |

**MANDATORY:** Services that depend on stateful services use `condition: service_healthy` in their `depends_on` block, not `condition: service_started`.

## 4.7 Image Version Pinning

**MANDATORY:** All Docker images use exact `major.minor.patch` version tags. The following image versions are the Phase 4.5 approved set:

| Service | Image | Tag | Architecture |
|---|---|---|---|
| PostgreSQL | `postgres` | `16.4-alpine` | linux/amd64, linux/arm64 |
| PgAdmin | `dpage/pgadmin4` | `8.14` | linux/amd64, linux/arm64 |
| Redis | `redis` | `7.4-alpine` | linux/amd64, linux/arm64 |
| MailHog | `mailhog/mailhog` | `v1.0.1` | linux/amd64 only |

**MANDATORY:** `latest` and floating tags (e.g., `16`, `7.4-alpine`) are prohibited. An image tag change constitutes a version change and requires an Engineering Decision Report.

**Note on MailHog:** MailHog does not publish an official arm64 image. Its use is profile-gated (`mail` profile) and reserved. This limitation is documented in the Engineering Decision Register (ED-P45-004).

## 4.8 Restart Policies

| Policy | Meaning | Applied To |
|---|---|---|
| `unless-stopped` | Restarts after Docker Engine restart; stops on explicit `docker compose down` | All Phase 4.5 services |
| `always` | PROHIBITED — restarts even after explicit stop | Not used |
| `on-failure` | Not appropriate for development services | Not used |
| `no` | Default — does not restart | Not used explicitly |

**MANDATORY:** All services declare `restart: unless-stopped`.

## 4.9 Secrets

| Rule | Classification | Detail |
|---|---|---|
| No credentials in `docker-compose.dev.yml` | MANDATORY | All secrets via `${VAR}` substitution from `.env` |
| No Compose `secrets:` block | MANDATORY | Compose secrets are for production swarm deployments |
| `DATABASE_URL` not hardcoded in any committed file | MANDATORY | Derived from `.env` at runtime |
| `JWT_SECRET` not hardcoded in any committed file | MANDATORY | Sourced from `.env` at runtime; CI secrets in GitHub Actions |
| PostgreSQL `POSTGRES_PASSWORD` via `${VAR}` | MANDATORY | Sourced from `.env` |
| PgAdmin `PGADMIN_DEFAULT_PASSWORD` via `${VAR}` | MANDATORY | Sourced from `.env` |

## 4.10 Resource Limits

Resource limits are not configured in the Phase 4.5 development environment. This is a deliberate decision appropriate for local development where host resources are dedicated to the development workflow, not shared with production workloads. Production resource constraints are a CD phase concern.

This standard explicitly documents the absence of resource limits as an engineering decision, not an oversight.

## 4.11 Container Naming

**MANDATORY:** Container names follow the pattern `factory-erp-<service>`:

| Service | Container Name |
|---|---|
| PostgreSQL | `factory-erp-db` |
| PgAdmin | `factory-erp-pgadmin` |
| Redis | `factory-erp-redis` |
| MailHog | `factory-erp-mailhog` |

Container names are used in `docker logs`, `docker exec`, and `docker inspect` commands. Consistent naming prevents ambiguity across multi-container environments.

## 4.12 Validation

| Standard | Validation Type | Method |
|---|---|---|
| No `version:` key in Compose file | STRUCTURAL | Inspect `docker-compose.dev.yml` |
| `docker compose -f docker-compose.dev.yml config` | AUTOMATED | Exit 0 required |
| PostgreSQL reaches `healthy` | AUTOMATED | `docker compose -f docker-compose.dev.yml up -d` + health check |
| Named volume created | AUTOMATED | `docker volume ls \| grep factory-postgres-data` |
| No credentials in Compose file | STRUCTURAL | Inspect for literal values in credential fields |
| All container names match §4.11 | STRUCTURAL | Inspect `container_name:` values |
| All image tags match §4.7 | STRUCTURAL | Inspect `image:` values |
| Health check on stateful services | STRUCTURAL | Inspect `healthcheck:` block on `db` service |

---

# Chapter 5: DevContainer Standards

## 5.1 Objectives

The DevContainer provides a containerized development environment for developers who cannot or choose not to manage Node.js, build tools, and dependencies locally. It is an opt-in alternative — the local development path (host Node.js + Docker PostgreSQL) must remain fully functional independently of the DevContainer.

**MANDATORY:** The DevContainer must achieve the same quality gate results as the host development environment. A `npm run build` or `npm run test` that passes on the host must also pass inside the DevContainer.

## 5.2 Workspace Standards

| Property | Required Value | Classification |
|---|---|---|
| `workspaceFolder` | `/workspaces/backend` | MANDATORY |
| `remoteUser` | `vscode` (non-root) | MANDATORY |
| Workspace mount | Automatic (VSCode manages bind mount) | MANDATORY |
| File ownership in container | `vscode:vscode` on `/workspaces/backend` | MANDATORY |
| Base image | `mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm` | MANDATORY |
| Custom Dockerfile | Only when base image is insufficient; EDR required | CONDITIONAL |

## 5.3 Lifecycle

| Phase | Trigger | Required Action |
|---|---|---|
| Creation | First `Reopen in Container` | `postCreateCommand`: `npm ci && DATABASE_URL="..." npx prisma generate` |
| Start | Subsequent container start | Optional `postStartCommand` (not required in Phase 4.5) |
| Rebuild | `Rebuild Container` command | Full image rebuild; `postCreateCommand` re-runs |
| Stop | VSCode window close | Container stops; named volumes persist |

**MANDATORY:** The `postCreateCommand` runs `npm ci` before `prisma generate`. This ordering is non-negotiable: Prisma requires node_modules to exist before it can generate the client.

**MANDATORY:** The `postCreateCommand` prefixes `DATABASE_URL=...` on the `prisma generate` invocation. This is a project-level constraint that applies inside the container as on the host.

## 5.4 Extensions

Extensions declared in `devcontainer.json` under `customizations.vscode.extensions` are installed automatically at container creation.

**MANDATORY** extensions:

| Extension ID | Purpose |
|---|---|
| `dbaeumer.vscode-eslint` | ESLint inline error feedback |
| `esbenp.prettier-vscode` | Prettier formatting |
| `prisma.prisma` | Prisma schema language support |
| `EditorConfig.EditorConfig` | EditorConfig enforcement |

**RECOMMENDED** extensions (listed in `devcontainer.json` but not blocking container creation):

| Extension ID | Purpose |
|---|---|
| `ms-azuretools.vscode-docker` | Docker management |
| `humao.rest-client` | HTTP request testing |

## 5.5 VS Code Integration

| Integration | Location | Classification |
|---|---|---|
| Formatter (`esbenp.prettier-vscode`) | `customizations.vscode.settings` | MANDATORY |
| `editor.formatOnSave: true` | `customizations.vscode.settings` | MANDATORY |
| `editor.codeActionsOnSave` (ESLint fix) | `customizations.vscode.settings` | MANDATORY |
| TypeScript workspace version (`tsdk`) | `customizations.vscode.settings` | MANDATORY |
| Extension recommendations | `devcontainer.json` `extensions` | MANDATORY |

## 5.6 Ports

| Port | Service | Label | Auto-Open |
|---|---|---|---|
| 3000 | NestJS Application | `FactoryERP API` | Once (browser on first start) |
| 5432 | PostgreSQL | `PostgreSQL` | No |

**MANDATORY:** Ports are declared in `devcontainer.json` under `forwardPorts`. Ports not listed are not forwarded. The `portsAttributes` block provides labels and auto-open behavior.

## 5.7 Performance

**RECOMMENDED** optimizations for DevContainer performance:

| Optimization | Method | Classification |
|---|---|---|
| Exclude `node_modules/` from file watcher | `"watcherExclude"` in workspace settings | RECOMMENDED |
| Exclude `dist/` from file watcher | `"watcherExclude"` in workspace settings | RECOMMENDED |
| Named volume for `node_modules/` | Avoids bind-mount penalty on macOS/Windows | OPTIONAL |

The `node_modules/` named volume optimization, if used, must be declared in a separate `docker-compose.devcontainer.yml` Compose override, not in `docker-compose.dev.yml`. This preserves the development Compose file's integrity.

## 5.8 Security

| Rule | Classification | Detail |
|---|---|---|
| Container runs as non-root (`vscode`) | MANDATORY | `"remoteUser": "vscode"` in `devcontainer.json` |
| No credentials in `devcontainer.json` | MANDATORY | Credentials via `remoteEnv` with `${localEnv:VAR}` |
| No credentials in Compose override | MANDATORY | Same rule as `docker-compose.dev.yml` |
| Base image from official Microsoft registry | MANDATORY | `mcr.microsoft.com/devcontainers/` namespace |
| No Docker-in-Docker unless explicitly required | MANDATORY | DinD is a security risk; requires EDR |

## 5.9 Validation

| Check | Required Result | Validation Type |
|---|---|---|
| Container opens without error | No error dialog or rebuild failure | MANUAL |
| `node --version` inside container | `v24.16.0` | MANUAL |
| `npm run build` inside container | Exit 0 | MANUAL |
| `npm run test` inside container | 482/482 PASS | MANUAL |
| `whoami` inside container | `vscode` (non-root) | MANUAL |
| Port 3000 forwarded | Application reachable at `localhost:3000` | MANUAL |
| PostgreSQL reachable at `db:5432` | `pg_isready` exits 0 | MANUAL |
| No credentials in `devcontainer.json` | No literal credential values | STRUCTURAL |

---

# Chapter 6: Bootstrap Standards

## 6.1 Bootstrap Philosophy

Bootstrap and doctor scripts are verification and setup tools, not environment installers. They verify prerequisites, perform application-level setup (dependency installation, code generation), and report actionable errors. They do not install operating system tools, runtimes, or system packages.

**MANDATORY:** All bootstrap scripts are idempotent. Running a script twice in an identical environment produces the same observable outcome as running it once, without error on the second execution.

**MANDATORY:** No bootstrap script requires elevated permissions (`sudo` or administrator) on any supported platform.

## 6.2 `setup.sh` / `setup.ps1` Standards

| Standard | Classification | Detail |
|---|---|---|
| POSIX sh compatibility (`.sh`) | MANDATORY | `#!/bin/sh`; no Bash-isms per §3.9 |
| PowerShell 5.1 target (`.ps1`) | MANDATORY | `#Requires -Version 5.1` |
| Exit on first error | MANDATORY | `.sh`: `set -e`; `.ps1`: `$ErrorActionPreference = "Stop"` |
| Idempotent execution | MANDATORY | Second run produces no error or unexpected output |
| Does not install system tools | MANDATORY | Verifies tool presence; exits with error if missing |
| Copies `.env.example` to `.env` if absent | MANDATORY | With console notice to edit values before continuing |
| Starts Docker Compose `db` service | MANDATORY | Waits for `healthy` status before continuing |
| Runs `npm ci` | MANDATORY | Respects lock file; `--engines-strict` flag |
| Runs `prisma generate` with `DATABASE_URL` | MANDATORY | Project-level constraint |
| Console output: `[STEP N/N] Description` | MANDATORY | Numbered steps for progress visibility |

## 6.3 `doctor.sh` / `doctor.ps1` Standards

| Standard | Classification | Detail |
|---|---|---|
| Read-only operation | MANDATORY | Modifies no files, no state, no configuration |
| POSIX sh compatible (`.sh`) | MANDATORY | Per §3.9 |
| PowerShell 5.1 target (`.ps1`) | MANDATORY | Per §3.8 |
| Sources `.env` before checks | MANDATORY | `. ./.env 2>/dev/null \|\| true` (`.sh`); manual parse (`.ps1`) |
| Checks all 12 conditions in §6.4 | MANDATORY | No check may be omitted |
| Exit code 0 on full success | MANDATORY | CI-safe |
| Exit code 1 on any failure | MANDATORY | CI-safe |
| Output format: `[PASS] <message>` / `[FAIL] <message>` | MANDATORY | Machine-parseable; human-readable |
| All checks attempted regardless of prior failure | MANDATORY | Reports all failures, not just the first |
| Completion under 10 seconds | RECOMMENDED | Encourages routine use |

## 6.4 Doctor Script Verification Sequence

The doctor script verifies the following conditions in order. The order is non-negotiable — checks that depend on later checks must not run before their prerequisite:

| Order | Check | Success Condition |
|---|---|---|
| 1 | `git` present and version ≥ 2.40 | `git --version` returns expected output |
| 2 | `node` present and version = 24.16.0 | `node --version` = `v24.16.0` |
| 3 | `npm` present and version ≥ 11.0.0 | `npm --version` returns expected output |
| 4 | `docker` present and version ≥ 24.0.0 | `docker --version` returns expected output |
| 5 | `docker compose` (v2) present | `docker compose version` returns expected output |
| 6 | Docker daemon is running | `docker info` exits 0 |
| 7 | `.env` file present | File exists at repository root |
| 8 | `DATABASE_URL` variable set | Variable is present in `.env` |
| 9 | `JWT_SECRET` variable set | Variable is present in `.env` |
| 10 | `node_modules/` directory present | Directory exists |
| 11 | `@prisma/client` present in `node_modules` | Package directory exists |
| 12 | PostgreSQL container healthy | `docker compose -f docker-compose.dev.yml ps db` shows `healthy` |

## 6.5 `reset.sh` / `reset.ps1` Standards

| Standard | Classification | Detail |
|---|---|---|
| Confirmation prompt before ANY destructive action | MANDATORY | Must receive explicit input (e.g., type `yes`) |
| `docker compose down -v` classified as destructive | MANDATORY | Destroys all named volumes (data loss) |
| `rm -rf node_modules/` classified as destructive | MANDATORY | Guarded by confirmation |
| No automatic `.env` deletion | MANDATORY | Requires a second explicit confirmation |
| Confirmation prompt text must identify what will be destroyed | MANDATORY | "This will destroy all PostgreSQL data. Type 'yes' to continue:" |
| Non-destructive steps run without confirmation | RECOMMENDED | `npm cache clean`, `rm -rf dist/` are safe without prompt |

## 6.6 Execution Order

**MANDATORY** execution order for the setup workflow:

```
1. Verify prerequisites (git, node, npm, docker, docker compose)
2. Verify .env file (copy .env.example if absent)
3. Start Docker Compose db service
4. Wait for db service to reach healthy state
5. Run npm ci
6. Run prisma generate
7. Verify setup: doctor.sh exits 0
```

Steps may not be reordered. A failure at any step halts the setup script (per `set -e` / `$ErrorActionPreference = "Stop"`).

## 6.7 Failure Handling

| Failure Type | Script Response | Classification |
|---|---|---|
| Tool missing | `[FAIL] git not found. Install from https://git-scm.com` | MANDATORY |
| Version mismatch | `[FAIL] node 22.1.0 found; 24.16.0 required. Run: nvm use` | MANDATORY |
| Docker not running | `[FAIL] Docker daemon not running. Start Docker Desktop.` | MANDATORY |
| `.env` missing | `[FAIL] .env not found. Run: cp .env.example .env` | MANDATORY |
| `npm ci` failure | Script exits non-zero; error output visible | MANDATORY |
| `prisma generate` failure | Script exits non-zero; error output visible | MANDATORY |

## 6.8 Validation

| Check | Validation Type | Method |
|---|---|---|
| `doctor.sh` exits 0 on configured machine | MANUAL | Run `bash scripts/doctor.sh`; inspect output |
| `doctor.sh` exits 1 on each failure condition | MANUAL | Simulate failure; verify `[FAIL]` output and exit 1 |
| `setup.sh` is idempotent | MANUAL | Run twice; no error on second run |
| `reset.sh` prompts before destructive actions | MANUAL | Attempt reset; verify prompt appears |
| All `.sh` scripts pass POSIX syntax check | AUTOMATED | `sh -n scripts/*.sh` in CI |
| All `.sh` scripts have execute bit | AUTOMATED | `ls -la scripts/*.sh` on Ubuntu CI |
| PowerShell scripts pass syntax check | AUTOMATED | `powershell -NonInteractive -File scripts/doctor.ps1 -Check` |

---

# Chapter 7: Toolchain Standards

## 7.1 Node.js

| Property | Standard | Classification |
|---|---|---|
| Required version | `24.16.0` (exact) | MANDATORY |
| Version pin location | `.nvmrc` root of repository | MANDATORY |
| `.nvmrc` format | Exact version string, no `v` prefix: `24.16.0` | MANDATORY |
| Engine range | `"node": ">=24.0.0 <25.0.0"` in `package.json` | MANDATORY |
| Version manager | nvm (Linux/macOS), nvm-windows (Windows) | RECOMMENDED |
| Alternative version manager | Volta | OPTIONAL |
| CI enforcement | `actions/setup-node@v4` with `node-version-file: '.nvmrc'` | MANDATORY |
| Doctor script check | `node --version` compared to `.nvmrc` content | MANDATORY |

## 7.2 npm

| Property | Standard | Classification |
|---|---|---|
| Minimum version | `11.0.0` (bundled with Node.js 24) | MANDATORY |
| Engine declaration | `"npm": ">=11.0.0"` in `package.json` | MANDATORY |
| Lock file | `package-lock.json` — committed; never gitignored | MANDATORY |
| Local install command | `npm install` (permitted) | PERMITTED |
| CI/script install command | `npm ci` | MANDATORY |
| Engine enforcement | `--engines-strict` flag on `npm ci` in CI | MANDATORY |
| Audit enforcement | `--audit-level=high` in CI | MANDATORY |
| New package additions | PROHIBITED without EDR and architect approval | MANDATORY |

## 7.3 TypeScript

TypeScript `5.7.3` is installed via the existing `package.json` devDependencies. Phase 4.5 does not introduce TypeScript files. The following TypeScript configuration properties are protected and must not be modified by any Platform feature:

| Property | Value | Protection Reason |
|---|---|---|
| `isolatedModules` | `true` | Enables module boundary enforcement; removing it could hide import errors |
| `forceConsistentCasingInFileNames` | `true` | Cross-platform filename safety on case-insensitive systems |
| `strictNullChecks` | `true` | Null safety; removing it would unmask potential runtime errors |
| `target` | `ES2023` | Established runtime compatibility baseline |
| `module` | `nodenext` | Node.js ESM/CJS interop configuration |

## 7.4 Prisma

| Property | Standard | Classification |
|---|---|---|
| CLI version | `6.16.2` (from `package.json`) | MANDATORY — no change |
| Client version | `6.16.2` (must match CLI) | MANDATORY |
| `DATABASE_URL` prefix | Required on all CLI commands | MANDATORY (project constraint) |
| Schema location | `prisma/schema.prisma` | MANDATORY — no change |
| Schema modification | PROHIBITED during Phase 4.5 | MANDATORY |
| `prisma db pull` | PROHIBITED unconditionally | MANDATORY (FEOS + CLAUDE.md) |
| `prisma validate` in CI | Run without live database; placeholder URL sufficient | MANDATORY |
| `prisma generate` timing | After `npm ci` in setup and DevContainer `postCreateCommand` | MANDATORY |

## 7.5 Git

| Property | Standard | Classification |
|---|---|---|
| Minimum version | `2.40.0` | RECOMMENDED |
| Line-ending strategy | Governed by `.gitattributes` (§9.2); `core.autocrlf` not relied upon | MANDATORY |
| Force push to `main` | PROHIBITED (FEOS `10_GIT_GOVERNANCE.md`) | MANDATORY |
| Amending pushed commits | PROHIBITED (FEOS) | MANDATORY |
| Merge commits on `main` | PROHIBITED — linear history required | MANDATORY |
| Branch naming | `feat/`, `fix/`, `chore/` prefixes | RECOMMENDED |
| Commit signing | Per FEOS `10_GIT_GOVERNANCE.md` | Per FEOS policy |

## 7.6 Docker

| Property | Standard | Classification |
|---|---|---|
| Docker Engine minimum | `24.0.0` | MANDATORY |
| Docker Desktop (Windows/macOS) | `4.25.0+` | MANDATORY |
| Compose v2 CLI | `docker compose` (space-separated; not hyphenated) | MANDATORY |
| Compose minimum version | `2.20.0` | MANDATORY |
| Compose file format | Compose Specification (no `version:` key) | MANDATORY |
| Explicit `-f` flag for dev Compose | `docker compose -f docker-compose.dev.yml ...` | MANDATORY |
| Docker-in-Docker (DinD) | PROHIBITED without EDR | MANDATORY |

## 7.7 Docker Compose

**MANDATORY:** The v2 CLI (`docker compose`, space-separated) is the only permitted invocation format. The legacy v1 format (`docker-compose`, hyphenated) is prohibited in all committed scripts, documentation, and workflow files.

The explicit `-f docker-compose.dev.yml` flag is MANDATORY in all invocations. The file is named `docker-compose.dev.yml` (not `docker-compose.yml`) precisely to require this flag, preventing accidental use of the development Compose file in contexts where it is inappropriate.

## 7.8 VS Code

| Property | Standard | Classification |
|---|---|---|
| Minimum version | `1.90.0` | RECOMMENDED |
| Dev Containers extension | Required for DevContainer workflow | MANDATORY (F06) |
| Workspace TypeScript version | Use workspace TypeScript (`typescript.tsdk`) | MANDATORY |
| Settings scope | Workspace settings (`.vscode/settings.json`); not user-level | MANDATORY |

## 7.9 Version Pinning Summary

| Tool | Pinning Document | Pinning Method | Version |
|---|---|---|---|
| Node.js | `.nvmrc` | Exact string | `24.16.0` |
| Node.js (engine) | `package.json` | Semver range | `>=24.0.0 <25.0.0` |
| npm (engine) | `package.json` | Semver range | `>=11.0.0` |
| PostgreSQL | `docker-compose.dev.yml` | Exact image tag | `16.4-alpine` |
| PgAdmin | `docker-compose.dev.yml` | Exact image tag | `8.14` |
| Redis | `docker-compose.dev.yml` | Exact image tag | `7.4-alpine` |
| MailHog | `docker-compose.dev.yml` | Exact image tag | `v1.0.1` |
| GitHub Actions (checkout) | `.github/workflows/ci.yml` | Major version | `@v4` |
| GitHub Actions (setup-node) | `.github/workflows/ci.yml` | Major version | `@v4` |
| Prisma | `package.json` (existing) | Exact version | `6.16.2` |

## 7.10 Compatibility Matrix

| Tool | Windows 11 | Ubuntu 24 | macOS 14 (arm64) | Debian 12 (DevContainer) |
|---|---|---|---|---|
| Node `24.16.0` | ✓ nvm-windows | ✓ nvm | ✓ arm64 build | ✓ base image |
| npm `11.x` | ✓ | ✓ | ✓ | ✓ |
| Git `2.40+` | ✓ | ✓ | ✓ | ✓ |
| Docker `24+` | ✓ Desktop | ✓ Engine | ✓ Desktop | N/A (host) |
| Compose v2 | ✓ Desktop | ✓ Plugin | ✓ Desktop | N/A (host) |
| Prisma `6.16.2` | ✓ | ✓ | ✓ arm64 | ✓ linux-musl |
| `bcrypt` `6.0` native | ✓ build-tools | ✓ build-essential | ✓ Xcode CLI | ✓ base image |

## 7.11 Upgrade Policy

**MANDATORY:** No toolchain component is upgraded during Phase 4.5 execution except as part of F01 (already COMPLETE — Node.js to `24.16.0`). All other upgrades are deferred to post-Phase 4.5.

Any toolchain upgrade proposed during Phase 4.5 execution:
1. Triggers SC-007 (Engineering Decision Required).
2. Requires an EDR documenting the version change, rationale, and compatibility assessment.
3. Requires architect approval.
4. Requires re-verification of all quality gates on all supported platforms.

## 7.12 Downgrade Policy

**MANDATORY:** No toolchain component is downgraded during Phase 4.5. A requirement to downgrade constitutes SC-013 (Tool Version Incompatibility) and may escalate to a Class E stop condition if the downgrade is unavoidable.

## 7.13 Validation

| Tool | Validation Method | Classification |
|---|---|---|
| Node.js version | Doctor script check 2; CI `node --version` | AUTOMATED |
| npm version | Doctor script check 3; `npm --version` in CI | AUTOMATED |
| Docker version | Doctor script check 4 | MANUAL (CI has Docker) |
| Compose v2 | Doctor script check 5 | MANUAL |
| All image tags exact | Inspect `docker-compose.dev.yml` | STRUCTURAL |
| GitHub Actions versions | Inspect `.github/workflows/ci.yml` | STRUCTURAL |
| Prisma version unchanged | `git diff HEAD -- package.json \| grep prisma` | AUTOMATED |

---

# Chapter 8: CI/CD Standards

## 8.1 GitHub Actions Philosophy

Phase 4.5 uses GitHub Actions as the sole CI platform. The CI pipeline enforces quality, not deployment. No deployment steps are included in Phase 4.5 workflows.

| Principle | Standard | Classification |
|---|---|---|
| Every PR to `main` triggers CI | `on: pull_request: branches: [main]` | MANDATORY |
| Every push to `main` triggers CI | `on: push: branches: [main]` | MANDATORY |
| CI is the final cross-platform quality authority | Local gates are necessary; CI is sufficient | MANDATORY |
| No workflow bypasses quality gates | No `if: false`; no conditional skip on protected branches | MANDATORY |
| `fail-fast: true` in all matrix strategies | Cancel remaining matrix jobs when one fails | MANDATORY |
| `timeout-minutes` on all jobs | Prevents runaway jobs; set per estimated duration | MANDATORY |
| `permissions: contents: read` on all jobs | Principle of least privilege | MANDATORY |

## 8.2 Matrix Builds

**MANDATORY:** The CI pipeline runs a matrix build across all three required OS targets:

| Matrix Entry | Runner | Priority | Status |
|---|---|---|---|
| `ubuntu-latest` | `ubuntu-24.04` | PRIMARY | MANDATORY |
| `windows-latest` | `windows-2022` | PRIMARY | MANDATORY |
| `macos-latest` | `macos-14` (arm64) | SECONDARY | MANDATORY |

All three OS targets must pass for a CI run to be considered successful. A CI run with one OS target skipped or conditionally excluded is not a valid quality gate.

## 8.3 Ubuntu CI Job

The Ubuntu job is the reference CI job. All other jobs reproduce its steps with OS-specific adaptations.

**MANDATORY** steps:

| Step | Standard |
|---|---|
| `actions/checkout@v4` | `fetch-depth: 1` |
| `actions/setup-node@v4` | `node-version-file: '.nvmrc'`; `cache: 'npm'` |
| `npm ci --engines-strict` | Clean install; lock file respected; engines enforced |
| `DATABASE_URL="..." npx prisma generate` | Placeholder URL; no live database required |
| `npm run build` | Exit 0 required |
| `npm run lint` | Exit 0, 0 errors required |
| `npm run test` | Exit 0, 482/482 required |
| `DATABASE_URL="..." npx prisma validate` | Exit 0 required |
| `npm audit --audit-level=high` | Exit 0 required |
| `bash scripts/doctor.sh` (non-blocking) | Informational; validates environment report format |

## 8.4 Windows CI Job

The Windows job reproduces all Ubuntu steps with the following adaptations:

| Adaptation | Detail |
|---|---|
| Shell | `pwsh` (PowerShell Core, available on Windows runners) for GitHub Actions steps |
| Shell scripts (`.sh`) | Not executed on Windows CI; covered by `.ps1` equivalents |
| `node_modules/.bin/` paths | Avoided; `npx` used for all tool invocations |
| Line endings | `.gitattributes` normalizes to LF on commit; checkout restores per platform |
| `DATABASE_URL` in workflow env | Set via `env:` block; `$env:DATABASE_URL` syntax is automatic |

## 8.5 macOS CI Job

The macOS job reproduces the Ubuntu steps with the following adaptations:

| Adaptation | Detail |
|---|---|
| `bcrypt` native module | Xcode CLI tools present on `macos-14` runner; `npm ci` compiles natively |
| Docker | Not available on macOS GitHub Actions runners; Docker-dependent steps omitted |
| Shell scripts | POSIX sh compatible; run without modification |
| arm64 Node.js | `actions/setup-node` provides the arm64 Node.js build |

## 8.6 Caching

| Cache | Strategy | Managed By |
|---|---|---|
| npm dependencies | `${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}` | `actions/setup-node` with `cache: 'npm'` |
| TypeScript incremental build | `${{ runner.os }}-tsbuildinfo-${{ hashFiles('src/**/*.ts') }}` | `actions/cache@v4` (RECOMMENDED) |

Cache invalidation: a change to `package-lock.json` invalidates the npm cache. A change to any `.ts` file invalidates the TypeScript incremental cache. Cache keys include the runner OS to prevent cross-platform cache contamination.

## 8.7 Artifacts

| Artifact | Runner | Upload Condition | Retention |
|---|---|---|---|
| Coverage report (`coverage/`) | `ubuntu-latest` only | On test success | 7 days |
| Build output (`dist/`) | None | Never uploaded in Phase 4.5 | N/A |

Coverage artifacts are uploaded from `ubuntu-latest` only. Triplicate uploads from all three OS targets are unnecessary and consume storage.

## 8.8 Quality Gates in CI

| Gate | Local | CI | Classification |
|---|---|---|---|
| `npm run build` | MANDATORY | MANDATORY | Must exit 0 |
| `npm run lint` | MANDATORY | MANDATORY | Must exit 0; 0 errors |
| `npm run test` | MANDATORY | MANDATORY | Must exit 0; 482/482 |
| `npx prisma validate` | MANDATORY | MANDATORY | Must exit 0 |
| `npm audit --audit-level=high` | RECOMMENDED | MANDATORY | Must exit 0 in CI |
| LF line ending assertion | OPTIONAL | MANDATORY | F08 CI step |
| Execute bit on `.sh` scripts | N/A | MANDATORY | Ubuntu CI; `ls -la scripts/` |
| PowerShell script syntax | N/A | MANDATORY | Windows CI |

## 8.9 Branch Protection

Branch protection on `main` is a GitHub repository configuration, not a workflow file. The following rules **MUST** be configured:

| Rule | Required Setting |
|---|---|
| Require status checks before merge | Enabled |
| Required checks | `CI / build-and-test (ubuntu-latest)` at minimum; all three preferred |
| Require branches up to date before merge | Enabled |
| Restrict force pushes | Enabled |
| Allow deletions | Disabled |
| Require signed commits | Per FEOS `10_GIT_GOVERNANCE.md` |

Branch protection is validated as part of F07 completion and documented in `F07_REPORT.md`.

## 8.10 Failure Policy

| Failure | CI Behavior | Developer Action |
|---|---|---|
| Any matrix job fails | `fail-fast: true` cancels remaining jobs | Identify failing OS; reproduce locally |
| Build failure | Step fails; job fails; matrix cancelled | `npm run build` locally; fix TypeScript errors |
| Lint failure | Step fails | `npm run lint` locally; apply fixes |
| Test failure | Step fails | `npm run test -- --testPathPattern=<failing>` locally |
| Audit failure | Step fails | Assess vulnerability; update or document exception |
| Prisma validate failure | Step fails | Verify schema unmodified; `git diff HEAD -- prisma/` |

## 8.11 Validation

| Check | Validation Type | Method |
|---|---|---|
| `ci.yml` is valid YAML | AUTOMATED | GitHub Actions parses on push |
| CI passes on `ubuntu-latest` | AUTOMATED | CI run |
| CI passes on `windows-latest` | AUTOMATED | CI run |
| CI passes on `macos-latest` | AUTOMATED | CI run |
| `npm audit` passes | AUTOMATED | CI step |
| Branch protection enabled on `main` | MANUAL | GitHub repository settings review |
| No credentials in workflow files | STRUCTURAL | Inspect `.github/workflows/ci.yml` |
| All actions pinned to major version | STRUCTURAL | Inspect `uses:` values |
| `timeout-minutes` on all jobs | STRUCTURAL | Inspect workflow file |
| `permissions: contents: read` | STRUCTURAL | Inspect workflow file |

---

# Chapter 9: Developer Experience Standards

## 9.1 `.editorconfig`

**MANDATORY:** `.editorconfig` exists at the repository root with the following minimum configuration:

| Directive | Required Value | Classification |
|---|---|---|
| `root = true` | Present as first line | MANDATORY |
| `[*]` section `charset` | `utf-8` | MANDATORY |
| `[*]` section `end_of_line` | `lf` | MANDATORY |
| `[*]` section `indent_style` | `space` | MANDATORY |
| `[*]` section `indent_size` | `2` | MANDATORY |
| `[*]` section `insert_final_newline` | `true` | MANDATORY |
| `[*]` section `trim_trailing_whitespace` | `true` | MANDATORY |
| `[*.md]` section `trim_trailing_whitespace` | `false` | MANDATORY (Markdown trailing spaces are semantic) |

Additional overrides for specific file types (e.g., `indent_size = 4` for Python files, if ever introduced) are permitted in subsequent sections.

## 9.2 `.gitattributes`

**MANDATORY:** `.gitattributes` exists at the repository root with the following minimum configuration:

| Rule | Required Form | Classification |
|---|---|---|
| Catch-all LF normalization | `* text=auto eol=lf` | MANDATORY (must be first rule) |
| TypeScript files | `*.ts text eol=lf` | MANDATORY |
| JavaScript files | `*.js text eol=lf` | MANDATORY |
| JSON files | `*.json text eol=lf` | MANDATORY |
| YAML files | `*.yml text eol=lf` | MANDATORY |
| Markdown files | `*.md text eol=lf` | MANDATORY |
| Shell scripts | `*.sh text eol=lf` | MANDATORY |
| PowerShell scripts | `*.ps1 text eol=lf` | MANDATORY |
| SQL files | `*.sql text eol=lf` | MANDATORY |
| Prisma schema | `*.prisma text eol=lf` | MANDATORY |
| PNG images | `*.png binary` | MANDATORY |
| JPEG images | `*.jpg binary` | MANDATORY |
| TypeScript build info | `*.tsbuildinfo binary` | MANDATORY |

**MANDATORY:** After committing `.gitattributes`, the line-ending normalization is applied to existing files using the re-normalization procedure:

```
git rm --cached -r .
git reset --hard
```

This procedure is documented in the F02 feature report and is non-negotiable. Skipping it means the `.gitattributes` rules are not applied to pre-existing files.

## 9.3 `.vscode/` Configuration

**MANDATORY:** Four files are committed under `.vscode/`:

| File | Purpose | Classification |
|---|---|---|
| `settings.json` | Workspace-level editor, formatter, and linter settings | MANDATORY |
| `tasks.json` | Named task aliases for npm scripts and Docker commands | MANDATORY |
| `launch.json` | Debug profiles for NestJS application and Jest | MANDATORY |
| `extensions.json` | Extension recommendations | MANDATORY |

No other files are committed to `.vscode/` during Phase 4.5.

## 9.4 Formatting Standards

**MANDATORY** settings in `.vscode/settings.json`:

| Setting | Required Value | Rationale |
|---|---|---|
| `editor.defaultFormatter` | `"esbenp.prettier-vscode"` | Prettier as universal formatter |
| `editor.formatOnSave` | `true` | Format without manual action |
| `editor.codeActionsOnSave` | `{ "source.fixAll.eslint": "explicit" }` | Auto-fix on save |
| `editor.tabSize` | `2` | Consistent with `.editorconfig` |
| `editor.insertSpaces` | `true` | Consistent with `.editorconfig` |
| `files.eol` | `"\n"` | LF line endings |
| `files.encoding` | `"utf8"` | UTF-8 without BOM |
| `typescript.tsdk` | `"node_modules/typescript/lib"` | Use workspace TypeScript |

## 9.5 Debugging Standards

**MANDATORY:** Two debug profiles exist in `.vscode/launch.json`:

| Profile Name | Runtime | Key Configuration |
|---|---|---|
| `Debug NestJS` | `npm run start:debug` | `"envFile": "${workspaceFolder}/.env"` |
| `Debug Current Test` | `npx jest` | `"envFile": "${workspaceFolder}/.env"`; `"--testPathPattern": "${relativeFile}"` |

**MANDATORY:** Debug profiles for Jest use `runtimeExecutable: "npx"` with `runtimeArgs: ["jest", "--runInBand"]`. Direct references to `node_modules/.bin/jest` are prohibited — they produce cross-platform failures on Windows where path resolution differs.

## 9.6 Tasks Standards

**MANDATORY** tasks in `.vscode/tasks.json`:

| Label | Command | Type |
|---|---|---|
| `Build` | `npm run build` | Default build task |
| `Start Dev` | `npm run start:dev` | Shell |
| `Test` | `npm run test` | Default test task |
| `Lint` | `npm run lint` | Shell |
| `Docker Up` | `docker compose -f docker-compose.dev.yml up -d` | Shell |
| `Docker Down` | `docker compose -f docker-compose.dev.yml down` | Shell |
| `Doctor` | `bash scripts/doctor.sh` | Shell (with Windows override) |
| `Prisma Generate` | `DATABASE_URL="..." npx prisma generate` | Shell |
| `Prisma Validate` | `DATABASE_URL="..." npx prisma validate` | Shell |

**MANDATORY:** Tasks that invoke `.sh` scripts must provide a `"windows"` platform override that runs the `.ps1` equivalent:

```json
"windows": {
  "command": "powershell.exe",
  "args": ["-File", "scripts/doctor.ps1"]
}
```

## 9.7 Extensions Standards

**MANDATORY** in `.vscode/extensions.json` `recommendations`:

| Extension ID | Purpose |
|---|---|
| `dbaeumer.vscode-eslint` | ESLint |
| `esbenp.prettier-vscode` | Prettier |
| `prisma.prisma` | Prisma schema |
| `EditorConfig.EditorConfig` | EditorConfig |
| `ms-vscode-remote.remote-containers` | Dev Containers |
| `ms-azuretools.vscode-docker` | Docker management |

Extensions in `unwantedRecommendations` must not include any extension from the MANDATORY list above.

## 9.8 Performance Targets

**RECOMMENDED** performance benchmarks for developer operations:

| Operation | Target Duration | Measurement Method |
|---|---|---|
| `npm run build` (warm, incremental) | < 30 seconds | Timed on PRIMARY platforms |
| `npm run test` | < 60 seconds | Timed on PRIMARY platforms |
| Docker PostgreSQL reaches `healthy` | < 30 seconds | `docker compose up -d`; timed |
| Doctor script completion | < 10 seconds | Timed on PRIMARY platforms |
| DevContainer first build | < 5 minutes | Timed on PRIMARY platforms |
| Zero-to-running (first time) | < 15 minutes | End-to-end onboarding test |

## 9.9 Developer Onboarding Standards

**MANDATORY** onboarding requirements for `README.md` (produced by F09):

| Requirement | Standard | Classification |
|---|---|---|
| Prerequisites section | List exact tool versions required | MANDATORY |
| Installation section | Platform-specific steps (Windows and Unix delineated) | MANDATORY |
| Local development section | Step-by-step from clean checkout to running app | MANDATORY |
| Verification section | How to confirm the environment is correct (`doctor.sh`) | MANDATORY |
| Troubleshooting section | Known issues from repository audit (CPB-001–CPB-008) and resolutions | MANDATORY |
| Prisma section | `DATABASE_URL` prefix requirement explicitly documented | MANDATORY |
| Docker Compose section | Explicit `-f docker-compose.dev.yml` flag documented | MANDATORY |
| Zero-to-running time | Verified end-to-end on at least one PRIMARY platform | MANDATORY |

## 9.10 Validation

| Check | Validation Type | Method |
|---|---|---|
| `.editorconfig` present and contains all MANDATORY directives | STRUCTURAL | File inspection |
| `.gitattributes` present and contains all MANDATORY rules | STRUCTURAL | File inspection |
| Line-ending normalization applied | AUTOMATED | `git ls-files --eol \| grep crlf` returns empty |
| `.vscode/settings.json` contains all MANDATORY settings | STRUCTURAL | File inspection |
| `.vscode/launch.json` has both debug profiles | STRUCTURAL | File inspection |
| `.vscode/tasks.json` has all MANDATORY tasks | STRUCTURAL | File inspection |
| All tasks execute from Command Palette | MANUAL | Manual execution |
| Debug profiles launch | MANUAL | F5 key; verify attach |
| Prettier formats on save | MANUAL | Edit `.ts` file; verify format-on-save |
| Onboarding verified end-to-end | MANUAL | Sign-off in F09 report |

---

# Chapter 10: Documentation Standards

## 10.1 Documentation Structure

All Phase 4.5 documentation resides within `docs/execution/platform/`. The following directory structure is MANDATORY:

| Path | Contents |
|---|---|
| `docs/execution/platform/` | IEF documents (00–10); PMIC; governance register |
| `docs/execution/platform/books/` | Book 1 (Governance); Book 2 (Standards); future books |
| `docs/execution/platform/reports/` | Feature reports (`F01_REPORT.md` through `F10_REPORT.md`) |

No Phase 4.5 documentation is committed outside these paths. Any exception requires an Engineering Decision Report.

## 10.2 Naming Convention

| Document Type | Naming Pattern | Example |
|---|---|---|
| Feature report | `FXX_REPORT.md` | `F04_REPORT.md` |
| Engineering Decision Report | `ENGINEERING_DECISION_REPORT_FXX.md` | `ENGINEERING_DECISION_REPORT_F04.md` |
| Phase-level EDR | `ENGINEERING_DECISION_REPORT_P45_NNN.md` | `ENGINEERING_DECISION_REPORT_P45_001.md` |
| IEF specification | `XX_TITLE_IN_UPPER_SNAKE.md` | `04_DOCKER_DEVELOPMENT_SPECIFICATION.md` |
| Platform governance book | `BOOK_N_TITLE_IN_UPPER_SNAKE.md` | `BOOK_1_ENGINEERING_GOVERNANCE.md` |
| Platform Master Implementation Contract | `PLATFORM_MASTER_IMPLEMENTATION_CONTRACT.md` | (fixed name) |
| Platform Final Acceptance | `10_PLATFORM_FINAL_ACCEPTANCE.md` | (fixed name) |
| Platform Final Report | `PLATFORM_IMPLEMENTATION_FINAL_REPORT.md` | (fixed name) |

All documentation file names use uppercase. All book file names are prefixed with `BOOK_N_`. All feature report file names are prefixed with `FXX_`.

## 10.3 Storage Rules

| Rule | Classification | Detail |
|---|---|---|
| All Phase 4.5 docs in `docs/execution/platform/` | MANDATORY | No exceptions without EDR |
| No documentation files in `src/` | MANDATORY | Application source code only in `src/` |
| No documentation files at repository root (beyond `README.md`, `CLAUDE.md`) | MANDATORY | Root documentation only for recognized conventions |
| Documentation committed in the same session as the feature it documents | MANDATORY | No documentation debt |
| No Markdown files in `.github/`, `scripts/`, `.vscode/` | MANDATORY | Those directories contain only functional artifacts |

## 10.4 Feature Reports

**MANDATORY** sections in every feature report (`reports/FXX_REPORT.md`):

| Section | Content |
|---|---|
| Header table | Feature ID, Status, Commit hash, Date, Specification reference |
| Summary | What the feature implements; which cross-platform blockers are resolved |
| Files Created | All new files with their path and purpose |
| Files Modified | All modified files with the nature of the change |
| Files NOT Modified | Explicit statement that protected paths are unchanged |
| Implementation Details | Technical description of each committed artifact |
| Engineering Decisions | Reference to any EDR; "None" if not applicable |
| Quality Gates | Gate, command, result (PASS/FAIL) for all four gates |
| Cross-Platform Blocker Resolution | Which CPB items are resolved by this feature |
| Repository Health | Commit hash, build state, lint state, test count, Prisma state |

A feature report that omits any MANDATORY section is incomplete. The transition validation (PMIC §29.7) will fail, and the feature will remain in DONE state.

## 10.5 Engineering Decision Reports

EDR structure is defined in Book 1 §10.3. The following documentation standards supplement that definition:

| Standard | Classification | Detail |
|---|---|---|
| EDR committed before the deviation is implemented | MANDATORY | Never implement first; document second |
| EDR committed in the same commit chain as the feature | MANDATORY | Not in a separate, later PR |
| EDR references the specific IEF or PMIC section being deviated from | MANDATORY | Section-level citation; not document-level |
| A SUPERSEDED EDR is updated with `[SUPERSEDED by §X.Y]` | MANDATORY | Content retained; status changed |

## 10.6 Progress Tracking

**MANDATORY** update standards for `09_PLATFORM_PROGRESS_TEMPLATE.md`:

| Update Trigger | Field Updated |
|---|---|
| Feature enters IN PROGRESS | Status field; Started date |
| Feature reaches DONE | Status field; Commit hash; Quality gate checkboxes |
| Feature reaches COMPLETE | Status field; Completed date |
| Stop condition triggered | Blocking Issues Register |
| Stop condition resolved | Blocking Issues Register status |
| Engineering Decision issued | Engineering Decisions Register |
| Feature report committed | Report link in feature section |

The progress template is the single source of truth for execution state. Any discrepancy between the progress template and the actual repository state constitutes SC-017 (Progress Template Inconsistency).

## 10.7 Acceptance Reports

The Platform Final Acceptance document (`10_PLATFORM_FINAL_ACCEPTANCE.md`) is the terminal governance artifact of Phase 4.5. Standards:

| Standard | Classification | Detail |
|---|---|---|
| Every acceptance criterion has a binary result | MANDATORY | PASS or FAIL; no "partial" or "n/a without justification" |
| All FAIL results documented with resolution | MANDATORY | No unresolved FAIL at the time of signing |
| Quality gate evidence table | MANDATORY | Gate × Feature matrix; all PASS |
| Written acceptance statement by Chief Architect | MANDATORY | Name, date, explicit statement of acceptance |
| QA Director co-signature | MANDATORY | Name, date |
| Post-closure actions confirmed | MANDATORY | KEB update, FEOS metrics update, tag pushed |

## 10.8 Cross References

**MANDATORY** cross-reference standard: every document that references another document must cite by document name and section number. Line number references are prohibited — they become stale as content is updated.

| Reference Type | Required Format | Example |
|---|---|---|
| Book reference | `Book N §X.Y` | `Book 1 §8.3` |
| PMIC reference | `PMIC §X.Y` | `PMIC §29.7` |
| IEF document reference | `IEF document XX §Y.Z` | `IEF document 04 §5.1` |
| FEOS reference | `FEOS <document-name>` | `FEOS 10_GIT_GOVERNANCE.md` |
| Feature report reference | `reports/FXX_REPORT.md` | `reports/F04_REPORT.md` |

## 10.9 Review Cycle

| Document | Review Trigger | Owner |
|---|---|---|
| Feature report | At feature completion | Chief Platform Engineer |
| EDR | Before approval | Engineering Governance Lead |
| Progress template | After each feature | Technical Program Manager |
| PMIC | At each Part completion | Chief Software Architect |
| Books (1, 2) | Annual or phase transition | Engineering Governance Lead |
| Final Acceptance | At F10 completion | Chief Software Architect + QA Director |

## 10.10 Validation

| Check | Validation Type | Method |
|---|---|---|
| All documents in correct paths | STRUCTURAL | Directory tree inspection |
| Feature reports contain all MANDATORY sections | MANUAL | Section checklist per report |
| EDRs committed before implementation | PROCEDURAL | `git log` ordering |
| Progress template up to date | STRUCTURAL | Compare to feature status |
| Cross-references use name+section format | MANUAL | Review during documentation commit |
| Final Acceptance has binary results for all criteria | MANUAL | Review during F10 |

---

# Chapter 11: Quality Gate Standards

## 11.1 Build Gate

**Purpose:** Verify TypeScript compilation succeeds without errors.

| Standard | Required Value | Classification |
|---|---|---|
| Command | `npm run build` | MANDATORY |
| Exit code | 0 | MANDATORY |
| Output | `dist/` directory populated | MANDATORY |
| TypeScript errors | 0 | MANDATORY |
| Source files modified | 0 (Phase 4.5 constraint) | MANDATORY |
| Clean build on first gate run per feature | `dist/` deleted before first gate run | RECOMMENDED |

**Failure behavior:** Stop immediately. Do not proceed to gate 2. Diagnose the TypeScript error. Apply the minimum fix. Restart from gate 1.

## 11.2 Lint Gate

**Purpose:** Enforce code style and quality rules via ESLint.

| Standard | Required Value | Classification |
|---|---|---|
| Command | `npm run lint` | MANDATORY |
| Exit code | 0 | MANDATORY |
| ESLint errors | 0 | MANDATORY |
| ESLint warnings | Permitted (do not fail gate) | PERMITTED |
| Auto-fix | Applied automatically (included in npm script) | INCLUDED |
| New ESLint ignores | Require inline comment with justification | MANDATORY |

**Failure behavior:** Stop immediately. Apply auto-fix. Review remaining errors. Apply manual fix if needed. Restart from gate 1.

## 11.3 Tests Gate

**Purpose:** Verify all application unit tests pass.

| Standard | Required Value | Classification |
|---|---|---|
| Command | `npm run test` | MANDATORY |
| Exit code | 0 | MANDATORY |
| Tests passing | 482/482 | MANDATORY |
| Test count decrease | Prohibited | MANDATORY |
| New tests added in Phase 4.5 | Prohibited | MANDATORY |
| Intermittent failure | Document in KEB; run 3 times; proceed only if all pass | MANDATORY |
| Isolated suite run (diagnostic) | `npm run test -- --testPathPattern=<suite>` | PERMITTED (diagnostic only) |

**Failure behavior:** Stop immediately. Identify the failing suite. Determine whether the failure is in application code (SC-003 + SC-005) or infrastructure code (investigate). Restart from gate 1 after fix.

## 11.4 Prisma Validate Gate

**Purpose:** Verify the Prisma schema file is syntactically valid and structurally correct.

| Standard | Required Value | Classification |
|---|---|---|
| Command | `DATABASE_URL="..." npx prisma validate` | MANDATORY |
| `DATABASE_URL` prefix | Required | MANDATORY (project constraint) |
| Exit code | 0 | MANDATORY |
| Live database required | No — `validate` is a static operation | CONFIRMED |
| Schema modified | Prohibited — verify with `git diff HEAD -- prisma/` | MANDATORY |

**Failure behavior:** Immediately check whether `prisma/schema.prisma` was modified. If yes: SC-030 (critical). If no: investigate Prisma CLI version compatibility. Restart from gate 1 after fix.

## 11.5 Execution Order

The quality gate sequence is fixed and non-negotiable:

```
Gate 1: npm run build
  ↓ (exit 0 required)
Gate 2: npm run lint
  ↓ (exit 0, 0 errors required)
Gate 3: npm run test
  ↓ (exit 0, 482/482 required)
Gate 4: DATABASE_URL="..." npx prisma validate
  ↓ (exit 0 required)
COMMIT AUTHORIZED
```

Running gates out of sequence, skipping a gate, or abbreviating a gate is a governance violation. The rationale: build errors can produce misleading lint output; lint auto-fix can affect test behavior; a passing test suite on a schema that fails validation is not a safe commit state.

## 11.6 Failure Policy

| Gate | Failure Response | Restart Point |
|---|---|---|
| Gate 1 (Build) | Stop; diagnose TypeScript errors; fix | Gate 1 |
| Gate 2 (Lint) | Stop; apply auto-fix; manual fix if remaining errors | Gate 1 |
| Gate 3 (Tests) | Stop; identify failing suite; diagnose; fix | Gate 1 |
| Gate 4 (Prisma) | Stop; verify schema unmodified; diagnose; fix | Gate 1 |

**MANDATORY:** After any gate failure and fix, the sequence always restarts from Gate 1. Partial re-runs (e.g., "I only changed a comment, I'll just re-run lint") are prohibited. The full sequence is cheap and reliable; the assumption that a change only affects one gate is not.

## 11.7 Retry Policy

Quality gates do not have a retry count for intermittent failures. A gate that fails must be fixed before a retry is meaningful. A flaky gate (passes on some runs, fails on others) is a defect that must be investigated and resolved — not worked around by re-running until it passes.

**Exception:** Intermittent test failures (flaky tests) are documented in the KEB, run three times to confirm the failure rate, and addressed on a case-by-case basis. Three consecutive passes are required before a feature is allowed to proceed past Gate 3 with a documented flaky test.

## 11.8 Acceptance Criteria

A commit is authorized only when all of the following are true:

| Criterion | Verification |
|---|---|
| Gate 1 passed on the staged set of files | `npm run build` exit 0 |
| Gate 2 passed on the staged set of files | `npm run lint` exit 0, 0 errors |
| Gate 3 passed on the staged set of files | `npm run test` exit 0, 482/482 |
| Gate 4 passed on the staged set of files | `npx prisma validate` exit 0 |
| Staged files are only in-scope files | `git diff --staged --name-only` inspection |
| Working tree is clean after staging | `git status` shows only staged changes |

## 11.9 Evidence Collection

Quality gate evidence is recorded in the feature report (`reports/FXX_REPORT.md`) in the Quality Gates section:

| Column | Content |
|---|---|
| Gate | Human-readable gate name |
| Command | Exact command executed |
| Result | `PASS` or `FAIL — <brief description>` |

**MANDATORY:** Evidence reflects the state of the implementation commit, not an intermediate state. A gate result recorded from a state that differs from the committed state is falsified evidence — a governance violation of the highest severity.

## 11.10 Metrics

At Phase 4.5 completion, the following quality metrics must be true:

| Metric | Required Value |
|---|---|
| Test count | 482 (unchanged from Phase 4.5 entry) |
| ESLint errors | 0 |
| TypeScript compilation errors | 0 |
| Prisma schema validity | PASS |
| CI matrix failures on `main` | 0 (across all three OS targets) |
| npm audit high severity vulnerabilities | 0 |

## 11.11 Validation

| Check | Validation Type | Method |
|---|---|---|
| All four gates pass on `main` HEAD | AUTOMATED | CI pipeline |
| Gate sequence enforced (build before lint, etc.) | PROCEDURAL | CI step ordering in `ci.yml` |
| Test count = 482 | AUTOMATED | CI `npm run test` output |
| Quality gate evidence in feature reports | MANUAL | Report review during transition |
| No `--no-verify` flag in any committed script | STRUCTURAL | `grep -r "no-verify" -- scripts/` returns empty |

---

# Chapter 12: Commit Standards

## 12.1 Implementation Commit

The implementation commit contains all feature implementation files and nothing else.

**MANDATORY** requirements:

| Requirement | Standard | Classification |
|---|---|---|
| All feature files in one commit | No split implementation commits | MANDATORY |
| Only in-scope files staged | `git diff --staged --name-only` matches feature scope | MANDATORY |
| Quality gates pass on staged state | All four gates; committed state not a future state | MANDATORY |
| Message format | `feat(platform/FXX): <description>` | MANDATORY |
| Conventional Commits compliance | Type, scope, description; body optional | MANDATORY |
| Co-author attribution (if AI-assisted) | `Co-Authored-By: <tool> <email>` in commit body | MANDATORY |

## 12.2 Documentation Commit

The documentation commit contains only documentation files for the completed feature.

**MANDATORY** requirements:

| Requirement | Standard | Classification |
|---|---|---|
| Files: `reports/FXX_REPORT.md` and `09_PLATFORM_PROGRESS_TEMPLATE.md` | No implementation files | MANDATORY |
| Follows immediately after the implementation commit | No intervening commits | MANDATORY |
| Message format | `docs(platform/FXX): <description>` | MANDATORY |
| Repository remains in quality-gate-passing state after this commit | Gates pass on HEAD after documentation commit | MANDATORY |

## 12.3 Commit Naming

All commit messages follow Conventional Commits with Phase 4.5 scope conventions:

| Type | Scope | When Used |
|---|---|---|
| `feat` | `platform/FXX` | Feature implementation commits |
| `docs` | `platform/FXX` | Feature documentation commits |
| `docs` | `platform` | Cross-feature governance documentation |
| `fix` | `platform/FXX` | Stop condition fixes within a feature |
| `chore` | `platform` | Housekeeping with no user-visible change |

**MANDATORY:** The description (after the `:`) is written in the imperative mood, present tense: "add docker health checks" not "added docker health checks" and not "adding docker health checks".

**MANDATORY:** The description does not exceed 72 characters (type + scope + description combined, first line).

## 12.4 Commit Verification

After every commit, the following verification confirms the commit captured the intended state:

| Check | Method | Classification |
|---|---|---|
| `git status` is clean | `git status` | MANDATORY |
| Commit appears in log | `git log --oneline -1` | MANDATORY |
| Commit hash matches feature report | Inspect feature report after documentation commit | MANDATORY |
| Protected paths unchanged | `git diff HEAD~N -- src/ prisma/ test/ docs/feos/` | MANDATORY |
| `npm run build` passes on HEAD | Re-run after commit | RECOMMENDED |

## 12.5 History Integrity

**MANDATORY** git history requirements throughout Phase 4.5:

| Requirement | Standard |
|---|---|
| Linear history on `main` | No merge commits; rebase if branch used |
| No orphaned commits | `git fsck --lost-found` returns empty |
| No force-pushed history | FEOS prohibition |
| No amended pushed commits | FEOS prohibition |
| All Phase 4.5 commits in sequence | `git log` shows Phase 4.5 feature commits in F01→F10 order |
| No work-in-progress commits on `main` | `wip:`, `tmp:`, `WIP:` prefixes are prohibited on `main` |

## 12.6 Forbidden Commits

The following commit types are prohibited on `main` under all circumstances:

| Forbidden Commit | Reason |
|---|---|
| Commit with failing quality gates | Core invariant; commits this after gate failure are reverted |
| `wip:` or `tmp:` commits | No incomplete work on `main` |
| Merge commits | Linear history requirement (FEOS) |
| Empty commits | No informational value; prohibited |
| Commits modifying protected paths without EDR | SC-005; reverted immediately |
| Force-pushed commits | FEOS prohibition |
| Amended pushed commits | FEOS prohibition |
| Commits containing credentials | SC-006; reverted; credential rotated |
| Commits with non-Conventional message format | SC-016; corrected by follow-up commit |

## 12.7 Exception Policy (Third Commit)

Each feature is permitted a maximum of three commits: one implementation commit, one documentation commit, and one exception commit. The exception commit is used only for a quality gate fix discovered after the implementation commit.

**MANDATORY** requirements for the exception commit:

| Requirement | Standard |
|---|---|
| Message format | `fix(platform/FXX): <description of the fix>` |
| Scope | Only the files needed to fix the failing gate; no new feature scope |
| EDR | If the fix is non-trivial or changes an implementation decision |
| Documentation in feature report | "Commit Exception" section with root cause and fix |
| Quality gates | All four gates pass after the exception commit |

A fourth commit is a governance violation. If a fourth commit appears necessary, the feature has a quality problem that requires a stop condition classification and resolution.

## 12.8 Validation

| Check | Validation Type | Method |
|---|---|---|
| Implementation commit message format | STRUCTURAL | `git log --oneline` inspection |
| Documentation commit message format | STRUCTURAL | `git log --oneline` inspection |
| Max 3 commits per feature | STRUCTURAL | `git log` count for feature range |
| No merge commits on `main` | AUTOMATED | `git log --merges main` returns empty |
| No credentials in committed files | AUTOMATED | `git log -S "password" -- . \| grep -v .env.example` |
| History linear | AUTOMATED | `git log --oneline --graph` shows linear |
| Protected paths unchanged across all commits | AUTOMATED | `git diff <pre-phase-tag>..HEAD -- src/ prisma/ test/` |

---

# Chapter 13: Engineering Standards Validation

## 13.1 Purpose

This chapter is the self-certification checklist for Book 2. It confirms that the standards defined in this document are internally consistent, compliant with higher-authority governance documents, and complete in their coverage of the engineering standards domain.

## 13.2 Internal Consistency

| Check | Status |
|---|---|
| No standard in Chapter N contradicts a standard in Chapter M | PASS |
| MANDATORY classifications are unambiguous and specific | PASS |
| RECOMMENDED classifications are distinct from MANDATORY | PASS |
| Validation sections use defined validation types (AUTOMATED/MANUAL/STRUCTURAL/PROCEDURAL) | PASS |
| Version numbers are consistent across all chapters (Node `24.16.0`, Prisma `6.16.2`, PostgreSQL `16.4-alpine`) | PASS |
| Quality gate sequence in Chapter 11 matches the sequence referenced in other chapters | PASS |
| Commit message formats in Chapter 12 are consistent with examples in Chapter 2 | PASS |
| Docker container names in Chapter 4 are consistent with references in other chapters | PASS |
| Protected paths in Chapter 2 are consistent with Book 1 stop conditions | PASS |
| Cross-platform compatibility requirements in Chapter 3 are consistent with Chapter 8 matrix | PASS |

## 13.3 FEOS Compliance

| FEOS Requirement | Book 2 Compliance |
|---|---|
| Force push to `main` prohibited | §7.5 Git Standards; §12.5 History Integrity |
| Merge commits prohibited on `main` | §12.5 History Integrity |
| `prisma db pull` prohibited | §7.4 Prisma Standards |
| Credentials not committed | §2.7 Repository Hygiene; §4.9 Docker Secrets; §5.8 DevContainer Security |
| Protected paths not modified during Platform phases | §2.4 Protected Directories |
| Quality gates required before commit | §11.5 Execution Order; §12.1 Implementation Commit |
| Engineering decisions documented | §10.5 Engineering Decision Reports |
| Linear git history | §12.5 History Integrity |
| `DATABASE_URL` prefixed on Prisma CLI | §7.4 Prisma Standards; §11.4 Prisma Validate Gate |

**FEOS Compliance:** CONFIRMED

## 13.4 Book 1 Compliance

| Book 1 Requirement | Book 2 Compliance |
|---|---|
| Governance before implementation (Principle 1) | §1.4 Infrastructure Principles; §2.5 Dependency Rules |
| Architecture preservation (Principle 2) | §1.6 Architecture Compatibility; §2.4 Protected Directories |
| Quality gate sovereignty (Principle 3) | Chapter 11 Quality Gate Standards |
| Deterministic engineering (Principle 4) | §1.4 Infrastructure Principles; §2.6 Versioning |
| Minimum viable change (Principle 5) | §1.7 Validation (scope constraint) |
| Single source of truth (Principle 6) | §10.1 Documentation Structure; §10.6 Progress Tracking |
| Reversibility (Principle 7) | §1.4 Infrastructure Principles; §12.7 Exception Policy |
| Documentation parity (Principle 8) | §10.3 Storage Rules; §10.4 Feature Reports |
| Auditability (Principle 9) | §10.2 Naming Convention; §10.5 EDRs; §12.3 Commit Naming |
| Cross-platform parity (Principle 10) | Chapter 3 Cross-Platform Standards |
| Secrets hygiene (Principle 11) | §3.7 Environment Variables; §4.9 Docker Secrets |
| Feature isolation (Principle 12) | §2.2 Folder Ownership |
| Fail fast (Principle 13) | §11.6 Failure Policy; §6.7 Failure Handling |
| Infrastructure immutability (Principle 14) | §1.4 Infrastructure Principles; §2.6 Versioning |
| Progressive maturity (Principle 15) | §2.9 Repository Maturity Levels |
| Zero tolerance for silent failures (Principle 16) | §11.6 Failure Policy; §11.7 Retry Policy |
| Commit atomicity (Principle 17) | §12.1 Implementation Commit; §12.2 Documentation Commit |
| Explicit over implicit (Principle 18) | §1.2 Applicability; §2.3 Naming Standards |
| Platform independence from application (Principle 19) | §1.6 Architecture Compatibility; §2.4 Protected Directories |
| Permanent governance (Principle 20) | §1.2 Applicability |

**Book 1 Compliance:** CONFIRMED

## 13.5 IEF Compliance

| IEF Requirement | Book 2 Compliance |
|---|---|
| IEF document 03 (DevContainer) standards reflected | Chapter 5 |
| IEF document 04 (Docker) standards reflected | Chapter 4 |
| IEF document 05 (Bootstrap) standards reflected | Chapter 6 |
| IEF document 06 (CI/CD) standards reflected | Chapter 8 |
| IEF document 07 (Developer Experience) standards reflected | Chapter 9 |
| IEF document 08 (Acceptance Criteria) standards reflected | §11.8 Acceptance Criteria; §13.8 |
| IEF document 09 (Progress Template) standards reflected | §10.6 Progress Tracking |
| IEF feature dependency order preserved | §2.1 Repository Layout (feature order) |

**IEF Compliance:** CONFIRMED

## 13.6 Cross-Reference Validation

| Cross-Reference | Status |
|---|---|
| All Book 1 references use `Book 1 §X.Y` format | CONFIRMED |
| All PMIC references use `PMIC §X.Y` format | CONFIRMED |
| All FEOS references use `FEOS <document-name>` format | CONFIRMED |
| All feature references use `FXX` format | CONFIRMED |
| All stop condition references use `SC-NNN` format | CONFIRMED |
| All EDR references use correct file naming | CONFIRMED |
| Docker image versions consistent with §7.9 Version Pinning Summary | CONFIRMED |

**Cross-Reference Validation:** PASS

## 13.7 Engineering Standards Completeness

| Domain | Chapter | Standard Count | Coverage |
|---|---|---|---|
| Infrastructure Engineering | Chapter 1 | 8 principles + 6 objectives | COMPLETE |
| Repository | Chapter 2 | 10 sections, 40+ standards | COMPLETE |
| Cross-Platform | Chapter 3 | 10 sections, 30+ standards | COMPLETE |
| Docker | Chapter 4 | 12 sections, 35+ standards | COMPLETE |
| DevContainer | Chapter 5 | 9 sections, 25+ standards | COMPLETE |
| Bootstrap | Chapter 6 | 8 sections, 30+ standards | COMPLETE |
| Toolchain | Chapter 7 | 13 sections, 40+ standards | COMPLETE |
| CI/CD | Chapter 8 | 11 sections, 35+ standards | COMPLETE |
| Developer Experience | Chapter 9 | 10 sections, 40+ standards | COMPLETE |
| Documentation | Chapter 10 | 10 sections, 30+ standards | COMPLETE |
| Quality Gates | Chapter 11 | 11 sections, 30+ standards | COMPLETE |
| Commit Standards | Chapter 12 | 8 sections, 30+ standards | COMPLETE |

## 13.8 Completeness Against Platform Acceptance Criteria

The IEF document `08_PLATFORM_ACCEPTANCE_CRITERIA.md` defines the acceptance criteria for Platform Phase 4.5. Every acceptance criterion must be governed by a standard in Book 2:

| Acceptance Criterion Domain | Governing Book 2 Chapters |
|---|---|
| Node version governance (CPB-001) | §7.1 Node.js |
| Line-ending governance (CPB-002) | §9.2 `.gitattributes`; §3.4 UTF-8; §11 CI |
| Docker infrastructure (CPB-003) | Chapter 4 |
| DevContainer (CPB-004) | Chapter 5 |
| CI/CD pipeline (CPB-005) | Chapter 8 |
| Cross-platform validation (CPB-006) | Chapter 3; §8.2 Matrix Builds |
| Secrets management (CPB-007) | §3.7 Environment Variables; §4.9; §5.8 |
| Developer onboarding (CPB-008) | §9.9 Developer Onboarding; Chapter 6 |

**Completeness:** All cross-platform blockers addressed by governing standards in Book 2.

## 13.9 Forward Applicability

Book 2 standards must remain applicable to future Platform phases. Verify:

| Forward Applicability Check | Result |
|---|---|
| Version numbers are stated as Phase 4.5 specific where applicable | PASS — noted in §1.6, §2.6, §7.1 |
| Standards that are phase-specific are identified | PASS — Phase 4.5 feature references clearly scoped |
| Standards that are permanent are not marked as phase-specific | PASS |
| Tool compatibility matrix is extendable without restructuring | PASS — §7.10 matrix format accommodates new OS rows |
| Repository maturity model is extensible | PASS — §2.9 table format accommodates new dimensions |
| Chapter 2 (Repository Standards) references feature names; update required each phase | NOTED — §2.1 will require update for Phase 5 features |

**Forward Applicability:** CONFIRMED with noted §2.1 update requirement for each new Platform phase.

## 13.10 Final Certification Statement

Book 2 — Engineering Standards is internally consistent, compliant with FEOS, Book 1 (Engineering Governance), PMIC, and the Infrastructure Execution Framework. It provides complete engineering standards coverage across all thirteen chapters. Every standard is specific, measurable, and assigned a MANDATORY or RECOMMENDED classification. Every chapter provides a validation section specifying how compliance is verified.

This engineering standards validation was performed at Book 2 Version 1.0 authoring. Subsequent reviews must repeat this validation and document any findings.

**Engineering Standards Validation:** PASS

---

*End of Book 2 — Engineering Standards*
*FactoryERP Platform Engineering*
*Version 1.0 — 2026-07-01*
