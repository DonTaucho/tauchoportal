# Smart Device API Endpoints (Updated)

## Overview

The device API now integrates with the **template-based device control system**, enabling standardized, brand-agnostic control of 10+ smart home brands. This document outlines all endpoints for devices, credentials, and templates.

### System Flow
```
Live Stream Detected → Extract Sub Info → Filter by Condition → 
  Look up Device Credentials → Load Template → Execute via Brand API
```

---

## Device Endpoints (Existing - No Changes)

These endpoints manage device registrations. Credentials are now stored separately in the credential store.

### GET /devices
List all devices for the current user (summaries only, no sensitive data).

**Response:**
```json
[
  {
    "id": "device_xyz",
    "name": "Living Room Light",
    "brand": "govee",
    "product_id": "H6199",
    "room": "Living Room",
    "is_configured": true,
    "status": "unknown",
    "created_at": "2026-06-14T10:00:00Z",
    "updated_at": "2026-06-14T10:00:00Z"
  }
]
```

---

### GET /devices/get?id={device_id}
Get a specific device with full details.

**Query Parameters:**
- `id` (required): Device ID

**Response:**
```json
{
  "id": "device_xyz",
  "user_id": 1,
  "name": "Living Room Light",
  "brand": "govee",
  "product_id": "H6199",
  "room": "Living Room",
  "is_configured": true,
  "status": "unknown",
  "credentials": {},
  "created_at": "2026-06-14T10:00:00Z",
  "updated_at": "2026-06-14T10:00:00Z"
}
```

---

### POST /devices
Create a new device registration.

**Body:**
```json
{
  "name": "Living Room Light",
  "brand": "govee",
  "product_id": "H6199",
  "room": "Living Room",
  "credentials": {}
}
```

**Response:** 201 Created with full device object

---

### PATCH /devices/update?id={device_id}
Update device metadata.

**Query Parameters:**
- `id` (required): Device ID

**Body:** (all fields optional)
```json
{
  "name": "Updated Light Name",
  "product_id": "H6199",
  "room": "Bedroom",
  "credentials": {}
}
```

**Response:** Updated device object

---

### DELETE /devices?id={device_id}
Delete a device.

**Query Parameters:**
- `id` (required): Device ID

**Response:**
```json
{
  "status": "deleted"
}
```

---

### POST /devices/test?id={device_id}  ⭐ NEW - Template-Based Testing

Send a test command to verify device connectivity and credential validity.

**Query Parameters:**
- `id` (required): Device ID

**Body:**
```json
{
  "template_id": 123,           // Required: Template ID to use
  "action": "on",               // Required: Action to perform
  "params": {                   // Optional: Action-specific parameters
    "brightness": 50,
    "color": "#FF0000"
  }
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "device": "Living Room Light",
  "brand": "govee",
  "action": "on",
  "message": "Test command sent successfully"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "failed",
  "device": "Living Room Light",
  "brand": "govee",
  "error": "Connection timeout",
  "message": "Test command failed — check credential and template configuration"
}
```

**What This Does:**
1. Verifies device exists and belongs to user
2. Loads the template by ID
3. Verifies template brand matches device brand
4. Finds credential for the device's brand
5. Executes HTTP request to actual device API
6. Returns success/failure with detailed error info

---

## Device Credentials Endpoints ⭐ NEW

Manage credentials for smart device brands. Each user can have one credential per brand.

### GET /device-credentials
List all credentials for the current user (masked sensitive data).

**Response:**
```json
[
  {
    "id": 1,
    "brand_name": "govee",
    "device_name": "Hallway Strip",
    "device_model": "H6199",
    "is_active": true,
    "created_at": "2026-06-14T10:00:00Z",
    "updated_at": "2026-06-14T10:00:00Z",
    "last_tested_at": "2026-06-14T10:30:00Z",
    "metadata": {
      "host_ip": "192.168.1.100",
      "port": 4003,
      "region": "us-east-1"
    }
  }
]
```

---

### GET /device-credentials/get?id={credential_id}
Get a specific credential (without sensitive fields).

**Query Parameters:**
- `id` (required): Credential ID

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "brand_name": "govee",
  "api_key": "****3k9x",          // Masked
  "device_name": "Hallway Strip",
  "device_model": "H6199",
  "host_ip": "192.168.1.100",
  "port": 4003,
  "is_active": true,
  "last_tested_at": "2026-06-14T10:30:00Z",
  "created_at": "2026-06-14T10:00:00Z",
  "updated_at": "2026-06-14T10:00:00Z"
}
```

---

### POST /device-credentials
Create a new credential for a brand.

**Body:**
```json
{
  "brand_name": "govee",
  "api_key": "your-actual-api-key",
  "device_name": "Hallway Strip",
  "device_model": "H6199",
  "host_ip": "192.168.1.100",
  "port": 4003,
  "region": "us-east-1"
}
```

**Supported Fields by Brand:**

| Brand | api_key | bearer_token | username | password | host_ip | port | device_id | region |
|-------|---------|--------------|----------|----------|---------|------|-----------|--------|
| **Govee** | ✅ | | | | | | ✅ | |
| **LIFX** | | ✅ | | | | | | |
| **Philips Hue** | | ✅ | | | ✅ (bridge) | ✅ | | |
| **WLED** | | | | | ✅ | ✅ | | |
| **Nanoleaf** | ✅ | | | | ✅ | ✅ | | |
| **TP-Link Kasa** | | | ✅ | ✅ | ✅ | ✅ | | |
| **Tuya** | ✅ | ✅ | | | | | ✅ | ✅ |
| **Wyze** | | | ✅ | ✅ | | | | |
| **Yeelight** | | | | | ✅ | ✅ | | |

**Response:** 201 Created with masked credential object

---

### PATCH /device-credentials/update?id={credential_id}
Update an existing credential (add/update fields).

**Query Parameters:**
- `id` (required): Credential ID

**Body:** (all fields optional)
```json
{
  "api_key": "new-api-key",
  "device_id": "new-device-id",
  "is_active": true,
  "device_name": "Updated Name"
}
```

**Response:** Updated credential object (masked)

---

### DELETE /device-credentials?id={credential_id}
Delete a credential. Device commands will fail until a new credential is added.

**Query Parameters:**
- `id` (required): Credential ID

**Response:**
```json
{
  "status": "deleted"
}
```

---

## Device Templates Endpoints ⭐ NEW

Browse pre-defined control templates for supported brands. Templates define HTTP patterns, required parameters, and authentication methods.

### GET /device-templates
List all available templates (optionally filtered).

**Query Parameters:**
- `brand` (optional): Filter by brand (e.g., `?brand=govee`)
- `category` (optional): Filter by category (e.g., `?category=power`)

**Response:**
```json
[
  {
    "id": 1,
    "brand_name": "govee",
    "template_name": "Turn Light On",
    "category": "power",
    "description": "Sends turn-on command to Govee device",
    "http_method": "POST",
    "endpoint_url": "https://api.govee.com/v1/devices/control",
    "authentication_type": "api_key",
    "body_template": "{\"device\":\"{device_id}\",\"model\":\"{model}\",\"cmd\":{\"name\":\"turn\",\"value\":\"on\"}}",
    "required_parameters": ["device_id"],
    "optional_parameters": [],
    "parameter_defaults": {},
    "parameter_constraints": {},
    "requires_authentication": true,
    "local_network_only": false,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### GET /device-templates/get?id={template_id}
Get a specific template by ID.

**Query Parameters:**
- `id` (required): Template ID

**Response:** Single template object (same structure as list response)

---

## Usage Flow: Testing a Device

Here's the complete flow to test if a device is properly set up:

### Step 1: List Templates for Brand
```bash
GET /device-templates?brand=govee
```
Returns all templates available for Govee devices.

### Step 2: Choose a Template Action
Pick a template from the list, e.g., template ID `1` for "Turn Light On".

### Step 3: Test the Device
```bash
POST /devices/test?id=device_xyz
Content-Type: application/json

{
  "template_id": 1,
  "action": "on",
  "params": {
    "brightness": 50
  }
}
```

**Possible Outcomes:**
- ✅ **Success**: Device API responded correctly
- ❌ **Failed**: Credential invalid, device offline, or template misconfigured

---

## Error Responses

All endpoints use standard HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid parameters) |
| 403 | Forbidden (not user's resource) |
| 404 | Not Found |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "error": "Human-readable error message"
}
```

---

## System Design Notes

### Credential Storage
- Credentials are encrypted at the application level
- Sensitive fields (API keys, tokens, passwords) are masked in API responses
- Only the last 4 characters are visible: `****3k9x`

### Template System
- Templates are pre-defined in the database
- Each template contains HTTP method, URL pattern, body structure, and auth type
- Parameters are substituted before sending: `{device_id}` → actual device ID from credential

### Brand-Specific Handling
- Generic template executor handles all HTTP mechanics
- Brand-specific logic isolated in separate executors (Govee, WLED, LIFX, Tuya)
- Adding new brand requires only:
  1. Creating brand.go file with parameter validation
  2. Adding template records to database

---

## Example: Complete Device Setup Workflow

### 1. Create Device Registration
```bash
POST /devices
{
  "name": "Living Room Light",
  "brand": "govee",
  "product_id": "H6199",
  "room": "Living Room"
}
```
Returns: `device_xyz`

### 2. Add Credentials for Brand
```bash
POST /device-credentials
{
  "brand_name": "govee",
  "api_key": "your-govee-api-key-here",
  "device_id": "aabbccddeeff",
  "device_name": "Living Room Light"
}
```
Returns: credential `id: 42`

### 3. Get Available Templates for Brand
```bash
GET /device-templates?brand=govee
```

### 4. Test Device Connectivity
```bash
POST /devices/test?id=device_xyz
{
  "template_id": 1,
  "action": "on",
  "params": { "brightness": 75 }
}
```

### 5. Device is Ready
If test succeeds, device is ready to receive commands from conditions when live streams match!

---

## Future Enhancements

- [ ] List all templates (currently requires brand or category filter)
- [ ] Credential validation endpoint (test connectivity before saving)
- [ ] Template creation API (allow users to create custom templates)
- [ ] Batch device control (send same command to multiple devices)
- [ ] Command execution history (view past device commands)
- [ ] OAuth token auto-refresh for services like Tuya

---

## Migration from Old System

If you were using the old device system:

1. **Existing devices still work** - nothing to change in device registrations
2. **Move credentials to new system**:
   - Create POST /device-credentials for each device brand
   - Provide API keys, tokens, device IDs as appropriate
3. **Update conditions to use templates**:
   - Conditions still trigger on stream events
   - Device execution now goes through template system automatically
4. **Test with POST /devices/test** to verify setup

---
