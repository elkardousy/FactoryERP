# Coding Standards

TypeScript and NestJS coding standards for FactoryERP. These standards are enforced by ESLint, Prettier, and code review.

---

## TypeScript

### General

- `strictNullChecks: true` — always handle `null` and `undefined` explicitly
- `isolatedModules: true` — re-exporting a TypeScript interface or type from a barrel **must** use `export type { Foo }`, not `export { Foo }`
- `noImplicitAny: false` — allowed but discouraged; prefer explicit types for public APIs
- Avoid `as any` casts. Use `as unknown` as a stepping stone when necessary

### Types vs Interfaces

- Use `interface` for object shapes that describe domain data or contracts
- Use `type` for unions, intersections, or aliases
- Prisma-generated types are `type` — do not redeclare them as interfaces

### BigInt

- All IDs from the database are `BigInt`. Do not cast them to `number`
- Use `serializeBigInts()` in the response interceptor (already done globally)
- In test data, use `BigInt(1)` not `1n` for consistency

---

## NestJS Patterns

### Controllers

```typescript
@Controller({ path: 'customers', version: '1' })
@ApiTags('Customers')
@ApiBearerAuth('JWT')
@Roles(UserRole.system_admin, UserRole.factory_manager)
export class CustomersController {
  constructor(private readonly createCustomerUseCase: CreateCustomerUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.createCustomerUseCase.execute(dto);
  }
}
```

Rules:
- One `@Controller()` per module, one method per HTTP endpoint
- Methods call exactly one use case
- No business logic in controllers
- Always declare `version: '1'` in `@Controller()`
- Always add `@ApiTags()`, `@ApiBearerAuth('JWT')`, `@Roles()`
- Return the use-case result directly — `ResponseInterceptor` wraps it

### Use Cases

```typescript
@Injectable()
export class CreateCustomerUseCase {
  constructor(
    private readonly customersRepo: CustomersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateCustomerDto): Promise<Customer> {
    const customer = await this.customersRepo.create(dto);
    void this.auditService.log({ action: 'CUSTOMER_CREATED', entityId: customer.customer_id });
    return customer;
  }
}
```

Rules:
- Named `<Action><Domain>UseCase` (e.g., `CreateCustomerUseCase`)
- Single public method: `execute()`
- Always emit audit event for state-changing operations (fire-and-forget)
- Throw NestJS HTTP exceptions for domain errors (`NotFoundException`, `ConflictException`)
- Never catch errors in use cases unless re-throwing a more specific exception

### Repositories

```typescript
@Injectable()
export class CustomersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(id: bigint): Promise<Customer | null> {
    return this.db.customer.findUnique({ where: { customer_id: id } });
  }
}
```

Rules:
- Extend `BaseRepository`
- Use `this.db` (alias for `this.prisma`) for all Prisma calls
- Return Prisma model types directly — no manual DTO mapping in repositories
- Named `<Domain>Repository`
- Methods are database operations, not business operations

### Services

```typescript
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

Rules:
- Services provide reusable, stateless capabilities
- Named `<Capability>Service`
- Do not embed business-specific logic in services

---

## DTOs

### Class-Validator Decorators

Every DTO field must have `class-validator` decorators and an `@ApiProperty()` decorator for Swagger:

```typescript
export class CreateCustomerDto {
  @ApiProperty({ example: 'ACME Corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customer_name: string;

  @ApiPropertyOptional({ example: 'contact@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
```

### Update DTOs

```typescript
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
```

Never duplicate fields between create and update DTOs.

### Import Source for Mapped Types

```typescript
// Always:
import { PartialType, OmitType, PickType } from '@nestjs/swagger';

// Never:
import { PartialType } from '@nestjs/mapped-types';
```

---

## Error Handling

```typescript
// Throw HTTP exceptions from use cases:
throw new NotFoundException(`Customer ${id} not found`);
throw new ConflictException('Customer with this email already exists');
throw new UnauthorizedException('Invalid credentials');
```

- Never throw plain `Error` from use cases — use NestJS HTTP exceptions
- The `AllExceptionsFilter` catches everything, but specific HTTP exceptions give the correct status code
- `PrismaExceptionFilter` handles database-level errors (`P2002` → 409, `P2025` → 404, etc.)
- Do not catch Prisma errors in use cases or repositories — let the filter handle them

---

## Comments

Write no comments by default. Write a comment only when the **why** is non-obvious:
- A hidden constraint
- A subtle invariant
- A workaround for a specific bug
- Behavior that would surprise a reader

Do not comment what the code does — the code already says that. Do not reference the current task, PR, or issue number in comments.

```typescript
// eslint-disable-next-line @typescript-eslint/require-await
// MemoryPermissionCache methods are async to satisfy IPermissionCache but perform no async work.
async get(key: string): Promise<string[] | null> {
  return this.cache.get(key) ?? null;
}
```

---

## ESLint Rules

Key rules in `eslint.config.mjs`:

- `@typescript-eslint/no-floating-promises` — all Promises must be `await`ed or explicitly `void`-prefixed
- `@typescript-eslint/require-await` — functions marked `async` must contain an `await`
- `@typescript-eslint/unbound-method` — methods passed as callbacks must be bound

### Spec File Overrides

The following rules are turned off for `*.spec.ts` files:

```javascript
{
  files: ['**/*.spec.ts', '**/*.test.ts'],
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
  },
}
```

This is intentional — Jest's `expect(mock.method).toHaveBeenCalled()` patterns trigger `unbound-method`.

---

## Naming Conventions

| Concern | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `CreateCustomerUseCase` |
| Files | kebab-case | `create-customer.use-case.ts` |
| Interfaces | PascalCase with `I` prefix | `IPermissionCache` |
| Enums | PascalCase | `UserRole` |
| Enum values | snake_case | `UserRole.factory_manager` |
| DTO fields | snake_case | `customer_name` |
| Database columns | snake_case | `customer_id` |
| Route paths | kebab-case | `/production-lines` |
| Environment variables | UPPER_SNAKE_CASE | `JWT_SECRET` |
| Config namespace keys | camelCase | `jwt.expiresIn` |

---

## Testing

### Unit Test File Location

Test files live alongside the code they test:
```
src/modules/customers/use-cases/create-customer/
  create-customer.use-case.ts
  create-customer.use-case.spec.ts
```

### Test Structure

```typescript
describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let customersRepo: jest.Mocked<CustomersRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateCustomerUseCase,
        { provide: CustomersRepository, useValue: { create: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CreateCustomerUseCase);
    customersRepo = module.get(CustomersRepository);
  });

  it('creates and returns a customer', async () => {
    customersRepo.create.mockResolvedValue(mockCustomer);
    const result = await useCase.execute(dto);
    expect(result).toEqual(mockCustomer);
  });
});
```

Rules:
- Mock all external dependencies (repositories, services)
- Do not mock internal computation (use the real `PasswordService` for hashing tests)
- One `describe` block per class
- Test both happy path and error scenarios
- Do not use `as any` in tests — use proper types or typed mocks

---

## Formatting

Prettier handles formatting automatically:

```bash
npm run format    # prettier --write src/ test/
npm run lint      # eslint with --fix
```

Key Prettier settings (`.prettierrc`):
- Single quotes
- Trailing commas where valid
- Semicolons
- 2-space indentation
- 100-character line length

Do not add formatting fixes in a PR that adds features — separate formatting PRs from logic changes.
