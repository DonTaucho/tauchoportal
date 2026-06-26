# Brand Credentials API — Backend Requirements

**Status:** ⚠️ **CRITICAL** — Required for `/brand-settings` page  
**Date:** 2026-06-24  
**Priority:** HIGH  

---

## Overview

The `/brand-settings` page allows users to manage their smart device brand integrations (Govee, Hue, Lifx, etc.). This requires **backend endpoints and database** to store user-specific brand credentials.

Currently **missing:**
- ❌ `user_brand_credentials` table
- ❌ All `/auth/brand/...` endpoints
- ❌ Credential validation logic
- ❌ OAuth token management

**Note:** This is separate from the global `/catalog/brands` endpoint (which exists). This is about **user-scoped** credential storage.

---

## Requirements

### 1. Database Schema

**Table:** `user_brand_credentials` (NEW)

**Purpose:** Store each user's credentials for each brand they've connected.

**Schema:**
```sql
CREATE TABLE user_brand_credentials (
  id VARCHAR(32) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id VARCHAR(50) NOT NULL REFERENCES catalog.brands(id),
  auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('api_key', 'oauth', 'local', 'bearer_token', 'none')),
  status VARCHAR(20) CHECK (status IN ('connected', 'expired', 'revoked', 'invalid')),
  
  -- Credential payload (varies by brand/auth_type)
  credentials JSONB NOT NULL,
  
  -- OAuth tokens (if auth_type = 'oauth')
  oauth_access_token VARCHAR(2048),
  oauth_refresh_token VARCHAR(2048),
  oauth_token_expires_at TIMESTAMP,
  oauth_scope TEXT,
  
  -- Metadata
  is_primary BOOLEAN DEFAULT true,
  connected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_tested_at TIMESTAMP,
  last_used_at TIMESTAMP,
  error_message TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, brand_id),
  CONSTRAINT valid_oauth_fields CHECK (
    (auth_type != 'oauth') OR (oauth_access_token IS NOT NULL)
  ),
  FOREIGN KEY (brand_id) REFERENCES catalog.brands(id)
);

CREATE INDEX idx_user_brand_credentials_user_id ON user_brand_credentials(user_id);
CREATE INDEX idx_user_brand_credentials_user_brand ON user_brand_credentials(user_id, brand_id);
CREATE INDEX idx_user_brand_credentials_status ON user_brand_credentials(user_id, status);
```

**Key notes:**
- `credentials` is JSONB → flexible for different brands
- `(user_id, brand_id)` is unique → one credential set per brand per user
- OAuth tokens stored separately from API keys
- `is_primary` flag for future multi-account support
- `status` tracks connection health

---

### 2. API Endpoints

#### 2.1 GET /auth/brands

**Purpose:** List all brands with connection status for current user.

**Auth:** Required (authenticated user)

**Response `200`:**
```json
{
  "brands": [
    {
      "id": "govee",
      "name": "Govee",
      "is_connected": true,
      "auth_type": "api_key",
      "status": "connected",
      "connected_at": "2026-05-20T10:30:00Z",
      "last_tested_at": "2026-06-24T14:15:00Z",
      "error_message": null
    },
    {
      "id": "hue",
      "is_connected": false,
      "status": null
    },
    {
      "id": "tuya",
      "is_connected": true,
      "auth_type": "oauth",
      "status": "connected",
      "oauth_scope": "read write"
    }
  ]
}
```

**Implementation notes:**
- Query `user_brand_credentials` for current user
- Join with `catalog.brands` for name/description
- Do NOT return `credentials`, `oauth_access_token`, or `oauth_refresh_token`
- Return only connection status

---

#### 2.2 GET /auth/brand/\<brand_id\>

**Purpose:** Get detailed connection status for one brand.

**Auth:** Required

**Response `200`:**
```json
{
  "id": "govee",
  "is_connected": true,
  "auth_type": "api_key",
  "status": "connected",
  "connected_at": "2026-05-20T10:30:00Z",
  "last_tested_at": "2026-06-24T14:15:00Z",
  "error_message": null
}
```

**Implementation notes:**
- Query one row from `user_brand_credentials`
- Return `404` if brand doesn't exist in catalog
- Return `null` status if not connected

---

#### 2.3 POST /auth/brand/\<brand_id\>/connect

**Purpose:** Save or update credentials for a brand.

**Auth:** Required

**Request body (format varies by brand):**

**For API-key brands (Govee, Lifx, Wyze):**
```json
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "12345-67890-abcde",
    "device_id": "MAC:aabbccddeeff"  // optional, brand-dependent
  }
}
```

**For local IP brands (Hue, Nanoleaf, Yeelight, Kasa, WLED):**
```json
{
  "auth_type": "local",
  "credentials": {
    "device_ip": "192.168.1.50",
    "api_key": "token123",           // optional, if device requires auth
    "light_id": "1"                  // optional, brand-dependent
  }
}
```

**For OAuth brands (Tuya):**
```json
{
  "auth_type": "oauth",
  "oauth_code": "authorization_code_from_tuya",
  "oauth_state": "state_token_for_csrf"
}
```

**Response `200` / `201`:**
```json
{
  "id": "ubcred_1748500000000",
  "brand_id": "govee",
  "status": "connected",
  "connected_at": "2026-06-24T23:27:37Z",
  "error_message": null
}
```

**Error responses:**

`400` — Bad request:
```json
{ "error": "Missing required field: credentials.api_key" }
```

`422` — Validation failed (credentials don't work):
```json
{ "error": "Invalid API key. Check your Govee settings." }
```

`401` — Not authenticated

**Implementation notes:**
- If `(user_id, brand_id)` exists, UPDATE. Otherwise INSERT.
- Validate credentials format (non-empty strings, IP format if IP field, etc.)
- Try to verify credentials work (see Credential Validation section below)
- Store in `user_brand_credentials` table
- For OAuth: Exchange code for token, store token in `oauth_access_token`
- Set `status = 'connected'` on success
- Set `status = 'invalid'` + `error_message` on failure
- Set `connected_at` to NOW()

---

#### 2.4 POST /auth/brand/\<brand_id\>/test

**Purpose:** Validate credentials without saving.

**Auth:** Required

**Request body:** Same as `/connect` endpoint.

**Response `200` (credentials valid):**
```json
{
  "is_valid": true,
  "message": "✅ Credentials verified. Found 3 devices.",
  "device_count": 3
}
```

**Response `422` (credentials invalid):**
```json
{
  "is_valid": false,
  "error": "Invalid API key for Govee. Check your app settings."
}
```

**Implementation notes:**
- Validate credentials format (same as `/connect`)
- Try to connect to brand API and verify credentials work
- Return `{ is_valid: true/false }` + error message
- Do NOT save anything
- Used by frontend before user clicks "Save"

---

#### 2.5 POST /auth/brand/\<brand_id\>/disconnect

**Purpose:** Revoke/delete brand credentials.

**Auth:** Required

**Response `200`:**
```json
{ "status": "disconnected" }
```

**Implementation notes:**
- Delete row from `user_brand_credentials`
- Do NOT delete devices that use these credentials
- Devices remain in DB with invalid credentials (will show error in devices page)

---

#### 2.6 PATCH /auth/brand/\<brand_id\>/update

**Purpose:** Partially update credentials.

**Auth:** Required

**Request body (example):**
```json
{
  "credentials": {
    "device_ip": "192.168.1.51"  // Update only this field
  }
}
```

**Response `200`:**
```json
{
  "id": "ubcred_...",
  "status": "connected",
  "updated_at": "2026-06-24T23:27:37Z"
}
```

**Implementation notes:**
- Merge new credentials with existing (do not overwrite entire object)
- Re-validate if credentials changed
- Update `updated_at` timestamp

---

### 3. Credential Validation Logic

For each brand, implement validation:

#### Govee (auth_type: api_key)
- **Fields:** `api_key`, `device_id`
- **Validation:** Call Govee API endpoint with API key
  - Endpoint: `GET https://openapi.govee.com/v1/devices`
  - Header: `Authorization: Bearer {api_key}`
  - If `200` → valid
  - If `401` → invalid key
  - If `device_id` provided, verify device exists in list

#### Philips Hue (auth_type: local)
- **Fields:** `bridge_ip`, `api_key`, `light_id` (optional)
- **Validation:** Call local Hue Bridge API
  - Endpoint: `GET http://{bridge_ip}/api/{api_key}/lights`
  - If `200` → valid
  - If `401` → invalid key
  - If `light_id` provided, verify in response
  - If bridge unreachable → `503` error (device offline)

#### LIFX (auth_type: api_key)
- **Fields:** `api_key`, `selector` (optional)
- **Validation:** Call LIFX API
  - Endpoint: `GET https://api.lifx.com/v1/lights/{selector}`
  - Header: `Authorization: Bearer {api_key}`
  - If `200` → valid
  - If `401` → invalid key
  - If `selector` not provided, use `"all"`

#### Tuya (auth_type: oauth)
- **OAuth:** Implement standard OAuth 2.0 flow
- **Validation:** Request `/auth/brands/tuya/oauth-start` returns `auth_url`
- **Token exchange:** POST to Tuya token endpoint with `code` and `state`
- **Store:** Save `access_token` + `refresh_token` + `expires_at`
- **Refresh:** Before expiry, refresh token

#### Nanoleaf (auth_type: local)
- **Fields:** `device_ip`, `api_key`
- **Validation:** Call local Nanoleaf API
  - Endpoint: `GET http://{device_ip}:16021/api/v1/{api_key}/`
  - If `200` → valid
  - If `401` → invalid key

#### TP-Link Kasa (auth_type: local)
- **Fields:** `device_ip`
- **Validation:** Connect to device on port 9999
  - Send Kasa discovery command
  - If response → valid
  - Otherwise → invalid

#### Yeelight (auth_type: local)
- **Fields:** `device_ip`
- **Validation:** Connect via TCP port 55443
  - Send discovery request
  - If response → valid

#### WLED (auth_type: local)
- **Fields:** `device_ip`
- **Validation:** Call local WLED API
  - Endpoint: `GET http://{device_ip}/api/info`
  - If `200` → valid

#### Wyze (auth_type: unsupported)
- Currently not supported → return `422` with message

#### Amazon Alexa (auth_type: external)
- Currently not supported → return message directing to external app

---

### 4. OAuth Flow (for Tuya)

**Step 1: Frontend requests OAuth start**
```
GET /auth/brand/tuya/oauth-start
```

**Step 2: Backend returns auth URL**
```json
{
  "auth_url": "https://iot-cn.tuya.com/...?client_id=...&redirect_uri=...&state=...",
  "state": "..."
}
```

**Step 3: Frontend redirects user to auth_url**

**Step 4: Tuya redirects to callback**
```
GET /callback?code=...&state=...
```

**Step 5: Frontend sends code to backend**
```
POST /auth/brand/tuya/connect
{
  "auth_type": "oauth",
  "oauth_code": "...",
  "oauth_state": "..."
}
```

**Step 6: Backend exchanges code for token**
- POST to Tuya token endpoint
- Store `access_token`, `refresh_token`, `expires_at`
- Return success

---

### 5. Error Handling

**Invalid credentials:**
```
Status: 422
{
  "error": "Invalid API key for Govee",
  "details": "Check your Govee app settings"
}
```

**Brand not found:**
```
Status: 404
{ "error": "Brand 'unknown-brand' not found" }
```

**Not authenticated:**
```
Status: 401
{ "error": "Authentication required" }
```

**Device offline:**
```
Status: 503
{ "error": "Hue Bridge is offline or unreachable" }
```

---

## Implementation Plan

### Phase 1: Core (Days 1-2)
- [ ] Create `user_brand_credentials` table
- [ ] Implement `GET /auth/brands`
- [ ] Implement `GET /auth/brand/<brand_id>`
- [ ] Implement `POST /auth/brand/<brand_id>/connect` (basic save, no validation)
- [ ] Implement `POST /auth/brand/<brand_id>/disconnect`

### Phase 2: Validation (Days 3-4)
- [ ] Implement credential validation for Govee
- [ ] Implement credential validation for Hue
- [ ] Implement credential validation for Lifx
- [ ] Add validation to `/connect` endpoint

### Phase 3: OAuth & Polish (Days 5+)
- [ ] Implement `POST /auth/brand/<brand_id>/test`
- [ ] Implement OAuth flow for Tuya
- [ ] Implement remaining brand validations
- [ ] Add error handling + logging

---

## Testing Checklist

### Manual Testing

- [ ] Frontend can fetch `/auth/brands` (returns empty list for new user)
- [ ] Frontend can POST `/auth/brand/govee/connect` with dummy credentials
- [ ] Credentials are saved in DB
- [ ] Frontend can GET `/auth/brands` and see Govee as connected
- [ ] Frontend can test credentials with actual Govee account
- [ ] Frontend can POST `/auth/brand/govee/disconnect`
- [ ] Credentials are deleted from DB
- [ ] Frontend can see brand as disconnected

### API Response Testing

- [ ] `GET /auth/brands` returns correct schema
- [ ] `POST /auth/brand/unknown/connect` returns `404`
- [ ] `POST /auth/brand/govee/connect` with missing fields returns `400`
- [ ] `POST /auth/brand/govee/connect` with invalid API key returns `422`
- [ ] `POST /auth/brand/govee/test` returns validation result without saving

---

## Security Considerations

1. **Secrets in logs:** Do NOT log `api_key`, `oauth_access_token`, or `oauth_refresh_token`
2. **Credentials masking:** Never return credential values to frontend (only in `/get` if explicitly requested with permission)
3. **HTTPS only:** All credential endpoints must require HTTPS
4. **Rate limiting:** Add rate limiting to `/test` and `/connect` (prevent brute force)
5. **CSRF:** Use `state` token for OAuth flows
6. **Token refresh:** Automatically refresh expired OAuth tokens before use
7. **Encryption at rest:** Consider encrypting `credentials` JSONB column with `pgcrypto`
8. **Audit logging:** Log all credential operations (connect, disconnect, test, update)

---

## Frontend Integration

The frontend (`/brand-settings` page) expects these endpoints to exist. Current implementation:

- ✅ Phase 1 wizard UI added
- ❌ Calls `/auth/brands` to load connection status (missing endpoint)
- ❌ Calls `POST /auth/brand/{brand}/connect` to save credentials (missing endpoint)
- ❌ Calls `POST /auth/brand/{brand}/disconnect` to disconnect (missing endpoint)

Once these endpoints are ready, frontend will:
1. Load user's brand connections on page load
2. Show setup wizard when user clicks "Connect [Brand]"
3. Submit credentials to backend
4. Show success/error based on response
5. Refresh status after save

---

## Questions for Backend Team

1. **Credential encryption:** Should credentials be encrypted at rest? (Recommended: yes, use pgcrypto)
2. **Token refresh:** Should Tuya tokens be auto-refreshed on schedule, or on-demand when used?
3. **Device linking:** When brand credentials are deleted, should associated devices be marked invalid or deleted?
4. **Multi-account:** Should users be able to save multiple Govee accounts (e.g., one for bedroom, one for living room)? Currently schema supports this via `is_primary` flag but endpoint doesn't expose it.
5. **Rate limiting:** Any rate limit policy for `/test` endpoint (prevent credential brute-force)?

---

## Appendix: Brand Credential Field Reference

| Brand | Auth Type | Required Fields | Optional Fields | Example |
|-------|-----------|-----------------|-----------------|---------|
| **Govee** | api_key | `api_key`, `device_id` | — | `api_key: "abc123def456..."`, `device_id: "AA:BB:CC:DD:EE:FF"` |
| **Hue** | local | `bridge_ip`, `api_key` | `light_id` | `bridge_ip: "192.168.1.50"`, `api_key: "token123"` |
| **Lifx** | api_key | `api_key` | `selector` | `api_key: "abc123..."`, `selector: "Living Room Light"` |
| **Tuya** | oauth | (OAuth handles) | `device_id` | OAuth token automatically stored |
| **Nanoleaf** | local | `device_ip`, `api_key` | — | `device_ip: "192.168.1.100"`, `api_key: "token123"` |
| **Kasa** | local | `device_ip` | — | `device_ip: "192.168.1.100"` |
| **Yeelight** | local | `device_ip` | — | `device_ip: "192.168.1.100"` |
| **WLED** | local | `device_ip` | — | `device_ip: "192.168.1.100"` |
| **Wyze** | unsupported | — | — | Not supported |
| **Amazon Alexa** | external | — | — | External flow |

---

**Status:** Ready for backend implementation  
**Estimated effort:** 3-5 days for full implementation  
**Priority:** HIGH — Blocks `/brand-settings` page functionality
