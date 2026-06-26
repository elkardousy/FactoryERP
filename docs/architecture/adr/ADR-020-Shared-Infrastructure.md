# ADR-020 — Shared Infrastructure

## Title

Shared DTOs, Interfaces, and Cross-Module Infrastructure

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

Multiple business modules share common input/output patterns:
- Pagination (page number, limit, total count)
- Resource ID parameters in URL paths
- Paginated list response format (items + meta)
- Date range filtering

Without a canonical shared location for these patterns:
1. Each module implements its own `PaginationDto` with potentially different defaults and validation rules
2. Pagination metadata is computed differently in each repository, producing inconsistent API responses
3. ID parameter DTOs have inconsistent validation (some min: 0, some min: 1)
4. Shared infrastructure becomes scattered across feature modules

---

## Decision

Common patterns live in the `src/common/` directory:

### `src/common/dto/pagination/pagination.dto.ts`

```typescript
export class PaginationDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
```

All filter DTOs extend `PaginationDto`. This provides:
- Consistent defaults (`page: 1`, `limit: 20`)
- Consistent maximum limit (`100`)
- Consistent query parameter names

### `src/common/dto/params/id-param.dto.ts`

```typescript
export class IdParamDto {
  @ApiProperty({ description: 'Resource ID', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
```

Used by all `GET /resource/:id`, `PATCH /resource/:id`, `DELETE /resource/:id`, `PATCH /resource/:id/reactivate` endpoints.

### `src/common/interfaces/paginated-result.interface.ts`

```typescript
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
```

All repositories call `buildPaginationMeta()` to compute consistent pagination metadata. The function handles the edge case of `total === 0` (returns `totalPages: 0` rather than `NaN`).

### `src/common/dto/date-range.dto.ts`

Optional date range filter DTO for time-bounded queries (e.g., listing production orders within a date range).

### `src/core/constants/auth.constants.ts`

Shared constants for guard metadata keys:
```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
```

These are used by both decorators (`@Public()`, `@Roles()`) and the guards that check them, across module boundaries.

---

## Rationale

**Why `src/common/` for shared DTOs instead of each module defining its own?**

Duplication of `PaginationDto` across modules would produce inconsistent defaults. If one module's `PaginationDto` has `limit` max of 50 and another has 100, the API is inconsistent. A single shared class ensures uniformity.

**Why `buildPaginationMeta()` as a shared function instead of computing inline?**

`totalPages`, `hasNext`, and `hasPrev` have the same computation logic everywhere. Centralizing it:
1. Eliminates duplication across ~10 repository files
2. Ensures the edge case `total === 0` is handled consistently everywhere
3. Makes it independently testable

**Why `IdParamDto` with `@Min(1)` instead of inline `@Param('id', ParseIntPipe)`?**

`ParseIntPipe` converts a string to integer but provides no minimum validation. An `id = 0` would pass through as a valid (though semantically invalid) identifier. `@Min(1)` in `IdParamDto` ensures the ID is a positive integer. Using a DTO also enables `@ApiProperty` documentation, keeping Swagger accurate.

**Why `@Type(() => Number)` on `PaginationDto` fields alongside `enableImplicitConversion`?**

`enableImplicitConversion` handles implicit type conversion. `@Type(() => Number)` is explicit and works even without `enableImplicitConversion`. Using both provides belt-and-suspenders type safety and makes the intent clear to future readers who may not know about the global pipe configuration.

**Why `src/core/constants/auth.constants.ts` instead of each guard defining its own key strings?**

Constants used in both decorators and guards must match exactly. If `JwtAuthGuard` checks for `isPublic` but `@Public()` sets `is_public`, authentication is bypassed silently. A shared constants file eliminates this class of bug.

---

## Consequences

**Positive:**
- All list endpoints have consistent pagination parameters and defaults
- All ID path parameters have consistent validation
- Pagination metadata format is identical across all modules
- Auth constants are defined once — no string mismatch bugs

**Negative:**
- `src/common/` can become a "miscellaneous" dump if not curated carefully
- Changes to `PaginationDto` (e.g., changing `limit` default) affect all modules simultaneously

**Trade-offs:**
- Shared code means shared change impact. Adding a field to `PaginationDto` adds it to every list endpoint. This is desirable for consistency but requires careful backward-compatibility consideration.

**Future Implications:**
- **Cursor-based pagination**: When `limit`/`offset` pagination is insufficient for large datasets, `CursorPaginationDto` can be added alongside `PaginationDto` for specific endpoints
- **Field selection**: A shared `FieldsDto` (for sparse fieldsets) can be added without changing existing DTOs
- **Sort parameter**: A shared `SortDto` can provide `sortBy` and `sortOrder` for all list endpoints

---

## Related Components

- `src/common/dto/pagination/pagination.dto.ts`
- `src/common/dto/params/id-param.dto.ts`
- `src/common/interfaces/paginated-result.interface.ts`
- `src/core/constants/auth.constants.ts`
- All `src/modules/*/dto/*.dto.ts` files that extend `PaginationDto`
- All `src/modules/*/repositories/*.repository.ts` that call `buildPaginationMeta()`
- `src/modules/auth/guards/jwt-auth.guard.ts` — uses `IS_PUBLIC_KEY`
- `src/modules/authorization/guards/roles.guard.ts` — uses `ROLES_KEY`

---

## Alternatives Considered

### Modules Define Their Own Pagination DTOs

Rejected. Module-specific pagination DTOs would diverge over time. Discovered during Sprint 10.5 architecture review: one module had `limit` max of 50, another had no maximum. A shared class was the correct remediation.

### Generic Repository with Built-in Pagination

A `BaseRepository.paginate()` method that handles `buildPaginationMeta` automatically was considered. Rejected because:
- Different entities have different query patterns (different `where` clauses, different `orderBy`)
- A generic `paginate()` with flexible `where` and `orderBy` parameters would become a leaky abstraction
- Repositories calling `buildPaginationMeta()` explicitly is clear and simple

---

## Future Evolution

- **API version compatibility**: If `PaginationDto` changes between API versions, the old version can be kept as `PaginationV1Dto` while the new version becomes `PaginationDto`
- **Rate limiting per endpoint**: Different endpoints may benefit from different rate limits, expressible as a shared `RateLimitDto` applying to Throttler configuration
- **Shared response interceptors**: Additional shared response shapes (bulk operation results, async job status) can be defined in `src/common/`

---

## References

- `src/common/dto/pagination/pagination.dto.ts`
- `src/common/dto/params/id-param.dto.ts`
- `src/common/interfaces/paginated-result.interface.ts`
- ADR-006 (Validation Strategy) — how shared DTOs integrate with the validation pipe
- ADR-009 (Swagger Strategy) — `@ApiProperty` on shared DTOs
