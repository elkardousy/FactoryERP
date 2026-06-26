# Sprint 12 — Customer Manufacturing Orders (CMO)

**Version target:** v0.4.0-cmo-foundation
**Note:** CMO is the first operational domain — it depends on all Business Foundation master data.

---

## Objectives

Implement Customer Manufacturing Orders — the primary operational record linking customer demand to production. A CMO specifies which garment models, in which colors and sizes, at which quantities, for which customer. CMOs drive all downstream production orders, inventory reservations, and shipments.

---

## Scope

### New Domain Module: `src/modules/customer-orders/`

**Schema entities:**
- `customer_manufacturing_orders` — top-level CMO record
- `cmo_line_items` — specific model+color+size+quantity per CMO
- `packing_patterns` — customer-specified packaging configurations
- `packing_pattern_lines` — individual lines within a packaging pattern

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `CreateCmoUseCase` | Create a CMO with all line items in a single transaction |
| `GetCmoUseCase` | Retrieve CMO with all line items |
| `ListCmosUseCase` | Paginated, filterable by customer/status/date range |
| `UpdateCmoUseCase` | Update CMO header fields (not line items) |
| `CancelCmoUseCase` | Soft-cancel a CMO; cascades to active production orders |
| `AddLineItemUseCase` | Add a line item to an existing draft CMO |
| `UpdateLineItemUseCase` | Modify quantity on an existing line item |
| `RemoveLineItemUseCase` | Remove a line item from a draft CMO |
| `CreatePackingPatternUseCase` | Create packaging configuration for a CMO |
| `GetCmoStatusUseCase` | Compute CMO fulfillment percentage from production data |

---

## Architecture Constraints

- `CreateCmoUseCase` must create the CMO header + all line items atomically via `executeInTransaction()`
- Line items validate that the referenced `model_color_size` is active before accepting
- CMO cancellation must check for in-progress production orders — throw `ConflictException` if any exist
- A CMO in `CONFIRMED` status cannot have line items added/removed — throw `UnprocessableEntityException`
- `customer_id` is set at CMO creation and is immutable — `UpdateCmoUseCase` must reject requests that include `customer_id`
- All endpoints require `@Roles(UserRole.system_admin, UserRole.factory_manager)`

---

## Files Expected to Change

```
prisma/schema.prisma                          (verify CMO models)
prisma/migrations/                            (new migration if needed)
src/modules/customer-orders/
  customer-orders.module.ts
  repositories/
    cmo.repository.ts
    cmo-line-items.repository.ts
    packing-patterns.repository.ts
  dto/
    cmo.dto.ts
    cmo-line-item.dto.ts
    packing-pattern.dto.ts
  use-cases/
    create-cmo.use-case.ts + spec
    get-cmo.use-case.ts + spec
    list-cmos.use-case.ts + spec
    update-cmo.use-case.ts + spec
    cancel-cmo.use-case.ts + spec
    add-line-item.use-case.ts + spec
    update-line-item.use-case.ts + spec
    remove-line-item.use-case.ts + spec
    create-packing-pattern.use-case.ts + spec
    get-cmo-status.use-case.ts + spec
  controllers/
    cmo.controller.ts
    cmo-line-items.controller.ts
    packing-patterns.controller.ts
src/app.module.ts
docs/ (PROJECT_MEMORY, CHECKPOINT, ADR-027, ADR_INDEX, release notes)
```

---

## Testing Requirements

- All 10 use cases must have test suites
- `CreateCmoUseCase` must test: valid creation, inactive model rejection, inactive color-size rejection, transactional atomicity
- `CancelCmoUseCase` must test: cancellation of draft, rejection when production orders exist
- Status transitions must be tested: DRAFT → CONFIRMED → CANCELLED
- Minimum new tests: 50
- All existing tests must continue passing

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0
- [ ] `npm run build` succeeds
- [ ] `npm run test` shows 0 failures (≥ 192 tests after Sprint 12)
- [ ] CMO creation is atomic — partial failures roll back completely
- [ ] Status transitions are enforced — invalid transitions throw 422
- [ ] Customer binding is immutable after creation
- [ ] All CMO endpoints require factory_manager role or higher
- [ ] Audit events emitted for: create, cancel, line item changes
- [ ] ADR-027 written and accepted

---

## Exit Criteria

Sprint 12 complete when all acceptance criteria checked, quality gates pass, `v0.4.0-cmo-foundation` released.
