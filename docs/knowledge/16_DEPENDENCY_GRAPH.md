# 16 — Dependency Graph

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Module Import Graph

### AppModule imports:

```
AppModule
├── ConfigModule (@Global, isGlobal: true)
├── PrismaModule (@Global)
├── LoggerModule (@Global)
├── AuditModule (@Global)
├── DocumentNumberingModule (@Global)
├── OrganizationModule
├── MeasurementsModule
├── WarehousesModule
├── ProductionSetupModule
├── CustomersModule
├── SuppliersModule
├── GarmentModelsModule
├── AuthModule
├── AuthorizationModule
├── InventoryModule
└── ThrottlerModule
```

### Global Module Exports (available everywhere, no import needed)

```
PrismaModule        → exports PrismaService
LoggerModule        → exports LoggerService
AuditModule         → exports AuditService, AuditRepository
DocumentNumberingModule → exports DocumentNumberingService
ConfigModule        → exports ConfigService
```

### AuthModule exports (available to importers)

```
AuthModule exports:
├── AuthService
├── JwtAuthGuard
├── JwtService
└── UsersRepository
```

### AuthorizationModule exports (available to importers)

```
AuthorizationModule exports:
├── AuthorizationService
├── RolesGuard
├── ScreenPermissionGuard
└── (PermissionResolverService, etc.)
```

Note: Guards are registered as `APP_GUARD` in AppModule, not imported per-module.

### InventoryModule exports (available to importers)

```
InventoryModule exports:
├── PhysicalBagsRepository
├── PhysicalBagReservationsRepository
├── InventoryBagsRepository
├── InventoryTransactionsRepository
├── InventoryTransactionService
└── ReservationService
```

---

## Layer Dependency Graph (Per Module)

### Standard Module Pattern

```
Controller
    │ injects (via constructor)
    ▼
[UseCase1, UseCase2, ..., UseCaseN]
    │ inject (via constructor)
    ▼
Service (domain service — optional)
    │ injects (via constructor)
    ▼
Repository (extends BaseRepository)
    │ injects (via constructor)
    ▼
PrismaService (from PrismaModule, @Global)
```

### Inventory Module Specific Graph

```
InventoryController
    │ injects 16 use cases
    ▼
┌─────────────────────────────────────────────────────┐
│ Transaction Use Cases (8)                           │
│   CreateInventoryTransactionUseCase → txnService   │
│   ReceiveInventoryUseCase → txnService             │
│   IssueInventoryUseCase → txnService               │
│   TransferInventoryUseCase → txnService            │
│   AdjustInventoryUseCase → txnService              │
│   ListInventoryTransactionsUseCase → txnService    │
│   GetInventoryTransactionUseCase → txnService      │
│   GetBagTransactionHistoryUseCase → txnService     │
└─────────────────────────────────────────────────────┘
    │ all inject InventoryTransactionService
    ▼
InventoryTransactionService
    │ injects
    ├── InventoryTransactionsRepository
    ├── PhysicalBagsRepository
    ├── InventoryTransactionFactory
    ├── InventoryTransactionMapper
    ├── InventoryTransactionValidator
    └── LoggerService (@Global)

InventoryTransactionValidator
    │ injects
    └── InventoryValidationRepository

┌─────────────────────────────────────────────────────┐
│ Reservation Use Cases (8)                           │
│   CreateReservationUseCase → reservationService    │
│   ReleaseReservationUseCase → reservationService   │
│   CancelReservationUseCase → reservationService    │
│   ExpireReservationUseCase → reservationService    │
│   GetReservationUseCase → reservationService       │
│   ListReservationsUseCase → reservationService     │
│   ListReservationsByBagUseCase → reservationService│
│   ListReservationsByOrderUseCase → reservationService│
└─────────────────────────────────────────────────────┘
    │ all inject ReservationService
    ▼
ReservationService
    │ injects
    ├── PhysicalBagReservationsRepository
    ├── ReservationFactory
    ├── ReservationMapper
    ├── ReservationValidator
    └── LoggerService (@Global)

ReservationValidator
    │ injects
    ├── PhysicalBagsRepository
    ├── PhysicalBagReservationsRepository
    └── InventoryValidationRepository
```

---

## External Package Dependencies

### Runtime Dependencies (what runs in production)

```
Application Core
├── @nestjs/common ^11
├── @nestjs/core ^11
├── @nestjs/config ^4
├── @nestjs/jwt ^11
├── @nestjs/passport ^11
├── @nestjs/platform-express ^11
├── @nestjs/swagger ^11
├── @nestjs/throttler ^6
├── rxjs ^7
└── reflect-metadata ^0.2

Database
├── @prisma/client ^6
└── prisma ^6

Security
├── bcrypt ^6
├── helmet ^8
├── passport ^0.7
└── passport-jwt ^4

Validation
├── class-validator ^0.15
└── class-transformer ^0.5

Logging
├── nestjs-pino ^4
├── pino ^10
└── pino-pretty ^13

HTTP
├── compression ^1.8
└── swagger-ui-express ^5

Misc
├── joi ^18 (startup env validation)
└── ms ^2.1 (time string parsing)
```

### Dev-Only Dependencies (not shipped)

```
Testing
├── jest ^30
├── ts-jest ^29
├── @nestjs/testing ^11
└── supertest ^7

Linting/Formatting
├── eslint ^9
├── typescript-eslint ^8
├── eslint-config-prettier ^10
├── eslint-plugin-prettier ^5
└── prettier ^3.4

TypeScript
├── typescript ^5.7
├── ts-node ^10.9
├── ts-loader ^9
└── tsconfig-paths ^4.2

NestJS Build
├── @nestjs/cli ^11
└── @nestjs/schematics ^11

Type Definitions
├── @types/node ^24
├── @types/bcrypt ^6
├── @types/compression ^1.8
├── @types/express ^5
├── @types/jest ^30
├── @types/passport-jwt ^4
└── @types/supertest ^7
```

---

## Import Rules (Enforced)

### What CAN import what

| Layer | May Import |
|-------|------------|
| Controller | Use Cases, DTOs, Decorators, Guards |
| Use Case | Services, Repository interfaces, Command/Query objects |
| Service | Repositories, other Services, LoggerService, ConfigService |
| Repository | PrismaService only |
| DTO | class-validator decorators, @nestjs/swagger decorators |
| Module | Providers, other Modules |

### What CANNOT import what

| Layer | May NOT Import |
|-------|----------------|
| Repository | Services, Use Cases, Controllers |
| Service | PrismaService directly, Controllers |
| Use Case | PrismaService, other Use Cases |
| Controller | Repositories directly, PrismaService |
| Any | Other module's private providers (only exports) |

### Cross-Module Rules

- Feature modules cannot import each other's repositories except via exports
- `PrismaModule` imported once in `AppModule` (global)
- `LoggerModule` imported once in `AppModule` (global)
- `AuthModule` exports are available to `AuthorizationModule`

---

## Circular Dependency Prevention

No circular imports are allowed. NestJS will throw at startup if circular dependencies exist.

Known potential circular risks (NONE currently, verified at Sprint 11.3):
- `InventoryModule` exports repositories used by future modules (e.g., production module may need InventoryBagsRepository)
- `AuthModule` exports `UsersRepository` for session validation
