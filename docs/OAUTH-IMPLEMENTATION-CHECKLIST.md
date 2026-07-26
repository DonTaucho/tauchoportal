# OAuth Implementation Checklist for TauchoPortal

Based on research + brand vs device clarification, here's what needs to be implemented.

## 📋 Phase 1: Database & Backend Structure

### 1.1 Create `brand_credentials` Table
```sql
CREATE TABLE brand_credentials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  brand_id VARCHAR(50) NOT NULL,
  auth_type ENUM('api_key', 'local', 'oauth', 'none') NOT NULL,
  
  -- Credentials (store encrypted)
  api_key VARCHAR(512),                  -- For api_key auth
  bridge_ip VARCHAR(50),                 -- For local bridge auth
  oauth_token VARCHAR(2048),             -- For OAuth
  oauth_refresh_token VARCHAR(2048),     -- For OAuth refresh
  oauth_scope VARCHAR(256),              -- Permissions granted
  
  -- Status & Metadata
  status ENUM('connected', 'error', 'expired', 'pending_auth') NOT NULL,
  connected_at TIMESTAMP,
  last_tested_at TIMESTAMP,
  last_tested_result ENUM('success', 'failure'),
  last_error VARCHAR(512),
  error_message TEXT,
  
  -- OAuth Session Management
  oauth_state_token VARCHAR(100),        -- Current authorization state
  oauth_state_expires_at TIMESTAMP,      -- When state expires
  
  -- Metadata
  metadata JSON,                         -- Brand-specific config
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_brand (user_id, brand_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 1.2 Create `oauth_sessions` Table (for PKCE + state)
```sql
CREATE TABLE oauth_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  brand_id VARCHAR(50) NOT NULL,
  state_token VARCHAR(100) UNIQUE NOT NULL,
  code_verifier VARCHAR(128) NOT NULL,     -- For PKCE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_state (state_token)
);
```

### 1.3 Update `devices` Table (if not already correct)
```sql
ALTER TABLE devices ADD COLUMN thumbnail_url VARCHAR(2048);
-- Already has: device_id, brand_id, device_name, device_ip, etc.
```

---

## 🔌 Phase 2: Backend API Endpoints

### 2.1 POST `/auth/brand/{brand_id}/connect`

**Purpose:** Initiate brand authentication

**For API Key Brand (Govee):**
```
POST /auth/brand/govee/connect
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "a1b2c3d4-..."
  }
}

Response 200:
{
  "status": "testing",
  "message": "Testing credentials..."
}
```

**For Local Bridge Brand (Philips Hue):**
```
POST /auth/brand/philips-hue/connect
{
  "auth_type": "local",
  "credentials": {
    "bridge_ip": "192.168.1.50",
    "api_key": "bridge-token"
  }
}

Response 200:
{
  "status": "testing",
  "message": "Testing credentials..."
}
```

**For OAuth Brand (Tuya):**
```
POST /auth/brand/tuya/connect
{
  "auth_type": "oauth"
}

Response 200:
{
  "status": "awaiting_authorization",
  "auth_url": "https://openapi.tuyaeu.com/oauth/authorize?client_id=...",
  "state": "random-state-abc123",
  "expires_in": 300
}
```

**Implementation Steps:**
1. Validate auth_type matches brand's expected type
2. For OAuth: Generate random `state`, store in `oauth_sessions` table
3. For OAuth: Generate `code_verifier` for PKCE, store with `state`
4. For API key/local: Validate credentials work (call test endpoint)
5. If valid: Insert/update `brand_credentials` table
6. Return appropriate response

### 2.2 POST `/auth/brand/{brand_id}/oauth-callback`

**Purpose:** Handle OAuth authorization code, exchange for token

```
POST /auth/brand/tuya/oauth-callback
{
  "code": "authorization-code-from-tuya",
  "state": "random-state-abc123"
}

Response 200:
{
  "status": "connected",
  "connected_at": "2026-07-25T20:04:17Z",
  "device_count": 5,
  "message": "Successfully authenticated with Tuya"
}

Response 400:
{
  "error": "invalid_state",
  "message": "State token not found or expired"
}
```

**Implementation Steps:**
1. Verify `state` exists in `oauth_sessions` table
2. Verify `state` hasn't expired
3. Retrieve stored `code_verifier`
4. Call brand's token endpoint with:
   - `code`
   - `client_id` (from config)
   - `client_secret` (from config)
   - `code_verifier` (PKCE)
   - `redirect_uri`
5. Store received `access_token` and `refresh_token` (encrypted) in `brand_credentials`
6. Delete entry from `oauth_sessions`
7. Return success response

### 2.3 POST `/auth/brand/{brand_id}/test`

**Purpose:** Test credentials without saving (or re-test saved credentials)

```
POST /auth/brand/govee/test
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "a1b2c3d4-..."
  }
}

Response 200:
{
  "valid": true,
  "device_count": 12,
  "devices": [
    { "device_id": "AA:BB:CC:DD:EE:FF", "device_name": "Bedroom Light", "product_name": "Govee RGBIC" },
    { "device_id": "11:22:33:44:55:66", "device_name": "Living Room", "product_name": "Govee Smart Bulb" }
  ],
  "message": "✅ Verified! Found 12 device(s)"
}

Response 400:
{
  "valid": false,
  "message": "❌ Invalid API key",
  "device_count": 0
}
```

**Implementation:**
1. Use provided credentials (or fetch from DB if not provided)
2. Make actual API call to brand's service
3. If successful: List devices found
4. Update `last_tested_at` and `last_tested_result` in DB
5. Return device count and sample list

### 2.4 POST `/auth/brand/{brand_id}/disconnect`

**Purpose:** Remove brand authentication

```
POST /auth/brand/govee/disconnect

Response 200:
{
  "status": "disconnected",
  "message": "Brand authentication removed"
}
```

**Implementation:**
1. Delete row from `brand_credentials` table
2. Delete associated devices (or cascade delete)
3. Return success

### 2.5 GET `/auth/brands`

**Purpose:** Get connection status of all brands

```
Response 200:
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
      "connected_at": "2026-06-10T09:00:00Z",
      "last_tested_at": "2026-06-24T18:00:00Z",
      "device_count": 8
    },
    {
      "id": "philips-hue",
      "is_connected": false
    }
  ]
}
```

**Implementation:**
1. Query `brand_credentials` table for user
2. For each brand, include status and metadata
3. Count devices in `devices` table for each brand

### 2.6 GET `/auth/brands/{brand_id}`

**Purpose:** Get detailed info for one brand

```
Response 200:
{
  "id": "govee",
  "name": "Govee",
  "is_connected": true,
  "auth_type": "api_key",
  "status": "connected",
  "connected_at": "2026-05-20T10:30:00Z",
  "last_tested_at": "2026-06-24T14:15:00Z",
  "last_error": null,
  "devices": [
    { "id": 1, "device_id": "AA:BB:CC:...", "device_name": "Bedroom Light" }
  ]
}
```

---

## 🎨 Phase 3: Frontend Updates

### 3.1 Update `/templates/pages/brand-settings.html`

**Remove device fields from setup guides:**

```javascript
// OLD - WRONG:
'govee': {
  helpFields: {
    'api_key': 'Your Govee API key',
    'device_id': 'Device MAC address'  ← DELETE THIS
  }
}

// NEW - CORRECT:
'govee': {
  helpFields: {
    'api_key': 'Your Govee API key'
  }
}
```

**Update all brands:**
- Govee: Remove `device_id` field
- Philips Hue: Remove `light_id` field
- Tuya: Remove `device_id` field
- All: Only ask for brand-level auth, not device identifiers

### 3.2 Update `/public/js/brand-settings.js`

**Remove device ID fields from setup guides** (lines 27-140):

```javascript
// Find each brand guide
// Remove any field that is device-specific:
// - device_id, device_mac, device_ip, light_id, etc.

// Keep only brand-level fields:
// - api_key (for api_key auth)
// - bridge_ip, api_key (for local bridge auth)
// - (nothing for OAuth — handled via redirect)
```

**Update credential field mapping:**

```javascript
// In buildCredentialsPayload():
// Use correct field names from spec:
// - api_key (not apikey, api-key, key)
// - bridge_ip (not device_ip, ip, bridge_address)
// - port (optional)

const fieldMapping = {
  'device_ip': 'bridge_ip',  // Handle legacy field name
  'token': 'api_key',        // Handle legacy field name
  // ... etc
};
```

### 3.3 Update Modal Structure

**Modal should have two sections:**

1. **Brand Credentials Section** (always shown)
   - Fields: api_key, bridge_ip, etc.
   - Test button: Test brand auth
   - Save button: Save brand credentials
   
2. **Devices Section** (separate, shown after brand connected)
   - List of available devices
   - Add/edit device configuration
   - "Next" to create conditions

**Separate concerns in HTML:**
```html
<!-- Brand Auth Modal -->
<div id="brandAuthModal">
  <!-- Step 1: Brand Credentials -->
  <div class="brand-credentials-section">
    <!-- Brand-specific fields -->
  </div>
  
  <!-- (NO device fields here) -->
</div>

<!-- Device Selection Modal (different modal or page) -->
<div id="deviceSelectionModal">
  <!-- Device identifier fields -->
</div>
```

---

## 📝 Field Name Summary

**For POST requests to `/auth/brand/{brand}/connect`:**

```
API Key Brands:
  credentials: {
    api_key: "the-key"
  }

Local Bridge Brands:
  credentials: {
    bridge_ip: "192.168.1.50",
    api_key: "bridge-token",
    port: 80  # optional
  }

Local Direct Device Brands:
  (No brand credentials — handled per-device)

OAuth Brands:
  (No credentials in request — uses OAuth flow)
```

**DO NOT include:**
- Device IP addresses
- Device IDs
- Light IDs
- Device MAC addresses
- Any per-device information

---

## 🔒 Security Considerations

1. **Encrypt sensitive data in database:**
   - api_key
   - oauth_token
   - oauth_refresh_token
   - Use database encryption or application-level encryption

2. **CSRF Protection:**
   - State token must be random (cryptographically secure)
   - Verify state on callback
   - Expire state after 5-10 minutes

3. **Session Management:**
   - Store PKCE `code_verifier` server-side only
   - Never return `code_verifier` to frontend
   - Delete `oauth_sessions` entries after use or expiry

4. **API Rate Limiting:**
   - Limit test credential calls (e.g., 5 per minute)
   - Prevent brute force on credentials

5. **Error Messages:**
   - Log full errors server-side
   - Return generic messages to client (security through obscurity)

---

## 🧪 Testing Checklist

- [ ] Test API key brand (Govee): save, test, disconnect
- [ ] Test local bridge brand (Philips Hue): save IP + token, test
- [ ] Test OAuth brand (Tuya): initiate, verify state, callback, token storage
- [ ] Test invalid credentials: error handling
- [ ] Test expired tokens: refresh or disconnect gracefully
- [ ] Test device list retrieval: after successful brand auth
- [ ] Test device setup: create device after brand auth
- [ ] Test conditions: can create condition using brand + device

---

## Implementation Order

1. **Database schema** (brand_credentials, oauth_sessions tables)
2. **Core endpoints** (connect, disconnect, test, oauth-callback)
3. **GET endpoints** (list brands, get brand details)
4. **Frontend updates** (remove device fields from brand setup)
5. **Integration** (frontend calls updated endpoints)
6. **Testing** (manual + automated)

Estimated effort: 2-3 days for complete implementation
