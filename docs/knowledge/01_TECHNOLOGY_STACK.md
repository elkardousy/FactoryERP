# 01 — Technology Stack

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Runtime

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | ≥18 (implied by `@types/node ^24`) | Production runtime |
| TypeScript | ^5.7.3 | `target: ES2023`, `module: nodenext` |
| PostgreSQL | 18 (port 5432, active) | `factory` schema |
| PostgreSQL | 16 (port 5433) | NOT used by application |

---

## Framework

| Package | Version | Role |
|---------|---------|------|
| `@nestjs/common` | ^11.0.1 | Core framework |
| `@nestjs/core` | ^11.0.1 | DI container, bootstrapping |
| `@nestjs/config` | ^4.0.4 | Config module (namespace-based) |
| `@nestjs/jwt` | ^11.0.2 | JWT token signing/verification |
| `@nestjs/passport` | ^11.0.5 | Passport.js integration |
| `@nestjs/platform-express` | ^11.0.1 | HTTP adapter (Express) |
| `@nestjs/swagger` | ^11.4.4 | Swagger UI at `/api/docs` |
| `@nestjs/throttler` | ^6.5.0 | Rate limiting (60 req/60s default) |
| `@nestjs/websockets` | ^11.1.27 | WebSocket support (declared, unused) |
| `@nestjs/platform-socket.io` | ^11.1.27 | Socket.IO adapter (declared, unused) |

---

## ORM / Database

| Package | Version | Role |
|---------|---------|------|
| `@prisma/client` | ^6.16.2 | Generated Prisma client |
| `prisma` | ^6.16.2 | CLI and schema engine |

**Active Prisma preview features:** `multiSchema`  
**Schema location:** `prisma/schema.prisma` (2229 lines)  
**Migration path:** `prisma/migrations/`

---

## Security

| Package | Version | Role |
|---------|---------|------|
| `bcrypt` | ^6.0.0 | Password hashing |
| `helmet` | ^8.2.0 | HTTP security headers |
| `passport` | ^0.7.0 | Authentication middleware |
| `passport-jwt` | ^4.0.1 | JWT passport strategy |
| `joi` | ^18.2.3 | Environment variable validation at startup |

---

## HTTP / Middleware

| Package | Version | Role |
|---------|---------|------|
| `compression` | ^1.8.1 | Response compression |
| `class-validator` | ^0.15.1 | DTO validation (ValidationPipe) |
| `class-transformer` | ^0.5.1 | DTO transformation |

---

## Logging

| Package | Version | Role |
|---------|---------|------|
| `nestjs-pino` | ^4.6.1 | NestJS Pino integration |
| `pino` | ^10.3.1 | Structured JSON logger |
| `pino-pretty` | ^13.1.3 | Pretty-print for development |

**Behavior:** Development → pretty-printed logs. Production → raw JSON.  
**Redacted headers:** `authorization`, `cookie`, `set-cookie`

---

## Realtime (Declared, Not Yet Wired)

| Package | Version | Role |
|---------|---------|------|
| `socket.io` | ^4.8.3 | WebSocket server |
| `rxjs` | ^7.8.1 | Reactive extensions (NestJS internal) |

---

## Utilities

| Package | Version | Role |
|---------|---------|------|
| `ms` | ^2.1.3 | Time string parsing (JWT expiry) |
| `reflect-metadata` | ^0.2.2 | Decorator metadata (NestJS requirement) |
| `swagger-ui-express` | ^5.0.1 | Swagger UI server |

---

## Development Dependencies

| Package | Version | Role |
|---------|---------|------|
| `@nestjs/cli` | ^11.0.0 | NestJS CLI |
| `@nestjs/testing` | ^11.0.1 | Test module factory |
| `jest` | ^30.0.0 | Test runner |
| `ts-jest` | ^29.2.5 | TypeScript Jest transformer |
| `typescript-eslint` | ^8.20.0 | TypeScript ESLint integration |
| `eslint` | ^9.18.0 | Linter (flat config) |
| `eslint-config-prettier` | ^10.0.1 | Disables conflicting ESLint rules |
| `eslint-plugin-prettier` | ^5.2.2 | Runs Prettier as ESLint rule |
| `prettier` | ^3.4.2 | Code formatter |
| `supertest` | ^7.0.0 | E2E HTTP testing |
| `ts-node` | ^10.9.2 | TypeScript execution |
| `ts-loader` | ^9.5.2 | Webpack TS loader |
| `tsconfig-paths` | ^4.2.0 | TypeScript path resolution |
| `source-map-support` | ^0.5.21 | Source map support |

---

## TypeScript Configuration

```json
{
  "module": "nodenext",
  "moduleResolution": "nodenext",
  "resolvePackageJsonExports": true,
  "esModuleInterop": true,
  "isolatedModules": true,          // CRITICAL: type re-exports need `export type`
  "emitDecoratorMetadata": true,    // Required for NestJS DI
  "experimentalDecorators": true,
  "target": "ES2023",
  "strictNullChecks": true,
  "noImplicitAny": false,
  "strictBindCallApply": false,
  "noFallthroughCasesInSwitch": false,
  "incremental": true,
  "skipLibCheck": true
}
```

---

## ESLint Configuration (eslint.config.mjs)

- Flat config format (ESLint 9)
- `@typescript-eslint/recommendedTypeChecked` ruleset
- `@typescript-eslint/no-explicit-any: off`
- `@typescript-eslint/no-floating-promises: warn`
- `@typescript-eslint/no-unsafe-argument: warn`
- `prettier/prettier: error` (with `endOfLine: auto`)
- Test files: relax `unbound-method`, `no-unsafe-assignment`, `no-unsafe-argument`, `no-unsafe-member-access`

---

## Jest Configuration (package.json)

```json
{
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "moduleFileExtensions": ["js", "json", "ts"],
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage"
}
```

E2E config: `test/jest-e2e.json`

---

## Database Configuration

| Parameter | Value |
|-----------|-------|
| Host | localhost |
| Port | 5432 (PostgreSQL 18) |
| Database | `factory_erp` |
| App User | `elkardousy` / `250686` |
| Superuser | `postgres` / `250686??` |
| Schema | `factory` |
| Prisma prefix | `DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp"` |

**WARNING:** Postgres superuser password contains `??` — URL-unsafe. Use PGPASSWORD env var only, never in DATABASE_URL.

---

## Environment Variables (Joi-validated at startup)

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | `development` / `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Token signing secret |
| `JWT_EXPIRES_IN` | Yes | e.g., `15m` |
| `REFRESH_EXPIRES_IN` | Yes | e.g., `7d` |
| `APP_NAME` | No | Application name |
| `PORT` | No | HTTP port (default 3000) |
| `LOG_LEVEL` | No | Pino log level |
