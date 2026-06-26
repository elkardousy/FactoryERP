# Feature Playbook

Step-by-step procedure for implementing a new ERP feature within an existing or new module.

---

## Prerequisites

Before writing any code, confirm:
- [ ] Sprint prompt read: `.ai/SPRINT_PROMPTS/Sprint_{N}_{Name}.md`
- [ ] `docs/PROJECT_MEMORY.md` Current Status section reviewed
- [ ] Relevant ADRs reviewed (see `docs/architecture/ADR_INDEX.md`)
- [ ] Schema for affected tables reviewed in `prisma/schema.prisma`
- [ ] `.ai/MASTER_PROMPT.md` Architecture Invariants reviewed

---

## Phase 1 — Design

**1.1 Identify the module**
- Does the feature belong to an existing module? → extend it
- Does it require a new module? → follow module layout in `CLAUDE.md`

**1.2 Define the layer stack**
```
Controller DTO → Use Case → Service(s) → Repository → Prisma
```

**1.3 Identify entities**
- New Prisma models needed?
- Existing relations affected?
- Do any indexes need to be added?

**1.4 Decide if an ADR is needed**
- New pattern? New technology? → YES → create ADR first
- See `.ai/CHECKLISTS/Decision_Tree.md` "Do I need an ADR?" section

---

## Phase 2 — Database (if schema changes required)

Follow `.ai/PLAYBOOKS/Database_Playbook.md` first before writing application code.

---

## Phase 3 — Repository

Create `src/modules/{module}/repositories/{entity}.repository.ts`:

```typescript
@Injectable()
export class {Entity}Repository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(id: bigint): Promise<{Entity} | null> {
    return this.db.{table}.findUnique({ where: { id } });
  }

  async findAllActive(pagination: PaginationDto): Promise<{Entity}[]> {
    return this.db.{table}.findMany({
      where: { is_active: true },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
      orderBy: { created_at: 'desc' },
    });
  }
}
```

Rules:
- Only the repository touches `this.db` (Prisma)
- Services must never inject `PrismaService` directly
- Use `this.executeInTransaction()` for multi-table writes

---

## Phase 4 — Use Cases

Create `src/modules/{module}/use-cases/{action}/{action}.use-case.ts`:

```typescript
@Injectable()
export class {Action}UseCase {
  constructor(
    private readonly {entity}Repository: {Entity}Repository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: {Action}Dto, actorId: bigint): Promise<{Result}> {
    // Validate business rules
    // Execute domain logic
    // Fire audit (fire-and-forget)
    void this.auditService.log({ action: '{ACTION}', entityType: '{ENTITY}', entityId: result.id, actorId });
    return result;
  }
}
```

Rules:
- One use case per user action (CreateOrder, ConfirmOrder, CancelOrder are separate)
- Business logic lives here, not in controllers or repositories
- Throw NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, etc.)

---

## Phase 5 — Controller

Create `src/modules/{module}/controllers/{entity}.controller.ts`:

```typescript
@ApiTags('{Domain}')
@ApiBearerAuth('JWT')
@Roles(Role.ADMIN, Role.MANAGER)
@Controller({ path: '{entities}', version: '1' })
export class {Entity}Controller {
  constructor(private readonly {action}UseCase: {Action}UseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a {entity}' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: Create{Entity}Dto, @CurrentUser() user: JwtPayload) {
    return this.{action}UseCase.execute(dto, user.sub);
  }
}
```

Rules:
- Controllers call exactly one use case per method
- No business logic in controllers
- Use `@CurrentUser()` decorator to extract actor ID

---

## Phase 6 — Module Registration

Add to `src/modules/{module}/{module}.module.ts`:
```typescript
providers: [
  {Entity}Repository,
  {Action}UseCase,
  {Entity}Controller,  // only if not in controllers array
],
controllers: [{Entity}Controller],
exports: [],  // only export if another module needs it
```

---

## Phase 7 — Tests

For each use case, create `{action}.use-case.spec.ts`:
```typescript
describe('{Action}UseCase', () => {
  let useCase: {Action}UseCase;
  let repo: jest.Mocked<{Entity}Repository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {Action}UseCase,
        { provide: {Entity}Repository, useValue: { findById: jest.fn(), create: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    useCase = module.get({Action}UseCase);
    repo = module.get({Entity}Repository);
  });

  it('should ...', async () => { /* ... */ });
});
```

---

## Phase 8 — Quality Gates

```bash
npm run lint
npm run build
npm run test
```

All three must exit 0 before the feature is considered done.

Then run:
- `.ai/CHECKLISTS/Definition_of_Done.md`
- `.ai/REVIEW_PROMPTS/Architecture_Review.md`
- `.ai/REVIEW_PROMPTS/Security_Review.md`
