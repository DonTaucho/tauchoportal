# Session Summary - OAuth Research & Brand Settings Architecture

**Date:** 2026-07-25  
**Focus:** OAuth implementation research + clarify brand vs device authentication  
**Outcome:** Complete specifications ready for API backend implementation

---

## 🎯 What Was Accomplished

### 1. ✅ OAuth Research (via background agent)
**Research Agent Results:**
- Standard OAuth 2.0 response formats documented
- QR code encoding patterns for device flows
- Tuya OAuth flow specifics (QR login vs standard OAuth)
- Govee (no OAuth — API key only)
- PKCE + state handling for CSRF protection
- Device Authorization Grant (RFC 8628) reference

**Key Findings:**
- Your current response format is correct: `{ auth_url }`
- Extended format with state: `{ auth_url, state, expires_in }`
- QR codes: Base64-encoded PNG in JSON (`data:image/png;base64,...`)
- Tuya uses proprietary QR login PLUS standard OAuth
- Govee is API key only — no OAuth needed

**Result:** `/docs/OAUTH-RESEARCH-SUMMARY.md`

---

### 2. ✅ Brand vs Device Clarification
**Problem Identified:**
Current code conflates two separate concepts:
- Brand-level auth: User's account with the service (needs 1 per user per brand)
- Device-level config: Which device to control (can be multiple per brand)

**Current Bugs:**
| Brand | Current | Wrong | Should Be |
|-------|---------|-------|-----------|
| Govee | Asks: api_key + device_mac | Device MAC in brand creds | Only api_key |
| Hue | Asks: bridge_ip + token + light_id | Light ID in brand creds | Only bridge_ip + token |
| Tuya | Asks: OAuth + device_id | Device ID in brand creds | Only OAuth |
| Nanoleaf | Asks: device_ip | Device IP in brand creds | No brand creds (per-device) |

**Correct Architecture:**
```
┌─────────────────────┐                  ┌──────────────────┐
│ Brand Credentials   │                  │ Device Config    │
│ (one per user+brand)│                  │ (per device)     │
├─────────────────────┤                  ├──────────────────┤
│ api_key: "..."      │                  │ device_id: "..." │
│ bridge_ip: "192.." │                  │ device_name      │
│ oauth_token: "..."  │                  │ device_ip: "..." │
└─────────────────────┘                  └──────────────────┘
     (Brand Setup)                        (Device Setup)
     (Once per brand)                     (Multiple allowed)
```

**Result:** `/docs/BRAND-VS-DEVICE-AUTH-SPECIFICATION.md` (20KB, comprehensive)

---

### 3. ✅ Implementation Specifications Created

#### A. Database Schema Requirements
- `brand_credentials` table — user's account auth with brand
- `oauth_sessions` table — temporary PKCE/state storage
- Updated `devices` table — device identifiers and locations

#### B. API Endpoint Specifications
```
POST /auth/brand/{brand_id}/connect       → Start/save brand auth
POST /auth/brand/{brand_id}/oauth-callback → Handle OAuth code exchange
POST /auth/brand/{brand_id}/test          → Validate credentials
POST /auth/brand/{brand_id}/disconnect    → Remove brand auth
GET  /auth/brands                         → List brand status
GET  /auth/brands/{brand_id}              → Detailed brand info
```

Each with:
- Request/response formats (JSON examples)
- Implementation steps
- Error handling
- Security considerations

#### C. OAuth Flow Details
- Standard OAuth 2.0 code flow
- PKCE implementation (state + code_verifier)
- Tuya QR login pattern
- Token refresh strategy
- CSRF protection via state token

#### D. Field Naming Standards
Standardized `snake_case` JSON field names:
- `api_key` (not apikey, api-key, token)
- `bridge_ip` (not device_ip, ip)
- `oauth_token`, `oauth_refresh_token`, `oauth_scope`
- `state_token`, `code_verifier`

**Results:**
- `/docs/OAUTH-RESEARCH-SUMMARY.md` — OAuth patterns
- `/docs/OAUTH-IMPLEMENTATION-CHECKLIST.md` — Database + endpoint checklist
- `/docs/API-BACKEND-REQUIREMENTS.md` — Ready-to-share with API team

---

## 🔴 Current Issues Found

### Issue #1: Device Fields in Brand Setup Guides
**Location:** `/public/js/brand-settings.js` lines 27-140

Device-specific fields mixed into brand credential setup:
```javascript
'govee': {
  helpFields: {
    'api_key': 'Your Govee API key',
    'device_id': '← WRONG - belongs in device setup' 
  }
}
```

**Fix:** Remove all device-specific fields from SETUP_GUIDES

### Issue #2: No Brand/Device Separation in Setup Flow
**Location:** `/templates/pages/brand-settings.html`

Current modal tries to collect both brand AND device info in one dialog.

**Fix:** 
- Modal 1: Brand credentials only
- Modal/Page 2: Device configuration (separate concern)

### Issue #3: Field Name Mapping Fragility
**Location:** `/public/js/brand-settings.js` lines 671-814

Current code uses fallback logic to handle different field names:
```javascript
bridge_ip: wizardCredentials.device_ip || wizardCredentials.bridge_ip
```

**Fix:** Normalize field names in form generation (use correct names from start)

### Issue #4: No OAuth State Management
**Status:** Found, but expected to be backend concern

OAuth `state` token needed for CSRF protection is not being handled properly.

**Fix:** Backend should generate and validate state tokens

---

## 🟡 Questions for API Team

Before implementing frontend, we need backend clarification:

1. **Existing Endpoints?**
   - Do `POST /auth/brand/{brand}/connect`, etc. already exist?
   - If so, what's current implementation?

2. **OAuth Credentials?**
   - Do we have Tuya OAuth `client_id` and `client_secret`?
   - What redirect URI should be registered?

3. **Database Schema?**
   - Is `brand_credentials` table already created?
   - How are sensitive fields encrypted?

4. **Token Refresh?**
   - Should expired OAuth tokens refresh automatically?
   - Or require user re-authentication?

5. **Device API Response Format?**
   - When listing devices, what field names does each brand API use?
   - Need consistency across brands

---

## 📚 Documentation Created

| Document | Purpose | Size | Status |
|----------|---------|------|--------|
| BRAND-VS-DEVICE-AUTH-SPECIFICATION.md | Comprehensive arch + examples | 20KB | ✅ Ready |
| OAUTH-RESEARCH-SUMMARY.md | Research findings + patterns | 3KB | ✅ Ready |
| OAUTH-IMPLEMENTATION-CHECKLIST.md | Database + endpoint checklist | 12KB | ✅ Ready |
| API-BACKEND-REQUIREMENTS.md | Ready for API team | 12KB | ✅ Ready |
| BRAND-SETTINGS-ADDITIONAL-ISSUES.md | 9 issues found + priority | 8KB | ✅ Ready |
| (Previous) BRAND-SETTINGS-API-REQUIREMENTS.md | Earlier analysis | — | Reference |

---

## 🔧 Frontend Implementation Status

### Ready to Implement:
- [ ] Remove device fields from SETUP_GUIDES (Govee, Hue, Tuya, etc.)
- [ ] Refactor setup modal to ask ONLY for brand-level auth
- [ ] Update field mapping in buildCredentialsPayload()

### Blocked on Backend:
- [ ] OAuth flow (needs backend endpoints)
- [ ] OAuth callback handling (needs backend `/oauth-callback`)
- [ ] Device list retrieval (needs backend `/devices` or `/test` response)

---

## 🚀 Next Steps

### For Frontend (Your Team):
1. **Review** `/docs/BRAND-VS-DEVICE-AUTH-SPECIFICATION.md`
   - Ensure you agree with brand vs device separation
   - If not, discuss before proceeding

2. **Get API Team Review**
   - Share `/docs/API-BACKEND-REQUIREMENTS.md`
   - Discuss which endpoints already exist
   - Clarify OAuth credentials, database schema, encryption

3. **Once API team responds:**
   - Update frontend to remove device fields
   - Test with actual backend endpoints
   - Implement OAuth callback handling

### For API Team:
- Review `/docs/API-BACKEND-REQUIREMENTS.md`
- Confirm implementation status of 6 endpoints
- Clarify OAuth and encryption strategy
- Build missing endpoints

---

## ⏭️ Session Todos

| Todo | Status | Notes |
|------|--------|-------|
| OAuth Research | ✅ Done | Research agent completed |
| Brand vs Device Clarification | ✅ Done | Full spec created |
| API Backend Requirements Doc | ✅ Done | Ready for API team |
| Get API Team Clarification | ⏳ Pending | Need responses on 5 questions |
| Fix Frontend Setup Guides | ⏰ Blocked | Waiting for API clarification |
| Implement Backend Endpoints | ⏰ Blocked | API team work |

---

## 💾 Key Files for Reference

**You Should Review:**
1. `/docs/BRAND-VS-DEVICE-AUTH-SPECIFICATION.md` — Read full architecture
2. `/docs/API-BACKEND-REQUIREMENTS.md` — Share with API team
3. `/docs/OAUTH-IMPLEMENTATION-CHECKLIST.md` — Implementation guide

**Already Exist (from prior sessions):**
- `/public/js/brand-settings.js` — Needs device field removal
- `/templates/pages/brand-settings.html` — Needs modal refactoring
- `/docs/api-spec.md` — Source of truth for endpoints

---

## 🎓 Key Learnings

1. **OAuth has multiple patterns:** Standard code flow, device flow, QR login — each has different response format
2. **Smart home services vary:** Govee is API key only, Tuya has OAuth + QR, local devices have no auth
3. **PKCE is important:** Even for server-side OAuth, use `code_verifier` to prevent authorization code interception
4. **State token prevents CSRF:** Must be random, short-lived (5-10 min), verified on callback
5. **Backend is the OAuth client:** Frontend just displays URLs/QR codes, backend handles token exchange
6. **Separation of concerns:** Brand auth ≠ device config — should be separate tables and setup flows

---

## 📊 Effort Estimate

**Frontend Changes:** 1-2 hours
- Remove device fields from guides
- Update field mapping
- Test with mock data

**Backend Implementation:** 3-5 days (for API team)
- Database schema
- 6 endpoints (connect, test, disconnect, oauth-callback, list, detail)
- OAuth flow
- Testing

**Total:** ~1 week for full implementation

---

**Generated:** 2026-07-25T20:34:17Z  
**Agent:** Research + Claude Copilot  
**Status:** Ready for next phase (API team implementation)
