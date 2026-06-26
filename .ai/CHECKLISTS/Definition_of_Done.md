# Definition of Done

A Use Case, Feature, or Module is **Done** only when every item in this checklist is checked.

---

## Code

- [ ] Implementation follows the layer ordering: Controller → Use Case → Service/Repository → PrismaService
- [ ] No `PrismaService` injected outside a repository
- [ ] No cross-module repository injection
- [ ] Controller has `@Roles()` or `@Public()` on every method
- [ ] `@Controller({ path: '...', version: '1' })` declared
- [ ] All write operations emit `void this.auditService.log()`
- [ ] All HTTP input is typed as DTO classes
- [ ] No `as any` casts
- [ ] No `console.log` in production code
- [ ] No `process.env` in application code (outside documented exceptions)
- [ ] `export type { Foo }` for interface re-exports

## Tests

- [ ] Unit test suite exists for every new Use Case
- [ ] Happy path tested
- [ ] All error scenarios tested (NotFoundException, ConflictException, etc.)
- [ ] Repository calls are mocked
- [ ] Test count has not decreased from the previous sprint

## Schema (if applicable)

- [ ] New models use `@@schema("factory")`
- [ ] PKs are `BigInt @id @default(autoincrement())`
- [ ] DateTime fields use `@db.Timestamptz(6)`
- [ ] Quantities use `Decimal(12,3)`
- [ ] `prisma migrate dev` completed successfully
- [ ] `prisma generate` run after schema change

## Documentation

- [ ] New endpoints have `@ApiOperation()`, `@ApiResponse()`, `@ApiBearerAuth()`
- [ ] All DTO fields have `@ApiProperty()`
- [ ] ADR written if an architectural decision was made
- [ ] ADR added to `docs/architecture/ADR_INDEX.md`

## Quality

- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm run test` exits 0

## Sprint Level (checked at sprint completion, not per use case)

- [ ] `docs/PROJECT_MEMORY.md` updated
- [ ] `docs/checkpoints/PROJECT_CHECKPOINT.md` updated
- [ ] Sprint report in `docs/sprint-reports/`
- [ ] Release notes in `docs/releases/` (if releasing)
- [ ] Git commit with descriptive message
- [ ] Git tag created (if releasing)
