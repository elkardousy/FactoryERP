# ADR-006 — Validation Strategy

## Title

Global Validation Pipe with Strict Whitelist Mode and DTO-Based Validation

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

HTTP APIs receive untrusted input from clients. Without validation:
1. Malformed data enters business logic and causes confusing runtime errors
2. Unexpected fields may overwrite protected properties (mass assignment vulnerability)
3. Type mismatches are only discovered deep in the call stack, making error messages unhelpful
4. Error messages are inconsistent across endpoints

The ERP additionally needs query parameters (strings from URLs) to be automatically transformed into typed values (numbers, booleans, enums).

---

## Decision

A **Global Validation Pipe** is applied at application bootstrap. It uses `class-validator` for declarative constraint checking and `class-transformer` for type coercion.

### GlobalValidationPipe Configuration

```typescript
export const GlobalValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  enableImplicitConversion: true,
  exceptionFactory: (errors) => new BadRequestException(flattenValidationErrors(errors)),
});
```

**Key settings:**
- `whitelist: true` — Strips any property not declared in the DTO class. Unknown fields are silently removed.
- `forbidNonWhitelisted: true` — Throws `BadRequestException` when an unknown field is provided (instead of silently stripping). This prevents clients from sending unexpected fields without feedback.
- `transform: true` — Transforms input to the declared DTO class instance.
- `enableImplicitConversion: true` — Automatically converts types without explicit `@Type(() => Number)` decorators. A string `"42"` in a query param is converted to `number` if the DTO property is typed as `number`.
- `exceptionFactory` — Produces a `BadRequestException` with a flat array of all validation error messages.

### Error Flattening

The custom `flattenValidationErrors` function recursively extracts all constraint messages from nested validation errors:

```typescript
function flattenValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const current = Object.values(error.constraints ?? {});
    const nested = error.children?.length
      ? flattenValidationErrors(error.children)
      : [];
    return [...current, ...nested];
  });
}
```

This ensures a single invalid nested object produces one clear error per violated constraint rather than a deeply nested object structure.

### DTO Pattern

All input types are DTO classes decorated with `class-validator` and `@nestjs/swagger` annotations:

```typescript
export class CreateCustomerDto {
  @ApiProperty({ example: 'CUST-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  customer_code!: string;

  @ApiProperty({ example: 'ACME Corporation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customer_name!: string;

  @ApiPropertyOptional({ example: 'info@acme.com' })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;
}
```

**Update DTOs** use `PartialType(CreateDto)` from `@nestjs/swagger` to make all fields optional with inherited validators:
```typescript
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
```

**Pagination** extends `PaginationDto`:
```typescript
export class CustomerFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
```

### Parameter Validation

Route parameters (`/customers/:id`) use `IdParamDto`:
```typescript
export class IdParamDto {
  @ApiProperty({ description: 'Resource ID', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
```

The `@Type(() => Number)` ensures the string URL parameter is explicitly converted (in addition to the implicit conversion from the pipe).

---

## Rationale

**Why `whitelist: true` AND `forbidNonWhitelisted: true`?**

`whitelist` alone silently strips extra fields, which can mask client-side bugs. With `forbidNonWhitelisted`, the client receives immediate feedback when sending unexpected fields. This is the correct behavior for an ERP API consumed by managed frontend applications — clients should not silently succeed when sending invalid data.

**Why `enableImplicitConversion`?**

Query parameters arrive as strings. Without implicit conversion, every query DTO would need explicit `@Type(() => Number)` on every numeric field. With `enableImplicitConversion`, the TypeScript type annotation itself drives the conversion. This is correct for simple scalar types. For complex types (arrays, objects), explicit `@Type()` is still used to ensure deterministic behavior.

**Why a custom `exceptionFactory` with flat errors?**

NestJS's default validation error structure returns a deeply nested object of errors. For an API client, a flat array of human-readable strings is more actionable. The flat format also integrates cleanly with the `ErrorResponse` wrapper used by the exception filters.

**Why `PartialType` from `@nestjs/swagger` instead of `@nestjs/mapped-types`?**

Both provide `PartialType`. The `@nestjs/swagger` version additionally generates correct Swagger documentation (all fields marked as optional in the schema). Since Swagger accuracy is a stated requirement, the swagger-aware version is mandatory.

---

## Consequences

**Positive:**
- Invalid input never reaches business logic
- Mass assignment is prevented at the framework level
- Error messages are human-readable and complete
- Update DTOs are derived from create DTOs — no duplication of field definitions

**Negative:**
- `enableImplicitConversion` can occasionally produce unexpected conversions for edge case input — this is mitigated by explicit `@Type()` decorators on ambiguous fields
- Every new entity requires creating DTO files with all validators — this is boilerplate but necessary

**Trade-offs:**
- `forbidNonWhitelisted: true` makes the API stricter than necessary for exploratory clients. This is an acceptable trade-off for an ERP where API contracts are managed.

**Future Implications:**
- GraphQL integration (if ever adopted) would bypass the HTTP validation pipe; GraphQL input types would need their own validation strategy
- File upload endpoints (multipart/form-data) may need specialized validation not covered by class-validator

---

## Related Components

- `src/core/pipes/validation.pipe.ts`
- `src/common/dto/pagination/pagination.dto.ts`
- `src/common/dto/params/id-param.dto.ts`
- All `src/modules/*/dto/*.dto.ts` files
- `src/main.ts` — pipe registration

---

## Alternatives Considered

### Manual Validation in Controllers

Rejected. Manual validation is inconsistent, verbose, and easy to forget. Class-based validation provides a single declarative source of truth.

### Zod for Runtime Validation

Considered. Zod provides excellent TypeScript inference and compose-friendly schemas. Rejected because:
- `class-validator` is the NestJS standard — first-class integration with the validation pipe
- `@nestjs/swagger` generates documentation directly from class-validator decorators
- Mixing Zod for validation and class-validator for documentation would require maintaining both

### JSON Schema Validation

Rejected. Less developer-friendly than class-validator decorators. Requires maintaining separate schema files.

---

## Future Evolution

- **Custom constraints**: Complex business rule validators (e.g., `@IsExistingCustomerCode()`) can be implemented as custom class-validator decorators that perform database lookups
- **i18n error messages**: The custom `exceptionFactory` can be extended to translate error messages based on request locale
- **Request correlation**: Error responses can include the correlation ID from the request context for tracing

---

## References

- `src/core/pipes/validation.pipe.ts`
- `src/common/dto/pagination/pagination.dto.ts`
- `src/common/dto/params/id-param.dto.ts`
- ADR-007 (Exception Handling) — how validation errors are formatted and returned
- ADR-009 (Swagger Strategy) — DTO annotations driving API documentation
