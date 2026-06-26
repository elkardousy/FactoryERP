# Documentation Checklist

Run before Documentation Review and at every sprint completion.

---

## Per-Endpoint Documentation (Swagger)

For every new controller method:
- [ ] `@ApiOperation({ summary: 'Short description' })`
- [ ] `@ApiResponse({ status: 200, description: '...' })` or appropriate success code
- [ ] `@ApiResponse({ status: 400, description: 'Validation error' })` (if input validated)
- [ ] `@ApiResponse({ status: 404, description: '...' })` (if entity can be not found)
- [ ] `@ApiBearerAuth('JWT')` on the controller class (not per-method)
- [ ] `@ApiTags('{Domain}')` on the controller class

## Per-DTO Documentation

For every DTO field:
- [ ] `@ApiProperty({ example: '...' })` or `@ApiPropertyOptional()`
- [ ] `example` value is realistic (not `'string'` or `123`)
- [ ] BigInt ID fields: `@ApiProperty({ type: String, example: '42' })`

## ADR Documentation

For every new architectural decision:
- [ ] ADR file created using `.ai/TEMPLATES/ADR_Template.md`
- [ ] Status: Accepted
- [ ] File placed in `docs/architecture/adr/ADR-{NNN}-{Title}.md`
- [ ] Added to `docs/architecture/ADR_INDEX.md`

## PROJECT_MEMORY.md

- [ ] Current phase reflects actual implementation state
- [ ] Latest Git Tag field is current
- [ ] Repository metrics (modules, repos, use cases, tests, ADRs) are accurate
- [ ] Technical debt list: resolved items removed; new items added
- [ ] Risks: outdated risks removed or updated
- [ ] Immediate Next Sprint description matches the upcoming sprint prompt

## PROJECT_CHECKPOINT.md

- [ ] Sprint number and name are current
- [ ] Completion date updated
- [ ] "What was completed" is exhaustive
- [ ] "What is NOT done" is explicit
- [ ] Verification commands are accurate
- [ ] Next checkpoint target and expected tag are stated

## README_ARCHITECTURE.md

- [ ] Latest Stable Tag reflects current release
- [ ] Current phase and milestone are current
- [ ] Module count in "Architecture at a Glance" section reflects current state

## ARCHITECTURE_TIMELINE.md

- [ ] New sprint milestone added with date and summary
