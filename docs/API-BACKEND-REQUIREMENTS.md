# API Backend Requirements - Brand Settings Implementation

**Prepared for:** API Team  
**From:** Frontend/Product Team  
**Date:** 2026-07-25  
**Status:** Ready for implementation

---

## 📌 Executive Summary

The brand settings page needs a complete backend implementation to handle user authentication with external smart home services (Govee, Tuya, Philips Hue, etc.).

**Key insight:** We must separate **brand-level authentication** (user's account with the service) from **device-level configuration** (which specific device to control).

---

## 🎯 What Needs Implementation

### Critical: Clarify Current Implementation Status

Before we build frontend, we need to know:

1. **Do the following endpoints exist and work?**
   - `POST /auth/brand/{brand_id}/connect`
   - `POST /auth/brand/{brand_id}/disconnect`
   - `POST /auth/brand/{brand_id}/test`
   - `GET /auth/brands`

2. **If NOT:** Can you implement them according to the spec below?

3. **OAuth specifically:**
   - Do we have Tuya OAuth `client_id` and `client_secret` already?
   - What's the redirect URI we'll use? (e.g., `https://domain.com/oauth/callback`)
   - Does Tuya support standard OAuth 2.0 code flow, or do we need QR login?

---

## 💾 Database Requirements

### New Tables Needed

#### `brand_credentials`
Stores user's authentication with each brand (one row per user/brand combo)

```
Columns:
  - id (int, PK)
  - user_id (int, FK)
  - brand_id (varchar) — "govee", "tuya", "philips-hue", etc.
  - auth_type (enum) — "api_key", "local", "oauth"
  - api_key (varchar, encrypted) — for API key brands
  - bridge_ip (varchar) — for local bridge (Hue)
  - oauth_token (varchar, encrypted) — for OAuth
  - oauth_refresh_token (varchar, encrypted) — for OAuth
  - oauth_scope (varchar) — permissions granted
  - status (enum) — "connected", "error", "expired"
  - connected_at (timestamp)
  - last_tested_at (timestamp)
  - last_error (text)
  - oauth_state_token (varchar) — current auth state
  - oauth_state_expires_at (timestamp)
  - created_at, updated_at (timestamps)
```

#### `oauth_sessions`
Temporary storage for OAuth PKCE flow (CSRF prevention)

```
Columns:
  - id (int, PK)
  - user_id (int, FK)
  - brand_id (varchar)
  - state_token (varchar, unique) — random CSRF token
  - code_verifier (varchar) — for PKCE
  - created_at, expires_at (timestamps)
```

---

## 🔌 API Endpoints Required

### 1. POST `/auth/brand/{brand_id}/connect`

**What it does:** Begin brand authentication (API key, local bridge, or OAuth)

#### Request: API Key Brand (Govee)
```json
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Backend should:**
1. Call Govee API to test the key
2. If valid: Save to `brand_credentials` table
3. Return device count

#### Request: Local Bridge Brand (Philips Hue)
```json
{
  "auth_type": "local",
  "credentials": {
    "bridge_ip": "192.168.1.50",
    "api_key": "bridge-generated-token"
  }
}
```

**Backend should:**
1. HTTP request to bridge at IP
2. If valid: Save to `brand_credentials`
3. Return success

#### Request: OAuth Brand (Tuya)
```json
{
  "auth_type": "oauth"
}
```

**Backend should:**
1. Generate random `state` token
2. Generate PKCE `code_verifier`
3. Store both in `oauth_sessions` table
4. Return `auth_url` to redirect user

#### Response: All Brands
```json
{
  "status": "connected|awaiting_authorization",
  "message": "Credentials saved|Redirect to authorize",
  "device_count": 12,
  "auth_url": "https://..."  // only for OAuth
}
```

---

### 2. POST `/auth/brand/{brand_id}/oauth-callback`

**What it does:** Handle OAuth redirect, exchange code for token

#### Request
```json
{
  "code": "auth-code-from-provider",
  "state": "state-token-from-earlier"
}
```

**Backend should:**
1. Look up `state_token` in `oauth_sessions`
2. Verify not expired, then delete
3. Retrieve stored `code_verifier`
4. Call OAuth provider's token endpoint:
   - POST to provider's `/token`
   - Include `code`, `code_verifier`, `client_id`, `client_secret`
5. Store returned `access_token` + `refresh_token` in `brand_credentials`
6. Return success

#### Response
```json
{
  "status": "connected",
  "message": "Successfully authenticated",
  "device_count": 5
}
```

---

### 3. POST `/auth/brand/{brand_id}/test`

**What it does:** Test credentials (can be used before save, or to re-test)

#### Request (unsaved credentials)
```json
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "test-key"
  }
}
```

#### Request (for already-saved credentials)
```json
{
  "auth_type": "api_key"
}
```

**Backend should:**
1. Use provided credentials OR fetch from `brand_credentials`
2. Make actual API call to brand
3. If success: Return device list
4. If failure: Return error message

#### Response: Success
```json
{
  "valid": true,
  "device_count": 12,
  "devices": [
    {
      "device_id": "AA:BB:CC:DD:EE:FF",
      "device_name": "Bedroom Light",
      "product_name": "Govee RGBIC LED Strip"
    },
    {
      "device_id": "11:22:33:44:55:66",
      "device_name": "Living Room",
      "product_name": "Govee Smart Bulb"
    }
  ],
  "message": "✅ Verified! Found 12 device(s)"
}
```

#### Response: Failure
```json
{
  "valid": false,
  "device_count": 0,
  "message": "❌ Invalid API key"
}
```

---

### 4. POST `/auth/brand/{brand_id}/disconnect`

**What it does:** Remove brand authentication

#### Request
(Empty body)

**Backend should:**
1. Delete from `brand_credentials`
2. Cascade delete devices (or soft-delete)
3. Return success

#### Response
```json
{
  "status": "disconnected",
  "message": "Brand authentication removed"
}
```

---

### 5. GET `/auth/brands`

**What it does:** List all brands and connection status for current user

#### Response
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
      "device_count": 12
    },
    {
      "id": "tuya",
      "name": "Tuya",
      "is_connected": true,
      "auth_type": "oauth",
      "status": "connected",
      "oauth_scope": "read write",
      "device_count": 5
    },
    {
      "id": "philips-hue",
      "name": "Philips Hue",
      "is_connected": false,
      "auth_type": "local"
    }
  ]
}
```

---

### 6. GET `/auth/brands/{brand_id}`

**What it does:** Detailed info for one brand

#### Response
```json
{
  "id": "govee",
  "name": "Govee",
  "is_connected": true,
  "auth_type": "api_key",
  "status": "connected",
  "connected_at": "2026-05-20T10:30:00Z",
  "last_tested_at": "2026-06-24T14:15:00Z",
  "device_count": 12,
  "devices": [
    { "id": 1, "device_id": "AA:BB:CC:...", "device_name": "Bedroom Light" }
  ]
}
```

---

## 🔐 Security Requirements

1. **Encrypt sensitive data:**
   - `api_key`, `oauth_token`, `oauth_refresh_token` must be encrypted at rest
   - Use database column encryption or application-level encryption

2. **CSRF Protection:**
   - `state_token` must be cryptographically random
   - Minimum 128 bits of entropy
   - Expire after 5-10 minutes

3. **Session Cleanup:**
   - Delete expired `oauth_sessions` entries periodically
   - Prevent state token reuse

4. **Error Handling:**
   - Log full error details server-side
   - Return generic error messages to client
   - Never expose API keys or tokens in error messages

---

## 📋 Brand-Specific Requirements

### Govee
- **Auth Type:** API Key only (no OAuth)
- **Getting key:** User profile in Govee app → Settings → API Key
- **API Key:** Request emailed to user
- **Test:** Call `GET https://api.govee.com/v1/devices`
- **Header:** `Govee-Token: {api_key}`

### Tuya
- **Auth Type:** OAuth 2.0
- **Client Credentials:** Need `client_id` and `client_secret`
- **OAuth URL:** `https://openapi.tuyaeu.com/oauth/authorize` (EU) or US variant
- **Token URL:** `https://openapi.tuyaeu.com/v1.0/token`
- **Scope:** `read write` (or as configured)

### Philips Hue
- **Auth Type:** Local Bridge (no OAuth needed for bridge auth)
- **Bridge IP:** User finds on local network
- **Token:** Generated by pressing bridge button + creating user
- **API:** Bridge at `http://{bridge_ip}/api/{token}/`

### Others (LIFX, Nanoleaf, Kasa, Yeelight, WLED)
- See existing `/docs/api-spec.md` for current implementation status

---

## ❓ Questions for API Team

Before implementation, please clarify:

1. **Existing endpoints?** Do POST `/auth/brand/{brand}/connect`, etc. already exist?
   - If yes: What's the current implementation?
   - If no: Can you build them?

2. **OAuth credentials?** Do we have Tuya OAuth `client_id` and `client_secret`?
   - Where are they stored?
   - What redirect URI should we register?

3. **Device list response?** When testing credentials, what format do brand APIs use for listing devices?
   - Field names: `device_id`, `device_name`, `model`, etc.?
   - We need to standardize this

4. **Encryption?** How are sensitive credentials encrypted?
   - Database encryption? Application layer? HSM?
   - What's the key management strategy?

5. **Refresh tokens?** Should we implement OAuth token refresh?
   - When token expires, refresh automatically?
   - Or require user to re-authenticate?

---

## 📊 Implementation Phases

### Phase 1: Database + Core Endpoints (1-2 days)
- Create `brand_credentials` table
- Create `oauth_sessions` table
- Implement POST `/auth/brand/{brand}/connect` for API key brands
- Implement POST `/auth/brand/{brand}/test`
- Implement POST `/auth/brand/{brand}/disconnect`

### Phase 2: OAuth Support (1-2 days)
- Implement OAuth initiation (POST `/auth/brand/{brand}/connect`)
- Implement oauth-callback endpoint
- Test with Tuya

### Phase 3: GET Endpoints (0.5 days)
- GET `/auth/brands`
- GET `/auth/brands/{brand_id}`

### Phase 4: Testing & Integration (1 day)
- Test with real credentials
- Verify device list retrieval
- Frontend integration testing

**Total estimate:** 3-5 days

---

## 📞 Next Steps

1. Confirm what's already implemented vs. what needs to be built
2. Clarify OAuth credentials (Tuya client_id, etc.)
3. Confirm database schema requirements
4. Assign dev resources and timeline
5. Schedule sync on OAuth flow details if unclear

---

## Appendix: Field Name Standards

**Use these exact field names in API responses and requests:**

```
Brand Credentials Fields:
  api_key          (not: apikey, api-key, token, key)
  bridge_ip        (not: device_ip, ip, bridge_address)
  port             (optional, for local APIs)
  
Device Identifiers:
  device_id        (not: deviceid, device-id)
  device_name
  device_model

Timestamps:
  connected_at
  last_tested_at
  created_at
  updated_at

OAuth:
  oauth_token      (access token)
  oauth_refresh_token
  oauth_scope
  state_token      (for CSRF)

Status Fields:
  status           (connected | error | expired | pending_auth)
  is_connected     (boolean)
  valid            (boolean, for test responses)
```

---

**Document created:** 2026-07-25  
**Version:** 1.0  
**Status:** Ready for API team implementation
