# ADR-021 — BigInt Serialization

## Title

BigInt-to-String Serialization for JSON API Responses

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The ERP uses `BigInt` for all primary keys and foreign keys (ADR-000 P-7). This decision creates a technical challenge:

**JSON does not support BigInt.** The ECMAScript specification defines `JSON.stringify` to throw a `TypeError: Do not know how to serialize a BigInt` when it encounters a BigInt value.

This means:
- Prisma queries return objects with `bigint` fields
- NestJS's built-in JSON serialization (via Express `res.json()`) calls `JSON.stringify`
- Without explicit handling, every API response containing a BigInt would throw at serialization time

Additionally:
- Large BigInt values (> 2^53 - 1) cannot be represented as JavaScript `number` without precision loss
- Converting BigInt to `number` for JSON serialization would silently corrupt large ID values

---

## Decision

BigInt values are converted to strings before JSON serialization, using a `serializeBigInts()` utility that processes the entire response object recursively.

### serializeBigInts()

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

The function:
1. Uses `JSON.stringify` with a replacer function that converts every `bigint` to `v.toString()`
2. Non-BigInt values pass through unchanged
3. Parses the resulting JSON string back to a plain JavaScript object
4. The resulting object contains strings where BigInts were — safe for Express JSON serialization

### Integration Point

`serializeBigInts()` is called inside the `ResponseInterceptor` before the response data is wrapped in the envelope:

```typescript
return {
  data: serializeBigInts(data),
  statusCode: response.statusCode,
  timestamp: new Date().toISOString(),
  path: request.url,
};
```

This is applied globally to all successful responses. Error responses use `ErrorResponse` directly (which contains only string and number fields — no BigInts).

### Client Handling

API clients receive ID fields as strings:
```json
{
  "data": {
    "customer_id": "42",
    "customer_code": "CUST-001",
    "customer_name": "ACME Corp"
  }
}
```

Frontend TypeScript clients can reconstruct BigInt from string when needed:
```typescript
const customerId = BigInt(response.data.customer_id);
```

---

## Rationale

**Why convert to string instead of number?**

JavaScript `number` is a 64-bit IEEE 754 floating-point. It can represent integers exactly only up to 2^53 - 1 (9,007,199,254,740,991). PostgreSQL `bigint` supports up to 2^63 - 1 (9,223,372,036,854,775,807). A table with millions of rows can have PKs exceeding 2^53.

Converting to `number` would silently corrupt IDs beyond this threshold. Strings are lossless regardless of magnitude.

**Why use `JSON.stringify` + `JSON.parse` round-trip instead of a recursive visitor?**

The `JSON.stringify` replacer visits every value in the object graph, including nested objects, arrays, and primitives. A hand-written recursive visitor would need to handle every JavaScript container type (Object, Array, Map, Set, ...) and could miss edge cases.

The `JSON.stringify`/`JSON.parse` approach is battle-tested, handles all nesting, and is idiomatic JavaScript. The performance cost (one extra serialize/deserialize per response) is negligible compared to network I/O.

**Why in the `ResponseInterceptor` instead of at the repository level?**

Handling BigInt at the repository level would require every repository method to convert BigInt values in its return type. This adds complexity to repositories and creates duplication. Handling it in one interceptor means repositories return native Prisma types (with BigInts) and the presentation layer handles serialization — clean separation of concerns.

**Why not configure Express `json` settings instead?**

Express's `app.set('json replacer', fn)` can configure a global JSON replacer. However:
- It operates outside the NestJS interceptor chain
- The response envelope (statusCode, timestamp, path) cannot be added at that level
- The NestJS interceptor approach is more composable and testable

---

## Consequences

**Positive:**
- No `TypeError` at serialization time — BigInts are always converted before Express JSON serialization
- No precision loss — string representation is lossless
- Single, centralized conversion point — no per-repository or per-controller handling
- The conversion is transparent to use-cases and repositories

**Negative:**
- All IDs in API responses are strings, not numbers
- Frontend must handle ID fields as strings (cannot do numeric arithmetic without explicit BigInt conversion)
- `JSON.parse(JSON.stringify(...))` produces a plain object — class instances in the response are converted to plain objects (not typically a problem, but worth noting)
- The round-trip adds slight serialization overhead proportional to response size

**Trade-offs:**
- String IDs vs. number IDs: The frontend must know that IDs are strings. This is a stable contract — documented in the Swagger schema and in this ADR.

**Future Implications:**
- **API versioning**: If a V2 API changes ID representation (unlikely but possible), the serializer behavior can be versioned without affecting V1
- **BigInt arithmetic in responses**: If computed BigInt values appear in responses (e.g., total quantities), they are also converted to strings — clients must parse them accordingly
- **Decimal precision**: Prisma's `Decimal` type (used for quantities) has similar JSON serialization challenges — the same `serializeBigInts` function will need to be extended if Decimal serialization issues arise

---

## Related Components

- `src/core/utils/bigint-serializer.ts`
- `src/core/interceptors/response.interceptor.ts` — where `serializeBigInts` is called
- All Prisma model types in `prisma/schema.prisma` — source of BigInt values

---

## Alternatives Considered

### Convert BigInt to Number

Rejected. Silent precision loss for IDs > 2^53. Unacceptable for a production system.

### Prisma Custom Scalar Serializer

Prisma supports custom field serializers. Configuring Prisma to return `string` for BigInt fields would eliminate the need for `serializeBigInts`. Rejected because:
- Prisma's TypeScript types would then declare those fields as `string`, losing the BigInt type in application code
- The type system benefit of BigInt (cannot accidentally mix IDs from different tables) would be lost
- Repository and use-case code would need to handle string IDs

### JSON Replacer at Application Level

`JSON.stringify` with a global replacer (configured on the Express instance) was considered. See rationale above for why the interceptor approach is preferred.

### String Primary Keys

Using `String` (UUID or prefixed string) for PKs instead of `BigInt` would avoid the serialization problem entirely. Rejected because:
- UUID PKs are not sequentially ordered (worse for indexes, harder to debug)
- String PKs require a different type in all Prisma queries
- The BigInt decision (ADR-000 P-7) was made for other valid reasons

---

## Future Evolution

- **Decimal handling**: Extend `serializeBigInts` to also handle Prisma `Decimal` values if they appear in API responses
- **Client type generation**: OpenAPI Swagger schema can annotate BigInt ID fields with `format: "int64"` so generated TypeScript clients treat them as strings automatically
- **JSON:API format**: If adopting the JSON:API specification, the `id` field is always a string — this aligns naturally with the current implementation

---

## References

- `src/core/utils/bigint-serializer.ts`
- `src/core/interceptors/response.interceptor.ts`
- `prisma/schema.prisma`
- ADR-000 (Architecture Principles) — P-7 BigInt for all PKs
- ADR-015 (Response Serialization) — interceptor context
