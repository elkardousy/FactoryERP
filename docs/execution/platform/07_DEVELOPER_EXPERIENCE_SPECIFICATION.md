# 07 — Developer Experience Specification
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Complete specification for developer tooling, editor configuration, and onboarding experience |
| **Scope** | VSCode tasks, debug profiles, extensions, `.editorconfig`, `.gitattributes`, workspace settings, onboarding |
| **Audience** | All developers; DevOps lead; technical writers |
| **Status** | SPECIFICATION COMPLETE — Implementation Pending |
| **Owner** | Principal Platform Engineer |
| **Review Cycle** | On major VSCode or extension changes; on onboarding process revision |
| **Version** | 1.0 |
| **Dependencies** | Repository audit (01), DevContainer spec (03), Docker spec (04), bootstrap spec (05) |
| **Inputs** | VSCode gitignore state, current npm scripts, existing toolchain |
| **Outputs** | `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, `.vscode/tasks.json`, `.vscode/launch.json`, `.vscode/extensions.json`, `README.md` onboarding section |

---

## 1. Developer Onboarding

### 1.1 Onboarding Target

A developer who has never worked on this codebase before MUST be able to reach a running development environment and successfully execute `npm run start:dev` with a responding API within 15 minutes on any supported OS.

### 1.2 `README.md` Onboarding Section Requirements

The `README.md` at the repository root MUST contain a dedicated "Getting Started" section that covers:

1. **Prerequisites:** Links to installation guides for Git, Docker Desktop, nvm; Windows long-path enablement step
2. **Clone and setup:** `git clone`, `cp .env.example .env`, `scripts/setup.sh` (or `setup.ps1`)
3. **Start development:** `npm run start:dev` and `docker compose -f docker-compose.dev.yml up -d`
4. **Verify:** Swagger UI URL (`http://localhost:3000/api/docs`); health endpoint
5. **DevContainer alternative:** One-paragraph explanation of how to open the repo in DevContainer instead
6. **Doctor script:** `scripts/doctor.sh` / `scripts/doctor.ps1` for environment validation
7. **Prisma workflow:** How to run Prisma commands (always with explicit `DATABASE_URL`)
8. **Common issues:** Link to troubleshooting section

**MANDATORY:** The `README.md` onboarding section MUST be verified end-to-end on at least one supported OS before Phase 4.5 is declared complete.

### 1.3 CLAUDE.md Update

The existing `CLAUDE.md` already documents Prisma commands and architecture. It MUST be reviewed and updated to reference the new bootstrap scripts and Docker Compose commands. No content from `CLAUDE.md` is removed — only additions.

---

## 2. `.editorconfig`

### 2.1 Purpose

`.editorconfig` provides a cross-editor, cross-OS formatting baseline that operates below the formatter layer. It ensures that file creation defaults (indent size, line endings, charset) are consistent regardless of which editor or OS the developer uses.

### 2.2 Required Configuration

`.editorconfig` MUST be placed at the repository root and contain:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.json]
indent_size = 2

[*.prisma]
indent_size = 2

[*.sql]
indent_size = 2

[*.yml]
indent_size = 2

[Makefile]
indent_style = tab
```

**Rationale for `*.md` exception:** Markdown uses trailing spaces to force line breaks. Trimming trailing whitespace in Markdown breaks this formatting.

### 2.3 Key Directives

| Directive | Value | Rationale |
|---|---|---|
| `root = true` | Required | Prevents editorconfig from traversing to parent directories |
| `charset = utf-8` | UTF-8 | Cross-platform requirement (doc 02 §5) |
| `end_of_line = lf` | LF | Line-ending policy (doc 02 §3) |
| `indent_style = space` | Space | Consistent with Prettier's default output |
| `indent_size = 2` | 2 spaces | Consistent with NestJS/TypeScript community convention |
| `insert_final_newline = true` | Required | POSIX standard; prevents git diff noise |
| `trim_trailing_whitespace = true` | Required | Prevents invisible characters in diffs |

---

## 3. `.gitattributes`

### 3.1 Purpose

`.gitattributes` enforces line-ending normalization at the Git level, operating independently of developer `core.autocrlf` settings. This is the authoritative mechanism for preventing CRLF contamination in the repository.

### 3.2 Required Configuration

`.gitattributes` MUST be placed at the repository root and contain:

```gitattributes
# Default: normalize all text files to LF
* text=auto eol=lf

# Explicitly declare text files
*.ts    text eol=lf
*.js    text eol=lf
*.json  text eol=lf
*.md    text eol=lf
*.sql   text eol=lf
*.prisma text eol=lf
*.yml   text eol=lf
*.yaml  text eol=lf
*.sh    text eol=lf
*.env   text eol=lf
*.env.example text eol=lf
*.editorconfig text eol=lf
*.gitattributes text eol=lf
.nvmrc  text eol=lf

# Declare binary files (no line-ending conversion)
*.png   binary
*.jpg   binary
*.jpeg  binary
*.gif   binary
*.ico   binary
*.tsbuildinfo binary
```

### 3.3 Post-Commit Verification

After committing `.gitattributes` for the first time, developers MUST run:

```sh
git rm --cached -r .
git reset --hard
```

This re-normalizes all existing files in the working tree to enforce the new line-ending rules. This is a one-time operation.

**MANDATORY:** The commit that adds `.gitattributes` MUST be immediately followed by a normalization commit if any files require re-normalization. The CI MUST assert LF line endings on all governed extensions.

---

## 4. VSCode Workspace Settings

### 4.1 `.vscode/settings.json`

This file contains project-specific VSCode settings that override user and workspace defaults. It is committed to the repository and applies to all developers who open the project in VSCode.

**MANDATORY configuration:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["typescript", "javascript"],
  "files.eol": "\n",
  "files.encoding": "utf8",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "npm.packageManager": "npm",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "**/.git": true
  }
}
```

**Notes:**
- `typescript.tsdk` points to the workspace TypeScript (not the bundled VSCode one) — ensures consistent type checking with `npm run build`
- `typescript.enablePromptUseWorkspaceTsdk` shows a prompt to switch to workspace TypeScript if the user has the wrong version active
- `editor.codeActionsOnSave` with `"explicit"` runs ESLint fix only on explicit save (not auto-save), preventing infinite loop on aggressive auto-save configurations

---

## 5. VSCode Tasks

### 5.1 `.vscode/tasks.json`

Tasks provide named, runnable commands accessible from the Command Palette (`Ctrl+Shift+P → Tasks: Run Task`). They reduce the need to remember exact npm script names.

**Required tasks:**

| Task Label | Command | Group | Notes |
|---|---|---|---|
| `Build` | `npm run build` | `build` | Default build task |
| `Start Dev` | `npm run start:dev` | — | Starts NestJS in watch mode |
| `Test` | `npm run test` | `test` | Default test task |
| `Test Watch` | `npm run test:watch` | `test` | — |
| `Test Coverage` | `npm run test:cov` | `test` | — |
| `Lint` | `npm run lint` | — | — |
| `Format` | `npm run format` | — | Prettier write |
| `Docker Up` | `docker compose -f docker-compose.dev.yml up -d` | — | Start infrastructure |
| `Docker Down` | `docker compose -f docker-compose.dev.yml down` | — | Stop infrastructure |
| `Doctor` | `scripts/doctor.sh` (Linux/macOS) or `scripts/doctor.ps1` (Windows) | — | Environment health check |
| `Prisma Generate` | `DATABASE_URL="${env:DATABASE_URL}" npx prisma generate` | — | Regenerate client |
| `Prisma Validate` | `DATABASE_URL="${env:DATABASE_URL}" npx prisma validate` | — | Validate schema |

**Task type:** All tasks use `"type": "npm"` or `"type": "shell"`. Shell tasks MUST use `"presentation": { "reveal": "always", "panel": "shared" }` so output is visible.

**Cross-platform task `command`:** Tasks that invoke shell scripts MUST use a platform-specific `command` with `"windows"` override:

```json
{
  "label": "Doctor",
  "type": "shell",
  "command": "bash scripts/doctor.sh",
  "windows": {
    "command": "powershell.exe -File scripts/doctor.ps1"
  }
}
```

---

## 6. VSCode Debug Profiles

### 6.1 `.vscode/launch.json`

Debug profiles allow developers to attach the VSCode debugger to the running NestJS application or Jest test runner.

**Required profiles:**

#### Profile 1: Debug NestJS Application

```json
{
  "name": "Debug NestJS",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug"],
  "envFile": "${workspaceFolder}/.env",
  "skipFiles": ["<node_internals>/**"],
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "sourceMaps": true
}
```

#### Profile 2: Debug Current Test File

```json
{
  "name": "Debug Current Test",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npx",
  "runtimeArgs": ["jest", "--runInBand", "--testPathPattern", "${relativeFile}"],
  "envFile": "${workspaceFolder}/.env",
  "skipFiles": ["<node_internals>/**"],
  "cwd": "${workspaceFolder}"
}
```

**Notes:**
- `runtimeExecutable: "npx"` with `runtimeArgs: ["jest", ...]` avoids the `node_modules/.bin/` path issues on Windows (Risk R-09 from audit)
- `envFile: "${workspaceFolder}/.env"` automatically loads environment variables from `.env` — no manual setup required
- `--runInBand` runs tests serially inside the debugger (required; parallel workers do not support breakpoints)

---

## 7. Extension Recommendations

### 7.1 `.vscode/extensions.json`

Extension recommendations appear as prompts when a developer opens the workspace for the first time. They are not automatically installed.

**Required extensions (strongly recommended):**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "EditorConfig.EditorConfig",
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker"
  ],
  "unwantedRecommendations": []
}
```

**Rationale per extension:**

| Extension | Rationale |
|---|---|
| `dbaeumer.vscode-eslint` | In-editor ESLint feedback; required for `codeActionsOnSave` to work |
| `esbenp.prettier-vscode` | In-editor Prettier formatting; required for `formatOnSave` |
| `prisma.prisma` | Prisma schema syntax highlighting, formatting, and jump-to-definition |
| `EditorConfig.EditorConfig` | Applies `.editorconfig` rules at the editor level |
| `ms-vscode-remote.remote-containers` | Required for DevContainer workflow |
| `ms-azuretools.vscode-docker` | Docker Compose visualization and container management |

**Extensions NOT recommended (and why):**

| Extension | Reason Not Recommended |
|---|---|
| `ms-vscode.vscode-typescript-next` (TypeScript Nightly) | Host-side only — may conflict with workspace TypeScript; listed in DevContainer extensions instead |
| ESLint plugins beyond `dbaeumer.vscode-eslint` | Handled by project ESLint config |

---

## 8. Formatting Configuration

### 8.1 Prettier

Prettier is already installed (`prettier: 3.4.2`) and runs via `npm run format` and ESLint integration. A Prettier configuration file (`.prettierrc` or `prettier.config.js`) MUST be confirmed to exist at the repository root.

**Required `.prettierrc` (if not already present):**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

**Note:** If a `.prettierrc` already exists, audit its content against the project's actual formatting style. Do not modify existing formatter configuration — verify only.

### 8.2 ESLint

ESLint 9.18.0 with `typescript-eslint` is already configured. The ESLint configuration file (`eslint.config.mjs` or `eslint.config.js`) MUST exist. No ESLint configuration changes are part of Phase 4.5.

---

## 9. Terminal Configuration

### 9.1 Default Terminal (`.vscode/settings.json` additions)

On Windows, the integrated terminal defaults to PowerShell. Developers running `scripts/doctor.sh` or other POSIX sh scripts should use Git Bash. The following setting configures Git Bash as an available terminal profile:

```json
"terminal.integrated.profiles.windows": {
  "Git Bash": {
    "source": "Git Bash"
  }
}
```

This does NOT change the default terminal — it makes Git Bash available as an option. Developers select it from the terminal dropdown.

### 9.2 Terminal Font

No terminal font is specified in workspace settings. Font preferences are personal and should not be committed.

---

## 10. Logging in Development

### 10.1 Application Log Output

`npm run start:dev` with `NODE_ENV=development` outputs structured logs via `nestjs-pino` in pretty-printed format. No additional logging configuration is required in Phase 4.5.

### 10.2 Log Level

`LOG_LEVEL` environment variable controls pino log verbosity. The default is `info`. Developers investigating verbose output set `LOG_LEVEL=debug` in their `.env`. This is documented in `.env.example`.

---

## 11. Troubleshooting

The following common issues MUST be documented in a `docs/execution/platform/TROUBLESHOOTING.md` or in the `README.md` troubleshooting section:

| Issue | Symptom | Resolution |
|---|---|---|
| Wrong Node version | `Error: The engine "node" is incompatible with this module` | `nvm use` in project directory |
| bcrypt native module error | `Error: .../bcrypt_lib.node was compiled against a different Node.js version` | `rm -rf node_modules && npm ci` |
| PostgreSQL port conflict | `docker: Error response from daemon: Ports are not available: 5432` | Stop local PostgreSQL service or remap container port |
| Prisma generate fails | `Error: DATABASE_URL is required` | Set DATABASE_URL in `.env` or prefix command explicitly |
| CRLF in files after checkout | Files appear modified immediately after checkout | Run `git rm --cached -r . && git reset --hard` |
| DevContainer fails to build | Network timeout pulling base image | Check network/proxy; try `docker pull mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm` manually |
| `npm run lint` fails | ESLint errors in CI but not locally | Node version mismatch; different ESLint config resolution; check `.nvmrc` |

---

## 12. Validation

The developer experience implementation is valid when:

| Check | Verification Method |
|---|---|
| `.editorconfig` exists at project root | `test -f .editorconfig` |
| `.gitattributes` exists at project root | `test -f .gitattributes` |
| `.vscode/settings.json` exists and is valid JSON | `cat .vscode/settings.json | python -m json.tool` exits 0 |
| `.vscode/tasks.json` all tasks run successfully | Execute each task from Command Palette |
| `.vscode/launch.json` debug profiles launch without error | F5 starts NestJS debugger; breakpoints are hit |
| `.vscode/extensions.json` extensions install and activate | Check Extension panel for green status |
| `README.md` onboarding verified end-to-end | New developer follows steps; reaches running API |
| Prettier formats `.ts` files on save | Edit and save a `.ts` file; verify format change |
| ESLint shows inline errors | Introduce a lint violation; verify red underline |
| `scripts/doctor.sh` passes on configured machine | Exit code 0 |

---

## 13. Compliance

- Master Execution Contract (00) — Engineering Rules (line endings, encoding, path separators)
- Cross-Platform Requirements (02) — Sections 2–5 (filesystem, line endings, env vars, encoding)
- FEOS `07_CODE_GOVERNANCE.md` — code formatting and linting standards
- FEOS `13_ENGINEERING_STANDARDS.md` — documentation standards

---

## 14. Engineering Rules Summary

| Rule | Classification | Description |
|---|---|---|
| `.editorconfig` at repo root | MANDATORY | Cross-editor formatting baseline |
| `.gitattributes` at repo root | MANDATORY | LF normalization on all governed extensions |
| `.vscode/settings.json` committed | MANDATORY | Shared workspace settings |
| `.vscode/extensions.json` committed | MANDATORY | Extension discovery for new developers |
| `.vscode/tasks.json` committed | MANDATORY | Discoverable npm script aliases |
| `.vscode/launch.json` committed | MANDATORY | Debugger configuration |
| Shell tasks use platform override | MANDATORY | `"windows": { "command": "..." }` for `.sh` scripts |
| Debug profiles use `npx jest` | MANDATORY | Avoids `node_modules/.bin/` path issues on Windows |
| `README.md` onboarding verified | MANDATORY | End-to-end test before Phase 4.5 closure |
| Prettier config committed | RECOMMENDED | Explicit formatter settings prevent drift |
| Git Bash terminal profile (Windows) | RECOMMENDED | Enables POSIX scripts from integrated terminal |
