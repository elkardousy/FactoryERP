# 03 — DevContainer Specification
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Complete specification for the Visual Studio Code DevContainer configuration |
| **Scope** | `.devcontainer/` directory; Dockerfile; `devcontainer.json`; extensions; environment |
| **Audience** | Platform engineers, DevOps lead, all developers using VSCode |
| **Status** | SPECIFICATION COMPLETE — Implementation Pending |
| **Owner** | Principal DevOps Engineer / Principal Platform Engineer |
| **Review Cycle** | On base image major version upgrade or NestJS major version change |
| **Version** | 1.0 |
| **Dependencies** | Repository audit (01), cross-platform requirements (02), Docker spec (04), developer experience spec (07) |
| **Inputs** | Base image selection, Node version from `.nvmrc`, extension list from (07) |
| **Outputs** | `.devcontainer/devcontainer.json`, `.devcontainer/Dockerfile` (if custom image used) |

---

## 1. Purpose

The DevContainer provides a standardized, reproducible development environment that eliminates "works on my machine" problems. When a developer opens the repository in VSCode with the Dev Containers extension, they receive an identical environment regardless of their host OS.

The DevContainer does NOT replace local development. Developers who prefer local Node/PostgreSQL may continue doing so. The DevContainer is an opt-in alternative, not a requirement.

---

## 2. Container Philosophy

### 2.1 Base Image Strategy

**Decision: Use the official Microsoft TypeScript + Node DevContainer base image.**

`mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm`

Rationale:
- Pre-installs Node.js 24 LTS, TypeScript, ESLint, Prettier, npm, git, curl, build-essential
- `build-essential` and `python3` satisfy `bcrypt` native compilation requirements (CPB-002)
- Debian 12 (Bookworm) base — consistent, well-maintained, enterprise-grade
- Maintained by Microsoft with DevContainer-aware defaults (non-root user `vscode`, correct permissions)
- Avoids custom Dockerfile maintenance burden

### 2.2 Image Pinning Policy

**MANDATORY:** The base image MUST be pinned to a specific minor tag, not `latest`.

Accepted format: `mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm`

The `1-24-bookworm` tag pins: feature version `1`, Node major `24`, Debian `bookworm`. This does not pin the patch/build, but prevents unexpected Node major version changes.

### 2.3 Separation of Concerns

The DevContainer is responsible for:
- Operating system environment (Debian 12)
- Node.js runtime (pinned version)
- Build tools for native modules (`bcrypt`)
- VSCode extensions (container-side)
- Application code workspace

The DevContainer is NOT responsible for:
- PostgreSQL database (provided by Docker Compose in document 04 — linked as a service or via `docker-compose.devcontainer.yml`)
- Persistent application data
- Secrets (provided via `remoteEnv` or `containerEnv` from host `.env`)

---

## 3. Folder Layout

```
.devcontainer/
  devcontainer.json          # Primary DevContainer configuration
  Dockerfile                 # Custom Dockerfile (ONLY if base image is insufficient)
  docker-compose.extend.yml  # Docker Compose override for DevContainer service integration
  scripts/
    post-create.sh           # Runs after container creation (npm ci, prisma generate)
    post-start.sh            # Runs after each container start (optional — start dev server)
```

**Note on Dockerfile:** If the Microsoft base image satisfies all requirements without modification, a custom `Dockerfile` MUST NOT be created. Prefer `features` in `devcontainer.json` over a custom Dockerfile.

---

## 4. `devcontainer.json` Requirements

### 4.1 Required Fields

| Field | Specification | Notes |
|---|---|---|
| `name` | `"FactoryERP Development"` | Human-readable container name |
| `image` (or `dockerComposeFile`) | `"mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm"` | Pin to minor tag |
| `postCreateCommand` | `"npm ci && DATABASE_URL=\\"postgresql://...\\" npx prisma generate"` | Must use DATABASE_URL that matches the linked DB service |
| `remoteUser` | `"vscode"` | Non-root user; required for VSCode extension safety |
| `features` | See section 4.2 | Optional tool features |
| `customizations.vscode.extensions` | See section 6 | Container-side extensions |
| `customizations.vscode.settings` | See section 7 | Container-side workspace settings |
| `forwardPorts` | `[3000, 5432]` | Application port; PostgreSQL (for direct DB access from host) |
| `portsAttributes` | See section 8 | Port labels |

### 4.2 DevContainer Features

DevContainer features are composable add-ons installed at build time. The following features are candidates for FactoryERP:

| Feature | ID | Rationale | Priority |
|---|---|---|---|
| Docker-in-Docker | `ghcr.io/devcontainers/features/docker-in-docker:2` | Allows running `docker compose` commands inside the container | OPTIONAL |
| GitHub CLI | `ghcr.io/devcontainers/features/github-cli:1` | PR/issue management from terminal | OPTIONAL |

**Rule:** Features that duplicate what the base image already provides MUST NOT be added.

### 4.3 Docker Compose Integration

When connecting the DevContainer to the Docker Compose development services (PostgreSQL), use the `dockerComposeFile` approach:

```
dockerComposeFile: ["../docker-compose.dev.yml", "docker-compose.devcontainer.yml"]
service: "app"
workspaceFolder: "/workspaces/backend"
```

The `docker-compose.devcontainer.yml` defines the `app` service (the DevContainer itself) and references the PostgreSQL service from `docker-compose.dev.yml`.

This is the preferred approach over `runServices` in `devcontainer.json` because it provides explicit control over the Compose topology.

---

## 5. Dockerfile Requirements

A custom Dockerfile is required ONLY if one of the following conditions is true:

1. The base image does not include a tool required for development that cannot be added via a DevContainer feature
2. A specific package version must be pinned beyond what the feature system supports
3. A corporate proxy or custom registry prevents pulling from `mcr.microsoft.com`

If a custom Dockerfile is created, it MUST:
- `FROM` the Microsoft base image (never from scratch for a dev container)
- Install only what the base image omits
- Run as `vscode` user (or switch to `vscode` at the end)
- Not install the application dependencies (handled by `postCreateCommand`)
- Not embed secrets of any kind
- Be documented with inline comments for every `RUN` layer

---

## 6. VSCode Extensions (Container-Side)

The following extensions MUST be declared in `customizations.vscode.extensions` in `devcontainer.json`. These extensions run inside the container, not the host.

### 6.1 Required Extensions

| Extension ID | Name | Purpose |
|---|---|---|
| `dbaeumer.vscode-eslint` | ESLint | Lint feedback in editor |
| `esbenp.prettier-vscode` | Prettier | Format on save |
| `prisma.prisma` | Prisma | Schema syntax, formatting, jump-to-definition |
| `ms-vscode.vscode-typescript-next` | TypeScript Nightly | Improved TypeScript support |

### 6.2 Recommended Extensions (Container-Side)

| Extension ID | Name | Purpose |
|---|---|---|
| `ms-azuretools.vscode-docker` | Docker | Docker Compose visualization |
| `mtxr.sqltools` | SQLTools | Database query interface |
| `mtxr.sqltools-driver-pg` | SQLTools PostgreSQL | PostgreSQL driver for SQLTools |
| `humao.rest-client` | REST Client | API testing from `.http` files |
| `EditorConfig.EditorConfig` | EditorConfig | Apply `.editorconfig` settings |

### 6.3 Extension Classification Rule

Extensions that require access to the host filesystem or OS-level resources (e.g., Git Lens source control, GitHub Pull Requests) MUST be listed in `.vscode/extensions.json` (host-side) rather than in `devcontainer.json`. Extensions that operate on source code (linting, formatting, language services) belong inside the container.

---

## 7. Container-Side Workspace Settings

The following settings MUST be applied via `customizations.vscode.settings` in `devcontainer.json`:

| Setting | Value | Rationale |
|---|---|---|
| `editor.formatOnSave` | `true` | Enforce consistent formatting |
| `editor.defaultFormatter` | `"esbenp.prettier-vscode"` | Prettier is the project formatter |
| `[typescript]editor.defaultFormatter` | `"esbenp.prettier-vscode"` | Override for TypeScript files |
| `editor.codeActionsOnSave` | `{ "source.fixAll.eslint": "explicit" }` | Auto-fix ESLint on save |
| `eslint.validate` | `["typescript", "javascript"]` | ESLint scope |
| `files.eol` | `"\n"` | LF line endings in new files |
| `files.encoding` | `"utf8"` | UTF-8 without BOM |
| `typescript.preferences.importModuleSpecifier` | `"relative"` | Consistent import style |
| `npm.packageManager` | `"npm"` | Explicit package manager |

---

## 8. Forwarded Ports

| Port | Service | Label | Visibility |
|---|---|---|---|
| 3000 | NestJS Application | `"FactoryERP API"` | `"private"` (local machine only) |
| 5432 | PostgreSQL | `"PostgreSQL"` | `"private"` |
| 5050 | PgAdmin (optional) | `"PgAdmin"` | `"private"` |

Port 3000 MUST auto-open in the browser on forward (`onAutoForward: "openBrowserOnce"`).

---

## 9. Environment Variables

### 9.1 Variable Injection Strategy

**MANDATORY:** Environment variables MUST NOT be hardcoded in `devcontainer.json`. They are injected using one of two approaches:

**Approach A — `remoteEnv` with host environment forwarding (RECOMMENDED for developer machines):**
```json
"remoteEnv": {
  "DATABASE_URL": "${localEnv:DATABASE_URL}",
  "JWT_SECRET": "${localEnv:JWT_SECRET}",
  "JWT_EXPIRES_IN": "${localEnv:JWT_EXPIRES_IN}",
  "REFRESH_EXPIRES_IN": "${localEnv:REFRESH_EXPIRES_IN}",
  "NODE_ENV": "${localEnv:NODE_ENV}"
}
```

The developer sets these in their host `.env` file, which is also loaded by Docker Compose for the PostgreSQL service. VSCode Dev Containers reads them from the host shell environment.

**Approach B — `containerEnv` with Docker Compose environment (ALTERNATIVE for Codespaces/CI):**
Docker Compose injects the variables via its `environment:` block into the `app` service.

### 9.2 `postCreateCommand` Environment

The `postCreateCommand` runs `npm ci && DATABASE_URL="..." npx prisma generate`. The `DATABASE_URL` used here must point to the Compose-networked PostgreSQL service (hostname: `db`, port: 5432, as defined in document 04).

**Concrete value for `postCreateCommand`:**
```
npm ci && DATABASE_URL="postgresql://factory_dev:factory_dev@db:5432/factory_erp" npx prisma generate
```

This value uses the development-only credentials defined in `docker-compose.dev.yml`. Real credentials are never embedded here.

---

## 10. User Permissions

| Item | Specification |
|---|---|
| Container user | `vscode` (UID 1000) — non-root |
| Workspace ownership | `/workspaces/backend` owned by `vscode` |
| `node_modules/` ownership | `vscode` (set during `postCreateCommand`) |
| Docker socket access | Group `docker` — only if Docker-in-Docker feature is enabled |
| `sudo` access | Passwordless `sudo` for `vscode` — available in Microsoft base image |

**Rule IEF-009 (from document 00):** No bootstrap scripts may rely on `sudo`. The `sudo` capability in the container is reserved for one-off manual operations.

---

## 11. Validation Checklist

The DevContainer implementation is valid when ALL of the following pass:

| Check | How to Verify |
|---|---|
| Container opens without errors | `Remote-Containers: Reopen in Container` completes in VSCode |
| Node version matches `.nvmrc` | `node --version` inside container returns `v24.16.0` |
| `npm ci` succeeds | No errors in `postCreateCommand` output |
| `prisma generate` succeeds | Client generated for `linux-musl` or `debian-openssl-3.0.x` target |
| `npm run build` passes | Exit code 0 inside container |
| `npm run lint` passes | Exit code 0, 0 errors |
| `npm run test` passes | 482 tests, exit code 0 |
| ESLint extension active | Red underlines appear for lint violations in editor |
| Prettier formats on save | Saving a `.ts` file triggers format |
| Port 3000 forwarded | Application accessible at `localhost:3000` after `npm run start:dev` |
| PostgreSQL reachable | `psql -h db -U factory_dev -d factory_erp` connects from inside container |

---

## 12. Compliance

This specification complies with:
- Master Execution Contract (00) — Rules IEF-001 through IEF-009
- Cross-Platform Requirements (02) — Sections 5, 6.3, 9
- FEOS `09_SECURITY_GOVERNANCE.md` — no secrets in committed files

---

## 13. Engineering Rules Summary

| Rule | Classification | Description |
|---|---|---|
| Pin base image to minor tag | MANDATORY | Prevents unexpected Node major upgrades |
| Run as `vscode` non-root user | MANDATORY | Security and extension safety |
| No secrets in `devcontainer.json` | MANDATORY | Use `remoteEnv` with host env forwarding |
| `postCreateCommand` runs `npm ci` | MANDATORY | Ensures container-appropriate binaries |
| No custom Dockerfile without justification | RECOMMENDED | Base image is sufficient in baseline case |
| Docker-in-Docker feature | OPTIONAL | Enable only when Compose commands from inside container are required |
