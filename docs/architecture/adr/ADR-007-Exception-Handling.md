# ADR-007 — Exception Handling

## Title

Two-Filter Global Exception Handling Strategy

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

An ERP application throws exceptions at multiple layers:
- NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, etc.) from use-cases and guards
- Prisma database exceptions (`PrismaClientKnownRequestError`) from repository operations
- Unexpected runtime errors from anywhere in the stack

Without centralized exception handling:
1. Exceptions bubble up with framework-default formatting (varies by NestJS version)
2. Database exceptions expose internal error codes to clients
3. Error responses are inconsistent across endpoints
4. Prisma error codes are not mapped to appropriate HTTP status codes

An ERP API consumed by a managed frontend requires a completely consistent error response format.

---

## Decision

Two global exception filters are registered at application bootstrap, in a specific order that is critical to their correct function:

```typescript
app.useGlobalFilters(
  new PrismaExceptionFilter(),    // Must be first
  new AllExceptionsFilter(),      // Catch-all fallback
);
```

### Registration Method

Filters are registered **imperatively** (`app.useGlobalFilters`) rather than via the DI system (`APP_FILTER`). This is required because the filters do not inject any NestJS services — they are pure error translation utilities. Imperative registration avoids unnecessary DI complexity.

### Filter Ordering

NestJS evaluates global filters in **reverse registration order** (last-registered = first-evaluated). Therefore, `PrismaExceptionFilter` is listed first and `AllExceptionsFilter` second, so that:
- `PrismaExceptionFilter` (more specific) runs first
- `AllExceptionsFilter` (catch-all) runs second as a fallback

### PrismaExceptionFilter

Catches `Prisma.PrismaClientKnownRequestError` and maps Prisma error codes to appropriate HTTP exceptions:

| Prisma Code | HTTP Status | Meaning |
|-------------|-------------|---------|
| P2002 | 409 Conflict | Unique constraint violation |
| P2025 | 404 Not Found | Record not found (delete/update of missing record) |
| P2003 | 400 Bad Request | Foreign key constraint failed |
| P2014 | 409 Conflict | Relation constraint violation |
| All others | 500 Internal Server Error | Unhandled database error |

This mapping ensures that database constraint violations return meaningful HTTP status codes rather than 500 errors.

### AllExceptionsFilter

Catches everything that escapes `PrismaExceptionFilter`:
- NestJS HTTP exceptions → returns `exception.getStatus()` with formatted message
- Unknown errors → returns 500 with generic "Internal Server Error"

The filter extracts the message from the exception response using type-safe casting:
```typescript
const message =
  typeof exceptionResponse === 'string'
    ? exceptionResponse
    : ((exceptionResponse as Record<string, unknown>).message as string | string[])
      ?? 'An error occurred';
```

### Error Response Format

Both filters produce responses using `ErrorResponse`:

```typescript
class ErrorResponse implements ApiError {
  readonly success = false as const;
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    public readonly message: string | string[],
    public readonly path: string,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}
```

All error responses are therefore consistent:
```json
{
  "success": false,
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "Customer 42 not found.",
  "path": "/v1/customers/42",
  "timestamp": "2026-06-26T10:00:00.000Z"
}
```

### Business Logic Exception Convention

Use-cases and services throw NestJS HTTP exceptions directly:
```typescript
throw new NotFoundException(`Customer ${id} not found.`);
throw new ConflictException(`Customer code ${code} already exists.`);
throw new BadRequestException(`Customer ${id} is already inactive.`);
```

These are caught by `AllExceptionsFilter` and returned with correct HTTP status codes.

---

## Rationale

**Why two filters instead of one?**

Prisma exceptions are database-layer exceptions, not NestJS exceptions. A single filter would need to check `instanceof PrismaClientKnownRequestError` alongside all other exception types. Separating them into two filters follows SRP and makes each filter's responsibility clear.

**Why imperative registration instead of `APP_FILTER`?**

`APP_FILTER` registers filters through the DI system, allowing them to inject services. Neither filter needs injected services. Imperative registration is simpler and makes the registration order explicit without DI indirection.

**Why P2003 maps to 400 instead of 409?**

P2003 is a foreign key constraint failure, which means the referenced entity does not exist. This is a client error (sending a reference to a non-existent entity), not a conflict, hence 400. P2002 (unique violation) is genuinely a conflict — the record already exists — hence 409.

**Why is the filter order important?**

NestJS evaluates global filters in reverse order of the `useGlobalFilters` call. If `AllExceptionsFilter` (which catches everything) were evaluated first, it would catch Prisma exceptions before `PrismaExceptionFilter` has a chance to apply the correct HTTP status mapping.

---

## Consequences

**Positive:**
- All error responses share a consistent JSON structure (`ErrorResponse`)
- Prisma constraint violations return appropriate HTTP codes automatically
- Unexpected errors return 500 without exposing stack traces or internal details
- The `success: false` field enables clients to distinguish success and error responses by a single field

**Negative:**
- Filters are registered imperatively and cannot inject services (e.g., LoggerService) — this means exception filter logs go through `console.error` if added, not through the structured Pino logger
- The `success: false as const` type assertion is necessary because TypeScript's `prefer-as-const` lint rule requires it

**Trade-offs:**
- Mapping only Prisma error codes P2002, P2003, P2014, P2025 covers the most common cases. Uncommon Prisma errors (P1001, P2024, etc.) fall through to the 500 handler. This is acceptable — database connection errors and timeouts should not be surfaced as structured business errors.

**Future Implications:**
- When a logging service is needed in filters, the filters can be refactored to `APP_FILTER` providers with injected `LoggerService`
- Additional Prisma error code mappings can be added to `PrismaExceptionFilter` as new constraint types are identified in production

---

## Related Components

- `src/core/exceptions/filters/all-exceptions.filter.ts`
- `src/core/exceptions/filters/prisma-exception.filter.ts`
- `src/core/responses/error-response.ts`
- `src/main.ts` — filter registration
- `src/core/pipes/validation.pipe.ts` — validation errors use the same `BadRequestException` type

---

## Alternatives Considered

### Single Universal Exception Filter

Rejected. A single filter combining Prisma mapping and HTTP exception handling has two distinct responsibilities. It also makes the Prisma mapping logic less visible and harder to test independently.

### APP_FILTER DI Registration

Considered. Using `APP_FILTER` with DI would allow injecting `LoggerService`. Rejected because:
- Neither current filter needs service injection
- Imperative registration makes the order explicit
- No runtime difference in behavior

### Error Codes Instead of Error Messages

Considered. Some APIs return machine-readable error codes (e.g., `CUSTOMER_NOT_FOUND`) alongside human-readable messages. Not adopted in the current phase because:
- The ERP frontend is managed and can interpret HTTP status codes
- Adding error codes requires defining and maintaining a code registry
- Can be added later as a non-breaking extension to `ErrorResponse`

---

## Future Evolution

- **Error codes**: A `code` field can be added to `ErrorResponse` for client-side error discrimination
- **Request correlation**: The `path` field can be supplemented with the correlation ID from `CorrelationIdMiddleware`
- **Logging in filters**: Refactoring to `APP_FILTER` providers would allow structured logging of all unhandled exceptions

---

## References

- `src/core/exceptions/filters/all-exceptions.filter.ts`
- `src/core/exceptions/filters/prisma-exception.filter.ts`
- `src/core/responses/error-response.ts`
- ADR-006 (Validation Strategy) — how validation errors produce `BadRequestException`
- ADR-015 (Response Serialization) — the success response format counterpart to `ErrorResponse`
