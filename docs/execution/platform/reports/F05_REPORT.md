# F05 — Bootstrap Scripts
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Feature** | F05 — Bootstrap Scripts |
| **Status** | COMPLETE |
| **Commit** | 52cb8ce |
| **Date** | 2026-07-01 |
| **Specification** | 05_BOOTSTRAP_AND_TOOLCHAIN_SPECIFICATION.md §4 and §5 |

---

## Summary

F05 delivers six cross-platform scripts covering environment setup, health verification, and reset:

- `scripts/doctor.sh` / `scripts/doctor.ps1` — 14-point health check; exits 0 on pass, 1 on fail
- `scripts/setup.sh` / `scripts/setup.ps1` — 7-step idempotent environment setup
- `scripts/reset.sh` / `scripts/reset.ps1` — destructive reset with mandatory confirmation prompt

All `.sh` scripts target POSIX sh (`#!/bin/sh`). All `.ps1` scripts target Windows PowerShell 5.1 (`#Requires -Version 5.1`) with `$ErrorActionPreference = "Stop"`. No `&&` operator is used in PowerShell scripts. No OS-level installation occurs in any script.

---

## Files Created

| File | Change |
|---|---|
| `scripts/doctor.sh` | CREATED — POSIX sh 14-point health check |
| `scripts/doctor.ps1` | CREATED — PowerShell 5.1 equivalent |
| `scripts/setup.sh` | CREATED — POSIX sh 7-step idempotent setup |
| `scripts/setup.ps1` | CREATED — PowerShell 5.1 equivalent |
| `scripts/reset.sh` | CREATED — POSIX sh destructive reset with confirmation |
| `scripts/reset.ps1` | CREATED — PowerShell 5.1 equivalent with `Read-Host` confirmation |

## Files Modified

None.

## Files NOT Modified

All source files (`src/`), Prisma schema (`prisma/`), tests (`test/`), FEOS documents (`docs/feos/`), and all other configuration files are unchanged.

---

## Implementation Details

### Doctor Script Checks (14 total)

| # | Check | Pass Condition |
|---|---|---|
| 1 | git present | `git --version` exits 0 |
| 2 | Node.js present | `node --version` exits 0 |
| 3 | Node.js version matches `.nvmrc` | Output equals `24.16.0` |
| 4 | npm present | `npm --version` exits 0 |
| 5 | npm version ≥ 11.0.0 | Major version ≥ 11 |
| 6 | Docker present | `docker --version` exits 0 |
| 7 | Docker daemon running | `docker info` exits 0 |
| 8 | Docker Compose v2 | `docker compose version` exits 0 |
| 9 | `.env` exists | File exists at repo root |
| 10 | `DATABASE_URL` set | Variable non-empty after sourcing `.env` |
| 11 | `JWT_SECRET` set | Variable non-empty after sourcing `.env` |
| 12 | `node_modules/` present | Directory exists |
| 13 | `@prisma/client` generated | Directory exists |
| 14 | PostgreSQL container healthy | Compose JSON output contains `"Health":"healthy"` |

### Setup Script Steps (7 total)
1. Verify Node version against `.nvmrc`
2. Verify Docker daemon
3. `npm ci`
4. Copy `.env.example` → `.env` if absent
5. `docker compose up -d` + wait for healthy (30s timeout)
6. Source `.env` + `prisma generate`
7. Run `doctor.sh` to confirm

### Reset Script
- Displays warning + lists operations before prompting
- Requires exact input `yes` to proceed
- Executes: `docker compose down -v`, `rm -rf node_modules`, `rm -rf dist`
- Prints re-setup instructions on completion

---

## Engineering Decisions

| Decision | Rationale |
|---|---|
| `.sh` scripts use `#!/bin/sh` not `#!/bin/bash` | POSIX sh compliance per Book 2 §3.9 |
| PowerShell uses `Read-Host` in `reset.ps1` | Confirmation prompt is interactive by design; not run in non-interactive CI |
| Doctor reads `.env` via dot-sourcing (`.env` in sh) / manual parsing (PowerShell) | Avoids dependency on `dotenv` or external tools |
| PostgreSQL healthy check polls `docker compose ps --format json` | JSON output is machine-parseable without `jq` dependency |

---

## Quality Gates

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS |
| Lint | `npm run lint` | PASS (0 errors) |
| Tests | `npm run test` | PASS — 482/482 |
| Prisma Validate | `DATABASE_URL="..." npx prisma validate` | PASS |

---

## Cross-Platform Blocker Resolution

| Blocker | Status |
|---|---|
| CPB-008: No onboarding automation — developers manually run 6+ setup commands | RESOLVED |

---

## Repository Health

| Metric | Value |
|---|---|
| Commit | 52cb8ce |
| Build | PASS |
| Lint | PASS (0 errors) |
| Tests | 482/482 PASS |
| Prisma | PASS |
| Source files modified | 0 |
| Schema files modified | 0 |
| Test files modified | 0 |
