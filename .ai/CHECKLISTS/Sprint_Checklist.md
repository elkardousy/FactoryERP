# Sprint Completion Checklist

Use this checklist to track progress through a sprint and verify it is complete before release.

---

## Phase 1 — Sprint Setup

- [ ] Startup documents read (README_ARCHITECTURE, PROJECT_MEMORY, CHECKPOINT, ADR_INDEX, MASTER_PROMPT, GOVERNANCE_PROMPT)
- [ ] Sprint prompt read from `.ai/SPRINT_PROMPTS/Sprint_{N}_*.md`
- [ ] Technical debt reviewed — high-priority items addressed first
- [ ] Schema changes identified

## Phase 2 — Schema

- [ ] `prisma/schema.prisma` updated
- [ ] `npx prisma validate` passes
- [ ] `npx prisma migrate dev --name {descriptive-name}` succeeds
- [ ] `npx prisma generate` run
- [ ] `npm run build` clean after schema change

## Phase 3 — Implementation

- [ ] Repositories implemented
- [ ] DTOs with class-validator decorators and @ApiProperty implemented
- [ ] Use Cases implemented (one per business operation)
- [ ] Controllers implemented (`@Controller`, `@Roles`, `@ApiTags`, `@ApiBearerAuth`)
- [ ] Module file created and registered in `app.module.ts`

## Phase 4 — Testing

- [ ] Unit test suites for all use cases
- [ ] Happy path tests
- [ ] Error scenario tests
- [ ] `npm run test` passes (count ≥ previous sprint)

## Phase 5 — Quality Gates

- [ ] `npm run lint` exits 0 (Build Gate)
- [ ] `npm run build` exits 0 (Build Gate)
- [ ] `npm run test` 0 failures (Testing Gate)
- [ ] Architecture Gate passed (`.ai/QUALITY_GATES/Architecture_Gate.md`)
- [ ] Security Gate passed if applicable (`.ai/QUALITY_GATES/Security_Gate.md`)
- [ ] Performance Gate passed (`.ai/QUALITY_GATES/Performance_Gate.md`)
- [ ] Documentation Gate passed (`.ai/QUALITY_GATES/Documentation_Gate.md`)

## Phase 6 — Reviews

- [ ] Architecture Review (`REVIEW_PROMPTS/Architecture_Review.md`): PASS
- [ ] Security Review (`REVIEW_PROMPTS/Security_Review.md`): PASS / N/A
- [ ] Performance Review (`REVIEW_PROMPTS/Performance_Review.md`): PASS
- [ ] Code Quality Review (`REVIEW_PROMPTS/Code_Quality_Review.md`): PASS
- [ ] Documentation Review (`REVIEW_PROMPTS/Documentation_Review.md`): PASS
- [ ] Acceptance Review (`REVIEW_PROMPTS/Acceptance_Review.md`): ACCEPTED

## Phase 7 — Documentation

- [ ] `docs/PROJECT_MEMORY.md` updated (metrics, milestones, debt, risks)
- [ ] `docs/checkpoints/PROJECT_CHECKPOINT.md` updated
- [ ] New ADR(s) written and added to `ADR_INDEX.md`
- [ ] `docs/architecture/ARCHITECTURE_TIMELINE.md` updated
- [ ] Sprint report created in `docs/sprint-reports/`
- [ ] `README_ARCHITECTURE.md` updated if phase changed

## Phase 8 — Release

- [ ] Release notes created (`docs/releases/v{VERSION}.md`)
- [ ] `RELEASE_PROMPTS/Release.md` executed
- [ ] `RELEASE_PROMPTS/Git_Tag.md` executed
- [ ] `RELEASE_PROMPTS/GitHub_Release.md` executed (or commands prepared)
- [ ] `RELEASE_PROMPTS/Governance_Update.md` executed
- [ ] `git status` shows clean working tree
- [ ] `git tag --sort=-creatordate | head -3` shows new tag as latest
