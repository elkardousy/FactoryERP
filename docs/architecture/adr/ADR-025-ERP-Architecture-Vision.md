# ADR-025 — ERP Architecture Vision

## Title

Manufacturing ERP Architecture Vision and Domain Roadmap

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The Business Foundation sprint established the core infrastructure and seven business foundation modules. These represent the master data layer of the ERP. To guide future development, the architecture team needs a documented vision of the complete ERP domain model and how the current foundation supports it.

This ADR captures the intended ERP architecture at full scope — not as a commitment to implement everything, but as a compass for architectural decisions as the ERP grows.

---

## Decision

### ERP Domain Model

The FactoryERP is designed around a garment manufacturing workflow. The complete domain covers:

**Master Data (Business Foundation — Complete)**
- Organization: Departments, Work Shifts
- Infrastructure: Warehouses, Production Lines, Production Stages
- Relationships: Customers, Suppliers
- Catalog: Garment Models (with customer binding)
- Measurements: Colors, Sizes

**Customer-Facing Operations (Next Phase)**
- Customer Manufacturing Orders (CMOs): Long-running customer orders defining quantities
- Model Parts: Components of a garment model (e.g., fabric panels, lining)
- Packaging Lists: Customer-specified packaging requirements
- CMO Line Items: Specific model+color+size combinations within a CMO

**Procurement and Receiving**
- Purchase Orders: Material procurement from suppliers
- Receiving Audit Items: Inspection records for received goods
- Physical Bags: The physical manifestation of received inventory (tracked by barcode)

**Inventory Management**
- Inventory Bags: Logical inventory records tied to physical bags
- Inventory Transactions: All movements (receive, reserve, release, consume, return)
- Stock Reservations: Allocations of inventory to production orders

**Production**
- Production Orders: Work orders for specific CMO lines
- Production Stages (operations): Activities performed at each stage
- Workflow Templates: Configurable multi-step approval workflows
- Production Tracking: Time-based production stage logging

**Supplementary Management**
- Supplementary Material Requests: Non-standard material needs
- Defect Records: Quality tracking at the production level

**Finance (Future)**
- Costing models
- Invoice generation
- Payment tracking

### Architectural Layers at Full Scope

```
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                         │
│                   (NGINX / Cloud LB)                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  FactoryERP API                          │
│                  (NestJS Monolith)                       │
│                                                         │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Auth   │ │ Business │ │Production│ │ Inventory  │  │
│  │ Module  │ │Foundation│ │ Modules  │ │  Modules   │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Core Infrastructure                    │   │
│  │   Prisma | Audit | DocNumber | Logger | Config   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│               PostgreSQL (factory schema)                │
│  Master Data | Operational | Audit | Sequences           │
└─────────────────────────────────────────────────────────┘
```

### Module Expansion Strategy

New ERP modules follow the same structure as Business Foundation modules:

1. **Schema first**: Add models to `prisma/schema.prisma` in the `factory` schema
2. **Repository**: Implement CRUD and domain-specific queries
3. **Use cases**: One per business operation
4. **Controller**: Thin HTTP layer with role declarations
5. **Module**: Declare all providers
6. **Tests**: Unit tests for all use cases
7. **ADR**: Document any new architectural decisions

### Domain Events Architecture (Future)

As the ERP grows, certain operations span multiple modules:
- Creating a CMO triggers garment model validation, inventory reservations, and production line scheduling
- Completing a production order triggers inventory consumption and quality recording

These cross-domain workflows will be implemented using one of:
- **Synchronous use-case orchestration**: Current approach, adequate for simple cross-module operations
- **NestJS Event Emitter**: For loosely-coupled notifications (module B reacts to module A events)
- **Message Queue (future)**: For guaranteed-delivery cross-module workflows

### Database Evolution Strategy

The Prisma schema is the single source of truth. Database evolution follows:

```
Business requirement → Schema change → prisma migrate dev → prisma generate → Code changes
```

For production deployments:
```
Schema reviewed → prisma migrate deploy (no interactive prompts)
```

### Workflow Engine

The schema includes a general-purpose workflow engine:
- `workflow_templates`: Define approval step sequences
- `workflow_instances`: Track in-progress workflows
- `workflow_steps`: Individual step states with SLA tracking
- `approval_permissions`: Time-bounded approval rights

This engine will be used for production order approvals, CMO approvals, and supplementary material requests.

---

## Rationale

**Why document a vision that extends beyond current implementation?**

Architectural decisions made today (BigInt PKs, schema isolation, module structure) are irreversible or expensive to reverse. Understanding the intended future scope prevents decisions that are locally correct but globally harmful.

For example:
- Knowing that production orders will eventually link to CMOs, which link to customers, justifies the current customer model binding rules
- Knowing that inventory transactions will be partitioned by time justifies the composite primary key on `inventory_transactions`
- Knowing that production will require multi-step approvals justifies the `approval_permissions` table in the current schema

**Why monolith rather than microservices at full ERP scope?**

The ERP's transactional requirements (inventory must never be negative, production orders must be atomically created with their line items) require strong consistency guarantees. Distributed transactions are orders of magnitude more complex than local transactions. The monolith approach with strong module boundaries provides the right level of isolation without distributed transaction complexity.

If individual modules grow to require independent deployment, they can be extracted as services once the business requirements justify the operational complexity.

**Why define the full domain in the schema now?**

Having the complete schema visible (even for tables not yet used by application code) provides:
- Referential integrity from day one
- Foreign key constraints that prevent incorrect data from being inserted
- A complete data model for reporting and analytics
- Guidance for future developers on how entities relate

---

## Consequences

**Positive:**
- Future module developers have a complete schema to reference
- Referential integrity is enforced at the database level from the start
- The vision guides architectural decisions before individual modules are built
- New developers understand the ERP's intended scope immediately

**Negative:**
- A large schema with tables not yet used by application code adds cognitive load
- Some schema decisions (made for future modules) may need revision as requirements clarify
- The monolith approach requires careful discipline as the codebase grows

**Trade-offs:**
- Upfront schema design vs. incremental schema evolution: Upfront design provides integrity and coherence; incremental design provides flexibility. The ERP domain is well-understood enough for upfront design to be the correct choice.

**Future Implications:**
- **CMO Phase**: Customer Manufacturing Orders will be the next major module to implement
- **Inventory Phase**: Physical bag tracking and inventory transactions follow CMOs
- **Production Phase**: Production orders and stage tracking follow inventory management
- **Analytics Phase**: Read models and reporting can be added as the operational data accumulates

---

## Related Components

- `prisma/schema.prisma` — complete future domain schema
- All existing `src/modules/` — current implementation
- ADR-003 (Module Boundaries) — how new modules will be structured
- ADR-024 (Future Scalability) — provisions for future volume

---

## Alternatives Considered

### Domain-Driven Design with Bounded Contexts

Full DDD with explicit bounded context maps would provide stronger guidance for where module boundaries should be. Considered for a future architecture review. The current use-case-based structure is compatible with DDD and can evolve toward explicit bounded contexts.

### Event-Driven Architecture from Day One

Building the ERP on an event bus from the start would support loose coupling and eventual consistency. Rejected because:
- Strong consistency is required for inventory and production order operations
- Event-driven architectures are harder to reason about and debug
- Current synchronous orchestration is sufficient for current requirements
- Event-driven patterns can be introduced incrementally for specific cross-domain workflows

---

## Future Evolution

This ADR should be updated as each major domain phase is completed:
- After CMO Phase: Update status of CMO module
- After Inventory Phase: Update status of inventory management
- After Production Phase: Update status of production modules
- Add new ADRs for domain-specific decisions as they are made

---

## References

- `prisma/schema.prisma` — complete domain schema
- All existing ADRs — the foundation this vision builds upon
- Sprint 10.5 Architecture Review — acceptance of the Business Foundation
- `CLAUDE.md` — project guidance
