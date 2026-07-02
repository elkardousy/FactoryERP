# F09 — Developer Documentation
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Feature** | F09 — Developer Documentation |
| **Status** | COMPLETE |
| **Commit** | 828b5f1 |
| **Date** | 2026-07-02 |
| **Specification** | 07_DEVELOPER_EXPERIENCE_SPECIFICATION.md |

---

## Summary

F09 completes the developer experience layer. It delivers four VSCode workspace files, a full rewrite of `README.md` with the required Getting Started section, and additions to `CLAUDE.md` documenting bootstrap scripts and Docker Compose commands.

The prior `.editorconfig` and `.gitattributes` (F02) are already complete. The `.vscode/` directory did not exist before this feature.

---

## Files Created

| File | Change |
|---|---|
| `.vscode/settings.json` | CREATED — workspace VSCode settings |
| `.vscode/tasks.json` | CREATED — 12 named development tasks |
| `.vscode/launch.json` | CREATED — 2 debug profiles (NestJS + Jest) |
| `.vscode/extensions.json` | CREATED — 6 host-side extension recommendations |

## Files Modified

| File | Change |
|---|---|
| `README.md` | REWRITTEN — NestJS scaffold replaced with FactoryERP Getting Started |
| `CLAUDE.md` | UPDATED — setup/infrastructure section added (no content removed) |

## Files NOT Modified

All source files (`src/`), Prisma schema (`prisma/`), tests (`test/`), FEOS documents (`docs/feos/`), and all other platform files are unchanged.

---

## Implementation Details

### `.vscode/settings.json`

| Setting | Value |
|---|---|
| `editor.formatOnSave` | `true` |
| `editor.defaultFormatter` | `esbenp.prettier-vscode` |
| `[typescript]` formatter | `esbenp.prettier-vscode` |
| `[json]` formatter | `esbenp.prettier-vscode` |
| `editor.codeActionsOnSave` | `source.fixAll.eslint: explicit` |
| `files.eol` | `\n` (LF) |
| `files.encoding` | `utf8` |
| `typescript.tsdk` | `node_modules/typescript/lib` (workspace TypeScript) |
| `typescript.enablePromptUseWorkspaceTsdk` | `true` |
| `terminal.integrated.profiles.windows` | Git Bash as available terminal option |
| Search exclusions | `node_modules/`, `dist/`, `coverage/`, `.git/` |

### `.vscode/tasks.json` (12 tasks)

| Task | Command | Group |
|---|---|---|
| Build | `npm run build` | build (default) |
| Start Dev | `npm run start:dev` | — |
| Test | `npm run test` | test (default) |
| Test Watch | `npm run test:watch` | test |
| Test Coverage | `npm run test:cov` | test |
| Lint | `npm run lint` | — |
| Format | `npm run format` | — |
| Docker Up | `docker compose -f docker-compose.dev.yml up -d` | — |
| Docker Down | `docker compose -f docker-compose.dev.yml down` | — |
| Doctor | `bash scripts/doctor.sh` / `powershell.exe -File scripts/doctor.ps1` (Windows) | — |
| Prisma Generate | `DATABASE_URL="..." npx prisma generate` | — |
| Prisma Validate | `DATABASE_URL="..." npx prisma validate` | — |

Doctor task uses a `"windows"` override (`powershell.exe -File scripts/doctor.ps1`). Prisma tasks on Windows parse `.env` to extract `DATABASE_URL` before invoking the CLI.

### `.vscode/launch.json` (2 profiles)

**Debug NestJS:**
- `runtimeExecutable: npm`, `runtimeArgs: ["run", "start:debug"]`
- `envFile: ${workspaceFolder}/.env` (auto-loads environment)
- `sourceMaps: true`, `outFiles: dist/**/*.js`

**Debug Current Test:**
- `runtimeExecutable: npx`, `runtimeArgs: ["jest", "--runInBand", "--testPathPattern", "${relativeFile}"]`
- Uses `npx` to avoid `node_modules/.bin/` path issues on Windows (spec §6.1)
- `--runInBand` required for debugger breakpoints

### `.vscode/extensions.json` (6 host-side recommendations)

| Extension | Role |
|---|---|
| `dbaeumer.vscode-eslint` | ESLint inline errors + codeActionsOnSave |
| `esbenp.prettier-vscode` | formatOnSave |
| `prisma.prisma` | Schema syntax, formatting, jump-to-definition |
| `EditorConfig.EditorConfig` | Applies `.editorconfig` rules |
| `ms-vscode-remote.remote-containers` | DevContainer workflow |
| `ms-azuretools.vscode-docker` | Docker Compose visualization |

TypeScript Nightly (`ms-vscode.vscode-typescript-next`) is NOT listed here — it is a container-side extension only (declared in `.devcontainer/devcontainer.json`) because it may conflict with the workspace TypeScript when installed on the host.

### `README.md` Sections (per spec §1.2)

| Required Section | Delivered |
|---|---|
| Prerequisites (Git, Docker, nvm; Windows long-path) | ✓ |
| Clone and setup (setup.sh / setup.ps1) | ✓ |
| Start development (start:dev, docker compose) | ✓ |
| Verify (Swagger UI URL, doctor script) | ✓ |
| DevContainer alternative | ✓ |
| Doctor script reference | ✓ |
| Prisma workflow (DATABASE_URL prefix, db pull prohibition) | ✓ |
| Common issues (7 documented) | ✓ |

### `CLAUDE.md` Additions

Added a "Setup (first-time or after reset)" block and "Infrastructure" block above the existing Build commands. Covers `setup.sh/ps1`, `doctor.sh/ps1`, `reset.sh`, and all `docker compose` commands with explicit `-f docker-compose.dev.yml` flag.

No existing `CLAUDE.md` content was removed.

---

## Engineering Decisions

| Decision | Rationale |
|---|---|
| `typescript.tsdk: node_modules/typescript/lib` | Ensures build-consistent type checking; VSCode would otherwise use its bundled TypeScript version |
| `codeActionsOnSave: explicit` (not `always`) | Prevents infinite loop under aggressive auto-save configurations (spec §4.1 note) |
| Debug Current Test uses `npx jest` not `node_modules/.bin/jest` | Avoids Windows path resolution issue R-09 from audit (spec §6.1) |
| TypeScript Nightly in DevContainer only, not host | Host-side installation can conflict with workspace TypeScript; container is safe isolation boundary |
| README.md complete rewrite | NestJS scaffold had no FactoryERP-specific content; all required spec §1.2 sections require new content |

---

## Quality Gates

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS |
| Lint | `npm run lint` | PASS (0 errors) |
| Tests | `npm run test` | PASS — 482/482 |
| Prisma Validate | `DATABASE_URL="..." npx prisma validate` | PASS |

---

## Repository Health

| Metric | Value |
|---|---|
| Commit | 828b5f1 |
| Build | PASS |
| Lint | PASS (0 errors) |
| Tests | 482/482 PASS |
| Prisma | PASS |
| Source files modified | 0 |
| Schema files modified | 0 |
| Test files modified | 0 |
