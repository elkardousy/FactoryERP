# Architecture Checklist

Quick-reference checklist for architecture compliance. Run this before every Architecture Review.

---

## Layer Ordering

```bash
# No controller importing from a repository:
grep -r "Repository" src/modules --include="*.controller.ts"
# Expected: no results

# No use case importing PrismaService:
grep -r "PrismaService" src/modules --include="*.use-case.ts"
# Expected: no results

# No service importing PrismaService (except via super in repo):
grep -r "PrismaService" src/modules --include="*.service.ts"
# Expected: no results
```

- [ ] No controller imports a repository directly
- [ ] No use case imports PrismaService directly
- [ ] No service imports PrismaService directly

## Repository Isolation

```bash
# All repositories extend BaseRepository:
grep -r "class.*Repository" src/modules --include="*.repository.ts"
# Every result should show: extends BaseRepository
```

- [ ] All repositories extend `BaseRepository`
- [ ] All repositories inject `PrismaService` only via `constructor(prisma: PrismaService) { super(prisma); }`

## Cross-Module Rules

- [ ] No cross-module repository injection (CM-1)
- [ ] Cross-module data access via exported services only (CM-2)
- [ ] Global modules (Prisma, Logger, Audit, DocumentNumbering) not re-imported in feature modules

## Authorization Coverage

```bash
# Find all controllers:
grep -rn "@Controller" src/modules --include="*.controller.ts"
# For each file, verify @Roles() or @Public() on class or all methods
```

- [ ] Every controller class or method has `@Roles()` or `@Public()`
- [ ] No controller is missing `@ApiBearerAuth('JWT')`

## Audit Coverage

```bash
# Find write use cases missing audit:
grep -L "auditService.log" src/modules --include="*.use-case.ts" -r
# Results must only be read-only use cases (get/list)
```

- [ ] All write use cases call `void this.auditService.log()`
- [ ] No `await` before `auditService.log()`

## Module Registration

```bash
# Every module in src/modules/ is registered in app.module.ts:
grep -r "Module" src/app.module.ts
```

- [ ] All new modules imported in `AppModule`

## TypeScript Compliance

```bash
# Check for 'as any' casts:
grep -rn "as any" src/ --include="*.ts" | grep -v ".spec.ts"
# Expected: no results (or documented exceptions only)

# Check export type:
grep -rn "^export {" src/ --include="index.ts"
# Any interface re-exports should use: export type { }
```

- [ ] No `as any` in production code
- [ ] Interface re-exports use `export type { }`

## ADR Compliance

- [ ] All new architectural decisions have a corresponding ADR
- [ ] No implementation contradicts an Accepted ADR without a superseding ADR
