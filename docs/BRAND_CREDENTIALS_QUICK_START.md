# Brand Credentials API - Quick Reference for Frontend

## Endpoints You Can Use TODAY ✅

### List Brands (with connection status)
```bash
GET /auth/brands
Header: X-User-ID: 1
```
Returns: All brands with connection status for user

---

### Get Brand Details
```bash
GET /auth/brand/{brand_id}
Header: X-User-ID: 1
```
Returns: Connection status + credential fields needed for this brand

---

### Connect/Save Credentials
```bash
POST /auth/brand/{brand_id}/connect
Header: X-User-ID: 1
Body: {
  "auth_type": "api_key|local|oauth",
  "credentials": { ... }
}
```
Works for: **API Key** ✅ | **Local Bridge** ✅ | **OAuth** ❌ (not yet)

---

### Test Credentials (no save)
```bash
POST /auth/brand/{brand_id}/test
Header: X-User-ID: 1
Body: {
  "auth_type": "api_key|local",
  "credentials": { ... }
}
```
Returns: Valid/Invalid + device list if valid

---

### Disconnect
```bash
POST /auth/brand/{brand_id}/disconnect
Header: X-User-ID: 1
```
Removes all credentials for this brand

---

### Update Credentials (partial)
```bash
PATCH /auth/brand/{brand_id}/update
Header: X-User-ID: 1
Body: {
  "credentials": { api_key: "new_value" }
}
```
Updates only the fields you send

---

## Endpoints NOT YET READY ⏳

**Note:** OAuth endpoints are not yet needed. Current implementation supports API Key and Local Bridge authentication types.

---

## Examples by Brand

### Govee (API Key)
```javascript
const response = await fetch(`${API_URL}/auth/brand/govee/connect`, {
  method: 'POST',
  headers: { 'X-User-ID': userId },
  body: JSON.stringify({
    auth_type: 'api_key',
    credentials: {
      api_key: 'user-provided-key'
    }
  })
});
```

### Philips Hue (Local Bridge)
```javascript
const response = await fetch(`${API_URL}/auth/brand/philips-hue/connect`, {
  method: 'POST',
  headers: { 'X-User-ID': userId },
  body: JSON.stringify({
    auth_type: 'local',
    credentials: {
      bridge_ip: '192.168.1.50',
      api_key: 'bridge-token'
    }
  })
});
```

### Test Before Saving
```javascript
const response = await fetch(`${API_URL}/auth/brand/govee/test`, {
  method: 'POST',
  headers: { 'X-User-ID': userId },
  body: JSON.stringify({
    auth_type: 'api_key',
    credentials: {
      api_key: 'test-key'
    }
  })
});

if (response.ok) {
  const result = await response.json();
  console.log(`Found ${result.device_count} devices`);
  // Now save it
  await fetch(`${API_URL}/auth/brand/govee/connect`, { ... });
}
```

---

## Response Format

### Success (200-201)
```json
{
  "id": "ubcred_...",
  "brand_id": "govee",
  "status": "connected",
  "connected_at": "2026-07-25T...",
  "error_message": null
}
```

### Credential Validation Failed (422)
```json
{
  "is_valid": false,
  "message": "Invalid API key",
  "error": "Invalid API key",
  "device_count": 0
}
```

### Brand Not Found (404)
```json
{ "error": "Brand 'xyz' not found" }
```

### Missing User ID (401)
```json
{ "error": "Unauthorized" }
```

---

## Summary

| What | Where | Status |
|---|---|---|
| Build brand list UI | `GET /auth/brands` | ✅ Use today |
| Show details/fields | `GET /auth/brand/{id}` | ✅ Use today |
| Connect API brands | `POST /auth/brand/{id}/connect` | ✅ Use today |
| Test credentials | `POST /auth/brand/{id}/test` | ✅ Use today |
| Disconnect | `POST /auth/brand/{id}/disconnect` | ✅ Use today |
| Update | `PATCH /auth/brand/{id}/update` | ✅ Use today |
**TL;DR:** All 6 endpoints are ready to use. Build your UI with them.
