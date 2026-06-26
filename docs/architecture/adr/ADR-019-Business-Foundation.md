# ADR-019 — Business Foundation

## Title

Seven-Module Business Foundation with Soft-Delete Lifecycle Pattern

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

Before production orders, inventory management, or financial transactions can be modeled, the ERP requires a stable set of foundational business entities. These entities are the reference data that all operational modules will depend on:

- **Organization**: Who performs the work (departments, work shifts)
- **Infrastructure**: Where the work happens (warehouses, production lines)
- **Relationships**: Who orders and who supplies (customers, suppliers)
- **Catalog**: What is made (garment models with customer and supplier associations)
- **Measurements**: How quantities are defined (colors, sizes, production stages)

These are not operational entities (orders, transactions) — they are master data. They must be:
- Creatable by administrators
- Deactivatable when no longer in use (soft delete, not physical delete)
- Reactivatable when business needs change
- Listable with active/inactive filtering

---

## Decision

Seven business foundation modules were implemented in Sprint 10.5, each following a consistent architectural pattern:

| Module | Entities | Delete Type |
|--------|----------|-------------|
| Organization | departments, working_shifts | Soft (is_active) |
| Warehouses | warehouses | Soft (is_active) |
| Production Setup | production_lines, production_stages | Soft (lines) / Hard (stages) |
| Customers | customers | Soft (is_active) |
| Suppliers | suppliers | Soft (is_active) |
| Garment Models | models (linked to customers) | Soft (is_active) |
| Measurements | colors, sizes | Hard delete |

### Soft-Delete Lifecycle Pattern

Entities with `is_active` follow a consistent four-state lifecycle:

```
CREATE → ACTIVE → DEACTIVATED → ACTIVE (reactivated)
                     ↓
                  (soft-deleted, remains in DB)
```

**Idempotency rules** (enforced by all deactivation/reactivation use-cases):
- Deactivating an already-inactive entity throws `BadRequestException`
- Reactivating an already-active entity throws `BadRequestException`

**Active children guard** (departments only):
- A department with active sub-departments cannot be deactivated

### Default Active Filter

All list use-cases default to `is_active = true` when no filter is provided:

```typescript
async execute(filter: CustomerFilterDto) {
  return this.repo.findAllWithPagination({
    search: filter.search,
    is_active: filter.is_active ?? true,  // Default: only active
  }, filter.page, filter.limit);
}
```

Clients can explicitly pass `is_active=false` to see deactivated entities.

### Reactivation Endpoints

Each soft-delete module exposes a `PATCH /:id/reactivate` endpoint:

```typescript
@Patch(':id/reactivate')
@Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
@ApiOperation({ summary: 'Reactivate a previously deactivated customer' })
reactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
  return this.reactivateUseCase.execute(params.id, user.sub);
}
```

### Garment Models — Customer Binding

Garment models are permanently bound to a customer:
- `customer_id` is required on creation
- `customer_id` cannot be changed after creation (excluded from `UpdateModelDto` via `OmitType`)
- A model cannot be created for an inactive customer

```typescript
// In CreateModelUseCase:
const customer = await this.customersRepo.findById(BigInt(dto.customer_id));
if (!customer) throw new NotFoundException(`Customer ${dto.customer_id} not found.`);
if (!customer.is_active) throw new BadRequestException(`Customer ${dto.customer_id} is inactive.`);
```

### Warehouse Type Guard

Warehouse type cannot be changed after creation:

```typescript
// In UpdateWarehouseUseCase:
if (dto.warehouse_type && dto.warehouse_type !== existing.warehouse_type) {
  throw new BadRequestException('Warehouse type cannot be changed after creation.');
}
```

### Hard Delete Pattern (Colors, Sizes, Production Stages)

Measurement entities (colors, sizes, production stages) use hard delete because:
- They are reference data without operational history
- Deactivating a color is not semantically meaningful (there's no "inactive red")
- If a color is associated with active garment models, the database foreign key constraint will prevent deletion

---

## Rationale

**Why soft delete for most entities?**

ERP master data has operational history. A customer that is deactivated today still appears in historical orders. Physical deletion would corrupt that history. Soft delete (`is_active = false`) preserves the record while hiding it from active queries.

**Why hard delete for measurements (colors, sizes)?**

Colors and sizes are pure reference values. There is no business concept of "inactive color" — a color either exists or doesn't. If a color cannot be deleted (because it's referenced by garment models), the database FK constraint prevents it. No soft delete is needed.

**Why idempotency guards for deactivation/reactivation?**

Without idempotency checks, double-clicking a "Deactivate" button or replaying a failed request could succeed silently. Throwing `BadRequestException` for already-inactive/already-active entities:
- Gives the client clear feedback about the current state
- Prevents confusing audit entries (deactivation of an already-inactive entity)
- Makes the operation semantically correct (deactivation of an inactive entity is a client error)

**Why `is_active ?? true` as the list default?**

Active entities are what users see in normal operation. Showing inactive entities by default would require users to explicitly filter them out. The `?? true` default means:
- A client that sends no `is_active` parameter sees only active entities
- A client that wants inactive entities explicitly passes `is_active=false`

**Why `OmitType` for `UpdateModelDto` to exclude `customer_id`?**

A garment model's customer binding is immutable once created. Allowing `customer_id` in the update DTO would let clients change the customer association, potentially orphaning the model from its historical order references. `OmitType` removes the field at the DTO level, making the constraint self-documenting and enforced by the validation pipe.

---

## Consequences

**Positive:**
- Consistent CRUD + deactivate + reactivate API surface across all seven modules
- Soft-deleted entities are preserved for historical queries and audit trails
- Active-filter default reduces API noise for normal operations
- Idempotency guards prevent confusing state mutations

**Negative:**
- All list queries must include `is_active` filter to avoid returning deactivated entities
- Repository `findAllWithPagination` methods must handle the `is_active` filter consistently
- Reactivation adds a `PATCH /:id/reactivate` endpoint that must be secured with appropriate roles

**Trade-offs:**
- Soft delete vs. physical delete: Soft delete adds query complexity but preserves data integrity for historical reference. In a manufacturing ERP, this trade-off is always resolved in favor of soft delete for operational entities.

**Future Implications:**
- **Archival**: Inactive entities that have been inactive for >1 year can be moved to an archive table without affecting active operations
- **Cascading deactivation**: When a customer is deactivated, all their active models could be automatically deactivated (not currently implemented — business decision required)
- **Reactivation audit**: Every reactivation already produces an audit event, enabling compliance queries ("who reactivated customer X and when")

---

## Related Components

- `src/modules/organization/` — departments, working shifts
- `src/modules/warehouses/` — warehouses
- `src/modules/production-setup/` — production lines, production stages
- `src/modules/customers/` — customers
- `src/modules/suppliers/` — suppliers
- `src/modules/garment-models/` — garment models
- `src/modules/measurements/` — colors, sizes

---

## Alternatives Considered

### Physical Delete for All Entities

Rejected. Manufacturing ERPs cannot delete master data that may be referenced by historical orders. Physical deletion corrupts referential integrity.

### Status Enum Instead of Boolean

`status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'` was considered. Rejected for the initial phase because:
- Boolean `is_active` is simpler and sufficient for current requirements
- Most queries are "active vs. not active" — a three-state status adds complexity without value at this phase
- Can be migrated to an enum later if archival or additional states are needed

### Event Sourcing for Entity Lifecycle

Each state change (create, deactivate, reactivate) could be captured as an event, with the current state derived from the event log. Rejected because:
- Enormous complexity increase for current requirements
- Current audit events already capture all lifecycle transitions
- Event sourcing is appropriate for operational entities (orders) not master data

---

## Future Evolution

- **Archival**: Entities deactivated for >1 year can be moved to a separate `archived_customers` table without affecting active queries
- **Cascading deactivation**: When a customer is deactivated, trigger deactivation of their models
- **Bulk deactivation/reactivation**: A batch endpoint for managing many entities at once
- **Approval workflow for reactivation**: High-value entities (customers, suppliers) could require manager approval for reactivation

---

## References

- `src/modules/customers/use-cases/`
- `src/modules/customers/repositories/customers.repository.ts`
- `src/modules/garment-models/dto/model.dto.ts` — `OmitType` example
- ADR-001 (Repository Pattern) — restore() method
- ADR-016 (Audit Architecture) — lifecycle events
