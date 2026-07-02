# FactoryERP

Enterprise resource planning backend built with NestJS 11, Prisma 6, and PostgreSQL 16.

---

## Getting Started

### Prerequisites

Install the following tools before proceeding:

| Tool | Version | Install Guide |
|---|---|---|
| Git | 2.40+ | https://git-scm.com/downloads |
| Docker Desktop | 4.25+ | https://docs.docker.com/get-docker/ |
| nvm (Linux/macOS) | latest | https://github.com/nvm-sh/nvm |
| nvm-windows (Windows) | latest | https://github.com/coreybutler/nvm-windows |

**Windows only — enable long paths** (required; `node_modules/` nesting exceeds the 260-character default limit):

```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

---

### Clone and Setup

```bash
git clone <repository-url>
cd backend

# Linux / macOS
cp .env.example .env          # copy and edit credentials
bash scripts/setup.sh         # install deps, start Docker, generate Prisma client

# Windows PowerShell
Copy-Item .env.example .env   # copy and edit credentials
powershell.exe -File scripts/setup.ps1
```

Edit `.env` and set `POSTGRES_PASSWORD` and `JWT_SECRET` to secure values before running setup.

---

### Start Development

```bash
# Start PostgreSQL (if not already running via setup.sh)
docker compose -f docker-compose.dev.yml up -d

# Start NestJS in watch mode
npm run start:dev
```

Visit **http://localhost:3000/api/docs** for the Swagger UI.

---

### Verify Environment

```bash
# Linux / macOS
bash scripts/doctor.sh

# Windows PowerShell
powershell.exe -File scripts/doctor.ps1
```

The doctor script runs 14 checks and exits 0 if all pass.

---

### DevContainer (Alternative)

Open the repository in VS Code and select **Remote-Containers: Reopen in Container** from the Command Palette. The DevContainer starts PostgreSQL automatically and runs `npm ci` and `prisma generate` on first launch. No local Node.js or Docker Compose setup is required — the container handles everything.

Requires: VS Code + [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

---

### Prisma Workflow

**`prisma.config.ts` skips `.env` loading** — all Prisma CLI commands must prefix `DATABASE_URL` explicitly:

```bash
# Generate client after schema changes
DATABASE_URL="postgresql://..." npx prisma generate

# Validate schema
DATABASE_URL="postgresql://..." npx prisma validate

# Check migration status
DATABASE_URL="postgresql://..." npx prisma migrate status

# Open Prisma Studio
DATABASE_URL="postgresql://..." npx prisma studio

# PROHIBITED — destroys custom enums and @updatedAt directives
# npx prisma db pull
```

---

### Common Issues

| Issue | Symptom | Fix |
|---|---|---|
| Wrong Node version | `engine "node" is incompatible` | `nvm use` in project directory |
| bcrypt rebuild needed | `bcrypt_lib.node was compiled against a different Node.js version` | `rm -rf node_modules && npm ci` |
| PostgreSQL port in use | `Ports are not available: 5432` | Stop local PostgreSQL or change port mapping in `docker-compose.dev.yml` |
| `prisma generate` fails | `DATABASE_URL is required` | Set `DATABASE_URL` in `.env` or prefix command explicitly |
| CRLF files after checkout | Files appear modified on checkout | `git rm --cached -r . && git reset --hard` |
| DevContainer image pull fails | Timeout on `mcr.microsoft.com` | Check network/proxy; run `docker pull mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm` manually |

---

## Commands

```bash
# Build
npm run build

# Development
npm run start:dev      # watch mode
npm run start:prod     # production (requires dist/)

# Tests
npm run test           # unit tests (482 tests, 42 suites)
npm run test:watch     # watch mode
npm run test:cov       # with coverage report
npm run test:e2e       # end-to-end tests

# Code quality
npm run lint           # ESLint with auto-fix
npm run format         # Prettier --write

# Infrastructure
docker compose -f docker-compose.dev.yml up -d          # start PostgreSQL
docker compose -f docker-compose.dev.yml up -d --profile tools   # + PgAdmin
docker compose -f docker-compose.dev.yml down           # stop
docker compose -f docker-compose.dev.yml down -v        # stop and remove volumes

# Bootstrap
bash scripts/setup.sh                          # first-time setup (Linux/macOS)
powershell.exe -File scripts/setup.ps1         # first-time setup (Windows)
bash scripts/doctor.sh                         # environment health check
powershell.exe -File scripts/doctor.ps1        # environment health check (Windows)
bash scripts/reset.sh                          # destroy environment (with confirmation)
```

---

## Architecture

```
Controllers → Use Cases → Services → Repositories → PrismaService
```

NestJS 11 monolith. Clean Architecture with strict layer enforcement. Prisma 6 with PostgreSQL 16. All routes versioned under `/v1/`. Swagger at `/api/docs`.

See [CLAUDE.md](CLAUDE.md) for full architecture reference, TypeScript constraints, and Prisma migration workflow.
