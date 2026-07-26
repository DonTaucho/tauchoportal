# Brand Credentials - Frontend Implementation Guide

**Date:** 2026-07-25  
**Status:** Ready to implement (6/8 endpoints available)  
**Audience:** Frontend developers  
**Backend Status:** API delivered 75% - OAuth pending

---

## 📋 What's Ready to Build NOW

### Phase 1: Non-OAuth Brands (Start Today ✅)

**Available endpoints:**
1. `GET /auth/brands` - List all brands with connection status
2. `GET /auth/brand/{brand_id}` - Get brand details + credential fields
3. `POST /auth/brand/{brand_id}/connect` - Save credentials
4. `POST /auth/brand/{brand_id}/test` - Validate before saving
5. `POST /auth/brand/{brand_id}/disconnect` - Remove connection
6. `PATCH /auth/brand/{brand_id}/update` - Update credentials

**Brands to support NOW:**
- Govee (API key)
- LIFX (API key)
- Nanoleaf (API key)
- Philips Hue (local bridge)
- Any other API key / local bridge brand

### Phase 2: OAuth Brands (Wait ⏳)

**Pending endpoints:**
- `GET /auth/brand/{brand_id}/oauth-start` (returns 501)
- `POST /auth/brand/{brand_id}/oauth-callback` (doesn't exist)

**Brands to support LATER:**
- Tuya (OAuth)

---

## 🏗️ Frontend Architecture

### Current Page Structure
- **Header:** Navigation
- **Brand Settings:** Modal dialog (currently not great)
- **Devices:** Main page with device list

### Recommended Change
Refactor `/templates/pages/brand-settings.html` to be a proper page (not modal) that:
1. Lists all brands with connection status
2. Shows "Connect" button for each brand
3. Opens a connect form (modal or inline)
4. Tests credentials before saving
5. Shows connection status and last activity

---

## 📝 Implementation Steps

### Step 1: Load Brand List
```javascript
async function loadBrands() {
    const response = await fetch(`${API_BASE}/auth/brands`, {
        headers: { 'X-User-ID': userId }
    });
    const data = await response.json();
    return data.brands; // Array of brand objects
}
```

**Each brand object includes:**
```json
{
  "id": "govee",
  "name": "Govee",
  "is_connected": true,
  "auth_type": "api_key",
  "status": "connected",
  "connected_at": "2026-05-20T10:30:00Z",
  "last_tested_at": "2026-06-24T14:15:00Z",
  "error_message": null
}
```

### Step 2: Show Brand Details
```javascript
async function getBrandDetails(brandId) {
    const response = await fetch(
        `${API_BASE}/auth/brand/${brandId}`,
        { headers: { 'X-User-ID': userId } }
    );
    return await response.json();
}
```

**Response includes:**
```json
{
  "id": "govee",
  "name": "Govee",
  "is_connected": true,
  "credential_fields": [
    {
      "name": "api_key",
      "label": "API Key",
      "type": "password",
      "required": true,
      "help": "Get from Govee app Settings > API Key"
    }
  ]
}
```

### Step 3: Test Credentials
```javascript
async function testCredentials(brandId, authType, credentials) {
    const response = await fetch(
        `${API_BASE}/auth/brand/${brandId}/test`,
        {
            method: 'POST',
            headers: { 'X-User-ID': userId, 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_type: authType, credentials })
        }
    );
    return await response.json();
}
```

**Success response:**
```json
{
  "is_valid": true,
  "message": "✅ Verified! Found 12 device(s)",
  "device_count": 12,
  "devices": [
    { "id": "AA:BB:CC:DD:EE:FF", "name": "Bedroom Light", "status": "online" },
    { "id": "11:22:33:44:55:66", "name": "Living Room", "status": "offline" }
  ]
}
```

### Step 4: Save Credentials
```javascript
async function connectBrand(brandId, authType, credentials) {
    const response = await fetch(
        `${API_BASE}/auth/brand/${brandId}/connect`,
        {
            method: 'POST',
            headers: { 'X-User-ID': userId, 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_type: authType, credentials })
        }
    );
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}
```

### Step 5: Disconnect Brand
```javascript
async function disconnectBrand(brandId) {
    const response = await fetch(
        `${API_BASE}/auth/brand/${brandId}/disconnect`,
        {
            method: 'POST',
            headers: { 'X-User-ID': userId }
        }
    );
    return await response.json();
}
```

### Step 6: Update Credentials
```javascript
async function updateBrandCredentials(brandId, credentials) {
    const response = await fetch(
        `${API_BASE}/auth/brand/${brandId}/update`,
        {
            method: 'PATCH',
            headers: { 'X-User-ID': userId, 'Content-Type': 'application/json' },
            body: JSON.stringify({ credentials })
        }
    );
    return await response.json();
}
```

---

## 🎨 UI Components Needed

### 1. Brand List Card
Displays:
- Brand logo/icon
- Brand name
- Connection status (Connected ✓ / Not Connected)
- Last activity timestamp
- Action buttons (Connect / Manage / Disconnect)

### 2. Connect Modal/Form
Fields:
- Dynamic credential inputs (based on `credential_fields`)
- Help text for each field
- "Test Connection" button
- "Connect" button (only enabled after test passes)
- Error messages

### 3. Manage Modal/Form
Shows:
- Current credential status
- Last tested time
- Option to update specific fields
- "Test" button
- "Disconnect" button

---

## 📱 Page Flow

### Brand Settings Page (Recommended Refactor)

**Layout:**
```
Header: Brand Settings & Device Integrations

[Tabs or sections]
┌─────────────────────────────────────────┐
│ Connected Brands (3)                    │
├─────────────────────────────────────────┤
│ [Govee✓] [Hue✓] [LIFX✓]                 │
│ Last used: 2h ago                       │
│ [Manage]  [Disconnect]                  │
├─────────────────────────────────────────┤
│ Available Brands (6)                    │
├─────────────────────────────────────────┤
│ [Nanoleaf]  [Yeelight]  [Kasa]          │
│ [WiZ]       [Amazon]    [WLED]          │
│ [Connect]   [Connect]   [Connect]       │
└─────────────────────────────────────────┘

[Connect Modal appears when "Connect" clicked]
```

---

## 🔐 Security Notes

1. **X-User-ID header** required on all requests
2. **Credentials are encrypted** at rest in database
3. **Never log credentials** in console
4. **Test before save** to avoid invalid data
5. **Handle 401 errors** = missing/invalid X-User-ID

---

## ⚠️ Known Limitations

### OAuth Not Ready
- Can't connect Tuya yet
- `GET /auth/brand/{id}/oauth-start` returns 501
- `POST /auth/brand/{id}/oauth-callback` doesn't exist
- Wait for backend team to implement

### What to Do
1. Build UI for API key brands (Govee, LIFX, etc.)
2. Build UI for local bridge brands (Hue)
3. Hide Tuya from UI or show "Coming Soon"
4. Implement OAuth connect when backend is ready

---

## 🧪 Testing Endpoints

Use curl to test endpoints before implementing in frontend:

```bash
# List brands
curl -X GET http://localhost:8081/auth/brands \
  -H "X-User-ID: 1"

# Get brand details
curl -X GET http://localhost:8081/auth/brand/govee \
  -H "X-User-ID: 1"

# Test credentials
curl -X POST http://localhost:8081/auth/brand/govee/test \
  -H "X-User-ID: 1" \
  -H "Content-Type: application/json" \
  -d '{"auth_type":"api_key","credentials":{"api_key":"test-key"}}'

# Connect
curl -X POST http://localhost:8081/auth/brand/govee/connect \
  -H "X-User-ID: 1" \
  -H "Content-Type: application/json" \
  -d '{"auth_type":"api_key","credentials":{"api_key":"real-key"}}'
```

---

## 📋 Checklist

- [ ] Load brand list on page load
- [ ] Display brands with connection status
- [ ] Show "Connect" button for disconnected brands
- [ ] Open connect form when "Connect" clicked
- [ ] Dynamically render credential fields based on `credential_fields`
- [ ] Add "Test Connection" button to form
- [ ] Show device count after successful test
- [ ] Only enable "Save" after test passes
- [ ] Save credentials with `POST /connect`
- [ ] Show "Manage" button for connected brands
- [ ] Allow credential updates with `PATCH /update`
- [ ] Add "Disconnect" with confirmation
- [ ] Handle error messages gracefully
- [ ] Show last used timestamp
- [ ] Mobile responsive UI

---

## 🚀 When Backend Finishes OAuth

Once API team implements `/oauth-start` and `/oauth-callback`:

1. Add Tuya to UI
2. "Connect" for Tuya → calls `/oauth-start`
3. Returns auth_url → open in browser
4. User approves → redirects to `/oauth-callback`
5. Frontend handles redirect → stores token
6. Done

---

**Ready to start building?** Use `BRAND_CREDENTIALS_QUICK_START.md` for exact request/response examples.
