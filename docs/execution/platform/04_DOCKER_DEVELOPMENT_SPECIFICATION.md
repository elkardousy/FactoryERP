# 04 — Docker Development Specification
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Complete specification for the Docker Compose development environment topology |
| **Scope** | `docker-compose.dev.yml`; all service containers; networking; volumes; health checks; secrets |
| **Audience** | Platform engineers, DevOps lead, all developers |
| **Status** | SPECIFICATION COMPLETE — Implementation Pending |
| **Owner** | Principal DevOps Engineer |
| **Review Cycle** | On service image major version upgrade or new service addition |
| **Version** | 1.0 |
| **Dependencies** | Repository audit (01), cross-platform requirements (02), DevContainer spec (03) |
| **Inputs** | Service requirements from application architecture (PostgreSQL mandatory; PgAdmin optional) |
| **Outputs** | `docker-compose.dev.yml`, `.env.example` |

---

## 1. Development Environment Philosophy

### 1.1 Scope of Docker Compose in Development

The Docker Compose development environment provides INFRASTRUCTURE ONLY. It does NOT run the NestJS application. The application is always started via `npm run start:dev` on the developer's machine (or inside the DevContainer).

This is a deliberate design choice:
- Maintains fast hot-reload cycles (`--watch` mode is incompatible with production-style containers)
- Keeps the container count minimal and startup fast
- Allows the developer to debug the application in VSCode without remote attach complexity

### 1.2 File Naming

The primary development Compose file is `docker-compose.dev.yml` (not `docker-compose.yml`). This prevents accidental invocation without the `-f` flag.

The production Compose file (if created in a future phase) MUST NOT overwrite this file.

**MANDATORY:** All `docker compose` commands in developer documentation and scripts MUST include `-f docker-compose.dev.yml` explicitly.

### 1.3 Compose Version

No `version:` key at the top of the file (deprecated in Compose Specification v1.0+). All services use the current Compose Specification syntax.

---

## 2. Compose Topology

```
[Developer Machine / DevContainer]
  └─ docker-compose.dev.yml
       ├─ db          (PostgreSQL 16)      ← primary infrastructure
       ├─ pgadmin     (PgAdmin 4)          ← optional; enabled via profile
       ├─ redis       (Redis 7)            ← optional; reserved; disabled by default
       └─ mailhog     (MailHog)            ← optional; reserved; disabled by default

Networks:
  factory-dev-network (bridge)             ← all services on same network

Volumes:
  factory-postgres-data                    ← PostgreSQL data persistence
  factory-pgadmin-data                     ← PgAdmin configuration persistence
```

---

## 3. Networks

### 3.1 Development Network

| Property | Value |
|---|---|
| Name | `factory-dev-network` |
| Driver | `bridge` |
| Scope | All development services |
| External | `false` — created and managed by this Compose file |

All services MUST be attached to `factory-dev-network`. No service may use `network_mode: host`.

### 3.2 Network Rationale

A dedicated named network (rather than the default Compose network) provides:
- Deterministic hostname resolution between services
- Isolation from other Docker projects on the same machine
- Explicit network intent visible in the file

---

## 4. Volumes

### 4.1 PostgreSQL Data Volume

| Property | Value |
|---|---|
| Name | `factory-postgres-data` |
| Driver | `local` |
| Scope | PostgreSQL data directory |
| Bind mount | PROHIBITED — named volume only (see cross-platform requirements §8.3) |

### 4.2 PgAdmin Configuration Volume

| Property | Value |
|---|---|
| Name | `factory-pgadmin-data` |
| Driver | `local` |
| Scope | PgAdmin server configuration and query history |
| Bind mount | PROHIBITED |

### 4.3 Application Code (DevContainer Integration)

When the DevContainer is used, the workspace folder (`/workspaces/backend`) is mounted into the `app` service by VSCode automatically. This is NOT a volume defined in `docker-compose.dev.yml`.

### 4.4 Volume Lifecycle

| Operation | Command |
|---|---|
| Create (automatic on first `up`) | `docker compose -f docker-compose.dev.yml up -d` |
| Persist data between restarts | No action required — named volumes persist |
| Full reset (destroy all data) | `docker compose -f docker-compose.dev.yml down -v` |

**MANDATORY:** Volume destruction (`down -v`) is a data-loss operation. It MUST be documented clearly in the bootstrap and onboarding guides.

---

## 5. PostgreSQL Service

### 5.1 Image

| Property | Value | Rationale |
|---|---|---|
| Image | `postgres:16.4-alpine` | Alpine base — minimal footprint; deterministic version |
| Architecture | `linux/amd64`, `linux/arm64` | Multi-arch official image |
| Version rationale | PostgreSQL 16 — current LTS; matches developer local install |

**MANDATORY:** Image tag MUST be pinned to `major.minor.patch` format (`16.4`), never `16` or `latest`.

### 5.2 Configuration

| Property | Value | Notes |
|---|---|---|
| Container name | `factory-erp-db` | Deterministic; avoids hash suffix |
| Hostname | `db` | Used by application and DevContainer `postCreateCommand` |
| Port mapping | `5432:5432` | Host port 5432 → container port 5432 |
| Restart policy | `unless-stopped` | Survives Docker restarts; stops on explicit `down` |
| User | Default (`postgres`) | PostgreSQL image default |

### 5.3 Environment Variables

| Variable | Value | Source |
|---|---|---|
| `POSTGRES_USER` | `factory_dev` | `.env` (`POSTGRES_USER`) |
| `POSTGRES_PASSWORD` | `${POSTGRES_PASSWORD}` | `.env` (developer-set; never hardcoded) |
| `POSTGRES_DB` | `factory_erp` | `.env` (`POSTGRES_DB`) |

**MANDATORY:** `POSTGRES_PASSWORD` MUST NOT be hardcoded in `docker-compose.dev.yml`. It MUST be referenced as `${POSTGRES_PASSWORD}` and defined in `.env` (gitignored).

### 5.4 Health Check

```
test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-factory_dev} -d ${POSTGRES_DB:-factory_erp}"]
interval: 10s
timeout: 5s
retries: 5
start_period: 10s
```

Services that depend on PostgreSQL MUST declare `depends_on: db: condition: service_healthy`.

### 5.5 Volume Mount

```yaml
volumes:
  - factory-postgres-data:/var/lib/postgresql/data
```

### 5.6 Initialization

PostgreSQL initialization scripts can be placed in `docker/postgres/init/` and mounted to `/docker-entrypoint-initdb.d/`. These run ONLY on first container creation (when `factory-postgres-data` volume is empty).

**Use case for Phase 4.5:** Create the `factory` schema on first initialization:
```sql
CREATE SCHEMA IF NOT EXISTS factory;
```

This does not conflict with Prisma migrations, which manage tables within the `factory` schema.

---

## 6. PgAdmin Service

### 6.1 Classification: OPTIONAL — Profile-Gated

PgAdmin is declared under the `tools` Compose profile. It does NOT start with `docker compose up` by default. It must be explicitly requested:

```
docker compose -f docker-compose.dev.yml --profile tools up -d
```

### 6.2 Image

| Property | Value |
|---|---|
| Image | `dpage/pgadmin4:8.14` |
| Architecture | `linux/amd64`, `linux/arm64` |

### 6.3 Configuration

| Property | Value |
|---|---|
| Container name | `factory-erp-pgadmin` |
| Port mapping | `5050:80` |
| Restart policy | `unless-stopped` |

### 6.4 Environment Variables

| Variable | Value | Source |
|---|---|---|
| `PGADMIN_DEFAULT_EMAIL` | `${PGADMIN_EMAIL}` | `.env` |
| `PGADMIN_DEFAULT_PASSWORD` | `${PGADMIN_PASSWORD}` | `.env` |
| `PGADMIN_CONFIG_SERVER_MODE` | `"False"` | PgAdmin config — disables multi-user mode for dev |

### 6.5 Volume

```yaml
volumes:
  - factory-pgadmin-data:/var/lib/pgadmin
```

---

## 7. Redis Service

### 7.1 Classification: OPTIONAL — Reserved for Future Use

Redis is declared but gated behind the `cache` Compose profile. It is NOT started by default.

This service is reserved for when the application implements session persistence, caching, or rate-limit storage beyond the current in-memory implementation.

### 7.2 Image

| Property | Value |
|---|---|
| Image | `redis:7.4-alpine` |
| Architecture | `linux/amd64`, `linux/arm64` |

### 7.3 Configuration

| Property | Value |
|---|---|
| Container name | `factory-erp-redis` |
| Port mapping | `6379:6379` |
| Restart policy | `unless-stopped` |

### 7.4 Health Check

```
test: ["CMD", "redis-cli", "ping"]
interval: 10s
timeout: 5s
retries: 3
```

**Note:** No authentication is configured for Redis in the development environment. If Redis is used in production, authentication and TLS are required.

---

## 8. MailHog Service

### 8.1 Classification: OPTIONAL — Reserved for Future Use

MailHog provides a local SMTP server that captures outbound emails for inspection. It is declared under the `mail` Compose profile.

This service is reserved for when the application implements email functionality (password reset, notifications, order confirmations).

### 8.2 Image

| Property | Value |
|---|---|
| Image | `mailhog/mailhog:v1.0.1` |
| Architecture | `linux/amd64` only (official image) |

**Note on arm64:** The official MailHog image does not publish arm64 manifests. On macOS M-series or Linux arm64, Docker runs it via emulation (slower). An alternative arm64-compatible image (`axllent/mailpit`) may be substituted.

### 8.3 Configuration

| Property | Value |
|---|---|
| Container name | `factory-erp-mailhog` |
| Port mapping (SMTP) | `1025:1025` |
| Port mapping (Web UI) | `8025:8025` |
| Restart policy | `unless-stopped` |

---

## 9. Image Version Policy

| Rule | Classification | Detail |
|---|---|---|
| All images pinned to exact version tag | MANDATORY | `postgres:16.4-alpine`, not `postgres:16` or `latest` |
| `latest` tag prohibited | MANDATORY | Prevents silent environment drift |
| Image updates require explicit decision | MANDATORY | Document version change in Engineering Decision Report |
| Alpine variants preferred for infrastructure services | RECOMMENDED | Smaller image footprint; faster pull |
| Multi-arch images required | MANDATORY | Supports macOS arm64 developers without emulation |

---

## 10. Container Naming Convention

All containers follow the `factory-erp-<service>` naming pattern:

| Service | Container Name |
|---|---|
| PostgreSQL | `factory-erp-db` |
| PgAdmin | `factory-erp-pgadmin` |
| Redis | `factory-erp-redis` |
| MailHog | `factory-erp-mailhog` |

This prevents naming conflicts when multiple Compose projects exist on the same machine.

---

## 11. Secrets Policy

### 11.1 Policy Statement

**MANDATORY: No credentials, passwords, or API keys are hardcoded in `docker-compose.dev.yml` or any committed file.**

All credentials are provided via `.env` (gitignored) using variable substitution (`${VAR_NAME}`).

### 11.2 `.env` Variables Required for Compose

| Variable | Example Value (`.env.example`) | Notes |
|---|---|---|
| `POSTGRES_USER` | `factory_dev` | May be hardcoded as default — not a secret |
| `POSTGRES_PASSWORD` | `change_me_locally` | MUST be changed by each developer |
| `POSTGRES_DB` | `factory_erp` | Not a secret — database name |
| `DATABASE_URL` | `postgresql://factory_dev:change_me_locally@localhost:5432/factory_erp` | Derived from above; for application and Prisma CLI |
| `PGADMIN_EMAIL` | `admin@factory.local` | PgAdmin login — not a secret |
| `PGADMIN_PASSWORD` | `change_me_locally` | MUST be changed |
| `JWT_SECRET` | `minimum_32_char_secret_change_me` | Required by application |
| `JWT_EXPIRES_IN` | `15m` | Application JWT expiry |
| `REFRESH_EXPIRES_IN` | `7d` | Application refresh token expiry |
| `NODE_ENV` | `development` | Application mode |

### 11.3 `.env.example` Requirement

**MANDATORY:** `.env.example` MUST be committed to the repository. It contains all variable names with safe placeholder values. Developers copy it to `.env` and fill in real values.

---

## 12. Startup Sequence

The correct startup sequence is:

1. `docker compose -f docker-compose.dev.yml up -d` — start PostgreSQL (and optional services)
2. Wait for PostgreSQL health check to pass (automatic via `depends_on: condition: service_healthy`)
3. Run Prisma migrations if needed: `DATABASE_URL="..." npx prisma migrate status`
4. Start the application: `npm run start:dev`

Services that depend on PostgreSQL MUST NOT start until the PostgreSQL health check reports healthy. This is enforced via the `depends_on` `condition: service_healthy` directive.

---

## 13. Shutdown Sequence

| Command | Effect |
|---|---|
| `docker compose -f docker-compose.dev.yml stop` | Stop containers; preserve volumes and networks |
| `docker compose -f docker-compose.dev.yml down` | Stop and remove containers and networks; preserve volumes |
| `docker compose -f docker-compose.dev.yml down -v` | Stop and remove containers, networks, AND volumes (data loss) |

**MANDATORY:** `down -v` MUST be clearly documented as a destructive operation in all scripts and documentation that reference it.

---

## 14. Recovery Procedures

### 14.1 PostgreSQL Fails to Start

Symptom: `docker compose -f docker-compose.dev.yml up -d` exits with PostgreSQL container in `unhealthy` or `exited` state.

Recovery steps:
1. Check logs: `docker logs factory-erp-db`
2. Common cause: port 5432 already in use by a local PostgreSQL instance
3. Resolution: stop local PostgreSQL service, or remap the container port to `5433:5432`

### 14.2 Volume Corruption

Symptom: PostgreSQL starts but cannot read data files.

Recovery:
1. `docker compose -f docker-compose.dev.yml down -v` (DESTRUCTIVE — data loss)
2. Re-run migrations via the documented Prisma workflow
3. Re-seed if applicable

### 14.3 `bcrypt` Native Module Mismatch

Symptom: `Error: The module '.../bcrypt/build/Release/bcrypt_lib.node' was compiled against a different Node.js version`.

Recovery:
1. `rm -rf node_modules`
2. `npm ci`
3. This rebuilds native modules for the current Node version

---

## 15. Validation

The Docker development environment implementation is valid when ALL of the following pass:

| Check | Command / Method |
|---|---|
| Compose file parses without errors | `docker compose -f docker-compose.dev.yml config` |
| PostgreSQL starts and reports healthy | `docker compose -f docker-compose.dev.yml ps` shows `db` as `healthy` |
| `DATABASE_URL` in `.env` connects successfully | `psql "$DATABASE_URL" -c "SELECT 1"` exits 0 |
| Application boots against containerized DB | `npm run start:dev` reaches `Application is running` log |
| `prisma validate` passes | `DATABASE_URL="..." npx prisma validate` exits 0 |
| Named volumes created | `docker volume ls` shows `factory-postgres-data` |
| Container names match specification | `docker ps` shows `factory-erp-db` |
| No credentials in Compose file | `git diff HEAD -- docker-compose.dev.yml` shows no plaintext passwords |
| PgAdmin accessible when `--profile tools` | Browser reaches `localhost:5050` after profile start |

---

## 16. Compliance

- Master Execution Contract (00) — Rules IEF-003, IEF-004, IEF-005, IEF-009
- Cross-Platform Requirements (02) — Sections 8 (Docker), 4 (Environment Variables)
- FEOS `09_SECURITY_GOVERNANCE.md` — no secrets in committed files
- FEOS `14_OPERATIONAL_PLAYBOOK.md` — recovery procedures documented
