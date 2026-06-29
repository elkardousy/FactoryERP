# 07 — Code Governance

**Document:** FEOS-07  
**Category:** Code  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-03 (Architecture Governance), FEOS-04 (Implementation Governance), FEOS-08 (Test Governance)  
**Related KEB:** KEB-02 (Architecture Baseline), KEB-17 (Cross Reference)

---

## Purpose

This document governs the structure, naming, and implementation standards for all TypeScript code in FactoryERP. It defines folder conventions, naming rules, DTO requirements, service patterns, logging requirements, error handling, dependency injection, and Swagger documentation requirements.

## Scope

All TypeScript files in `src/`.

## Audience

All engineers and AI agents writing or reviewing TypeScript code.

---

## Folder Structure Standards

### Module Layout

Each feature module follows this layout:

```
src/modules/<domain>/
├── controllers/
│   └── <domain>.controller.ts
├── dto/
│   ├── <noun>-request.dto.ts
│   ├── <noun>-response.dto.ts
│   ├── <noun>-filter.dto.ts
│   └── <noun>-history.dto.ts
├── repositories/
│   └── <domain>.repository.ts
├── services/
│   ├── <domain>.factory.ts
│   ├── <domain>.mapper.ts
│   ├── <domain>.validator.ts
│   └── <domain>.service.ts
├── use-cases/
│   ├── <feature>/
│   │   ├── <verb>-<noun>.use-case.ts
│   │   ├── <verb>-<noun>.command.ts   (for commands)
│   │   ├── <verb>-<noun>.query.ts     (for queries)
│   │   └── index.ts                   (barrel export)
│   └── <domain>.use-cases.spec.ts     (all use case tests in one spec)
└── <domain>.module.ts
```

### Core Layout

Core infrastructure lives in `src/core/` and is not modified by feature sprints:

```
src/core/
├── config/          (app, database, jwt, logger config factories)
├── database/
│   ├── prisma/      (PrismaService, PrismaExceptionFilter)
│   ├── repositories/base/  (BaseRepository)
│   └── health/      (DatabaseHealthService)
├── exceptions/filters/  (AllExceptionsFilter)
├── interceptors/        (ResponseInterceptor)
├── logger/              (LoggerModule, LoggerService)
├── pipes/               (GlobalValidationPipe)
└── responses/           (ErrorResponse, ApiError)
```

---

## Naming Conventions

### Files

| Artifact | Pattern | Example |
|----------|---------|---------|
| Controller | `<domain>.controller.ts` | `inventory.controller.ts` |
| Module | `<domain>.module.ts` | `inventory.module.ts` |
| Repository | `<entity-plural>.repository.ts` | `physical-bags.repository.ts` |
| Service | `<domain>.<role>.ts` | `inventory-transaction.mapper.ts` |
| Use case | `<verb>-<noun>.use-case.ts` | `create-reservation.use-case.ts` |
| Command | `<verb>-<noun>.command.ts` | `create-reservation.command.ts` |
| Query | `<verb>-<noun>.query.ts` | `list-reservations.query.ts` |
| DTO | `<noun>-<role>.dto.ts` | `reservation-request.dto.ts` |
| Spec | `<domain>.use-cases.spec.ts` | `reservations.use-cases.spec.ts` |
| Interface | `<noun>.interface.ts` | `reservation-result.interface.ts` |

### Classes

| Artifact | Pattern | Example |
|----------|---------|---------|
| Controller | `<Domain>Controller` | `InventoryController` |
| Module | `<Domain>Module` | `InventoryModule` |
| Repository | `<EntityPlural>Repository` | `PhysicalBagsRepository` |
| Service | `<Domain><Role>Service` | `InventoryTransactionMapper` |
| Use case | `<Verb><Noun>UseCase` | `CreateReservationUseCase` |
| Command | `<Verb><Noun>Command` | `CreateReservationCommand` |
| Query | `<Verb><Noun>Query` | `ListReservationsQuery` |
| DTO | `<Noun><Role>Dto` | `ReservationRequestDto` |

### Methods

| Artifact | Pattern |
|----------|---------|
| Use case entry point | `execute(command: ...) / execute(query: ...)` |
| Repository read | `findById()`, `findAll()`, `findBy<Field>()` |
| Repository write | `create()`, `update()`, `delete()`, `upsert()` |
| Mapper | `toResponse()`, `toResponseList()` |
| Factory | `create()`, `build()` |
| Validator | `validate()`, `validateAvailability()` |

---

## DTO Standards

### Request DTOs

Every controller input must be a DTO class decorated with `class-validator` and `class-transformer` decorators:

```typescript
import { IsString, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationRequestDto {
  @ApiProperty({ description: 'Physical bag ID' })
  @IsString()
  bag_id: string;  // String in DTO, BigInt in domain

  @ApiProperty({ description: 'Dozens to reserve', minimum: 1 })
  @IsPositive()
  reserved_dozens: number;

  @ApiProperty({ description: 'Expiry date (optional)', required: false })
  @IsOptional()
  expires_at?: string;
}
```

Rules for request DTOs:
- BigInt IDs are received as `string` in DTOs.
- All number fields receive `@IsPositive()` or appropriate range validators.
- Optional fields use `@IsOptional()`.
- All fields have `@ApiProperty()` with description.
- No business logic in DTOs.

### Response DTOs

Response DTOs document what the API returns:

```typescript
export class ReservationResponseDto {
  @ApiProperty()
  reservation_id: string;  // BigInt serialized as string

  @ApiProperty()
  status: string;          // Enum value as string

  @ApiProperty()
  reserved_dozens: string; // Decimal serialized as string
}
```

Rules for response DTOs:
- All BigInt fields are `string` type (not `bigint` or `number`).
- All Decimal fields are `string` type.
- Enum fields are `string` type (Prisma enum value).
- All fields have `@ApiProperty()`.

---

## Repository Standards

All repositories must:

1. Extend `BaseRepository`.
2. Declare a constructor that calls `super(prisma)`.
3. Expose business-meaningful method names.
4. Use `this.db` for all Prisma queries.
5. Use `this.executeInTransaction()` for atomic multi-record operations.
6. Not expose raw Prisma types in their public method signatures (use domain types).

```typescript
@Injectable()
export class PhysicalBagReservationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findActiveByBagId(bagId: bigint): Promise<physical_bag_reservations[]> {
    return this.db.physical_bag_reservations.findMany({
      where: { bag_id: bagId, status: ReservationStatusEnum.ACTIVE }
    });
  }
}
```

---

## Service Standards

### Validator Services

Validator services check business rules before a use case proceeds:

- Receive domain objects (not DTOs).
- Throw `BadRequestException` or `ConflictException` for rule violations.
- Do not modify data — validation only.
- Are injected into use cases.

### Mapper Services

Mapper services translate between domain entities and DTOs:

- Have `toResponse()` and optionally `toResponseList()` methods.
- Call `serializeBigInts()` for BigInt fields.
- Return DTO instances, not raw Prisma entities.
- Contain no business logic.

### Factory Services

Factory services construct domain objects with business invariants:

- Receive validated DTO data.
- Return Prisma `create` input objects.
- Enforce default values and enum mappings.
- Example: `ReservationStatusEnum.ACTIVE` is set by the factory, not the controller.

---

## Controller Standards

Controllers must be thin. Every controller action:

1. Accepts input via a typed DTO parameter.
2. Calls exactly one use case's `execute()` method.
3. Returns the use case result.
4. Contains no business logic.
5. Has `@ApiBearerAuth('JWT')` on the class (for protected controllers).
6. Has `@ApiOperation({ summary: '...' })` on each action.
7. Has `@ApiResponse()` annotations for primary status codes.
8. Declares `version: '1'` in the `@Controller()` decorator.

```typescript
@ApiBearerAuth('JWT')
@Controller({ path: 'inventory/reservations', version: '1' })
export class InventoryController {
  
  @Post()
  @ApiOperation({ summary: 'Create a physical bag reservation' })
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  async createReservation(@Body() dto: ReservationRequestDto) {
    return this.createReservationUseCase.execute(
      new CreateReservationCommand(dto)
    );
  }
}
```

---

## Logging Standards

### Required Logger

Use `LoggerService` from `src/core/logger/logger.service.ts`. Do not use `console.log()`, `console.error()`, `console.warn()`.

### Available Methods

```typescript
this.logger.info(message: string, context?: object)
this.logger.warn(message: string, context?: object)
this.logger.error(message: string, error?: Error, context?: object)
this.logger.debug(message: string, context?: object)
```

**`this.logger.log()` does not exist.** Using `.log()` causes a runtime TypeError.

### Injection Pattern

```typescript
import { LoggerService } from '../../core/logger/logger.service';

@Injectable()
export class SomeUseCase {
  constructor(private readonly logger: LoggerService) {}
}
```

`LoggerModule` is global — no need to import it.

### What to Log

- `info`: Successful business operations (transaction created, reservation released).
- `warn`: Recoverable business rule violations (attempting to reserve more than available).
- `error`: Unexpected failures, caught exceptions.
- `debug`: Diagnostic information (query parameters, computed values).

Do not log: passwords, tokens, session IDs, or any PII.

---

## Error Handling Standards

### Throw NestJS HTTP Exceptions

Use NestJS built-in exceptions from `@nestjs/common`:

| Scenario | Exception |
|---------|-----------|
| Authentication required | `UnauthorizedException` |
| Resource not found | `NotFoundException` |
| Business rule violation | `BadRequestException` |
| Duplicate resource | `ConflictException` |
| Insufficient permissions | `ForbiddenException` |

### Exception Handling Rules

1. Throw exceptions from services and use cases. Controllers do not catch.
2. Do not catch exceptions unless transforming them to a more specific exception.
3. Do not swallow exceptions with empty catch blocks.
4. Prisma exceptions are handled by `PrismaExceptionFilter` — do not manually map Prisma error codes unless providing additional context.
5. Log errors before re-throwing when additional context is available.

---

## TypeScript Standards

### `isolatedModules: true`

Re-exporting a pure TypeScript interface or type from a barrel file **must** use `export type { Foo }`, not `export { Foo }`.

```typescript
// Correct:
export type { ReservationResult } from './reservation-result.interface';

// Wrong (violates isolatedModules):
export { ReservationResult } from './reservation-result.interface';
```

Class and enum re-exports use plain `export { }` as normal.

### `strictNullChecks: true`

All optional values must be null-checked before use. Do not use non-null assertion (`!`) unless the value's presence is guaranteed by the call site.

### Configuration Access

Never access `process.env` directly in application code. Use `ConfigService`:

```typescript
constructor(private readonly config: ConfigService) {}

const jwtSecret = this.config.get<string>('jwt.secret');
```

Known exceptions: `PrismaService` constructor and `loggerConfig` constant — both are documented in CLAUDE.md.

---

## Swagger Documentation Standards

All controllers must have:

- `@ApiBearerAuth('JWT')` at class level (for authenticated endpoints).
- `@ApiTags('<domain>')` at class level.
- `@ApiOperation({ summary: '...' })` on every action method.
- `@ApiResponse({ status: <code>, type: <DTO> })` for the primary success response.
- `@ApiResponse({ status: 401, description: 'Unauthorized' })` on every protected endpoint.

All request/response DTOs must have `@ApiProperty()` on every field.

---

## Compliance Rules

### Rule C-001 — LoggerService Only

**Classification:** MANDATORY  
**Statement:** `console.log()`, `console.error()`, `console.warn()`, and `console.info()` are forbidden in production code. Use `LoggerService`.  
**Violation Impact:** Lint error (ESLint rule).  
**Risk:** Unstructured logs, missing context, sensitive data in plain logs.  
**Recovery:** Replace with appropriate `LoggerService` method.  
**Approval Required:** None.

### Rule C-002 — No logger.log()

**Classification:** MANDATORY  
**Statement:** `this.logger.log()` does not exist on `LoggerService`. Using it causes a runtime TypeError. Use `this.logger.info()` for informational messages.  
**Violation Impact:** Runtime TypeError, endpoint failure.  
**Risk:** Silent startup failures or request failures.  
**Recovery:** Replace `.log()` with `.info()`.  
**Approval Required:** None.

### Rule C-003 — Export Type for Interfaces

**Classification:** MANDATORY  
**Statement:** Pure TypeScript interfaces re-exported from barrel files must use `export type { }` syntax, not `export { }`.  
**Violation Impact:** TypeScript compilation error (isolatedModules).  
**Risk:** Build failure.  
**Recovery:** Add `type` keyword to the export statement.  
**Approval Required:** None.

### Rule C-004 — Swagger Annotation Completeness

**Classification:** MANDATORY  
**Statement:** Every controller endpoint must have `@ApiOperation` and at least one `@ApiResponse`. Every DTO field must have `@ApiProperty`.  
**Violation Impact:** Incomplete Swagger documentation.  
**Risk:** API consumers cannot understand the contract.  
**Recovery:** Add missing annotations.  
**Approval Required:** None.

### Rule C-005 — No Direct process.env

**Classification:** MANDATORY  
**Statement:** Application code (excluding `PrismaService` and `loggerConfig`) must access configuration via `ConfigService`, not `process.env`.  
**Violation Impact:** Configuration validation bypassed, environment-specific behavior.  
**Risk:** Missing required env vars cause silent runtime failures instead of startup validation errors.  
**Recovery:** Inject `ConfigService` and use namespaced config getters.  
**Approval Required:** None.
