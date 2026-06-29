# 15 — Engineering Glossary

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Domain Terms

### Bag / Physical Bag
An individual unit of raw material (fabric/components) stored in a physical bag. Each bag has a unique `bag_code`, tracks `received_dozens` (original) and `current_dozens` (remaining), belongs to a specific model/part/customer, and moves through a status lifecycle: RECEIVED → AVAILABLE → RESERVED → RELEASED → IN_WIP → RETURNED/CLOSED.

### Bag Code
Unique identifier string for a physical bag (e.g., "BAG-2026-001234"). Stored as `varchar(30)` with a unique constraint.

### CMO — Customer Manufacturing Order
An order placed by a customer specifying what garment models, in which colors/sizes, and how many dozens need to be produced. CMOs contain multiple lines (one per model/color/size combination).

### Container
A shipment from a supplier containing raw materials. Containers are audited upon arrival to verify contents against the packaging list. Physical bags are created from container contents.

### Dozens
The unit of measurement for all quantities in this system. One dozen = 12 pieces. All quantity fields use `Decimal(12,3)` (supports fractional dozens).

### Finished Goods Bag
A unit of finished, quality-checked garments ready for shipping. Created at the end of the packing process.

### Inventory Bag
An aggregate ledger record representing total `dozens_on_hand` for a specific `{warehouse, model, part}` combination. Updated by inventory transactions. Different from Physical Bag.

### Inventory Transaction
A recorded movement of inventory: RECEIVING, RELEASE, WIP_CONSUMPTION, QUALITY_OUTPUT, PACKING, RETURN, ADJUSTMENT, or SUPPLEMENTARY_RELEASE. Stored in `inventory_transactions` with composite PK `[txn_id, executed_at]`.

### Model
A specific garment design belonging to a customer. Identified by `customer_id + model_code`. Has parts, colors, and sizes.

### Model Part
A component of a garment model (e.g., body fabric, lining). Identified by `model_id + part_code`.

### OEE — Overall Equipment Effectiveness
Manufacturing KPI = Availability × Performance × Quality. Tracked per machine per shift in `machine_oee_snapshots`.

### Packing Order
A work order to pack finished garments into dozens using a specific packing pattern. Links a production order to a packing pattern.

### Packing Pattern
A template defining how to pack garments into dozens by color/size combination. Specifies `pieces_per_dozen` per color/size line.

### Production Order
An order to produce a specific garment model on a production line. Goes through stages (DRAFT → PLANNED → IN_PRODUCTION → PRODUCTION_COMPLETE → CLOSED).

### Production Stage
A step in the manufacturing process (e.g., cutting, sewing, finishing). Stages have a unique `sequence_order`.

### Release Group
A batch release of materials from the warehouse to a production order. Contains multiple `release_group_lines` (one per warehouse/part).

### Reservation
A hold placed on dozens from a specific physical bag for a specific production order. Prevents the reserved quantity from being used by other orders. Statuses: ACTIVE, RELEASED, CANCELLED.

### SMV — Standard Minute Value
The target time (in minutes) for one unit of production at a specific stage for a specific model. Used to calculate efficiency.

### TRANSFER
An inventory transaction type that atomically moves material from one warehouse to another. Creates two records: RELEASE (source) + RECEIVING (destination) with the same `txn_reference`.

### WIP — Work In Progress
Material currently being processed in a production stage. Tracked in `wip_inventory` per `{order, part}`.

---

## Technical Terms

### BaseRepository
Abstract class in `src/core/database/repositories/base/base.repository.ts`. All repositories extend it. Provides `this.db` (PrismaService alias) and `executeInTransaction()`.

### BigInt
JavaScript BigInt type. All database primary keys are stored as `BigInt` in PostgreSQL and returned as JavaScript `BigInt` from Prisma. Must be converted to string for JSON serialization.

### Clean Architecture
Architectural pattern enforcing strict dependency layers: Controllers → Use Cases → Services → Repositories → Database. Outer layers depend on inner layers; inner layers never depend on outer.

### Command
An immutable value object carrying input data for a write operation. Example: `CreateReservationCommand`. Constructor-only, no logic.

### Composite PK
A primary key composed of multiple columns. In this codebase: `inventory_transactions` (`txn_id`, `executed_at`) and `audit_events` (`event_id`, `occurred_at`). Requires `findFirst` instead of `findUnique` when filtering by one column.

### CorrelationIdMiddleware
Middleware applied to all routes that adds/propagates `X-Correlation-ID` header for distributed request tracing.

### dbgenerated()
Prisma directive for columns whose value is computed by a PostgreSQL function or trigger. These columns cannot be set in INSERT statements.

### DI — Dependency Injection
NestJS's IoC container. Services, repositories, use cases, and guards are all injectable. Registered via `providers` array in module `@Module()` decorator.

### DTO — Data Transfer Object
TypeScript class with validation decorators (`class-validator`) used to shape and validate HTTP request/response data.

### executeInTransaction
Method on `BaseRepository` that wraps a callback in a Prisma database transaction: `this.prisma.$transaction(async (tx) => callback(tx as PrismaService))`.

### Factory (Service pattern)
A service that constructs data objects from commands. Example: `InventoryTransactionFactory.fromReceive(cmd)` → `CreateTransactionData`.

### findFirst vs findUnique
Prisma methods. `findUnique` requires ALL primary key fields. `findFirst` returns first match by any condition. Required for composite PK tables.

### isolatedModules
TypeScript compiler option requiring each file to be transformable in isolation. Key impact: re-exporting TypeScript interfaces/types from barrels must use `export type { Foo }` instead of `export { Foo }`.

### JwtPayload
Interface: `{ sub: bigint, username: string, role: string }`. Populated by JwtStrategy and accessible via `@CurrentUser()` decorator in controllers.

### Mapper (Service pattern)
A service that transforms database entities to response DTOs. Example: `InventoryTransactionMapper.toResponse(txn)`.

### multiSchema (Prisma preview feature)
Allows Prisma to work with multiple PostgreSQL schemas. Used here with only one schema (`factory`), but required to reference it explicitly in all models.

### PrismaExceptionFilter
Global exception filter that catches `PrismaClientKnownRequestError` and maps Prisma error codes to HTTP status codes (P2002→409, P2025→404, P2003→400, P2014→409).

### Query
An immutable value object carrying input data for a read operation. Example: `GetTransactionsQuery`. Constructor-only, no logic.

### ResponseInterceptor
Global NestJS interceptor wrapping all responses in `{ data, statusCode, timestamp, path }` and calling `serializeBigInts()`.

### serializeBigInts()
Utility function in `src/core/utils/bigint-serializer.ts`. Recursively traverses an object and converts all `BigInt` values to `string`.

### Use Case
A NestJS injectable class containing the business logic for a single feature/operation. Has one `execute(command|query)` method. Delegates to services and repositories.

### Validator (Service pattern)
A service that validates command inputs against business rules before they are executed. Example: `ReservationValidator.validateCreate(cmd)`.

---

## Acronym Reference

| Acronym | Full Form |
|---------|-----------|
| ADR | Architecture Decision Record |
| API | Application Programming Interface |
| CQRS | Command Query Responsibility Segregation (partial, not full) |
| CMO | Customer Manufacturing Order |
| DI | Dependency Injection |
| DTO | Data Transfer Object |
| EOS | Engineering Operating System (the .ai/ system) |
| ERP | Enterprise Resource Planning |
| JWT | JSON Web Token |
| KEB | Knowledge Extraction & Engineering Baseline |
| KPI | Key Performance Indicator |
| OEE | Overall Equipment Effectiveness |
| ORM | Object-Relational Mapping |
| PK | Primary Key |
| PSL | Prisma Schema Language |
| SMV | Standard Minute Value |
| WIP | Work In Progress |

---

## Database Column Naming Conventions

| Suffix | Meaning | Example |
|--------|---------|---------|
| `_id` | BigInt foreign key reference | `customer_id`, `model_id` |
| `_at` | Timestamptz | `created_at`, `executed_at` |
| `_by` | BigInt user reference | `created_by`, `executed_by` |
| `_date` | Date (no time) | `received_date`, `hire_date` |
| `_dozens` | Decimal quantity | `reserved_dozens`, `dozens_qty` |
| `_code` | Human-readable code | `bag_code`, `model_code` |
| `_hash` | Hashed value | `password_hash`, `token_hash` |
| `is_active` | Soft-delete flag | Boolean, default true |
| `version` | Optimistic lock counter | BigInt, default 0 |
| `status` | Enum status field | Various enum types |
