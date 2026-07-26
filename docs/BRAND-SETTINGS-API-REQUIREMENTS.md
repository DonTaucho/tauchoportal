# Brand Settings - Backend API Requirements Review

## Current API Calls in brand-settings.js

1. **`GET /auth/brands`** (line 430)
   - ✅ **EXISTS** in spec (lines 1841-1891)
   - Response includes: brands array with status, auth_type, is_connected
   - Status: READY

2. **`POST /auth/brand/{brand}/connect`** (lines 518, 543, 578)
   - ✅ **EXISTS** in spec (lines 1920-1967)
   - Parameters: auth_type, credentials object
   - Response: credential ID, status, connected_at
   - Status: READY

3. **`POST /auth/brand/{brand}/test`** (NOT YET IMPLEMENTED - MISSING)
   - ✅ **EXISTS** in spec (lines 1977-2003)
   - Purpose: Validate credentials without saving
   - Status: READY but not called by frontend

4. **`POST /auth/brand/{brand}/connect`** with OAuth (line 518)
   - For OAuth start flow, needs `oauth_code` and `oauth_state` in response
   - Spec mentions (lines 2049-2054) that OAuth flow returns `qr_code_svg`
   - Status: NEED TO VERIFY response includes qr_code fields

5. **`DELETE /auth/brand/{brand}`** (line 603)
   - ❌ **SPEC SAYS `POST` NOT `DELETE`** (lines 2007-2016)
   - Spec endpoint: `POST /auth/brand/<brand_id>/disconnect`
   - Status: WRONG HTTP METHOD

6. **`GET /set-oauth-return?url=...`** (line 517)
   - ❌ **NOT IN SPEC** - This is a page route, not API
   - Purpose: Store redirect URL before OAuth flow
   - Status: May be UI router, check if backend needed

---

## Data Requirements Analysis

### What Data Is Needed from Backend
1. ✅ Brand list with connection status - `GET /auth/brands` returns this
2. ✅ Credential metadata (field names, types) - Available via `/catalog/brands/{brand_id}`
3. ✅ Setup guides/help text - Currently hardcoded in JavaScript
4. ✅ Ability to save credentials - `POST /auth/brand/{brand}/connect`
5. ✅ Ability to test credentials - `POST /auth/brand/{brand}/test`
6. ⚠️ OAuth QR code and auth URL - Need to verify response structure

### What Data Is Hardcoded
1. `BRAND_METADATA` (brand-settings.js lines ~1-163)
   - Auth type, credential field definitions
   - Could come from `/catalog/brands` instead
   - Currently hardcoded - OK for now since brand metadata is stable

2. `SETUP_GUIDES` (brand-settings.js lines ~163-400)
   - Multi-step instructions, help text, tips
   - Currently hardcoded - NOT ideal but OK
   - Could be moved to backend in future if needed

---

## Issues Found

### Issue 1: Wrong HTTP Method for Disconnect
**Location:** brand-settings.js line 603

Current:
```javascript
await apiRequest('DELETE', `/auth/brand/${encodeURIComponent(brand)}`);
```

Should be (per spec lines 2007-2016):
```javascript
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/disconnect`);
```

**Status:** MUST FIX - spec clearly says POST not DELETE

---

### Issue 2: Test Credentials Not Implemented
**Location:** brand-settings.js line 738-741 (testBtn event handler)

Current:
```javascript
const testBtn = document.querySelector('[data-wizard-action="test"]');
if (testBtn) {
  testBtn.addEventListener('click', () => {
    // TODO: test credentials
  });
}
```

Should call (per spec lines 1977-2003):
```javascript
await apiRequest('POST', `/auth/brand/${brandId}/test`, {
  auth_type: meta.authType,
  credentials: setupWizardState.credentials
});
```

**Status:** TODO - Backend endpoint exists, frontend just doesn't call it

---

### Issue 3: OAuth Response Format Unclear
**Location:** brand-settings.js lines 492-510

Code expects response to have one of:
- `qr_code_svg` (SVG markup)
- `qr_code_data_url` (data URL)
- `qr_code_url` (URL)
- `qr_code_image` (image path)

Also expects:
- `auth_url` or `authorization_url` or `url`

**Problem:** Spec doesn't clearly specify which fields are returned for OAuth.

**Status:** NEED CLARIFICATION - Ask backend what fields are in OAuth response

---

### Issue 4: Credential Payload Mismatch
**Location:** brand-settings.js lines 543-547, 578-582

Current payloads don't match spec format.

Current (WRONG):
```javascript
// For API key
{ api_key: key, token: key, key }

// For local
{ ip, token, auth_token: token }
```

Should be (per spec):
```javascript
// For API key
{
  auth_type: 'api_key',
  credentials: {
    api_key: key,
    device_id: deviceId  // optional
  }
}

// For local  
{
  auth_type: 'local',
  credentials: {
    bridge_ip: ip,
    api_key: token,
    light_id: lightId  // optional
  }
}
```

**Status:** MUST FIX - currently won't work with backend

---

### Issue 5: Button Visibility Using `.hidden`
**Location:** brand-settings.js lines 674-675

Already discussed - use `style.display` instead of `.hidden`

**Status:** MUST FIX - styling conflict

---

## Backend Requirements Summary

### What Must Be Implemented (BLOCKING)
1. ✅ `GET /auth/brands` - Returns connection status for all brands
2. ✅ `POST /auth/brand/{brand}/connect` - Save credentials
3. ⚠️ `POST /auth/brand/{brand}/test` - Test credentials (exists but frontend doesn't use)
4. ❌ WRONG: `DELETE /auth/brand/{brand}` → Should be `POST /auth/brand/{brand}/disconnect`

### What Frontend Needs Clarification On
1. **OAuth response format** - Does it return `qr_code_svg`, `auth_url`, etc.?
2. **Credential field names** - Are they `bridge_ip` or `device_ip`? `api_key` or `token`?

### What Can Stay Hardcoded
1. Brand metadata (auth types, field definitions) - from BRAND_METADATA object
2. Setup guides and help text - from SETUP_GUIDES object

---

## Required Updates to API Spec

Add clarification to `POST /auth/brand/{brand}/connect` OAuth response:

```markdown
**Response `200` for OAuth start (initial call without code):**
```json
{
  "auth_url": "https://tuya.com/oauth/authorize?...",
  "state": "random_state_string",
  "qr_code_svg": "<svg>...</svg>",  // Optional
  "qr_code_url": "https://...",      // Optional
  "message": "Please scan QR code or visit auth_url"
}
```

Current spec doesn't show what `/connect` returns for OAuth without code.
```

---

## Implementation Plan

### Priority 1 (Must Fix - Blocking)
1. Fix button visibility (`.hidden` → `style.display`)
2. Fix credential payload format (wrap in `{ auth_type, credentials }`)
3. Fix disconnect endpoint (`DELETE` → `POST /disconnect`)
4. Fix credential field names to match spec

### Priority 2 (Should Implement)
1. Add test credentials functionality (call `/test` endpoint)
2. Add error handling for test response

### Priority 3 (Nice to Have)
1. Add setup guide loading from backend
2. Add brand metadata loading from backend
3. Refactor hardcoded data

---

## Final Assessment

**Can I implement without backend changes?**
- Mostly YES, but need clarification on:
  1. OAuth response format (QR code fields)
  2. Credential field names (bridge_ip vs device_ip)

**Blocking Issues:**
1. Disconnect endpoint uses wrong HTTP method in frontend
2. Credential payload format doesn't match spec
3. Test credentials endpoint not called by frontend

**All API endpoints exist** - Just need to fix how frontend calls them.
