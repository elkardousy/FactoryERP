# F06 — DevContainer
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Feature** | F06 — DevContainer |
| **Status** | COMPLETE |
| **Commit** | d4b2d16 |
| **Date** | 2026-07-02 |
| **Specification** | 03_DEVCONTAINER_SPECIFICATION.md |

---

## Summary

F06 delivers the VS Code DevContainer configuration for FactoryERP. It provides a reproducible, containerized development environment using the Microsoft TypeScript-Node base image, connected to the existing Docker Compose PostgreSQL service via the shared `factory-dev-network`.

The implementation uses the `dockerComposeFile` approach (spec §4.3) — `devcontainer.json` references both `docker-compose.dev.yml` (infrastructure) and `docker-compose.devcontainer.yml` (app service) so the DevContainer shares the same network as the database.

No custom Dockerfile was created — the Microsoft base image satisfies all requirements (Node 24, build-essential for bcrypt, non-root `vscode` user).

---

## Files Created

| File | Change |
|---|---|
| `.devcontainer/devcontainer.json` | CREATED — primary DevContainer configuration |
| `.devcontainer/docker-compose.devcontainer.yml` | CREATED — app service definition for Compose integration |

## Files Modified

None.

## Files NOT Modified

All source files (`src/`), Prisma schema (`prisma/`), tests (`test/`), FEOS documents (`docs/feos/`), and all other platform files are unchanged.

---

## Implementation Details

### devcontainer.json

| Field | Value |
|---|---|
| `name` | `"FactoryERP Development"` |
| `dockerComposeFile` | `["../docker-compose.dev.yml", "docker-compose.devcontainer.yml"]` |
| `service` | `"app"` |
| `workspaceFolder` | `"/workspaces/backend"` |
| `remoteUser` | `"vscode"` (non-root, UID 1000) |
| `postCreateCommand` | `npm ci && DATABASE_URL="postgresql://factory_dev:factory_dev@db:5432/factory_erp" npx prisma generate` |
| `forwardPorts` | `[3000, 5432, 5050]` |

### Port Attributes

| Port | Label | onAutoForward | Visibility |
|---|---|---|---|
| 3000 | `FactoryERP API` | `openBrowserOnce` | `private` |
| 5432 | `PostgreSQL` | `silent` | `private` |
| 5050 | `PgAdmin` | `silent` | `private` |

### Environment Variable Injection

All secrets injected via `remoteEnv` using `${localEnv:...}` host forwarding (spec §9.1 Approach A — RECOMMENDED). No credentials hardcoded in any committed file.

| Variable | Source |
|---|---|
| `DATABASE_URL` | `${localEnv:DATABASE_URL}` |
| `JWT_SECRET` | `${localEnv:JWT_SECRET}` |
| `JWT_EXPIRES_IN` | `${localEnv:JWT_EXPIRES_IN}` |
| `REFRESH_EXPIRES_IN` | `${localEnv:REFRESH_EXPIRES_IN}` |
| `NODE_ENV` | `${localEnv:NODE_ENV}` |

### Container-Side Extensions (9 total)

| Extension ID | Classification |
|---|---|
| `dbaeumer.vscode-eslint` | REQUIRED |
| `esbenp.prettier-vscode` | REQUIRED |
| `prisma.prisma` | REQUIRED |
| `ms-vscode.vscode-typescript-next` | REQUIRED |
| `ms-azuretools.vscode-docker` | RECOMMENDED |
| `mtxr.sqltools` | RECOMMENDED |
| `mtxr.sqltools-driver-pg` | RECOMMENDED |
| `humao.rest-client` | RECOMMENDED |
| `EditorConfig.EditorConfig` | RECOMMENDED |

### Container-Side Settings

| Setting | Value |
|---|---|
| `editor.formatOnSave` | `true` |
| `editor.defaultFormatter` | `"esbenp.prettier-vscode"` |
| `[typescript] editor.defaultFormatter` | `"esbenp.prettier-vscode"` |
| `editor.codeActionsOnSave` | `{ "source.fixAll.eslint": "explicit" }` |
| `eslint.validate` | `["typescript", "javascript"]` |
| `files.eol` | `"\n"` |
| `files.encoding` | `"utf8"` |
| `typescript.preferences.importModuleSpecifier` | `"relative"` |
| `npm.packageManager` | `"npm"` |

### docker-compose.devcontainer.yml

Defines the `app` service:
- Image: `mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm`
- Volume mount: `..:/workspaces/backend:cached`
- Command: `sleep infinity` (DevContainer standard)
- `depends_on: db: condition: service_healthy`
- Network: `factory-dev-network` (shared with `docker-compose.dev.yml`)

---

## Engineering Decisions

| Decision | Rationale |
|---|---|
| `dockerComposeFile` approach (not single `image`) | Allows `app` service to communicate with PostgreSQL over `factory-dev-network`; spec §4.3 |
| No custom Dockerfile | Base image satisfies all requirements; spec §5 — custom Dockerfile prohibited unless conditions are met |
| `remoteEnv` with `${localEnv:...}` | Recommended approach per spec §9.1; no credentials in committed files |
| Inline `postCreateCommand` | Spec §9.2 provides explicit concrete value; no separate script file needed |
| `sleep infinity` in Compose app service | DevContainer standard; keeps container alive for VSCode to attach |

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
| CPB-009: No standardized development container — environment parity not guaranteed across macOS, Windows, Linux | RESOLVED |

---

## Repository Health

| Metric | Value |
|---|---|
| Commit | d4b2d16 |
| Build | PASS |
| Lint | PASS (0 errors) |
| Tests | 482/482 PASS |
| Prisma | PASS |
| Source files modified | 0 |
| Schema files modified | 0 |
| Test files modified | 0 |
