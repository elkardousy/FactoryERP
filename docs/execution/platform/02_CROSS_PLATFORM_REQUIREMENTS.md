# 02 — Cross-Platform Requirements
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Definitive requirements for cross-platform compatibility across all target operating systems |
| **Scope** | OS support matrix, filesystem behavior, encoding, line endings, Node/Prisma/Docker/VSCode compatibility |
| **Audience** | Platform engineers, CI engineers, DevOps lead |
| **Status** | COMPLETE — Requirements finalized 2026-07-01 |
| **Owner** | Infrastructure Architect |
| **Review Cycle** | On major OS or toolchain version change |
| **Version** | 1.0 |
| **Dependencies** | Repository audit (01); FEOS architecture governance (03) |
| **Inputs** | OS matrix decision, toolchain versions from audit (01) |
| **Outputs** | Compatibility requirements by OS; acceptance criteria per requirement |

---

## 1. Supported Operating Systems

### 1.1 Target Matrix

| OS | Version | Architecture | Priority | CI Validated |
|---|---|---|---|---|
| Windows | 11 (build 22000+) | x64 | PRIMARY (current dev) | Required |
| Ubuntu | 24.04 LTS | x64 | PRIMARY (CI baseline) | Required |
| macOS | 14 Sonoma | arm64 (M-series) | SECONDARY | Required |
| Debian | 12 (Bookworm) | x64 | SECONDARY | Optional (Ubuntu covers Debian kernel) |
| Fedora | 40 | x64 | TERTIARY | Optional |

### 1.2 OS Priority Rationale

- **Windows 11 (PRIMARY):** Current developer environment. Phase 4.5 must not break the existing workflow.
- **Ubuntu 24 LTS (PRIMARY):** CI runner baseline. All quality gates must pass in GitHub Actions `ubuntu-latest` (currently Ubuntu 24).
- **macOS 14 arm64 (SECONDARY):** Developer population includes M-series Mac users. `bcrypt` native compilation on arm64 is a known compatibility surface.
- **Debian 12 / Fedora 40 (TERTIARY):** Covered by the Docker DevContainer approach — if the container image is Debian-based, internal behavior is consistent regardless of host OS.

### 1.3 Architecture Notes

| Architecture | Risk | Mitigation |
|---|---|---|
| x64 (Windows, Linux) | Low | Standard target; all npm packages tested |
| arm64 (macOS M-series) | MEDIUM | `bcrypt` requires native recompile for arm64; npm does this automatically via node-gyp during `npm install` but requires Xcode Command Line Tools |
| arm64 (Linux/Docker) | LOW | DevContainer runs on the host architecture; arm64 Docker images must be confirmed for all pinned service versions |

---

## 2. Filesystem Differences

### 2.1 Path Separator Policy

**MANDATORY: All paths in source code, scripts, and configuration files MUST use forward-slash `/` notation.**

| Platform | Native separator | Behavior in Node.js |
|---|---|---|
| Windows | `\` | `path.join` returns `\`; `path.posix.join` returns `/` |
| Linux / macOS | `/` | `path.join` returns `/` |

**Enforcement:**
- Use `path.join()` or `path.posix.join()` in any application code that constructs paths
- Use forward slashes in `jest` config (`rootDir`, `testRegex`), `tsconfig` paths, and `.vscode/` task definitions
- Shell scripts inside `.devcontainer/` and `scripts/` MUST be POSIX sh — never batch/PowerShell
- Windows-specific PowerShell scripts in `scripts/` MUST be clearly named `*.ps1` and documented as Windows-only

### 2.2 Filename Case Sensitivity

| Platform | Case Sensitivity | Risk |
|---|---|---|
| Windows (NTFS) | Case-insensitive | `import './Foo'` resolves even if file is `foo.ts` — masks errors |
| Linux (ext4) | Case-sensitive | Same import fails on CI — build error appears only in CI |
| macOS (APFS default) | Case-insensitive | Same as Windows — masks errors |

**MANDATORY:** The TypeScript compiler option `"forceConsistentCasingInFileNames": true` is already set in `tsconfig.json`. This MUST NOT be removed. It enforces consistent casing at compile time, catching Windows/macOS masking issues before CI.

### 2.3 Symlink Policy

| Platform | Symlink Support |
|---|---|
| Windows | Requires Developer Mode or elevated privileges |
| Linux / macOS | Native support |

**Rule IEF-MANDATORY:** Phase 4.5 MUST NOT introduce symlinks in any committed path. `node_modules/.bin/` symlinks are managed by npm and are excluded from this rule.

### 2.4 Maximum Path Length

| Platform | Limit | Risk |
|---|---|---|
| Windows (legacy) | 260 characters (MAX_PATH) | `node_modules/` nesting can exceed this |
| Windows (modern, enabled) | 32,767 characters | Requires registry key or Group Policy |
| Linux / macOS | 4,096 characters | No practical risk |

**MANDATORY:** Enable long path support for Windows developers. Document in `README.md`. This is a prerequisite step, not a script action.

---

## 3. Line-Ending Policy

### 3.1 Policy Statement

**MANDATORY: The canonical line ending for all text files in this repository is LF (`\n`).** CRLF line endings MUST NOT exist in committed files.

### 3.2 Governed File Types

The following extensions MUST be normalized to LF on commit via `.gitattributes`:

| Extension | Type |
|---|---|
| `.ts` | TypeScript source |
| `.js` | JavaScript |
| `.json` | JSON configuration |
| `.md` | Markdown documentation |
| `.sql` | SQL migrations |
| `.prisma` | Prisma schema |
| `.yml` / `.yaml` | GitHub Actions, Docker Compose, DevContainer |
| `.sh` | Shell scripts |
| `.env.example` | Environment variable templates |
| `.editorconfig` | Editor configuration |
| `.gitattributes` | Git attributes |
| `.gitignore` | Git ignore rules |
| `.nvmrc` | Node version |

### 3.3 Binary File Exemptions

The following MUST be declared binary in `.gitattributes` to prevent diff corruption:

| Extension | Type |
|---|---|
| `.png`, `.jpg`, `.gif`, `.ico` | Images |
| `*.tsbuildinfo` | TypeScript incremental build cache |
| `*.lock` | Lock files (do not normalize) — treat as text but no CRLF conversion |

### 3.4 Verification

`git ls-files --eol` MUST show `i/lf w/lf` or `i/lf w/crlf attr/text=auto eol=lf` for all governed text files. CI MUST assert this.

---

## 4. Environment Variable Policy

### 4.1 Policy Statement

**MANDATORY: No environment variable values are hardcoded in committed files.** All runtime values are provided via:

1. `.env` file (local development; gitignored)
2. DevContainer `remoteEnv` or `containerEnv` in `devcontainer.json`
3. Docker Compose `environment` block (using `${VAR}` substitution from `.env`)
4. GitHub Actions `env:` block (using repository secrets)

### 4.2 Required Variables

| Variable | Required By | Source in Dev | Source in CI |
|---|---|---|---|
| `DATABASE_URL` | Prisma, application | `.env` | GitHub Actions secret / service container |
| `JWT_SECRET` | Application boot (Joi validation) | `.env` | GitHub Actions secret |
| `JWT_EXPIRES_IN` | Application boot | `.env` | GitHub Actions env var |
| `REFRESH_EXPIRES_IN` | Application boot | `.env` | GitHub Actions env var |
| `NODE_ENV` | Application boot | `.env` or inline | GitHub Actions env var |
| `PORT` | Application (optional) | `.env` (optional) | GitHub Actions env var |

### 4.3 `.env.example` Requirement

**MANDATORY:** A `.env.example` file MUST be committed to the repository containing all required variable names with placeholder values. This file MUST NOT contain real secrets. It serves as the authoritative variable manifest.

### 4.4 Prisma-Specific Constraint

`prisma.config.ts` in this project causes Prisma CLI to skip automatic `.env` loading. Therefore:

- **ALL Prisma CLI commands** in scripts, CI, and documentation MUST prefix `DATABASE_URL="..."` explicitly
- This is a project-specific constraint (not a general Prisma behavior) documented in CLAUDE.md

---

## 5. Encoding Policy

**MANDATORY: All source files, configuration files, and documentation MUST be encoded in UTF-8 without BOM (UTF-8-NoBOM).**

| Platform | Default Editor Encoding | Risk |
|---|---|---|
| Windows (PowerShell) | UTF-16 LE | Files created with `Out-File` default to UTF-16 LE — will break TypeScript parser |
| Windows (Notepad, modern) | UTF-8 without BOM | Safe |
| VSCode | UTF-8 without BOM | Safe — enforce via `.editorconfig` and VSCode settings |
| Linux / macOS | UTF-8 without BOM | Safe |

**Enforcement:** `.editorconfig` MUST specify `charset = utf-8`. VSCode workspace settings MUST specify `"files.encoding": "utf8"`.

---

## 6. Node.js Compatibility

### 6.1 Version Policy

| Constraint | Value | Rationale |
|---|---|---|
| Required version | 24.16.0 LTS | Current developer environment; pinned for reproducibility |
| Minimum version | 20.0.0 | NestJS 11 minimum; `nodenext` module resolution requires Node 18.12+ |
| Recommended version manager | nvm (Linux/macOS), nvm-windows (Windows) | Cross-platform `.nvmrc` support |
| `.nvmrc` content | `24.16.0` | Exact version; no `v` prefix (nvm compatible) |
| `package.json` `engines` field | `"node": ">=24.0.0 <25.0.0"` | npm enforcement |

### 6.2 Compatibility Surface

| Feature | Node 20 | Node 22 | Node 24 | Notes |
|---|---|---|---|---|
| `module: nodenext` (tsconfig) | Yes | Yes | Yes | Requires ESM-aware code paths |
| `target: ES2023` (tsconfig) | Yes | Yes | Yes | All ES2023 builtins available |
| Prisma 6.x | Yes | Yes | Yes | Prisma 6 supports Node 18+ |
| NestJS 11 | Yes | Yes | Yes | NestJS 11 supports Node 18+ |
| `bcrypt` 6.x native | Compile | Compile | Compile | node-gyp required on all versions |

### 6.3 `bcrypt` Native Compilation Requirements

| OS | Build Tool Required | Notes |
|---|---|---|
| Windows | Visual Studio Build Tools 2022 or `windows-build-tools` | Node.js installer can install automatically |
| Ubuntu / Debian | `build-essential`, `python3` | Install via apt |
| macOS | Xcode Command Line Tools | `xcode-select --install` |
| DevContainer (Debian-based) | Pre-installed in `mcr.microsoft.com/devcontainers/typescript-node` | Handled by base image |

---

## 7. Prisma Compatibility

### 7.1 Version

Prisma 6.16.2 (both `prisma` CLI and `@prisma/client`). These MUST remain in sync.

### 7.2 Cross-Platform Behavior

| Item | Behavior | Notes |
|---|---|---|
| Binary targets | Auto-detected by Prisma at generate time | Generates platform-specific query engine binary |
| `prisma generate` output | `node_modules/@prisma/client` | Platform binary placed automatically; do not commit |
| Migrations | Plain SQL — OS-agnostic | LF line endings required (enforced by `.gitattributes`) |
| `prisma validate` | Does NOT require a running database | Safe to run in CI without PostgreSQL |
| `prisma migrate status` | Requires `DATABASE_URL` and running database | CI: use service container |
| `prisma studio` | Requires database | Development only; not in CI |

### 7.3 Prisma Binary Generation in DevContainer

`prisma generate` MUST be run inside the DevContainer to ensure the correct binary target (Linux/Debian) is used. The binary generated on Windows (`windows`) is not compatible inside the container.

**MANDATORY:** The DevContainer `postCreateCommand` MUST run `npm ci && DATABASE_URL="..." npx prisma generate`.

---

## 8. Docker Compatibility

### 8.1 Version Requirements

| Tool | Minimum Version | Notes |
|---|---|---|
| Docker Engine | 24.0.0 | Compose v2 support required |
| Docker Desktop (Windows/macOS) | 4.25.0 | Includes Docker Compose v2 |
| Docker Compose | 2.20.0 | `docker compose` (no hyphen) syntax used |

### 8.2 Image Architecture

| Service | Image | Architecture Support |
|---|---|---|
| PostgreSQL | `postgres:16.4-alpine` | linux/amd64, linux/arm64 |
| PgAdmin | `dpage/pgadmin4:8.x` | linux/amd64, linux/arm64 |

### 8.3 Volume Behavior

| Platform | Docker Volume Type | Notes |
|---|---|---|
| Windows (WSL2 backend) | Named volumes preferred | Bind mounts from Windows filesystem (`C:\`) have performance penalties |
| Linux | Named volumes or bind mounts | No performance penalty |
| macOS | Named volumes preferred | VirtioFS improves bind mount performance but named volumes are still faster |

**Rule:** PostgreSQL data MUST use a named volume (not a bind mount) for performance and portability.

---

## 9. VSCode Compatibility

### 9.1 Version

Minimum VSCode version: 1.90.0. This requirement is documented in `.vscode/extensions.json` via the `engines.vscode` constraint if applicable.

### 9.2 Extension Compatibility

All recommended extensions MUST be available in:
- VSCode (local)
- VSCode when attached to a DevContainer (Remote - Containers extension)

Extensions that are DevContainer-only MUST be declared in `.devcontainer/devcontainer.json` under `customizations.vscode.extensions`, not in `.vscode/extensions.json`.

### 9.3 Remote Development

The DevContainer setup MUST support:
- VSCode Dev Containers extension (ms-vscode-remote.remote-containers)
- GitHub Codespaces (future)

---

## 10. Acceptance Criteria

### AC-CP-001: Windows 11 (x64)

- [ ] `git clone` followed by `npm ci` completes without error
- [ ] `npm run build` completes without error
- [ ] `npm run lint` reports 0 errors
- [ ] `npm run test` reports 482 tests passing
- [ ] `docker compose -f docker-compose.dev.yml up -d` starts PostgreSQL
- [ ] Application boots with `.env` populated correctly
- [ ] DevContainer opens successfully in VSCode

### AC-CP-002: Ubuntu 24 LTS (x64)

- [ ] All AC-CP-001 items pass
- [ ] `nvm use` (with `.nvmrc`) switches to the correct Node version
- [ ] `bcrypt` native module compiles during `npm ci`
- [ ] `npm run test` passes inside DevContainer

### AC-CP-003: macOS 14 arm64

- [ ] All AC-CP-001 items pass
- [ ] `bcrypt` compiles for `darwin-arm64` target
- [ ] Docker Desktop arm64 images verified

### AC-CP-004: CI (Ubuntu 24, GitHub Actions)

- [ ] CI pipeline passes on `ubuntu-latest`
- [ ] CI pipeline passes on `windows-latest`
- [ ] CI pipeline passes on `macos-latest`
- [ ] `prisma validate` passes without a running database
- [ ] No secrets in CI logs

### AC-CP-005: Line Endings

- [ ] `git ls-files --eol` shows LF for all governed extensions
- [ ] No CRLF exists in `.ts`, `.sql`, `.prisma`, `.yml`, `.sh` files

### AC-CP-006: Encoding

- [ ] All committed source files are UTF-8 without BOM (verified by `file --mime-encoding` on CI)

---

## 11. Compliance

Requirements in this document are derived from:
- FEOS `04_IMPLEMENTATION_GOVERNANCE.md`
- FEOS `13_ENGINEERING_STANDARDS.md`
- Repository Audit (01)
- Master Execution Contract (00)

---

## 12. Validation

This document is valid when:

- [ ] All supported OS versions are confirmed against current GitHub Actions runner images
- [ ] `bcrypt` build tool requirements are verified for each target OS
- [ ] Docker image version choices are consistent with document 04
- [ ] All acceptance criteria have testable, binary outcomes (pass/fail)
- [ ] No OS is listed as supported without a corresponding CI matrix entry or documented exception
