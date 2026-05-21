# New API Endpoints Summary

This document lists all the NEW API endpoints that were added during the UI implementation, beyond the original `tauchoapis` design.

---

## 🆕 New Endpoints Added

### 1. POST /auth/logout

**Purpose**: Clear the user's session and log them out.

**Status**: Added to Postman collection ✓

**Endpoint**: `POST /auth/logout`

**Headers**:
```
Cookie: [session cookie]
Content-Type: application/json (optional)
```

**Query Parameters**: None

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "message": "logged out"
}
```

**Error Responses**:
- 200 OK (even if not authenticated - idempotent)

**Implementation Notes**:
- Called by: [public/js/auth.js](public/js/auth.js#L74)
- Must clear session cookie
- Should be idempotent (safe to call multiple times)
- UI proxies this as `/api/auth/logout` → `/auth/logout`

**Example Usage**:
```javascript
async function logout() {
    await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    });
    window.location.href = '/';
}
```

---

### 2. GET /api/user/preferences

**Purpose**: Retrieve authenticated user's saved preferences (language, theme, etc.)

**Status**: Added to Postman collection (marked OPTIONAL) ✓

**Endpoint**: `GET /api/user/preferences`

**Headers**:
```
Cookie: [session cookie]
Content-Type: application/json
```

**Query Parameters**: None

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "user_id": 1,
  "language": "ja",
  "theme": "light",
  "updated_at": "2026-05-21T12:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - No preferences saved yet (optional - can return default)

**Implementation Notes**:
- Called by: [public/js/localization.js](public/js/localization.js#L158)
- Only called if user is authenticated
- If not implemented, UI falls back to cookie-based language preference
- This is optional - not critical for functionality

**Database Schema** (if implementing):
```sql
CREATE TABLE user_preferences (
    user_id INT PRIMARY KEY,
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Example Usage**:
```javascript
async function loadUserLanguagePreference() {
    const response = await fetch('/api/user/preferences', {
        credentials: 'include'
    });
    
    if (response.ok) {
        const prefs = await response.json();
        setLanguage(prefs.language);
    }
}
```

---

### 3. POST /api/user/preferences

**Purpose**: Save/update authenticated user's preferences (language, theme, etc.)

**Status**: Added to Postman collection (marked OPTIONAL) ✓

**Endpoint**: `POST /api/user/preferences`

**Headers**:
```
Cookie: [session cookie]
Content-Type: application/json
```

**Query Parameters**: None

**Request Body**:
```json
{
  "language": "ja",
  "theme": "light"
}
```

**Response** (200 OK):
```json
{
  "user_id": 1,
  "language": "ja",
  "theme": "light",
  "updated_at": "2026-05-21T12:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid language code
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Database error

**Valid Language Codes**: `en`, `ja`, `de`, `fr`, `es`

**Implementation Notes**:
- Called by: [public/js/localization.js](public/js/localization.js#L106)
- Only called when user changes language
- If not implemented, UI falls back to cookie storage
- This is optional - not critical for functionality
- Should use INSERT OR UPDATE (UPSERT) pattern

**Database Query** (if implementing):
```sql
INSERT INTO user_preferences (user_id, language, theme, updated_at)
VALUES (?, ?, ?, NOW())
ON DUPLICATE KEY UPDATE
  language = VALUES(language),
  theme = COALESCE(VALUES(theme), theme),
  updated_at = NOW();
```

**Example Usage**:
```javascript
async function syncLanguagePreferenceToAPI(lang) {
    const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ language: lang })
    });
    
    return response.ok;
}
```

---

## 📊 Summary Table

| Endpoint | Method | Status | Criticality | Fallback |
|----------|--------|--------|-------------|----------|
| `/auth/logout` | POST | NEW | 🔴 CRITICAL | None - needs implementation |
| `/api/user/preferences` | GET | NEW | 🟡 OPTIONAL | Cookie-based language |
| `/api/user/preferences` | POST | NEW | 🟡 OPTIONAL | Cookie-based language |

---

## ✅ Implementation Checklist for API Server

- [ ] **CRITICAL**: Implement `POST /auth/logout`
  - [ ] Clear session cookie
  - [ ] Return 200 OK
  - [ ] Test with curl: `curl -X POST http://localhost:8081/auth/logout`

- [ ] **OPTIONAL**: Implement `GET /api/user/preferences`
  - [ ] Query user_preferences table
  - [ ] Return language, theme, updated_at
  - [ ] Return 401 if not authenticated

- [ ] **OPTIONAL**: Implement `POST /api/user/preferences`
  - [ ] Validate language code
  - [ ] Insert or update user_preferences table
  - [ ] Return updated preferences with timestamp

---

## 🔄 UI Proxy Mapping

The UI server proxies `/api/*` to the API server, removing `/api` prefix:

```
Browser → UI Server (localhost:8080) → API Server (localhost:8081)

/api/auth/logout          → /auth/logout
/api/user/preferences     → /user/preferences (GET)
/api/user/preferences     → /user/preferences (POST)
```

---

## 📝 Files Modified

1. **tauchoapis.postman_collection.json** - Updated with new endpoints
2. **public/js/auth.js** - Calls `POST /auth/logout`
3. **public/js/localization.js** - Calls preference endpoints (optional)

---

## 🚀 Next Steps

1. Review the new endpoints
2. Decide which are critical vs. optional for your use case
3. Implement `POST /auth/logout` (CRITICAL)
4. Optionally implement user preferences endpoints
5. Test with Postman collection
6. Update API documentation
