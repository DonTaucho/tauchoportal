# Brand vs Device Authentication - Specification & Clarification

## 🎯 Executive Summary

**Critical Issue:** Current code conflates two separate concepts:
- **Brand-Level Authentication** (user's account with the service)
- **Device-Level Authentication** (individual device credentials or identifiers)

This document clarifies the distinction and proposes correct backend implementation.

---

## 📋 The Confusion - Current State

### Current Code Problems

**File:** `/public/js/brand-settings.js` Lines 27-140 (SETUP_GUIDES)

The setup guides mix brand and device authentication. Examples:

#### Govee (API Key Brand)
```
Setup Guide says: 
  - "Get API Key" (Brand level ✅)
  - "Add Device" (Device level instruction ⚠️)
  - "Enter device MAC address" (Device level ❌)

Current helpFields:
  - 'api_key': "Your Govee API key"
  - 'device_id': "The MAC address of your Govee device"
```

**Problem:** 
- Brand connection only needs `api_key`
- Device MAC address is a device identifier, not brand credential
- Storing device MAC in brand credentials is wrong

#### Philips Hue (Local Bridge)
```
Setup Guide says:
  - "Generate Token" for the bridge (Brand-equivalent ✓)
  - "Light Identifier" (Device level ❌)

Current helpFields:
  - 'bridge_ip': Bridge IP
  - 'api_key': Bridge token
  - 'light_id': Light identifier ← WRONG LEVEL
```

**Problem:**
- Bridge IP + API key = brand credentials (you own a bridge)
- Light ID changes depending which light you're controlling
- Light ID belongs in device/condition setup, not brand setup

#### WiZ (Local Device Brand)
```
WiZ devices are local-only smart home lights.
Unlike cloud APIs, WiZ doesn't have account-level auth.
Each device connects individually via IP + token.

So there's NO brand-level authentication for WiZ.
Only device-level configuration:
  - Device IP address
  - Device auth token
```

**Note:** WiZ replaced Tuya in this system. Tuya required OAuth and device-level setup mixed together, which was the main source of confusion in the old code.

#### Local Device Brands (Nanoleaf, Kasa, Yeelight, WLED)
```
Current helpFields show:
  - 'device_ip': Device IP address ← This is DEVICE not BRAND

These are actually device-level credentials!
```

**Problem:**
- For local devices, each individual device has different IP
- Brand settings should only store account-level auth (if any)
- Device IP should be provided when adding a specific device

---

## ✅ The Solution - Correct Structure

### 1. BRAND-LEVEL Authentication

Brand credentials authenticate the **user's account** with the external service.

```
Brand Authentication Examples:
┌─────────────┬──────────────────────────┬────────────────────┐
│ Brand       │ Auth Type                │ Required Fields    │
├─────────────┼──────────────────────────┼────────────────────┤
│ Govee       │ API Key (cloud)          │ api_key            │
│ LIFX        │ API Key (cloud)          │ api_key            │
│ Philips Hue │ Local Bridge + API Key   │ bridge_ip, api_key │
│ WiZ         │ Local Device             │ device_ip, api_key │
│ Nanoleaf    │ NONE (per-device)        │ (none)             │
│ Kasa        │ NONE (per-device)        │ (none)             │
│ Yeelight    │ NONE (per-device)        │ (none)             │
│ WLED        │ NONE (per-device)        │ (none)             │
└─────────────┴──────────────────────────┴────────────────────┘
```

### 2. DEVICE-LEVEL Configuration

Device configuration specifies **which device** to control and how to reach it.

```
Device Configuration Examples:
┌─────────────┬──────────────────────────┬────────────────────┐
│ Brand       │ Configuration Type       │ Required Fields    │
├─────────────┼──────────────────────────┼────────────────────┤
│ Govee       │ Cloud API                │ device_id (MAC)    │
│ LIFX        │ Cloud API                │ selector (ID/name) │
│ Tuya        │ Cloud API                │ device_id          │
│ Philips Hue │ Local Bridge HTTP        │ light_id           │
│ Nanoleaf    │ Local HTTP               │ device_ip, port    │
│ Kasa        │ Local HTTP               │ device_ip, port    │
│ Yeelight    │ Local LAN                │ device_ip, port    │
│ WLED        │ Local HTTP               │ device_ip, port    │
└─────────────┴──────────────────────────┴────────────────────┘
```

---

## 🏗️ Correct Architecture

### Setup Flow - CORRECT

```
┌─────────────────────────────────────────────────────┐
│ User: "I want to control my Govee lights"           │
└────────────────┬──────────────────────────────────┬─┘
                 │                                  │
        ┌────────▼─────────┐          ┌──────────────▼──────┐
        │ Brand Settings   │          │ Device Setup        │
        │ (Once per user)  │          │ (Once per device)   │
        └────────┬─────────┘          └──────────┬──────────┘
                 │                               │
        ┌────────▼────────────────┐    ┌─────────▼────────────────┐
        │ Save Brand Credentials  │    │ Save Device Location     │
        │                         │    │                          │
        │ POST /auth/brand/       │    │ (Store in device config) │
        │   {brand}/connect       │    │                          │
        │                         │    │ Field: device_mac        │
        │ Payload:                │    │ Value: "AA:BB:CC:..."   │
        │ {                       │    │                          │
        │   auth_type: "api_key"  │    │ (This belongs in device, │
        │   credentials: {        │    │  not brand credentials)  │
        │     api_key: "uuid..."  │    │                          │
        │   }                     │    │                          │
        │ }                       │    │                          │
        └────────┬────────────────┘    └─────────┬────────────────┘
                 │                               │
        ┌────────▼──────────────────┐  ┌─────────▼──────────────┐
        │ ✅ Brand authenticated    │  │ ✅ Device discoverable │
        │ Can query device list     │  │ Can send commands      │
        └──────────────────────────┘  └────────────────────────┘
```

### Current (Wrong) Flow - What's Happening Now

```
┌─────────────────────────────────────────────────────┐
│ User: "I want to control my Govee lights"           │
└────────────────┬──────────────────────────────────┬─┘
                 │                                  │
        ┌────────▼─────────┐                       │
        │ Brand Settings   │◄──────────────────────┘
        │ (Asks for both!!)│
        └────────┬─────────┘
                 │
        ┌────────▼────────────────────────┐
        │ Collects:                       │
        │ - api_key (brand level ✓)       │
        │ - device_mac (device level ✗)   │
        │                                 │
        │ Tries to save to brand creds!   │
        └────────┬────────────────────────┘
                 │
        ✗ WRONG - Device ID shouldn't be stored at brand level
           Multiple devices share same brand auth!
```

---

## 📐 Data Model - Proposed Backend Structure

### Database Schema Concepts

#### BrandCredential (User → Brand auth)
```
Table: brand_credentials
Columns:
  - id                INT PRIMARY KEY
  - user_id           INT FOREIGN KEY
  - brand_id          VARCHAR (e.g., "govee", "philips-hue")
  - auth_type         VARCHAR ("api_key", "local", "oauth")
  - api_key           VARCHAR (encrypted if sensitive)
  - bridge_ip         VARCHAR (for local brands)
  - oauth_token       VARCHAR (encrypted)
  - oauth_refresh_token VARCHAR (encrypted, optional)
  - oauth_scope       VARCHAR (optional)
  - connected_at      TIMESTAMP
  - last_tested_at    TIMESTAMP
  - status            VARCHAR ("connected", "error", "expired")
  - error_message     TEXT
  - metadata          JSON (for brand-specific data)
  - created_at        TIMESTAMP
  - updated_at        TIMESTAMP
```

#### DeviceLocation/Configuration (Device → How to reach it)
```
Table: devices (already exists in your schema)
Columns:
  - id                INT PRIMARY KEY
  - user_id           INT FOREIGN KEY
  - brand_id          VARCHAR
  - device_name       VARCHAR
  - device_id         VARCHAR (brand's device identifier)
  - device_ip         VARCHAR (for local devices)
  - port              INT (for local devices)
  - region            VARCHAR (for some cloud APIs)
  - metadata          JSON (device-specific config)
  - created_at        TIMESTAMP
  - updated_at        TIMESTAMP
```

**Key Difference:**
- `brand_credentials` = how to authenticate with the brand
- `devices` = which device, and how to reach it using that auth

---

## 🔌 API Endpoints - Correct Implementation

### Brand-Level Endpoints

#### POST /auth/brand/{brand_id}/connect
**Purpose:** Authenticate user's account with a brand

**Request Examples:**

**API Key Brand (Govee):**
```json
POST /auth/brand/govee/connect
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Local Bridge Brand (Philips Hue):**
```json
POST /auth/brand/philips-hue/connect
{
  "auth_type": "local",
  "credentials": {
    "bridge_ip": "192.168.1.50",
    "api_key": "generated-bridge-token-here"
  }
}
```

**OAuth Brand (Tuya) - Initiation:**
```json
POST /auth/brand/tuya/connect
{
  "auth_type": "oauth"
}
```

**Response:**
```json
{
  "status": "awaiting_authorization",
  "auth_url": "https://iot.tuya.com/cloud/...",
  "state": "random-state-token-123",
  "qr_code_svg": "<svg>...</svg>",
  "expires_at": "2026-07-25T21:04:17Z"
}
```

**Frontend should:**
1. Display `auth_url` as clickable link OR
2. Display `qr_code_svg` as QR code for mobile scan
3. User completes OAuth on Tuya's site
4. Tuya redirects to our callback URL with `code` and `state`

#### POST /auth/brand/{brand_id}/oauth-callback
**Purpose:** Handle OAuth redirect from external service

**Request:**
```json
POST /auth/brand/tuya/oauth-callback
{
  "code": "oauth-auth-code-from-tuya",
  "state": "random-state-token-123"
}
```

**Response:**
```json
{
  "status": "connected",
  "connected_at": "2026-07-25T20:04:17Z",
  "device_count": 5,
  "message": "Successfully authenticated with Tuya"
}
```

#### GET /auth/brands
**Purpose:** Get connection status of all brands for user

**Response:**
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
      "last_tested_at": "2026-06-24T14:15:00Z"
    },
    {
      "id": "tuya",
      "name": "Tuya",
      "is_connected": true,
      "auth_type": "oauth",
      "status": "connected",
      "oauth_scope": "read write",
      "connected_at": "2026-06-10T09:00:00Z"
    },
    {
      "id": "kasa",
      "name": "TP-Link Kasa",
      "is_connected": false,
      "auth_type": "local",
      "status": null
    }
  ]
}
```

#### POST /auth/brand/{brand_id}/test
**Purpose:** Test brand credentials without saving

**Request:**
```json
POST /auth/brand/govee/test
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Response (Success):**
```json
{
  "valid": true,
  "device_count": 12,
  "devices": [
    { "device_id": "AA:BB:CC:DD:EE:FF", "device_name": "Bedroom Light", "product_name": "Govee RGBIC LED Strip" },
    { "device_id": "11:22:33:44:55:66", "device_name": "Living Room", "product_name": "Govee Smart Bulb" }
  ],
  "message": "✅ Verified! Found 12 device(s)"
}
```

**Response (Failure):**
```json
{
  "valid": false,
  "message": "❌ Invalid API key",
  "device_count": 0
}
```

#### POST /auth/brand/{brand_id}/disconnect
**Purpose:** Remove brand authentication, delete stored credentials

**Response:**
```json
{
  "status": "disconnected",
  "message": "Brand authentication removed"
}
```

---

### Device-Level Endpoints

#### POST /devices (or PATCH /devices/{id})
**Purpose:** Add or update device configuration

**Request:**
```json
POST /devices
{
  "brand_id": "govee",
  "device_name": "Bedroom Light",
  "device_id": "AA:BB:CC:DD:EE:FF",
  "device_model": "Govee RGBIC LED Strip",
  "thumbnail_url": "https://..."
}
```

**Key Point:**
- Only stores device identifier and metadata
- Uses brand_id to reference previously authenticated brand
- Does NOT duplicate brand credentials

#### Condition Setup
When user creates a condition/watch for a device:
- Select already-connected brand (brand_id from /auth/brands)
- Select device (device_id from /devices)
- Define action (property to set, value, parameters)

---

## 🔐 OAuth Flow Details

### Complete OAuth Flow for Tuya Example

```
Step 1: User clicks "Connect with Tuya"
┌──────────────────────────────────────────────────────────┐
│ Frontend: POST /auth/brand/tuya/connect                  │
│ Backend returns: { auth_url, state, qr_code_svg }        │
└──────────────────┬───────────────────────────────────────┘
                   │
Step 2: Display OAuth URL or QR code
┌──────────────────▼───────────────────────────────────────┐
│ Frontend displays link or QR code                         │
│ User scans QR or clicks link                              │
│ User logs in to Tuya's OAuth provider                     │
└──────────────────┬───────────────────────────────────────┘
                   │
Step 3: Tuya redirects to our callback
┌──────────────────▼───────────────────────────────────────┐
│ Browser: GET /oauth/callback?code=XXX&state=XXX          │
│ (This is our portal URL configured at Tuya)              │
└──────────────────┬───────────────────────────────────────┘
                   │
Step 4: Frontend handles callback
┌──────────────────▼───────────────────────────────────────┐
│ Frontend extracts code and state from URL                │
│ Frontend: POST /auth/brand/tuya/oauth-callback           │
│   { code, state }                                        │
│ Backend exchanges code for OAuth token                   │
└──────────────────┬───────────────────────────────────────┘
                   │
Step 5: Backend stores OAuth token
┌──────────────────▼───────────────────────────────────────┐
│ Backend stores in brand_credentials table:               │
│   - oauth_token (encrypted)                              │
│   - oauth_refresh_token (if provided)                    │
│   - connected_at, status = "connected"                   │
│ Returns: { status: "connected", device_count: N }        │
└──────────────────┬───────────────────────────────────────┘
                   │
Step 6: Frontend closes modal, brand appears connected ✅
```

### OAuth Callback URL Configuration
You need to register this URL with each OAuth provider:
```
https://yourdomain.com/oauth/callback

OR if using specific brand redirect:
https://yourdomain.com/oauth/callback/tuya
https://yourdomain.com/oauth/callback/govee
etc.
```

The backend should:
1. Receive callback with `code` and `state`
2. Verify `state` matches what was stored (prevents CSRF)
3. Exchange `code` for access token
4. Store tokens securely
5. Return success/error to frontend

---

## 📝 Field Name Standardization

### Brand Credentials Fields (in order of priority)

For `credentials` object sent in POST requests:

```
API Key Brands:
  api_key          (NOT: apikey, api-key, token, key)
  
Local Bridge/Device Brands:
  bridge_ip        (NOT: device_ip, ip, bridge_address)
  api_key          (NOT: token, auth_token, bridge_token)
  port             (OPTIONAL, default 80)
  
Local Direct Device Brands:
  device_ip        (NOT: bridge_ip, ip_address, address)
  port             (OPTIONAL, default varies)
  
Regional APIs:
  region           (NOT: area, zone, country)
  api_key
  
OAuth Brands:
  (none - OAuth token managed separately)
```

---

## 🎓 Examples by Brand

### Govee (API Key, Cloud)
```
BRAND SETUP:
POST /auth/brand/govee/connect
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "a1b2c3d4-..."
  }
}

DEVICE SETUP:
POST /devices
{
  "brand_id": "govee",
  "device_id": "AA:BB:CC:DD:EE:FF",
  "device_name": "Bedroom Light"
}
```

### Philips Hue (Local Bridge)
```
BRAND SETUP:
POST /auth/brand/philips-hue/connect
{
  "auth_type": "local",
  "credentials": {
    "bridge_ip": "192.168.1.50",
    "api_key": "bridge-generated-token"
  }
}

DEVICE SETUP:
POST /devices
{
  "brand_id": "philips-hue",
  "device_id": "1",  # Light ID in Bridge
  "device_name": "Living Room Lights"
}
```

### Nanoleaf (Local Direct Device)
```
BRAND SETUP:
(NONE - No brand-level auth)
POST /auth/brand/nanoleaf/connect
{
  "auth_type": "none"
}

DEVICE SETUP:
POST /devices
{
  "brand_id": "nanoleaf",
  "device_ip": "192.168.1.100",
  "device_name": "Wall Panels",
  "api_key": "device-auth-token"  # Device-specific token
}
```

### Tuya (OAuth)
```
BRAND SETUP:
Step 1: POST /auth/brand/tuya/connect { "auth_type": "oauth" }
        Returns: { auth_url, state, qr_code_svg }
Step 2: User authorizes
Step 3: POST /auth/brand/tuya/oauth-callback { code, state }
        Backend exchanges code for token

DEVICE SETUP:
POST /devices
{
  "brand_id": "tuya",
  "device_id": "bf3a0d117a29c8a13eae",  # From Tuya
  "device_name": "Smart Light"
}
```

---

## 🚀 Implementation Checklist

### Backend Implementation

- [ ] Create `brand_credentials` table
- [ ] Implement POST `/auth/brand/{brand}/connect`
  - [ ] API key validation
  - [ ] Local credentials validation
  - [ ] OAuth initiation
- [ ] Implement POST `/auth/brand/{brand}/oauth-callback`
  - [ ] State verification (CSRF protection)
  - [ ] Code-to-token exchange
  - [ ] Token storage
- [ ] Implement POST `/auth/brand/{brand}/test`
- [ ] Implement POST `/auth/brand/{brand}/disconnect`
- [ ] Implement GET `/auth/brands`
- [ ] Implement GET `/auth/brands/{brand_id}`

### Frontend Implementation

- [ ] Update setup guide to NOT ask for device-specific fields
- [ ] For API key brands: Only ask for credentials (Govee: just API key)
- [ ] For local brands: Only ask for brand connection info (Hue: bridge IP + token)
- [ ] For OAuth brands: Show authorization URL/QR code
- [ ] Update device setup flow to accept device IDs separately
- [ ] Remove device fields from SETUP_GUIDES

### Setup Guides - Correct Format

**Each guide should ONLY cover brand-level authentication:**

```javascript
'govee': {
  steps: [
    { title: 'Open Govee App', ... },
    { title: 'Get API Key', ... },
    { title: 'Enter Credentials', content: 'Paste your API key' },
    { title: 'Test Connection', ... }
  ],
  helpFields: {
    'api_key': 'Your Govee API key from app settings'
    // NO device_id here!
  }
}
```

---

## ⚠️ Migration Notes

If you have existing stored device data mixed with brand data:

1. Extract device_id fields from brand_credentials
2. Create corresponding device records
3. Update conditions to reference device.id instead of deriving from brand creds
4. Deprecate old device-storing endpoints

---

## Summary of Changes Needed

| Issue | Current | Correct |
|-------|---------|---------|
| Govee setup asks for | API key + MAC | API key only |
| Hue setup asks for | Bridge IP + token + light ID | Bridge IP + token only |
| Tuya setup asks for | OAuth + device ID | OAuth only |
| Device MAC storage | In brand credentials | In devices table |
| Device IP storage | In brand credentials | In devices table |
| Light/device ID storage | In brand credentials | In devices table |
| Brand endpoint | `/auth-credential` | `/auth/brand/{id}/connect` |
| Device storage | Mixed with brand | Separate devices table |

This clarification should align your architecture with industry standards and make the code more maintainable!
