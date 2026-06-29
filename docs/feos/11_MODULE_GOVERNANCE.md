# 11 — Module Governance

**Document:** FEOS-11  
**Category:** Architecture  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per new module creation  
**Related FEOS:** FEOS-03 (Architecture Governance), FEOS-04 (Implementation Governance), FEOS-07 (Code Governance)  
**Related KEB:** KEB-07 (Module Status), KEB-02 (Architecture Baseline), KEB-16 (Dependency Graph)

---

## Purpose

This document defines the template, required layers, file structure, acceptance checklist, and forbidden practices for creating NestJS modules in FactoryERP. It ensures all new modules conform to the established architecture.

## Scope

All NestJS feature modules in `src/modules/`.

## Audience

Engineers and AI agents implementing new business domain modules.

---

## Module Maturity Model

Every FactoryERP module passes through these maturity stages:

| Stage | State | Description |
|-------|-------|-------------|
| STUB | Empty module file only | `@Module({})` with no providers |
| FOUNDATION | Module with schema-only repositories | Repositories defined, no use cases |
| PARTIAL | Some use cases implemented | Some endpoints active |
| COMPLETE | All planned use cases implemented | All gates passing |

The Inventory module reached COMPLETE status at Sprint 11.3.

---

## Module Prerequisites

Before a new module is implemented, all of the following must be true:

1. **Schema ready:** All Prisma models the module will operate on are defined in `prisma/schema.prisma` and migrated to the database.
2. **Dependencies ready:** All modules this module depends on are at COMPLETE or PARTIAL (with the needed features complete).
3. **Business knowledge documented:** The business domain is documented in KEB-03 (Business Knowledge) or the relevant ADR.
4. **Sprint scope approved:** The architect has approved the sprint scope.

Check KEB-07 (Module Status) to verify dependency modules are ready.

---

## Module File Structure

Every new module must follow this structure exactly:

```
src/modules/<domain>/
├── controllers/
│   └── <domain>.controller.ts
├── dto/
│   ├── <noun>-request.dto.ts
│   └── <noun>-response.dto.ts
│   (add filter.dto.ts and history.dto.ts as needed)
├── repositories/
│   └── <entity-plural>.repository.ts
│   (add one repository file per distinct entity area)
├── services/
│   ├── <domain>.factory.ts
│   ├── <domain>.mapper.ts
│   └── <domain>.validator.ts
│   (add additional services as needed)
├── use-cases/
│   ├── <feature>/
│   │   ├── <verb>-<noun>.command.ts   (for write operations)
│   │   ├── <verb>-<noun>.use-case.ts
│   │   └── index.ts
│   └── <domain>.use-cases.spec.ts
└── <domain>.module.ts
```

---

## Module File Templates

### Module File

```typescript
import { Module } from '@nestjs/common';
import { <Domain>Controller } from './controllers/<domain>.controller';
import { <Entity>Repository } from './repositories/<entity-plural>.repository';
import { <Domain>Factory } from './services/<domain>.factory';
import { <Domain>Mapper } from './services/<domain>.mapper';
import { <Domain>Validator } from './services/<domain>.validator';
import { <Verb><Noun>UseCase } from './use-cases/<feature>/<verb>-<noun>.use-case';

@Module({
  controllers: [<Domain>Controller],
  providers: [
    <Entity>Repository,
    <Domain>Factory,
    <Domain>Mapper,
    <Domain>Validator,
    <Verb><Noun>UseCase,
    // ... additional use cases
  ],
  exports: [],  // Export only what other modules need
})
export class <Domain>Module {}
```

### Repository File

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';

@Injectable()
export class <Entity>Repository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(id: bigint): Promise<any | null> {
    return this.db.<table_name>.findUnique({
      where: { <id_column>: id }
    });
  }
}
```

Note: For composite PK tables, use `findFirst()` instead of `findUnique()`.

### Use Case File (Command)

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/logger/logger.service';
import { <Noun>Repository } from '../../repositories/<entity-plural>.repository';
import { <Verb><Noun>Command } from './<verb>-<noun>.command';

@Injectable()
export class <Verb><Noun>UseCase {
  constructor(
    private readonly repository: <Noun>Repository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: <Verb><Noun>Command): Promise<<ResponseType>> {
    // 1. Validate
    // 2. Execute business logic
    // 3. Log result
    // 4. Return response
    this.logger.info('<Operation> completed', { id: command.<id> });
    return result;
  }
}
```

### Command File

```typescript
export class <Verb><Noun>Command {
  constructor(
    public readonly <field1>: string,
    public readonly <field2>: number,
    // ...
  ) {}
}
```

### Controller File

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { <Verb><Noun>UseCase } from '../use-cases/<feature>/<verb>-<noun>.use-case';
import { <Noun>RequestDto } from '../dto/<noun>-request.dto';

@ApiBearerAuth('JWT')
@ApiTags('<domain>')
@Controller({ path: '<domain>', version: '1' })
export class <Domain>Controller {
  constructor(
    private readonly <verb><Noun>UseCase: <Verb><Noun>UseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: '<Action description>' })
  @ApiResponse({ status: 201, type: <Noun>ResponseDto })
  async <verb><Noun>(@Body() dto: <Noun>RequestDto) {
    return this.<verb><Noun>UseCase.execute(new <Verb><Noun>Command(
      dto.<field1>,
      dto.<field2>,
    ));
  }
}
```

---

## AppModule Registration

Every new module must be added to `AppModule`'s `imports` array:

```typescript
// src/app.module.ts
@Module({
  imports: [
    // ... existing modules ...
    <Domain>Module,
  ],
})
export class AppModule {}
```

---

## Forbidden Module Practices

The following are forbidden in any module:

| Practice | Reason |
|---------|--------|
| Import `PrismaModule` in feature module | Global module — import not needed |
| Import `LoggerModule` in feature module | Global module — import not needed |
| Import `AuditModule` in feature module | Global module — import not needed |
| Import `DocumentNumberingModule` in feature module | Global module — import not needed |
| Inject `PrismaService` in non-repository class | Layer violation |
| Business logic in controller | Layer violation |
| Use case calling another use case | Use case orchestration — not permitted |
| Direct SQL via `$executeRaw` in a use case | Use a repository method |
| Skip the mapper — return raw Prisma entities | Response shape violation |
| Hard-code enum values as strings | Use the Prisma-generated enum type |

---

## Module Acceptance Checklist

Before a new module sprint is marked Complete, verify all items:

### Code Structure
- [ ] Module file exists with correct `@Module()` declaration.
- [ ] All providers registered in the module's `providers` array.
- [ ] Module registered in `AppModule.imports`.
- [ ] No global module (Prisma, Logger, Audit, DocumentNumbering) imported in module.

### Layer Compliance
- [ ] All repositories extend `BaseRepository`.
- [ ] No service injects `PrismaService` directly.
- [ ] No use case injects `PrismaService` directly.
- [ ] All controllers call exactly one use case per action.

### Type Safety
- [ ] All BigInt IDs accepted as `string` in DTOs, converted to `BigInt()` before queries.
- [ ] All response DTOs serialize BigInt as `string`.
- [ ] Interface re-exports use `export type { }`.
- [ ] No `cb: any` in test mock callbacks.

### API
- [ ] All endpoints have `@ApiOperation`.
- [ ] All endpoints have `@ApiResponse` for primary status codes.
- [ ] All DTO fields have `@ApiProperty`.
- [ ] Controller uses `version: '1'` in `@Controller()`.
- [ ] Protected endpoints have `@ApiBearerAuth('JWT')`.

### Testing
- [ ] All use cases have unit tests (happy path + failure path).
- [ ] All tests pass (`npm run test` exits 0).
- [ ] No `cb: any` in mock implementations.
- [ ] `jest.clearAllMocks()` in `beforeEach`.

### Quality Gates
- [ ] `npm run build` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` exits 0.

### Documentation
- [ ] ADRs written for any non-obvious design decisions.
- [ ] KEB-07 (Module Status) updated to reflect COMPLETE.
- [ ] Sprint report committed.

---

## Inventory Module as Reference

The canonical reference implementation is `src/modules/inventory/`. When implementing any new module, the Inventory module's patterns take precedence:

| Reference | Location |
|-----------|----------|
| Module declaration | `src/modules/inventory/inventory.module.ts` |
| Controller | `src/modules/inventory/controllers/inventory.controller.ts` |
| Repository (single PK) | `src/modules/inventory/repositories/physical-bags.repository.ts` |
| Repository (composite PK) | `src/modules/inventory/repositories/inventory-transactions.repository.ts` |
| Repository (transaction) | `src/modules/inventory/repositories/physical-bag-reservations.repository.ts` |
| Factory service | `src/modules/inventory/services/reservation.factory.ts` |
| Mapper service | `src/modules/inventory/services/inventory-transaction.mapper.ts` |
| Validator service | `src/modules/inventory/services/inventory-transaction.validator.ts` |
| Command use case | `src/modules/inventory/use-cases/create-reservation/` |
| Query use case | `src/modules/inventory/use-cases/list-reservations/` |
| Spec file | `src/modules/inventory/use-cases/reservations.use-cases.spec.ts` |

---

## Module Compliance Rules

### Rule M-001 — AppModule Registration

**Classification:** MANDATORY  
**Statement:** Every new NestJS module must be added to `AppModule.imports` before it is considered complete.  
**Violation Impact:** Module providers are not available to the application.  
**Risk:** DI failures at runtime.  
**Recovery:** Add to `AppModule.imports`. Rebuild.  
**Approval Required:** None.

### Rule M-002 — Complete Provider Registration

**Classification:** MANDATORY  
**Statement:** Every class decorated with `@Injectable()` in a module must be registered in that module's `providers` array.  
**Violation Impact:** NestJS DI throws `NestJS cannot resolve dependencies` at startup.  
**Risk:** Application fails to start.  
**Recovery:** Add missing provider to the module's `providers` array.  
**Approval Required:** None.

### Rule M-003 — No Cross-Module Internal Imports

**Classification:** MANDATORY  
**Statement:** Modules must not import internal files from other modules directly. Cross-module dependencies must go through the exporting module's `exports` array.  
**Violation Impact:** Architecture violation, coupling between modules.  
**Risk:** Circular imports, DI failures.  
**Recovery:** Add the provider to the source module's `exports` and import the module (not the file) in the consuming module.  
**Approval Required:** Architect review for any new cross-module dependency.
