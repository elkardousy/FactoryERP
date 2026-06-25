# ADR-005 — Global Exception Handling

**Status:** Accepted
**Date:** 2026-06-26
**Deciders:** Principal Architect
**Applies to:** `src/core/exceptions/` — applies globally to all modules

---

## Context

NestJS has a built-in exception layer that handles unhandled exceptions and returns a default JSON error response. The default response shape does not match the API contract required by this ERP (no `success`, no `path`, no `timestamp` fields).

Two categories of exceptions need special handling:

1. **Prisma database errors** (`PrismaClientKnownRequestError`) — these have structured error codes (P2002, P2025, etc.) that map predictably to HTTP status codes and should return clean error messages rather than exposing Prisma internals.

2. **All other exceptions** — NestJS `HttpException` subclasses (`UnauthorizedException`, `NotFoundException`, etc.) should be returned as-is with their status and message; unknown errors should return 500.

The constraint is that global filters registered in `main.ts` **cannot inject services** (they are instantiated imperatively, not through DI). This affects what logging is available inside filters.

---

## Decision

Register **two global exception filters** imperatively in `main.ts` in a specific order:

```typescript
app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());
```

NestJS evaluates filters in the order they are registered. The first filter that matches the exception type handles it. This means `PrismaExceptionFilter` (more specific) is evaluated before `AllExceptionsFilter` (catch-all).

**Filter 1: `PrismaExceptionFilter`** — `@Catch(Prisma.PrismaClientKnownRequestError)`

Maps Prisma error codes to HTTP status codes:

| Prisma Code | Meaning | HTTP Status |
|---|---|---|
| `P2002` | Unique constraint violation | 409 Conflict |
| `P2025` | Record not found | 404 Not Found |
| `P2003` | Foreign key constraint failed | 400 Bad Request |
| `P2014` | Relation constraint violated | 409 Conflict |
| Other | Unhandled Prisma error | 500 Internal Server Error |

**Filter 2: `AllExceptionsFilter`** — `@Catch()` (catches everything)

- If the exception is an `HttpException`: extracts `getStatus()` and `getResponse()`.
- If the exception is anything else: returns 500 with `"Internal Server Error"`.

**Shared response shape (`ErrorResponse`):**

```json
{
  "success": false,
  "statusCode": 409,
  "error": "ConflictException",
  "message": "Record already exists.",
  "path": "/v1/auth/login",
  "timestamp": "2026-06-26T10:00:00.000Z"
}
```

**Application code convention:**

Services and use-cases throw NestJS HTTP exceptions directly:
```typescript
throw new UnauthorizedException('Invalid username or password.');
throw new NotFoundException('Session not found.');
```

No custom exception classes are needed. The exception name becomes the `error` field in the response via `exception.name`.

---

## Alternatives Considered

### A — Single catch-all filter
One filter that handles both Prisma and HTTP exceptions. Simpler, but harder to extend. When a new ORM or DB client is introduced, its error codes would be mixed into the same filter. Two-filter approach keeps concerns separate.

### B — Register filters via DI (`APP_FILTER`)
```typescript
{ provide: APP_FILTER, useClass: AllExceptionsFilter }
```
This enables dependency injection inside filters (e.g., injecting `LoggerService`). Rejected at this stage because:
- Both filters currently need no injected services.
- Imperative registration is explicit about registration order.
- The NestJS docs note that filter order with `APP_FILTER` providers can be harder to reason about when multiple filters are registered.

**Future migration path:** If filters need to inject `LoggerService` for structured error logging, migrate to `APP_FILTER` DI registration.

### C — NestJS built-in exception filter (default)
The default NestJS exception handling returns:
```json
{ "statusCode": 401, "message": "Unauthorized" }
```
Rejected because:
- No `success` field (breaks client contract).
- No `path` or `timestamp`.
- Does not handle Prisma errors specially — they appear as 500.

### D — Exception interceptor (not filter)
Interceptors run before filters and can transform responses. Using an interceptor for exceptions is non-standard in NestJS and creates confusion about execution order. Filters are the correct mechanism.

---

## Consequences

**Positive:**
- All error responses have a consistent shape regardless of which module throws.
- Prisma constraint violations produce clean, user-facing 409/404/400 responses instead of exposing ORM internals.
- Application code uses standard NestJS exceptions (`UnauthorizedException`, `NotFoundException`) — no custom exception hierarchy needed.
- The two-filter registration order is explicit and documented here.

**Negative / Trade-offs:**
- Filters instantiated with `new Filter()` cannot inject `LoggerService` — error events are not currently logged through Pino. This is a known gap; structured error logging via `APP_FILTER` is in the Sprint 9 backlog.
- The `AllExceptionsFilter` uses `(exceptionResponse as any).message` — a minor type cast required because `exception.getResponse()` returns `string | object`. This could be made type-safe with a type guard.
- Unhandled Prisma error codes (not P2002/P2025/P2003/P2014) fall through to a 500 response with the raw Prisma `exception.message`. This may expose internal query details. Future improvement: redact Prisma messages in production.
- Registration order in `main.ts` is a convention, not enforced by the compiler. A developer who re-registers filters in the wrong order would silently break Prisma error mapping.
