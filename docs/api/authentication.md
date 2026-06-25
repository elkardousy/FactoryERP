# Authentication API Reference

**Base URL:** `/v1/auth`
**Swagger:** `/api/docs`
**Versioning:** URI versioning — all routes prefixed `/v1/`

---

## Overview

The authentication system uses a dual-token architecture:

- **Access token** — a short-lived JWT (default 15 minutes) sent in `Authorization: Bearer` header on every protected request.
- **Refresh token** — an opaque composite string (`"<sessionId>:<rawUUID>"`) with a longer TTL (default 7 days). Stored by the client and used only to obtain a new token pair. The raw UUID portion is stored server-side as a bcrypt hash; the full string is never persisted.

On every authenticated request, the server verifies the JWT signature AND re-validates the user account in the database (active status, lock state).

---

## Request Headers (All Endpoints)

| Header | Required | Description |
|---|---|---|
| `X-Correlation-ID` | No | If provided, the same value is echoed back in the response header. If omitted, the server generates a UUID and returns it. Useful for tracing requests across logs. |
| `X-Device-ID` | No | Unique identifier for the client device (stored in session). Defaults to `"unknown"`. |
| `X-Device-Platform` | No | Client platform: `web`, `ios`, `android`. Defaults to `"web"`. |

---

## POST /v1/auth/login

Authenticate with username and password. Returns an access token, a refresh token, and session metadata.

**Rate limit:** 10 requests per 60 seconds per IP address.

### Request

```
POST /v1/auth/login
Content-Type: application/json
```

```json
{
  "username": "john.doe",
  "password": "P@ssw0rd!"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | Yes | Non-empty string |
| `password` | string | Yes | Non-empty string |

### Success Response

**Status:** `200 OK`

```json
{
  "user": {
    "userId": "1",
    "username": "john.doe",
    "fullName": "John Doe",
    "roleId": "2"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "42:550e8400-e29b-41d4-a716-446655440000",
    "accessExpiresAt": "2026-06-26T10:15:00.000Z",
    "refreshExpiresAt": "2026-07-03T10:00:00.000Z"
  },
  "sessionId": "42",
  "mustChangePassword": false
}
```

| Field | Type | Notes |
|---|---|---|
| `user.userId` | string | BigInt serialized as string |
| `user.username` | string | |
| `user.fullName` | string | |
| `user.roleId` | string | BigInt serialized as string |
| `tokens.accessToken` | string | JWT — include as `Authorization: Bearer <token>` |
| `tokens.refreshToken` | string | Composite format `"<sessionId>:<rawUUID>"` — store securely, send only to `/auth/refresh` |
| `tokens.accessExpiresAt` | ISO 8601 | UTC datetime |
| `tokens.refreshExpiresAt` | ISO 8601 | UTC datetime |
| `sessionId` | string | BigInt serialized as string |
| `mustChangePassword` | boolean | If `true`, redirect user to change-password flow before granting full access |

### Error Responses

| Status | Error | Condition |
|---|---|---|
| `400 Bad Request` | `BadRequestException` | Missing or invalid fields (e.g., empty username) |
| `401 Unauthorized` | `UnauthorizedException` | Invalid username or password |
| `401 Unauthorized` | `UnauthorizedException` | Account is locked |
| `429 Too Many Requests` | `ThrottlerException` | Exceeded 10 requests per 60 seconds |

**Note on error messages:** Both "user not found" and "wrong password" return the identical message `"Invalid username or password."` to prevent user enumeration.

### Authentication Flow

```
Client                          Server
  │                               │
  │── POST /login {user,pass} ───►│
  │                               │ 1. findActiveUser(username)
  │                               │    → checks is_active + status=ACTIVE
  │                               │ 2. check locked_at !== null
  │                               │ 3. bcrypt.compare(password, hash)
  │                               │    → on failure: incrementFailedLogin()
  │                               │ 4. generateTokenPair(placeholder payload)
  │                               │ 5. hashRefreshToken(rawUUID)
  │                               │ 6. createSession(userId, hash, ctx)
  │                               │    → user_sessions INSERT → session_id
  │                               │ 7. generateAccessToken(real payload)
  │                               │    → payload includes real sessionId
  │                               │ 8. updateLastLogin(userId)
  │                               │    → resets failed_login_count = 0
  │                               │ 9. AuditRepository.create (try/catch)
  │◄── 200 LoginResult ──────────│
```

---

## POST /v1/auth/refresh

Exchange a valid refresh token for a new access token and refresh token pair. The old refresh token is invalidated (rotation).

**Rate limit:** Default 60 requests per 60 seconds per IP.

### Request

```
POST /v1/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "42:550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Format |
|---|---|---|---|
| `refreshToken` | string | Yes | Composite format `"<sessionId>:<rawUUID>"` as returned by login or previous refresh |

### Success Response

**Status:** `200 OK`

Response body is identical in shape to the Login response. The `tokens.refreshToken` will be a new composite string. **Store the new refresh token and discard the old one immediately.**

```json
{
  "user": {
    "userId": "1",
    "username": "john.doe",
    "fullName": "John Doe",
    "roleId": "2"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "refreshToken": "42:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "accessExpiresAt": "2026-06-26T10:30:00.000Z",
    "refreshExpiresAt": "2026-07-03T10:15:00.000Z"
  },
  "sessionId": "42",
  "mustChangePassword": false
}
```

### Error Responses

| Status | Error | Condition |
|---|---|---|
| `400 Bad Request` | `BadRequestException` | Missing or empty `refreshToken` field |
| `401 Unauthorized` | `UnauthorizedException` | Invalid composite token format (no `:` separator) |
| `401 Unauthorized` | `UnauthorizedException` | Session not found |
| `401 Unauthorized` | `UnauthorizedException` | Session has been revoked |
| `401 Unauthorized` | `UnauthorizedException` | Session has expired |
| `401 Unauthorized` | `UnauthorizedException` | Session has no refresh token hash (data integrity) |
| `401 Unauthorized` | `UnauthorizedException` | Raw token does not match stored hash |
| `401 Unauthorized` | `UnauthorizedException` | User account is inactive or locked |

### Token Rotation Flow

```
Client                          Server
  │                               │
  │── POST /refresh {token} ─────►│
  │                               │ 1. Parse: split at first ':'
  │                               │    sessionId = prefix, rawUUID = suffix
  │                               │ 2. findSession(sessionId)
  │                               │ 3. validateSession()
  │                               │    → status, ended_at, expires_at
  │                               │ 4. bcrypt.compare(rawUUID, stored_hash)
  │                               │ 5. findActiveById(session.user_id)
  │                               │    → user must still be active + unlocked
  │                               │ 6. generateTokenPair(new payload)
  │                               │ 7. hashRefreshToken(new rawUUID)
  │                               │ 8. refreshSession(sessionId, newHash, newExpiry)
  │                               │    → old token hash OVERWRITTEN — old token is now invalid
  │                               │ 9. AuditRepository.create (try/catch)
  │◄── 200 LoginResult ──────────│
```

---

## POST /v1/auth/logout

Revoke the current session. The access token's remaining lifetime is not cancelled at the JWT level (stateless), but the session is marked as revoked. Subsequent `/refresh` calls with the same refresh token will fail. Subsequent authenticated requests with the same access token will be rejected when JwtStrategy re-validates the session (future enhancement — currently JwtStrategy validates the user account, not the session status).

**Authentication required:** `Authorization: Bearer <accessToken>`

**Rate limit:** Default 60 requests per 60 seconds per IP.

### Request

```
POST /v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

No request body required.

### Success Response

**Status:** `204 No Content`

Empty body. The session has been revoked.

### Error Responses

| Status | Error | Condition |
|---|---|---|
| `401 Unauthorized` | `UnauthorizedException` | Missing, expired, or invalid access token |
| `401 Unauthorized` | `UnauthorizedException` | User account is inactive or locked (JwtStrategy re-validation) |

### Logout Flow

```
Client                          Server
  │                               │
  │── POST /logout + Bearer ─────►│
  │                               │ 1. JwtAuthGuard verifies JWT signature
  │                               │ 2. JwtStrategy.validate(payload)
  │                               │    → findActiveById(sub) — DB check
  │                               │    → check locked_at
  │                               │ 3. @CurrentUser() extracts JwtPayload
  │                               │ 4. revokeSession(sessionId, sub, 'LOGOUT')
  │                               │    → status='REVOKED', ended_at=now, end_reason='LOGOUT'
  │                               │ 5. AuditRepository.create (try/catch)
  │◄── 204 No Content ───────────│
```

---

## JWT Access Token

The access token is a standard JWT. Its payload contains:

```json
{
  "sub": "1",
  "username": "john.doe",
  "roleId": "2",
  "sessionId": "42",
  "iat": 1751000000,
  "exp": 1751000900
}
```

| Claim | Type | Description |
|---|---|---|
| `sub` | string | User ID (BigInt serialized as string) |
| `username` | string | Username |
| `roleId` | string | Role ID (BigInt serialized as string) |
| `sessionId` | string | Active session ID (BigInt serialized as string) |
| `iat` | number | Issued at (Unix timestamp) |
| `exp` | number | Expiry (Unix timestamp) |

The `sessionId` claim is included to allow future session-level invalidation without a DB lookup.

---

## Security Notes

1. **Refresh token storage** — Store the refresh token in an `HttpOnly` secure cookie or in secure device storage. Never store in `localStorage`.

2. **Token rotation** — Every call to `/refresh` issues a completely new refresh token and invalidates the previous one. If a request fails in transit, the client may need to retry with the same token (idempotent within the same rotation window).

3. **Access token expiry** — The default TTL is 15 minutes. Clients should proactively refresh before expiry using `tokens.accessExpiresAt`.

4. **Account lock** — A locked account is rejected at login, at refresh (user re-validation step), and on every authenticated request (JwtStrategy). A valid access token cannot be used to bypass a lock.

5. **Correlation IDs** — All responses include `X-Correlation-ID`. Include this header when reporting issues.
