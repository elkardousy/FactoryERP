# 06 — API Knowledge

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## API Conventions

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:3000` |
| Version prefix | `/v1/` |
| Versioning type | URI versioning |
| Auth | Bearer JWT (`Authorization: Bearer <token>`) |
| Swagger UI | `/api/docs` |
| Rate limit | 60 requests per 60 seconds (ThrottlerGuard) |
| Response format | `{ data, statusCode, timestamp, path }` |
| ID type | All IDs returned as strings (BigInt serialized) |
| Quantity type | Decimal numbers serialized as strings |

---

## Authentication Endpoints

### Auth (`/v1/auth/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/login` | Public | Login with username/password → JWT pair |
| POST | `/v1/auth/refresh` | Public | Refresh access token using refresh token |
| POST | `/v1/auth/logout` | JWT | Logout (invalidate session) → 204 |

**Login response includes:** `access_token`, `refresh_token`, user info.

Auth is throttled at endpoint level for login (10 req/min on login route — more restrictive than default).

---

## Organization Module (`/v1/organization/`)

### Departments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/v1/organization/departments` | SYSTEM_ADMIN, ADMIN | Create department |
| GET | `/v1/organization/departments` | All | List departments (paginated) |
| GET | `/v1/organization/departments/:id` | All | Get department by ID |
| PATCH | `/v1/organization/departments/:id` | SYSTEM_ADMIN, ADMIN | Update department |
| DELETE | `/v1/organization/departments/:id` | SYSTEM_ADMIN, ADMIN | Soft delete department |
| POST | `/v1/organization/departments/:id/reactivate` | SYSTEM_ADMIN, ADMIN | Reactivate department |

### Working Shifts

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/v1/organization/shifts` | SYSTEM_ADMIN, ADMIN | Create shift |
| GET | `/v1/organization/shifts` | All | List shifts |
| GET | `/v1/organization/shifts/:id` | All | Get shift by ID |
| PATCH | `/v1/organization/shifts/:id` | SYSTEM_ADMIN, ADMIN | Update shift |
| DELETE | `/v1/organization/shifts/:id` | SYSTEM_ADMIN, ADMIN | Soft delete shift |

---

## Measurements Module

### Colors (`/v1/measurements/colors/`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/v1/measurements/colors` | SYSTEM_ADMIN, ADMIN | Create color |
| GET | `/v1/measurements/colors` | All | List colors |
| GET | `/v1/measurements/colors/:id` | All | Get color by ID |
| PATCH | `/v1/measurements/colors/:id` | SYSTEM_ADMIN, ADMIN | Update color |
| DELETE | `/v1/measurements/colors/:id` | SYSTEM_ADMIN, ADMIN | Hard delete color |

### Sizes (`/v1/measurements/sizes/`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/v1/measurements/sizes` | SYSTEM_ADMIN, ADMIN | Create size |
| GET | `/v1/measurements/sizes` | All | List sizes |
| GET | `/v1/measurements/sizes/:id` | All | Get size by ID |
| PATCH | `/v1/measurements/sizes/:id` | SYSTEM_ADMIN, ADMIN | Update size |
| DELETE | `/v1/measurements/sizes/:id` | SYSTEM_ADMIN, ADMIN | Hard delete size |

---

## Warehouses Module (`/v1/warehouses/`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/v1/warehouses` | SYSTEM_ADMIN, ADMIN | Create warehouse |
| GET | `/v1/warehouses` | All | List warehouses (paginated) |
| GET | `/v1/warehouses/:id` | All | Get warehouse by ID |
| PATCH | `/v1/warehouses/:id` | SYSTEM_ADMIN, ADMIN | Update warehouse |
| DELETE | `/v1/warehouses/:id` | SYSTEM_ADMIN, ADMIN | Soft delete |
| POST | `/v1/warehouses/:id/reactivate` | SYSTEM_ADMIN, ADMIN | Reactivate |

---

## Production Setup Module (`/v1/production-setup/`)

### Production Lines

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/production-setup/lines` | Create line |
| GET | `/v1/production-setup/lines` | List lines |
| GET | `/v1/production-setup/lines/:id` | Get line |
| PATCH | `/v1/production-setup/lines/:id` | Update line |
| DELETE | `/v1/production-setup/lines/:id` | Soft delete |
| POST | `/v1/production-setup/lines/:id/reactivate` | Reactivate |

### Production Stages

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/production-setup/stages` | Create stage |
| GET | `/v1/production-setup/stages` | List stages |
| GET | `/v1/production-setup/stages/:id` | Get stage |
| PATCH | `/v1/production-setup/stages/:id` | Update stage |
| DELETE | `/v1/production-setup/stages/:id` | Soft delete |

---

## Customers Module (`/v1/customers/`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/customers` | Create customer |
| GET | `/v1/customers` | List customers (paginated) |
| GET | `/v1/customers/:id` | Get customer |
| PATCH | `/v1/customers/:id` | Update customer |
| DELETE | `/v1/customers/:id` | Soft delete |
| POST | `/v1/customers/:id/reactivate` | Reactivate |

---

## Suppliers Module (`/v1/suppliers/`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/suppliers` | Create supplier |
| GET | `/v1/suppliers` | List suppliers (paginated) |
| GET | `/v1/suppliers/:id` | Get supplier |
| PATCH | `/v1/suppliers/:id` | Update supplier |
| DELETE | `/v1/suppliers/:id` | Soft delete |
| POST | `/v1/suppliers/:id/reactivate` | Reactivate |

---

## Garment Models Module (`/v1/models/`)

### Models

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/models` | Create model |
| GET | `/v1/models` | List models (paginated, filterable) |
| GET | `/v1/models/:id` | Get model |
| PATCH | `/v1/models/:id` | Update model |
| DELETE | `/v1/models/:id` | Soft delete |
| POST | `/v1/models/:id/reactivate` | Reactivate |

### Model Parts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/models/:modelId/parts` | Add part to model |
| GET | `/v1/models/:modelId/parts` | List model parts |
| GET | `/v1/models/:modelId/parts/:id` | Get model part |
| PATCH | `/v1/models/:modelId/parts/:id` | Update model part |
| DELETE | `/v1/models/:modelId/parts/:id` | Delete model part |

### Model Colors & Sizes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/models/:modelId/colors` | Assign color to model |
| GET | `/v1/models/:modelId/colors` | List model colors |
| DELETE | `/v1/models/:modelId/colors/:colorId` | Remove color from model |
| POST | `/v1/models/:modelId/sizes` | Assign size to model |
| GET | `/v1/models/:modelId/sizes` | List model sizes |
| DELETE | `/v1/models/:modelId/sizes/:sizeId` | Remove size from model |

---

## Inventory Module (`/v1/inventory/`) — Sprint 11.1–11.3

### Transaction Endpoints

| Method | Path | HTTP | Auth Role | Description |
|--------|------|------|-----------|-------------|
| POST | `/v1/inventory/transactions` | 201 | All | Generic transaction (requires `operation` field) |
| POST | `/v1/inventory/transactions/receive` | 201 | All | Record material receipt |
| POST | `/v1/inventory/transactions/issue` | 201 | All | Issue material to production order |
| POST | `/v1/inventory/transactions/transfer` | 201 | All | Transfer between warehouses (atomic) |
| POST | `/v1/inventory/transactions/adjust` | 201 | All | Adjust inventory (±qty) |
| GET | `/v1/inventory/transactions` | 200 | All | List transactions (paginated, filtered) |
| GET | `/v1/inventory/transactions/:id` | 200 | All | Get transaction by ID |
| GET | `/v1/inventory/bags/:id/history` | 200 | All | Get bag movement history |

**Note:** "All roles" = SYSTEM_ADMIN, ADMIN, MANAGER, SUPERVISOR, STAFF.

### Reservation Endpoints

| Method | Path | HTTP | Description |
|--------|------|------|-------------|
| POST | `/v1/inventory/reservations` | 201 | Reserve dozens from bag for order |
| POST | `/v1/inventory/reservations/:id/release` | 200 | Release active reservation |
| POST | `/v1/inventory/reservations/:id/cancel` | 200 | Cancel active reservation |
| POST | `/v1/inventory/reservations/:id/expire` | 200 | Expire active reservation (→ CANCELLED in DB) |
| GET | `/v1/inventory/reservations` | 200 | List reservations (filtered) |
| GET | `/v1/inventory/reservations/:id` | 200 | Get reservation by ID |
| GET | `/v1/inventory/bags/:id/reservations` | 200 | List all reservations for a bag |
| GET | `/v1/inventory/orders/:id/reservations` | 200 | List all reservations for an order |

---

## Inventory Transaction DTOs

### TransactionRequestDto (POST body)

```typescript
{
  operation?: TransactionOperationType;  // RECEIVE|ISSUE|TRANSFER|ADJUSTMENT|OPENING_BALANCE
  txn_reference: string;
  model_id: number;          // Converted to BigInt in controller
  part_id?: number;          // Optional
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  to_order_id?: number;
  dozens_qty: number;
  notes?: string;
}
```

### TransactionResponseDto (response shape)

```typescript
{
  txn_id: string;            // BigInt as string
  txn_reference: string;
  txn_type: string;          // TxnTypeEnum value
  model_id: string;
  part_id: string | null;
  from_location_type: string | null;
  from_location_id: string | null;
  to_location_type: string | null;
  to_location_id: string | null;
  dozens_qty: string;        // Decimal as string
  executed_by: string;
  executed_at: string;       // ISO 8601
  notes: string | null;
}
```

### TransactionFilterDto (GET query params)

```typescript
{
  page?: number;
  limit?: number;
  txn_type?: TxnTypeEnum;
  txn_reference?: string;
  model_id?: number;
  from_date?: string;
  to_date?: string;
}
```

---

## Inventory Reservation DTOs

### ReservationRequestDto (POST body)

```typescript
{
  bag_id: number;
  order_id: number;
  reserved_dozens: number;
}
```

### ReservationResponseDto (response shape)

```typescript
{
  reservation_id: string;
  bag_id: string;
  order_id: string;
  reserved_dozens: string;
  reserved_by: string;
  reserved_at: string;
  released_at: string | null;
  status: string;           // ReservationStatusEnum
}
```

### ReservationFilterDto (GET query params)

```typescript
{
  page?: number;
  limit?: number;
  status?: ReservationStatusEnum;
  bag_id?: number;
  order_id?: number;
}
```

---

## HTTP Response Codes (Inventory)

| Code | Trigger |
|------|---------|
| 201 | Resource created successfully |
| 200 | Query or state-change operation succeeded |
| 400 | Missing required field (e.g., `warehouse_id`) |
| 401 | Missing or invalid JWT |
| 403 | Insufficient role |
| 404 | Resource not found (bag, order, transaction, reservation) |
| 409 | Duplicate reservation for bag+order (ConflictException) |
| 422 | Insufficient available quantity (UnprocessableEntityException) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## Authentication Flow

```
POST /v1/auth/login
Body: { username, password }
Response: { access_token (15m), refresh_token (7d), user: { user_id, username, role } }

→ Use access_token as Bearer in all subsequent requests

POST /v1/auth/refresh
Body: { refresh_token }
Response: { access_token, refresh_token }

POST /v1/auth/logout
Header: Authorization: Bearer <access_token>
Response: 204 No Content
```

---

## Pagination

All list endpoints support pagination via query params:

```
GET /v1/inventory/transactions?page=1&limit=20
```

Response includes paginated result:

```json
{
  "data": {
    "items": [...],
    "total": 150,
    "page": 1,
    "limit": 20
  },
  "statusCode": 200,
  "timestamp": "...",
  "path": "..."
}
```

---

## Total Endpoints Count

| Module | Endpoints |
|--------|-----------|
| Auth | 3 |
| Organization (Dept + Shifts) | ~11 |
| Measurements (Colors + Sizes) | ~10 |
| Warehouses | 6 |
| Production Setup (Lines + Stages) | ~11 |
| Customers | 6 |
| Suppliers | 6 |
| Garment Models (Models + Parts + Colors/Sizes) | ~18 |
| Inventory (Transactions + Reservations) | 16 |
| **Total (estimated)** | **~87** |
