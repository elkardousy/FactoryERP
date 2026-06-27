# Architecture Decision Records — Index

All ADRs are stored in [`docs/architecture/adr/`](adr/).

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-000](adr/ADR-000-Architecture-Principles.md) | Architecture Principles | Accepted | 2026-06-26 |
| [ADR-001](adr/ADR-001-Repository-Pattern.md) | Repository Pattern | Accepted | 2026-06-26 |
| [ADR-002](adr/ADR-002-Clean-Architecture.md) | Clean Architecture Layer Ordering | Accepted | 2026-06-26 |
| [ADR-003](adr/ADR-003-Module-Boundaries.md) | NestJS Module Boundaries | Accepted | 2026-06-26 |
| [ADR-004](adr/ADR-004-Prisma-Integration.md) | Prisma as ORM | Accepted | 2026-06-26 |
| [ADR-005](adr/ADR-005-Configuration-Management.md) | Configuration Management | Accepted | 2026-06-26 |
| [ADR-006](adr/ADR-006-Validation-Strategy.md) | Global Validation Strategy | Accepted | 2026-06-26 |
| [ADR-007](adr/ADR-007-Error-Handling.md) | Error Handling Architecture | Accepted | 2026-06-26 |
| [ADR-008](adr/ADR-008-Logging-Architecture.md) | Structured Logging with nestjs-pino | Accepted | 2026-06-26 |
| [ADR-009](adr/ADR-009-DTO-Mapping.md) | DTO Mapping with @nestjs/swagger | Accepted | 2026-06-26 |
| [ADR-010](adr/ADR-010-Authentication.md) | JWT Authentication with Session Validation | Accepted | 2026-06-26 |
| [ADR-011](adr/ADR-011-JWT-Refresh-Tokens.md) | JWT and Refresh Token Strategy | Accepted | 2026-06-26 |
| [ADR-012](adr/ADR-012-Authorization-Architecture.md) | Role and Permission-Based Authorization | Accepted | 2026-06-26 |
| [ADR-013](adr/ADR-013-Guard-Stack.md) | Global Guard Stack Ordering | Accepted | 2026-06-26 |
| [ADR-014](adr/ADR-014-Permission-Cache.md) | Interface-Based Permission Cache | Accepted | 2026-06-26 |
| [ADR-015](adr/ADR-015-Response-Serialization.md) | API Response Serialization | Accepted | 2026-06-26 |
| [ADR-016](adr/ADR-016-Audit-Architecture.md) | Fire-and-Forget Audit Architecture | Accepted | 2026-06-26 |
| [ADR-017](adr/ADR-017-Document-Numbering.md) | Template-Based Document Numbering | Accepted | 2026-06-26 |
| [ADR-018](adr/ADR-018-TypeScript-Config.md) | TypeScript Configuration | Accepted | 2026-06-26 |
| [ADR-019](adr/ADR-019-Business-Foundation-Modules.md) | Business Foundation Module Design | Accepted | 2026-06-26 |
| [ADR-020](adr/ADR-020-Soft-Delete-Pattern.md) | Soft-Delete Pattern | Accepted | 2026-06-26 |
| [ADR-021](adr/ADR-021-BigInt-Serialization.md) | BigInt-to-String JSON Serialization | Accepted | 2026-06-26 |
| [ADR-022](adr/ADR-022-Dependency-Rules.md) | Formal Dependency Rules | Accepted | 2026-06-26 |
| [ADR-023](adr/ADR-023-Security-Principles.md) | Defense-in-Depth Security Architecture | Accepted | 2026-06-26 |
| [ADR-024](adr/ADR-024-Future-Scalability.md) | Scalability Provisions | Accepted | 2026-06-26 |
| [ADR-025](adr/ADR-025-ERP-Architecture-Vision.md) | ERP Architecture Vision and Domain Roadmap | Accepted | 2026-06-26 |
| [ADR-026](adr/ADR-026-Inventory-Architecture.md) | Inventory Architecture — Transactions, Locking, and Domain Model | Accepted | 2026-06-27 |

---

## ADR Status Legend

| Status | Meaning |
|--------|---------|
| **Accepted** | Decision is in effect |
| **Superseded** | Decision replaced by a later ADR (link to replacement) |
| **Deprecated** | Decision no longer applies but not replaced |
| **Proposed** | Under review, not yet implemented |

---

## Quick Reference by Topic

### Infrastructure
- ADR-004 — Prisma ORM
- ADR-005 — Configuration (ConfigService, Joi validation)
- ADR-008 — Logging (nestjs-pino, structured logs)
- ADR-018 — TypeScript configuration (isolatedModules, strictNullChecks)

### Architecture Patterns
- ADR-000 — Governing principles
- ADR-001 — Repository pattern
- ADR-002 — Clean Architecture layers
- ADR-003 — Module boundaries
- ADR-022 — Dependency rules (layer matrix)

### Authentication and Security
- ADR-010 — JWT authentication
- ADR-011 — Refresh tokens
- ADR-012 — Authorization (roles, screen permissions)
- ADR-013 — Guard stack ordering
- ADR-014 — Permission cache
- ADR-023 — Security architecture overview

### API Design
- ADR-006 — Validation (GlobalValidationPipe)
- ADR-007 — Error handling (global filters)
- ADR-009 — DTO mapping (OmitType, PartialType from @nestjs/swagger)
- ADR-015 — Response format (ResponseInterceptor, envelope)
- ADR-021 — BigInt serialization

### Domain Features
- ADR-016 — Audit logging
- ADR-017 — Document numbering
- ADR-019 — Business Foundation modules
- ADR-020 — Soft-delete pattern
- ADR-026 — Inventory architecture (transactions, locking, domain model)

### Future Direction
- ADR-024 — Scalability provisions
- ADR-025 — ERP domain roadmap
