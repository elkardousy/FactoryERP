# Dependency Rules

This document is the definitive reference for which layers and modules may depend on which others in FactoryERP. Violations are identified and corrected during code review.

See also: [ADR-022](adr/ADR-022-Dependency-Rules.md) for the full rationale.

---

## Layer Dependency Matrix

| Layer | May Import | Must NOT Import |
|-------|-----------|----------------|
| **Controller** | Use Cases, DTOs | Repositories, PrismaService, other module's services |
| **Use Case** | Repositories (own module), Services (own or global) | Controllers, PrismaService directly, other module's repositories |
| **Service** (cross-cutting) | Repositories (own module), other Services | Controllers, Use Cases |
| **Repository** | PrismaService only | Controllers, Use Cases, Services, other Repositories |
| **PrismaService** | Prisma Client, ConfigService | Everything above |

### Dependency Flow

```
HTTP Request
     ↓
Controller          validates input, calls one use case, returns result
     ↓
Use Case            all business logic; coordinates repository + services
     ↓    ↓
Repository  Service  data access / reusable capabilities
     ↓
PrismaService
     ↓
PostgreSQL
```

---

## Cross-Module Rules

### CM-1 — No Cross-Module Repository Injection

A repository from `CustomersModule` must never be injected into `SuppliersModule`. This holds even if the query seems trivial.

**Violation example:**
```typescript
// WRONG — SuppliersModule injecting a CustomersModule repository
constructor(private readonly customersRepo: CustomersRepository) {}
```

**Reason:** Cross-module repository injection creates hidden schema coupling. Customer table changes break Supplier code.

---

### CM-2 — Cross-Module Data Access via Services

If `GarmentModelsModule` needs to verify that a customer exists, `CustomersModule` exports a `CustomersService`. `GarmentModelsModule` declares `CustomersModule` in its `imports` array and injects `CustomersService`.

```typescript
// CustomersModule:
@Module({
  exports: [CustomersRepository],  // exported only for CustomersService
  providers: [CustomersService, CustomersRepository],
})

// GarmentModelsModule:
@Module({
  imports: [CustomersModule],
  providers: [GarmentModelsService, GarmentModelsRepository],
})
```

**Reason:** Service APIs are stable contracts. Repository schemas are internal implementation details.

---

### CM-3 — Global Modules Are an Exception

The following modules are `@Global()` and their exports are available everywhere without CM-2:

| Module | Exports |
|--------|---------|
| `PrismaModule` | `PrismaService` |
| `LoggerModule` | `LoggerService` |
| `AuditModule` | `AuditService` |
| `DocumentNumberingModule` | `DocumentNumberingService` |

These are infrastructure modules, not domain modules. Domain modules must still follow CM-1 and CM-2.

---

## Global Service Rules

### GS-1 — AuditService Is Always Fire-and-Forget

```typescript
// Correct:
void this.auditService.log({ action: 'CUSTOMER_CREATED', ... });

// Wrong — blocks the response on audit writing:
await this.auditService.log({ action: 'CUSTOMER_CREATED', ... });
```

---

### GS-2 — LoggerService, Never console

```typescript
// Correct:
this.logger.log('Customer created', { customerId });

// Wrong:
console.log('Customer created', customerId);
```

---

### GS-3 — No PrismaService Injection Outside Repositories

```typescript
// Correct — inside a Repository class extending BaseRepository:
constructor(prisma: PrismaService) {
  super(prisma);
}

// Wrong — in a Use Case or Service:
constructor(private readonly db: PrismaService) {}
```

---

## Configuration Rules

### CFG-1 — ConfigService Only

```typescript
// Correct:
const secret = this.configService.getOrThrow<string>('jwt.secret');

// Wrong:
const secret = process.env.JWT_SECRET;
```

**Documented exceptions** (both are in `src/core/`):
- `PrismaService` constructor reads `DATABASE_URL` via `process.env` directly (Prisma client requires the URL as a string at initialization time)
- `loggerConfig` constant reads `NODE_ENV` to select the log transport

---

## DTO Rules

### DTO-1 — All HTTP Input Is a DTO Class

HTTP body, query parameters, and route parameters must be declared as DTO classes with `class-validator` decorators. Raw string/number parameters without DTO wrapping are not permitted.

```typescript
// Correct:
@Get()
findAll(@Query() query: PaginationDto) {}

// Wrong:
@Get()
findAll(@Query('page') page: string) {}
```

---

### DTO-2 — Update DTOs Extend Create DTOs

```typescript
// Correct:
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

// Wrong (field duplication):
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  customer_name?: string;
}
```

---

### DTO-3 — Use `OmitType` / `PartialType` from `@nestjs/swagger`

```typescript
// Correct:
import { PartialType, OmitType } from '@nestjs/swagger';

// Wrong (Swagger schema breaks):
import { PartialType, OmitType } from '@nestjs/mapped-types';
```

See [ADR-009](adr/ADR-009-DTO-Mapping.md) for the rationale.

---

## TypeScript Import Rules

### TS-1 — Interface Re-Exports Use `export type`

```typescript
// Correct:
export type { LoginResult } from './contracts/login-result';

// Wrong (fails with isolatedModules: true):
export { LoginResult } from './contracts/login-result';
```

Classes and enums use plain `export {}` as normal.

---

## Enforcement

These rules are enforced during code review. Future automation options:

- `eslint-plugin-boundaries` — prevents cross-module imports at the file level
- Architecture fitness function tests — assert no cross-module repository injection
- NestJS module graph visualization — detect unexpected imports at CI time

Any intentional exception to these rules must be documented in the relevant ADR or in a code comment explaining the deviation.
