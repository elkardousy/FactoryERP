# Engineering Workflow

Complete end-to-end workflow for all FactoryERP development activities.

---

## 1. Feature Implementation Flow

```mermaid
flowchart TD
    A([Sprint Start]) --> B[Read startup documents]
    B --> C[Read Sprint Prompt]
    C --> D{Technical debt\nhigh-priority?}
    D -- Yes --> E[Resolve TD items first]
    D -- No --> F[Schema Design]
    E --> F
    F --> G[prisma migrate dev]
    G --> H[prisma generate]
    H --> I[Repository Layer]
    I --> J[Use Case Layer]
    J --> K[Controller Layer]
    K --> L[Module Registration]
    L --> M[Unit Tests]
    M --> N{npm run lint\nnpm run build\nnpm run test}
    N -- Fail --> O[Fix issues]
    O --> N
    N -- Pass --> P[Architecture Review]
    P --> Q{Accepted?}
    Q -- No --> R[Revise implementation]
    R --> N
    Q -- Yes --> S[Documentation Update]
    S --> T[Acceptance Review]
    T --> U{Accepted?}
    U -- No --> V[Address findings]
    V --> N
    U -- Yes --> W[Release Preparation]
    W --> X([Sprint Complete])
```

---

## 2. Module Implementation Sequence

Every new domain module follows this strict sequence:

```
Step 1: Schema
  └─ Add models to prisma/schema.prisma (@@schema("factory"))
  └─ npx prisma migrate dev --name {module}-foundation
  └─ npx prisma generate

Step 2: Repository
  └─ src/modules/{domain}/repositories/{domain}.repository.ts
  └─ extends BaseRepository
  └─ implements: create, findById, findAll, update, delete/deactivate

Step 3: DTOs
  └─ src/modules/{domain}/dto/{domain}.dto.ts
  └─ CreateXxxDto, UpdateXxxDto (extends PartialType), ResponseXxxDto

Step 4: Use Cases (one per business operation)
  └─ src/modules/{domain}/use-cases/*.use-case.ts
  └─ src/modules/{domain}/use-cases/*.use-case.spec.ts
  └─ execute() method, audit event, HTTP exceptions

Step 5: Controller
  └─ src/modules/{domain}/controllers/{domain}.controller.ts
  └─ @Controller({ path: '...', version: '1' })
  └─ @Roles(...), @ApiTags, @ApiBearerAuth

Step 6: Module
  └─ src/modules/{domain}/{domain}.module.ts
  └─ Register all providers (use cases, repository, controller)
  └─ Import dependent modules if needed

Step 7: App Registration
  └─ Import module in src/app.module.ts

Step 8: Tests
  └─ npx jest --testPathPattern={domain}
  └─ All use cases tested; happy path + error scenarios

Step 9: Quality Verification
  └─ npm run lint
  └─ npm run build
  └─ npm run test
```

---

## 3. Architecture Review Flow

```mermaid
flowchart LR
    A[Implementation Complete] --> B[Run Architecture_Review.md checklist]
    B --> C{Layer ordering\nviolation?}
    C -- Yes --> D[BLOCKING: Fix before review]
    C -- No --> E{PrismaService\noutside repo?}
    E -- Yes --> D
    E -- No --> F{Cross-module\nrepo injection?}
    F -- Yes --> D
    F -- No --> G{Missing @Roles\non endpoint?}
    G -- Yes --> D
    G -- No --> H{Audit missing\non write UC?}
    H -- Yes --> D
    H -- No --> I[Architecture Review: PASSED]
    D --> J[Fix and restart]
```

---

## 4. Security Review Flow

```mermaid
flowchart TD
    A[Architecture Review Passed] --> B{Auth flows\nchanged?}
    B -- Yes --> C[Run Security_Review.md]
    B -- No --> D{New data\naccess patterns?}
    D -- Yes --> C
    D -- No --> E{Dependency\nupgrade?}
    E -- Yes --> C
    E -- No --> F[Security Review: SKIPPED - not required]
    C --> G{Vulnerabilities\nfound?}
    G -- Critical/High --> H[BLOCKING: Fix before merge]
    G -- Medium/Low --> I[Log in PROJECT_MEMORY.md as risk]
    H --> J[Fix and restart Security Review]
    I --> K[Security Review: PASSED with notes]
```

---

## 5. Release Flow

```mermaid
flowchart TD
    A([Sprint Complete]) --> B[Verify all Quality Gates]
    B --> C{All gates\npassing?}
    C -- No --> D[Fix failing gates]
    D --> B
    C -- Yes --> E[Run RELEASE_PROMPTS/Release.md]
    E --> F[Update version references]
    F --> G[Create release notes\ndocs/releases/vX.Y.Z.md]
    G --> H[git add -A]
    H --> I["git commit: release(vX.Y.Z): ..."]
    I --> J[Run RELEASE_PROMPTS/Git_Tag.md]
    J --> K[git tag -a vX.Y.Z]
    K --> L[Run RELEASE_PROMPTS/GitHub_Release.md]
    L --> M[gh release create]
    M --> N[Run RELEASE_PROMPTS/Governance_Update.md]
    N --> O[Update PROJECT_MEMORY.md]
    O --> P[Update PROJECT_CHECKPOINT.md]
    P --> Q([Release Complete])
```

---

## 6. Schema Migration Flow

```mermaid
flowchart TD
    A[Business requirement] --> B[Add/modify model in schema.prisma]
    B --> C[npx prisma validate]
    C --> D{Valid?}
    D -- No --> E[Fix schema errors]
    E --> C
    D -- Yes --> F["npx prisma migrate dev --name descriptive-name"]
    F --> G{Migration\nsucceeds?}
    G -- No --> H[Investigate and fix]
    H --> F
    G -- Yes --> I[npx prisma generate]
    I --> J[Update affected repositories]
    J --> K[Update affected use cases/DTOs]
    K --> L[npm run build]
    L --> M{Build clean?}
    M -- No --> N[Fix TypeScript errors]
    N --> L
    M -- Yes --> O[Run tests]
    O --> P[Commit schema + migration + code together]
```

---

## 7. Hotfix / Emergency Fix Flow

See `PLAYBOOKS/Emergency_Fix_Playbook.md` for the complete procedure.

```mermaid
flowchart TD
    A([Production Issue]) --> B[Identify root cause]
    B --> C[Create hotfix branch from release tag]
    C --> D[Minimal fix — no refactoring]
    D --> E[npm run lint && npm run build && npm run test]
    E --> F{All pass?}
    F -- No --> G[Fix]
    G --> E
    F -- Yes --> H[Code review]
    H --> I[Merge to main]
    I --> J["Patch version tag: vX.Y.Z+1"]
    J --> K[Post-mortem document]
    K --> L{Architectural\ncause?}
    L -- Yes --> M[Write ADR]
    L -- No --> N[Update technical debt log]
    M --> O([Hotfix Complete])
    N --> O
```

---

## 8. ADR Creation Flow

```
1. Identify decision
   └─ New technology, pattern, constraint, or trade-off that will affect future code

2. Draft ADR
   └─ Use TEMPLATES/ADR_Template.md
   └─ Status: Proposed
   └─ Fill all sections: Context, Decision, Rationale, Consequences, Alternatives

3. Architecture Review
   └─ Does it contradict any existing Accepted ADR?
   └─ Is the rationale sound?
   └─ Are consequences fully described?

4. Accept
   └─ Change status from Proposed → Accepted
   └─ Assign next sequential number (ADR-NNN)
   └─ Place in docs/architecture/adr/

5. Index
   └─ Add row to docs/architecture/ADR_INDEX.md

6. Commit
   └─ Include ADR commit in the sprint commit
```

---

## 9. Documentation Update Flow

Triggered at sprint completion, release, or any significant architectural change.

| Document | When to Update |
|----------|---------------|
| `docs/PROJECT_MEMORY.md` | Every sprint completion, every release |
| `docs/checkpoints/PROJECT_CHECKPOINT.md` | Every sprint completion |
| `docs/architecture/ADR_INDEX.md` | When new ADRs are created |
| `docs/architecture/ARCHITECTURE_TIMELINE.md` | When a milestone is completed |
| `README_ARCHITECTURE.md` | When phase changes (e.g., entering CMO phase) |
| `docs/releases/vX.Y.Z.md` | At every release |
| `.ai/MASTER_PROMPT.md` | Only with Architecture Board approval + ADR |

---

## 10. Context Recovery Flow

Used when a session has incomplete context or is resuming after a break.

See `AI_SESSION/CONTEXT_RECOVERY.md` for the detailed procedure.

```
1. Read README_ARCHITECTURE.md → understand architecture
2. Read docs/PROJECT_MEMORY.md → understand current phase and status
3. Read docs/checkpoints/PROJECT_CHECKPOINT.md → understand sprint state
4. Read docs/architecture/ADR_INDEX.md → understand active decisions
5. Read .ai/MASTER_PROMPT.md → restore behavior policy
6. Run: npm run lint && npm run build && npm run test → verify health
7. Identify current sprint → read .ai/SPRINT_PROMPTS/Sprint_N_*.md
8. Resume from last documented state
```
