# ADR-015 — Response Serialization

## Title

Standardized Success Response Envelope with BigInt Serialization

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

Without standardized response formatting:
1. Clients receive raw Prisma model objects with inconsistent shapes
2. BigInt values (all primary keys, foreign keys) cause `JSON.stringify` to throw a `TypeError: Do not know how to serialize a BigInt`
3. Success and error responses have no common envelope structure — clients cannot write consistent response handlers
4. HTTP metadata (status code, timestamp, request path) is not included in responses

---

## Decision

A **global `ResponseInterceptor`** wraps all successful HTTP responses in a standardized envelope, with a `serializeBigInts()` utility to handle BigInt-to-string conversion before JSON serialization.

### Response Envelope

All successful responses are wrapped as:

```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2026-06-26T10:00:00.000Z",
  "path": "/v1/customers/42"
}
```

### ResponseInterceptor Implementation

```typescript
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (data === undefined) return data;
        return {
          data: serializeBigInts(data),
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
```

The `data === undefined` check passes through empty responses (e.g., 204 No Content) without wrapping.

### BigInt Serialization

```typescript
// src/core/utils/bigint-serializer.ts
export function serializeBigInts(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      typeof v === 'bigint' ? v.toString() : (v as unknown),
    ),
  );
}
```

The replacer function converts every `bigint` value in the entire response object to its string representation. The result is then parsed back to a plain JavaScript object for further JSON serialization by Express.

### Error Response Counterpart

`ErrorResponse` is the counterpart to the success envelope for error conditions. See ADR-007 for details.

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

### Interceptor Registration

The interceptor is registered globally in `AppModule`:

```typescript
{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }
```

---

## Rationale

**Why a global interceptor instead of per-controller `@UseInterceptors()`?**

Global registration ensures every endpoint uses the same response format. Per-controller registration is error-prone — a forgotten annotation produces an inconsistent response. In an ERP with a managed frontend, response format consistency is not optional.

**Why include `statusCode`, `timestamp`, and `path` in the response body?**

- `statusCode`: Duplicates the HTTP status in the body for clients that only read the body (some mobile frameworks, logging agents)
- `timestamp`: Enables the client to compute round-trip latency and debug caching issues
- `path`: Enables the client to log which endpoint was called, useful for error correlation

**Why `serializeBigInts` via JSON.stringify/parse round-trip instead of a recursive transformer?**

The `JSON.stringify` replacer is a well-defined, recursively-applied function that handles arbitrarily nested objects, arrays, and primitives. Writing a custom recursive transformer would risk missing edge cases (e.g., BigInt inside an array inside an object inside an array). The stringify/parse round-trip is reliable and battle-tested.

**Why convert BigInt to string instead of number?**

BigInt values above 2^53 - 1 cannot be represented precisely as JavaScript `number`. Converting to `number` would silently corrupt large IDs. Converting to `string` is lossless — the client receives `"42"` as a string and can construct a BigInt from it if needed.

**Why `data === undefined` bypass?**

Endpoints that return 204 No Content produce `undefined`. Wrapping undefined in the envelope would produce `{ "data": null, "statusCode": 204, ... }`, which is misleading. Empty responses should remain empty.

---

## Consequences

**Positive:**
- All client response handlers can use the same envelope structure
- BigInt serialization is handled in one place — no per-repository or per-use-case conversion needed
- Response includes debug metadata (timestamp, path) without controller changes
- No endpoint can accidentally return a raw Prisma model object

**Negative:**
- BigInt values in API responses become strings — clients must handle `"42"` not `42` for IDs
- The JSON.stringify/parse round-trip adds a small serialization overhead proportional to response size
- Clients receiving IDs as strings must explicitly handle BigInt if they need to compare or compute with them

**Trade-offs:**
- String IDs vs. number IDs: The ERP's managed frontend is built to handle string IDs. External integrations must be documented about the string format.

**Future Implications:**
- **Pagination envelope**: The response envelope can be extended with pagination metadata for list endpoints
- **ETags**: The interceptor can generate ETags from response content for HTTP caching
- **Response compression**: The interceptor could measure response size and trigger compression

---

## Related Components

- `src/core/interceptors/response.interceptor.ts`
- `src/core/utils/bigint-serializer.ts`
- `src/app.module.ts` — interceptor registration
- `src/core/responses/error-response.ts` — error response counterpart

---

## Alternatives Considered

### Per-Controller Response Classes with `@Exclude`

TypeScript `class-transformer` can control serialization via `@Exclude` decorators on entity classes. Rejected because:
- It requires wrapping every returned object in a response DTO class
- BigInt serialization would still require custom logic
- The global interceptor approach is simpler and more uniform

### JSON Replacer at Express Level

Configuring Express's `app.set('json replacer', ...)` would handle BigInt at the JSON serialization step. Rejected because:
- It operates outside NestJS's interceptor chain — response metadata (statusCode, path) cannot be injected
- Less composable — the NestJS interceptor can also transform response shape

### NestJS ClassSerializer Interceptor

NestJS's built-in `ClassSerializerInterceptor` transforms response objects using `class-transformer`. Rejected because:
- Requires returning class instances from use-cases (not plain objects), coupling use-cases to serialization concerns
- BigInt handling requires custom transformers regardless
- The custom interceptor provides equivalent functionality with explicit control

---

## Future Evolution

- **Paginated response wrapper**: The envelope can be specialized for paginated responses to include `meta` at the top level alongside `data`
- **Field filtering**: A `fields` query parameter could be processed by the interceptor to project only requested fields
- **Response schema validation**: In development mode, the interceptor could validate responses against expected schemas

---

## References

- `src/core/interceptors/response.interceptor.ts`
- `src/core/utils/bigint-serializer.ts`
- ADR-007 (Exception Handling) — error response format
- ADR-021 (BigInt Serialization) — detailed BigInt handling rationale
