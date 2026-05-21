# API Endpoints Audit - Original vs Implemented

This document compares the original API design (from `tauchoapis.postman_collection.json`) with what the UI is currently calling.

---

## 📋 Original API Endpoints (from Postman Collection)

### Health
- `GET /health` - Health check endpoint

### OAuth
- `GET /oauth/login?provider=google` - Get OAuth login URL
- `GET /oauth/callback?code=&state=` - OAuth callback (auto-redirect by Google)

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login with email/password
- `GET /auth/user` - Get current authenticated user

### Watches
- `GET /api/watches` - List all watch targets (with X-User-ID header)
- `POST /api/watches/create` - Create new watch target (with X-User-ID header)
- `DELETE /api/watches/delete?id=` - Delete watch target

### Poller
- `GET /api/poller/status` - Get poller status
- `POST /api/poller/start` - Start poller
- `POST /api/poller/stop` - Stop poller

---

## ✅ UI Implementation Status

### Endpoints Being Used by UI

| Endpoint | Original? | UI Path | Notes |
|----------|-----------|---------|-------|
| `GET /auth/user` | ✅ Yes | `/api/auth/user` | Correctly proxied ✓ |
| `GET /oauth/login` | ✅ Yes | `/api/oauth/login` | Correctly proxied ✓ |
| `POST /auth/logout` | ❌ **NEW** | `/api/auth/logout` | **NOT IN ORIGINAL** |
| `GET /api/user/preferences` | ❌ **NEW** | `/api/user/preferences` | **NOT IN ORIGINAL** (language preference) |
| `POST /api/user/preferences` | ❌ **NEW** | `/api/user/preferences` | **NOT IN ORIGINAL** (language preference) |

### Proxy Behavior

The UI server proxies all `/api/*` requests to the API server with `/api` prefix removed:

```
Browser Request        →  UI Server  →  API Server
/api/auth/user        →  remove /api →  /auth/user ✓
/api/oauth/login      →  remove /api →  /oauth/login ✓
/api/auth/logout      →  remove /api →  /auth/logout ✗ (NEW)
/api/user/preferences →  remove /api →  /user/preferences ✗ (NEW)
```

---

## 🆕 New Endpoints Added (Not in Original Design)

### 1. `POST /auth/logout`
**Status**: Added in UI code but NOT in original API  
**Location**: [public/js/auth.js](public/js/auth.js#L74)  
**Purpose**: Clear session and log out user  
**Request**:
```javascript
POST /api/auth/logout
credentials: include
```

**Recommendation**: 
- ✅ Should be added to API - it's essential for logout functionality
- Update Postman collection to include this

---

### 2. `GET /api/user/preferences`
**Status**: NEW feature for language preferences  
**Location**: [public/js/localization.js](public/js/localization.js#L158)  
**Purpose**: Retrieve user's saved preferences (language, theme, etc.)  
**Request**:
```javascript
GET /api/user/preferences
credentials: include
```

**Response**:
```json
{
  "language": "ja",
  "theme": "light",
  "updated_at": "2026-05-21T12:00:00Z"
}
```

**Recommendation**:
- 🟡 Optional feature - only used if user is authenticated
- Not critical for core functionality
- Falls back to cookies if not implemented
- If implemented, add to Postman collection

---

### 3. `POST /api/user/preferences`
**Status**: NEW feature for language preferences  
**Location**: [public/js/localization.js](public/js/localization.js#L106)  
**Purpose**: Save user's preferences (language, theme, etc.)  
**Request**:
```javascript
POST /api/user/preferences
Content-Type: application/json
credentials: include

{
  "language": "ja"
}
```

**Response**:
```json
{
  "language": "ja",
  "updated_at": "2026-05-21T12:00:00Z"
}
```

**Recommendation**:
- 🟡 Optional feature - only used if user is authenticated
- Not critical for core functionality
- Falls back to cookies if not implemented
- If implemented, add to Postman collection

---

## 📊 Unused Original Endpoints

These endpoints are in the original design but NOT used by the UI:

| Endpoint | Reason Not Used |
|----------|-----------------|
| `POST /auth/register` | Register form not yet in UI |
| `POST /auth/login` | Login form not yet in UI |
| `GET /api/watches` | Watch management UI not yet implemented |
| `POST /api/watches/create` | Watch management UI not yet implemented |
| `DELETE /api/watches/delete` | Watch management UI not yet implemented |
| `GET /api/poller/status` | Poller UI not yet implemented |
| `POST /api/poller/start` | Poller UI not yet implemented |
| `POST /api/poller/stop` | Poller UI not yet implemented |

**Note**: These endpoints will be needed when you implement the register/login pages and watch management UI.

---

## 🔄 Required API Implementation

To make the UI fully functional, your API server should implement:

### ESSENTIAL (for current functionality)
- ✅ `GET /oauth/login?provider=google` - Already exists
- ✅ `GET /oauth/callback?code=&state=` - Already exists
- ✅ `GET /auth/user` - Already exists

### CRITICAL (UI calls these)
- 🔴 `POST /auth/logout` - **MISSING** (add this!)

### OPTIONAL (enhances experience, has fallback)
- 🟡 `GET /api/user/preferences` - For cross-device language sync
- 🟡 `POST /api/user/preferences` - For cross-device language sync

### FUTURE (when UI implements these pages)
- ❌ `POST /auth/register` - Register page
- ❌ `POST /auth/login` - Login page
- ❌ `GET /api/watches` - Watch list
- ❌ `POST /api/watches/create` - Add watch
- ❌ `DELETE /api/watches/delete` - Remove watch
- ❌ `GET /api/poller/status` - Poller status
- ❌ `POST /api/poller/start` - Start poller
- ❌ `POST /api/poller/stop` - Stop poller

---

## 📝 Updated Postman Collection

The Postman collection should be updated to include:

### Add to Auth section:
```json
{
  "name": "Logout",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{baseUrl}}/auth/logout",
      "host": ["{{baseUrl}}"],
      "path": ["auth", "logout"]
    },
    "description": "Logs out the user by clearing their session.",
    "auth": { "type": "noauth" }
  }
}
```

### Add new section for Preferences (optional):
```json
{
  "name": "Preferences",
  "item": [
    {
      "name": "Get User Preferences",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/user/preferences",
          "host": ["{{baseUrl}}"],
          "path": ["api", "user", "preferences"]
        },
        "description": "Returns authenticated user's saved preferences (language, theme, etc.)"
      }
    },
    {
      "name": "Update User Preferences",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{baseUrl}}/api/user/preferences",
          "host": ["{{baseUrl}}"],
          "path": ["api", "user", "preferences"]
        },
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"language\": \"ja\"}"
        },
        "description": "Updates user's preferences (language, theme, etc.)"
      }
    }
  ]
}
```

---

## 🎯 Action Items

### For API Server
1. ✅ Verify `GET /auth/user` works correctly
2. ✅ Verify `GET /oauth/login` returns correct auth_url
3. 🔴 **IMPLEMENT** `POST /auth/logout` - Clear session & return 200
4. 🟡 **OPTIONAL**: Implement user preferences table & endpoints

### For UI Server (Already Done)
- ✅ Proxy correctly set up (`/api/*` → `/*` on API)
- ✅ API token injection set up
- ✅ All calls use correct endpoints

### For Documentation
- ✅ Update Postman collection with new endpoints
- ✅ Document preference endpoints as optional

---

## 🔗 References

- **Original Postman Collection**: [tauchoapis.postman_collection.json](tauchoapis.postman_collection.json)
- **UI API Calls**: [public/js/auth.js](public/js/auth.js)
- **Localization API**: [public/js/localization.js](public/js/localization.js)
- **API Integration**: [API_INTEGRATION.md](API_INTEGRATION.md)
- **UI Proxy**: [cmd/main.go](cmd/main.go#L38-L55)
