# ADR-009 — Swagger Strategy

## Title

OpenAPI Documentation via Swagger with URI Versioning

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The ERP API is consumed by a managed frontend application. The frontend team requires:
1. Accurate, up-to-date API documentation
2. The ability to test endpoints without writing custom HTTP client code
3. Documentation that reflects the actual JWT authentication requirement

Additionally, the API uses URI versioning (`/v1/`), which must be reflected in the documentation.

Without automated documentation:
- API documentation drifts from implementation
- Frontend developers must infer request/response shapes by reading backend source code
- Authentication requirements are not self-documented

---

## Decision

**Swagger** (OpenAPI 3.0) is enabled via `@nestjs/swagger` at the path `/api/docs`.

### Swagger Configuration

```typescript
// src/core/config/swagger.config.ts
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('FactoryERP API')
    .setDescription('Manufacturing ERP REST API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

### JWT Authentication in Swagger

Bearer JWT authentication is configured with the security scheme name `'JWT'`. Protected controllers declare:

```typescript
@ApiBearerAuth('JWT')
@Controller({ path: 'customers', version: '1' })
export class CustomersController {}
```

This adds the lock icon to all endpoints in the Swagger UI and enables the "Authorize" dialog for token entry.

### URI Versioning

All API routes use URI versioning (`/v1/`). The NestJS application is configured with:

```typescript
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
```

Each controller declares its version explicitly:
```typescript
@Controller({ path: 'customers', version: '1' })
```

This means all routes are accessible as `/v1/customers/...`, and Swagger correctly shows versioned URLs.

### DTO Documentation

All request and response DTOs use `@ApiProperty` and `@ApiPropertyOptional` to document fields:

```typescript
export class CreateCustomerDto {
  @ApiProperty({ example: 'CUST-001', description: 'Unique customer identifier code' })
  @IsString()
  @IsNotEmpty()
  customer_code!: string;
}
```

Pagination DTOs use `@ApiProperty` with `required: false` and default values:
```typescript
@ApiProperty({ required: false, default: 1, minimum: 1 })
page = 1;
```

Route parameters use `@ApiParam`, query parameters use `@ApiQuery`, and operations use `@ApiOperation` for summary text.

### `OmitType` for Update DTOs

When update DTOs must exclude certain fields from create DTOs, `OmitType` from `@nestjs/swagger` is used:
```typescript
export class UpdateModelDto extends PartialType(OmitType(CreateModelDto, ['customer_id'] as const)) {}
```

`OmitType` from `@nestjs/swagger` (not `@nestjs/mapped-types`) is required to maintain correct Swagger schema generation.

---

## Rationale

**Why `@nestjs/swagger` over manual OpenAPI YAML?**

Manual YAML drifts from the implementation. Code-first documentation is generated from the actual DTO classes and decorator annotations, ensuring the documentation reflects the real API. A separate YAML file would require manual synchronization.

**Why URI versioning over header/query-parameter versioning?**

URI versioning (`/v1/`) is:
- Immediately visible in browser URLs and log entries
- Bookmarkable
- Unambiguous in API gateways and reverse proxies
- The most common convention for REST APIs

Header versioning (e.g., `Accept-Version: 1`) is less visible and not testable in a browser.

**Why explicit version on each controller instead of a global default?**

Using `defaultVersion: '1'` on the application would apply version 1 implicitly to all routes. Declaring it explicitly on each controller makes the version visible in the code and prevents accidental version mismatches if a controller is moved or refactored.

**Why `OmitType` from `@nestjs/swagger` specifically?**

`@nestjs/mapped-types` provides the same `OmitType` but does not integrate with Swagger. Using `@nestjs/swagger`'s version ensures the generated Swagger schema correctly omits the excluded fields. The two packages' `OmitType` are API-compatible but produce different metadata.

---

## Consequences

**Positive:**
- API documentation is always current — generated from code at startup
- Frontend team can explore and test the API independently
- JWT authentication is self-documented in Swagger UI
- Versioned URLs appear correctly in documentation

**Negative:**
- `@ApiProperty` annotations on every DTO field add boilerplate
- Swagger UI is exposed at `/api/docs` — this endpoint must be disabled or secured in production environments
- `@ApiBearerAuth('JWT')` must be manually added to each controller; forgetting it means the endpoint appears as unauthenticated in Swagger UI (though it is still protected by guards)

**Trade-offs:**
- Code-first documentation is slightly less expressive than hand-written OpenAPI YAML for complex polymorphic response types. For current ERP needs, this is not a limitation.

**Future Implications:**
- **API versioning**: When version 2 of an endpoint is introduced, the old controller remains at `version: '1'` while a new controller is created at `version: '2'`
- **Swagger security**: Production deployments should restrict `/api/docs` to internal network access
- **SDK generation**: The OpenAPI document generated by Swagger can be used by tools like `openapi-generator` to generate typed frontend API clients automatically

---

## Related Components

- `src/core/config/swagger.config.ts`
- `src/main.ts` — Swagger setup call
- All `src/modules/*/controllers/*.controller.ts` — `@ApiBearerAuth('JWT')` declarations
- All `src/modules/*/dto/*.dto.ts` — `@ApiProperty` annotations
- `src/common/dto/pagination/pagination.dto.ts`
- `src/common/dto/params/id-param.dto.ts`

---

## Alternatives Considered

### Manual OpenAPI YAML

Rejected. YAML maintenance diverges from implementation. Updates to DTO fields require updating both the code and the YAML.

### Postman Collections

Considered as a supplementary tool. Postman collections are useful for manual testing but are not auto-generated from code. They would be maintained separately and drift over time.

### GraphQL Introspection

Rejected. The ERP uses REST, not GraphQL. GraphQL's self-documenting introspection system is an argument for GraphQL adoption, not a substitute for Swagger in a REST context.

---

## Future Evolution

- **Frontend client generation**: OpenAPI → TypeScript client generation eliminates manual API calls in the frontend
- **API changelog**: Version history can be maintained in Swagger descriptions to document breaking changes
- **Webhook documentation**: If the ERP sends webhooks, Swagger's callback documentation can describe webhook shapes

---

## References

- `src/core/config/swagger.config.ts`
- `src/main.ts`
- ADR-006 (Validation Strategy) — DTOs that Swagger documents
- ADR-010 (Authentication) — JWT auth that Swagger documents
