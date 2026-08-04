# Platform Config API - Quick Reference

## Base URL
All endpoints under `/platform-config` (public) or `/admin/platform-config` (admin)

---

## PUBLIC ENDPOINTS (No Authentication Required)

### 1. List All Platforms
```
GET /platform-config/platforms
```
**Response:**
```json
{
  "platforms": ["youtube", "twitch", "bilibili", "tiktok", "kick", "niconico"]
}
```

---

### 2. List Events for a Platform
```
GET /platform-config/platforms/{platform}/events
```
**Example:** `GET /platform-config/platforms/youtube/events`

**Response:**
```json
{
  "platform": "youtube",
  "events": ["comment", "superchat", "sticker", "member"]
}
```

---

### 3. Get All Parameters for Event (Available + Unavailable)
```
GET /platform-config/platforms/{platform}/events/{event}/parameters
```
**Example:** `GET /platform-config/platforms/youtube/events/superchat/parameters`

**Response:**
```json
{
  "platform": "youtube",
  "event": "superchat",
  "parameters": [
    {
      "name": "event_message",
      "type": "string",
      "available": true,
      "description": "Message text (optional)"
    },
    {
      "name": "event_is_mod",
      "type": "boolean",
      "available": false,
      "description": "YouTube API does not expose"
    }
  ]
}
```

---

### 4. Get ONLY Available Parameters for Event
```
GET /platform-config/platforms/{platform}/events/{event}/parameters/available
```
**Example:** `GET /platform-config/platforms/youtube/events/superchat/parameters/available`

**Use Case:** Frontend condition builder should only show these parameters in dropdown

**Response:** (Same format, but only `available: true` parameters)
```json
{
  "platform": "youtube",
  "event": "superchat",
  "parameters": [
    { "name": "event_message", "type": "string", "available": true },
    { "name": "event_sender_name", "type": "string", "available": true },
    { "name": "event_amount", "type": "number", "available": true }
  ]
}
```

---

### 5. Get ONLY Unavailable Parameters (With Reasons)
```
GET /platform-config/platforms/{platform}/events/{event}/parameters/unavailable
```
**Example:** `GET /platform-config/platforms/youtube/events/superchat/parameters/unavailable`

**Use Case:** Show user why certain fields can't be used in conditions

**Response:** (Same format, but only `available: false` parameters with descriptions)
```json
{
  "platform": "youtube",
  "event": "superchat",
  "parameters": [
    {
      "name": "event_is_mod",
      "type": "boolean",
      "available": false,
      "description": "YouTube API does not expose"
    },
    {
      "name": "event_badges",
      "type": "array",
      "available": false,
      "description": "YouTube API does not expose"
    }
  ]
}
```

---

### 6. Check One Parameter
```
GET /platform-config/platforms/{platform}/events/{event}/parameters/{param}/available
```
**Example:** `GET /platform-config/platforms/youtube/events/superchat/parameters/event_is_mod/available`

**Use Case:** Quick boolean check before allowing parameter in condition

**Response:**
```json
{
  "platform": "youtube",
  "event": "superchat",
  "parameter": "event_is_mod",
  "available": false
}
```

---

### 7. Get Full Catalog (Large Response)
```
GET /platform-config/catalog
```

**Warning:** This returns the entire catalog. Prefer specific queries above.

**Use Case:** Debugging, offline documentation, bulk export

**Response:** Full JSON structure (very large)

---

## ADMIN ENDPOINTS (Requires Admin Authentication)

### 8. Reload Catalog from Disk
```
POST /admin/platform-config/reload
```

**Use Case:** Update catalog after editing `platform_event_parameters.json` without restarting server

**Response:**
```json
{
  "status": "success",
  "message": "Platform catalog reloaded"
}
```

**Error Example (if JSON is malformed):**
```json
{
  "error": "Failed to reload catalog: failed to parse catalog JSON: invalid character"
}
```

---

## Usage Examples

### Frontend: Build Condition UI
```javascript
// Step 1: Get platforms
const platforms = await fetch('/platform-config/platforms').then(r => r.json());
// Result: ["youtube", "twitch", ...]

// Step 2: Show event dropdown for selected platform
const events = await fetch(`/platform-config/platforms/youtube/events`).then(r => r.json());
// Result: ["comment", "superchat", "sticker", "member"]

// Step 3: Show available parameters for selected event
const params = await fetch('/platform-config/platforms/youtube/events/superchat/parameters/available').then(r => r.json());
// Result: List of available parameters only
// User can now drag-drop these into condition builder
```

### Backend: Validate Condition Creation
```go
// When user creates condition with platform=youtube, event_type=superchat
platformParams := catalogMgr.GetAvailableParameters("youtube", "superchat")
if platformParams == nil {
    return errors.New("Event type 'superchat' not supported for platform 'youtube'")
}
// Condition creation proceeds...
```

### Operations: Update Catalog
```bash
# Edit the JSON file
vim internal/config/platform_event_parameters.json
# Changes take effect immediately via reload (no restart needed)
curl -X POST http://localhost:8080/admin/platform-config/reload
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing platform, event, or param) |
| 404 | Platform/event/parameter not found |
| 500 | Server error (JSON parse failure, etc.) |
| 503 | Catalog not initialized (load failed on startup) |

---

## Data Types

All parameters use standard JSON types:
- `string` - Text (e.g., message, username, currency code)
- `number` - Float/int (e.g., superchat amount)
- `boolean` - True/false (e.g., is_member, is_mod)
- `array` - String array (e.g., badges)

---

## Parameter Naming Convention

All event parameters use `event_` prefix:
- `event_message` (not message)
- `event_sender_name` (not sender_name or username)
- `event_amount` (not amount)
- `event_is_mod` (not is_mod)

This matches the condition evaluator's parameter lookup system.

---

## Troubleshooting

**Q: Empty parameters list for platform/event?**
- A: That platform/event combination doesn't exist. Use `/events` endpoint to see valid options.

**Q: Parameter shows as unavailable but I need it?**
- A: Contact developer. Platform API may have updated, or parameter is truly unavailable (documented in description).

**Q: Reload returns 500 error?**
- A: JSON file is malformed. Check syntax and fix. See error message for line details.

**Q: API returns 503?**
- A: Catalog failed to load on startup. Check server logs for "Failed to load platform event catalog".

---

## Notes

- All parameters are read-only (except reload, which is read-write for admins)
- Catalog is cached in memory after load (very fast)
- Reload acquires write lock (brief pause on other requests)
- No database required for platform config API
- All responses are JSON
