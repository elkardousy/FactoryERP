# 05 — Bootstrap and Toolchain Specification
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Complete specification for developer toolchain requirements and bootstrap/doctor scripts |
| **Scope** | Required tools, version constraints, installation order, bootstrap scripts, doctor/verify scripts |
| **Audience** | Platform engineers, new developers, DevOps lead |
| **Status** | SPECIFICATION COMPLETE — Implementation Pending |
| **Owner** | Principal Platform Engineer |
| **Review Cycle** | On major tool version changes or new tool additions |
| **Version** | 1.0 |
| **Dependencies** | Repository audit (01), cross-platform requirements (02), Docker spec (04) |
| **Inputs** | Tool version requirements from audit; OS support matrix from (02) |
| **Outputs** | `scripts/doctor.sh`, `scripts/doctor.ps1`, `.nvmrc`, `package.json` `engines` field (already governed by MEC) |

---

## 1. Bootstrap Philosophy

### 1.1 Core Principle

A developer with a clean machine and the documented prerequisites should be able to reach a running FactoryERP development environment by executing a documented sequence of no more than five commands. The bootstrap process is deterministic: the same inputs always produce the same environment.

### 1.2 Script Philosophy

Bootstrap scripts are NOT installers. They do not install Node.js, Docker, or VSCode on the developer's machine. They verify that required tools are present at the correct versions, provide actionable error messages when prerequisites are missing, and perform application-level setup (dependency installation, code generation).

**MANDATORY:** Bootstrap and doctor scripts are POSIX sh (`.sh`) scripts for Linux/macOS and equivalent PowerShell (`.ps1`) scripts for Windows. Neither script type performs OS-level tool installation.

### 1.3 Idempotency

**MANDATORY:** All bootstrap and doctor scripts MUST be idempotent — safe to run multiple times without side effects. `npm ci` replaces `node_modules/` on each run (acceptable). `prisma generate` is idempotent. Schema migration commands (`prisma migrate resolve --applied`) are idempotent by design.

---

## 2. Required Tools

### 2.1 Mandatory Prerequisites (Developer Must Install)

These tools MUST be installed on the developer's machine before any bootstrap script is run. Their installation is not automated by Phase 4.5 scripts.

| Tool | Required Version | Version Check Command | Installation Reference |
|---|---|---|---|
| Node.js | 24.16.0 (exact, or via nvm) | `node --version` | nodejs.org or nvm |
| npm | 11.x (bundled with Node 24) | `npm --version` | Bundled with Node |
| Git | 2.40.0+ | `git --version` | git-scm.com |
| Docker Desktop (Windows/macOS) | 4.25.0+ | `docker --version` | docker.com |
| Docker Engine (Linux) | 24.0.0+ | `docker --version` | docs.docker.com/engine/install |
| Docker Compose | 2.20.0+ (v2, not v1) | `docker compose version` | Bundled with Docker Desktop |

**MANDATORY:** The doctor script MUST verify ALL items in this table and report specific failures with remediation instructions.

### 2.2 Optional Prerequisites (For Specific Workflows)

| Tool | When Required | Version | Notes |
|---|---|---|---|
| VSCode | DevContainer workflow | 1.90.0+ | `code --version` |
| Dev Containers extension | DevContainer workflow | Latest | VSCode extension ID: `ms-vscode-remote.remote-containers` |
| nvm (Linux/macOS) | Node version management | Latest | `nvm --version` |
| nvm-windows | Node version management (Windows) | 1.1.12+ | Separate installer from nvm |
| Xcode CLI Tools (macOS) | `bcrypt` compilation on macOS | Latest | `xcode-select --install` |
| Build Tools for VS (Windows) | `bcrypt` compilation on Windows | 2022 | Via Node.js installer or winget |

### 2.3 Tools Provided by DevContainer (No Local Install Required)

When working inside the DevContainer, these tools are pre-installed and require no local installation:

| Tool | Provided By |
|---|---|
| Node.js 24 | Base image `mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm` |
| npm | Base image |
| Git | Base image |
| Python 3 | Base image |
| `build-essential` | Base image |
| Prisma CLI | `npm ci` (`postCreateCommand`) |
| NestJS CLI | `npm ci` (`postCreateCommand`) |

---

## 3. Node.js Version Management

### 3.1 `.nvmrc`

**MANDATORY:** `.nvmrc` MUST exist at the repository root containing:

```
24.16.0
```

No `v` prefix. No trailing newline. This is the format expected by nvm, nvm-windows, and Volta.

### 3.2 `package.json` `engines` Field

**MANDATORY:** `package.json` MUST include an `engines` field:

```json
"engines": {
  "node": ">=24.0.0 <25.0.0",
  "npm": ">=11.0.0"
}
```

This provides npm-level enforcement when `--engines-strict` is used (CI) and provides documentation for all developers.

### 3.3 nvm Usage

On Linux/macOS:
```sh
nvm install   # Reads .nvmrc, installs Node 24.16.0 if not present
nvm use       # Switches to Node 24.16.0
```

On Windows (nvm-windows):
```powershell
nvm install 24.16.0
nvm use 24.16.0
```

### 3.4 Version Drift Detection in Doctor Script

The doctor script MUST compare `node --version` output against the `.nvmrc` content and fail with a non-zero exit code if they do not match.

---

## 4. Bootstrap Scripts

### 4.1 `scripts/setup.sh` (Linux/macOS)

**Purpose:** One-time environment setup on a machine that already has all prerequisites installed.

**Operations (in order):**
1. Verify Node version matches `.nvmrc` — exit with error if mismatch
2. Verify Docker is running — exit with error if not
3. `npm ci` — install dependencies (clean install; respects `package-lock.json`)
4. Copy `.env.example` to `.env` if `.env` does not exist (with console notice to edit it)
5. `docker compose -f docker-compose.dev.yml up -d` — start PostgreSQL
6. Wait for PostgreSQL health: poll `docker compose -f docker-compose.dev.yml ps` until `db` is healthy (max 30 seconds)
7. `DATABASE_URL="${DATABASE_URL}" npx prisma generate` — generate Prisma client
8. Print success message with next steps

**Error handling:** Each step MUST check the exit code of the previous command. On failure, print a specific error message and exit with code 1.

### 4.2 `scripts/setup.ps1` (Windows PowerShell)

**Purpose:** Equivalent of `setup.sh` for Windows developers not using WSL.

The PowerShell script MUST perform the same operations as `setup.sh`, adapted for PowerShell syntax:
- Use `$LASTEXITCODE` for exit code checking
- Use `$env:DATABASE_URL` for environment variables
- Use `;` (not `&&`) for sequential execution (PowerShell 5.1 does not support `&&`)

**Note:** PowerShell 5.1 (Windows PowerShell) is the target runtime, NOT PowerShell 7. This ensures compatibility with unmodified Windows 11 installations.

### 4.3 `scripts/reset.sh` / `scripts/reset.ps1`

**Purpose:** Full environment reset — destroys all Docker volumes and reinstalls dependencies.

**Operations:**
1. `docker compose -f docker-compose.dev.yml down -v` — destroy containers and volumes (DATA LOSS)
2. `rm -rf node_modules` — remove installed packages
3. `rm -f .env` — remove local environment file (with confirmation prompt)
4. Print instructions to re-run `setup.sh`

**MANDATORY:** The reset script MUST display a confirmation prompt before executing destructive operations:
```
WARNING: This will destroy all local database data. Type "yes" to continue:
```

---

## 5. Doctor Script

### 5.1 Purpose

The doctor script is an environment health check tool. It does NOT modify any state. It checks all prerequisites and reports the status of each check, then exits 0 if all checks pass or 1 if any check fails.

### 5.2 `scripts/doctor.sh` (Linux/macOS)

**Checks (in order):**

| Check | Pass Condition | Fail Message |
|---|---|---|
| Git available | `git --version` exits 0 | `git not found — install from git-scm.com` |
| Node.js available | `node --version` exits 0 | `node not found — install from nodejs.org or use nvm` |
| Node.js version matches `.nvmrc` | `node --version` output equals `.nvmrc` content | `Node version X found, expected Y — run: nvm use` |
| npm available | `npm --version` exits 0 | `npm not found — should be bundled with Node.js` |
| npm version meets minimum | `npm --version` >= 11.0.0 | `npm version X is below minimum 11.0.0` |
| Docker available | `docker --version` exits 0 | `docker not found — install Docker Desktop or Docker Engine` |
| Docker daemon running | `docker info` exits 0 | `Docker daemon not running — start Docker Desktop` |
| Docker Compose v2 available | `docker compose version` exits 0 | `docker compose (v2) not found — upgrade Docker Desktop` |
| `.env` file exists | `test -f .env` | `.env not found — copy .env.example to .env and fill in values` |
| `DATABASE_URL` set | `test -n "$DATABASE_URL"` | `DATABASE_URL not set in environment or .env` |
| `JWT_SECRET` set | `test -n "$JWT_SECRET"` | `JWT_SECRET not set in environment or .env` |
| `node_modules` installed | `test -d node_modules` | `node_modules not found — run: npm ci` |
| Prisma client generated | `test -d node_modules/@prisma/client` | `Prisma client not generated — run: npx prisma generate` |
| PostgreSQL container healthy | `docker compose ps db --format json` | `PostgreSQL not healthy — run: docker compose -f docker-compose.dev.yml up -d` |
| `prisma validate` passes | `DATABASE_URL="..." npx prisma validate` exits 0 | `Prisma schema validation failed` |

**MANDATORY:** The doctor script MUST source `.env` if it exists (using `. .env` or equivalent) so that `DATABASE_URL` and other variables are available during checks.

### 5.3 `scripts/doctor.ps1` (Windows)

Equivalent checks to `doctor.sh`, adapted for PowerShell:
- Use `Get-Command` instead of `which` / `command -v`
- Use `$env:DATABASE_URL` for variable access
- Source `.env` by reading and parsing its contents into environment variables

### 5.4 Doctor Script Output Format

```
[PASS] git — version 2.48.1
[PASS] node — version 24.16.0 (matches .nvmrc)
[PASS] npm — version 11.13.0
[PASS] docker — version 27.1.2
[PASS] docker daemon — running
[PASS] docker compose — version v2.29.7
[PASS] .env — present
[PASS] DATABASE_URL — set
[PASS] JWT_SECRET — set
[PASS] node_modules — installed
[PASS] @prisma/client — generated
[PASS] PostgreSQL — healthy
[PASS] prisma validate — PASS
---
All checks passed. Environment is ready.
```

On failure:
```
[FAIL] node — version 22.14.0 (expected 24.16.0 from .nvmrc)
         Fix: run "nvm use" in this directory
---
1 check(s) failed. Run the above fix commands and re-run scripts/doctor.sh
```

---

## 6. Installation Order

The required order for a first-time setup on a clean machine:

1. Install Git
2. Install Docker Desktop (includes Docker Compose v2)
3. Install nvm (Linux/macOS) or nvm-windows (Windows)
4. `nvm install 24.16.0 && nvm use 24.16.0`
5. Clone the repository: `git clone <repo-url>`
6. `cd FactoryERP`
7. `cp .env.example .env` — and edit `.env` with real values
8. `scripts/setup.sh` (or `scripts/setup.ps1` on Windows)

Windows-specific prerequisite: Enable long path support:
```
# Run as Administrator:
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

---

## 7. Tool Verification Matrix

| Tool | Verification Command | Expected Output Pattern |
|---|---|---|
| Git | `git --version` | `git version 2.*` |
| Node.js | `node --version` | `v24.16.0` |
| npm | `npm --version` | `11.*` |
| Docker | `docker --version` | `Docker version 24.*` or higher |
| Docker Compose | `docker compose version` | `Docker Compose version v2.*` |
| Prisma CLI | `npx prisma --version` | `prisma: 6.16.*` |
| NestJS CLI | `npx @nestjs/cli --version` | `11.*` |

---

## 8. Validation

The bootstrap and toolchain implementation is valid when:

| Check | Method |
|---|---|
| `.nvmrc` exists at project root | `test -f .nvmrc` |
| `.nvmrc` contains `24.16.0` | `cat .nvmrc` |
| `package.json` has `engines.node` | `cat package.json | jq .engines` |
| `scripts/doctor.sh` exits 0 on a configured machine | Manual test + CI dry-run |
| `scripts/doctor.sh` exits 1 with specific messages on a broken machine | Manual test |
| `scripts/setup.sh` exits 0 on a clean machine | Manual test |
| `scripts/setup.sh` is idempotent (run twice, no errors) | Manual test |
| Doctor script completes in under 10 seconds | Timed execution |

---

## 9. Compliance

- Master Execution Contract (00) — Rules IEF-001, IEF-008, IEF-009
- Cross-Platform Requirements (02) — Sections 6 (Node.js), 3 (Line Endings), 2.1 (Path Separators)
- FEOS `14_OPERATIONAL_PLAYBOOK.md` — runbooks follow this format
- FEOS `13_ENGINEERING_STANDARDS.md` — script quality standards

---

## 10. Engineering Rules Summary

| Rule | Classification | Description |
|---|---|---|
| `.nvmrc` required | MANDATORY | Pinned Node version; no `v` prefix |
| `engines` field required | MANDATORY | npm enforcement of Node version |
| Doctor scripts exit non-zero on failure | MANDATORY | CI-safe health check contracts |
| Bootstrap scripts are idempotent | MANDATORY | Safe to re-run without side effects |
| No OS-level installation in scripts | MANDATORY | Scripts verify, not install |
| POSIX sh for `.sh` scripts | MANDATORY | No bash-isms; `/bin/sh` compatible |
| PowerShell 5.1 target for `.ps1` | MANDATORY | Windows PowerShell; not PS7 |
| Confirmation prompts for destructive operations | MANDATORY | `reset.sh` must confirm before `down -v` |
| Doctor script runs in < 10 seconds | RECOMMENDED | Encourages routine use |
