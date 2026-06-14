# Device Authentication: Action Plan & Next Steps

**Goal:** Transition from API key pasting to cloud OAuth + auto device discovery

---

## Summary of Findings

| Tier | Brands | Best For | Implementation |
|------|--------|----------|---|
| **🟢 Login-Only** | **Tuya** | Ideal UX, massive ecosystem | Medium (OAuth 2.0) |
| **🟡 Hybrid** | Govee, LIFX, Hue | Good balance | Low-Medium |
| **🔴 Local** | Nanoleaf, Yeelight, Kasa | Not for cloud service | Medium-High |
| **❌ N/A** | Alexa, WLED, Wyze | Not recommended | — |

---

## Immediate Actions (This Week)

### Action 1: Decide Implementation Scope
Choose which brands to prioritize:

**Option A: Login-First (Recommended)**
- Implement Tuya + Govee + LIFX
- 80% of users' needs covered
- Best UX with Tuya, easiest with Govee

**Option B: Gradual (Conservative)**
- Start with Govee (easiest, low risk)
- Add Tuya when you have developer account
- Add others gradually

**Option C: Comprehensive**
- Tuya + Govee + LIFX + Philips Hue (local)
- More work but covers most popular brands

**→ Choose one and document in `DEVICE_AUTH_ROADMAP.md`**

---

### Action 2: Register Developer Accounts

**For Tuya (if you choose Option A or C):**
1. Go to https://platform.tuya.com
2. Sign up for developer account
3. Create an app project → note down `client_id`
4. Request access to "Device Discovery" API
5. Note regional endpoints (US, EU, CN, etc.)
6. **Approximate time:** 15 minutes signup + await approval (usually instant)

**For Govee (easy integration):**
1. No developer account needed
2. Users apply for API key in Govee Home app
3. Document this in your UI

**For LIFX (optional):**
1. No developer account needed
2. Users generate personal token at https://cloud.lifx.com/settings
3. Document this in your UI

---

### Action 3: Research Decision Questions

Answer these questions and document in your project:

1. **Token Storage:**
   - Where will encrypted tokens/API keys be stored?
   - Will you use database + encryption key from environment?
   - Or external KMS (AWS KMS, Vault)?
   - **Recommendation:** Database + environment variable key (simple) or AWS KMS (production)

2. **Rate Limiting:**
   - Tuya free tier quota?
   - Should you implement per-brand throttling?
   - **Recommendation:** Check Tuya pricing page, implement basic throttling

3. **Token Refresh Strategy:**
   - For Tuya: refresh on expiry automatically?
   - When to refresh? Before each request, or on background interval?
   - **Recommendation:** Refresh on expiry before request (lazy approach)

4. **Fallback Strategy (if OAuth fails):**
   - Show "try manual API key" option?
   - Or error out?
   - **Recommendation:** Error out for now, add fallback in Phase 2

5. **Regional Support:**
   - Support only US/EU?
   - Or all Tuya regions (CN, India)?
   - **Recommendation:** Start with US/EU, expand if needed

---

## Database Schema Changes Needed

### New Tables

```sql
-- For OAuth providers (Tuya, future platforms)
CREATE TABLE oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL FK users(id) CASCADE DELETE,
  provider VARCHAR(50), -- "tuya", "lifx", etc.
  provider_user_id VARCHAR(255), -- Tuya UID
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Link devices to OAuth accounts
ALTER TABLE device_credentials ADD COLUMN oauth_account_id INT FK oauth_accounts(id);
-- Then users.device.provider can reference oauth_accounts instead of storing keys directly
```

### Updated device_credentials

```sql
-- Now supports:
-- 1. OAuth-based (reference oauth_accounts)
-- 2. Token-based (LIFX personal token)
-- 3. API key-based (Govee API key)

ALTER TABLE device_credentials ADD COLUMN oauth_account_id INT FK oauth_accounts(id);
-- If oauth_account_id is set, use that for auth
-- Otherwise, use api_key / bearer_token / etc.
```

---

## API Endpoint Changes Needed

### New Authentication Endpoints

```
GET  /auth/brand-login/tuya
     Generate QR code or OAuth URL
     Returns: { qr_url: "...", or login_url: "..." }

POST /auth/brand-login/tuya/callback?code=XXX
     Exchange auth code for tokens
     Returns: { status: "success", devices: [...] }

GET  /auth/brand-login/tuya/devices
     List currently authenticated user's Tuya devices
     Returns: { devices: [{id, name, category, capabilities}] }

DELETE /auth/brand-login/tuya
     Unlink Tuya account from user
```

### Updated Device Endpoints

```
POST /devices
     BEFORE: { brand: "tuya", api_key: "...", device_id: "..." }
     AFTER:  { brand: "tuya", oauth_device_id: "...", name: "My Light" }
             Device registration now references oauth_account_id, not raw API key

GET /devices
    No change (still returns device list)
    Behind the scenes: looks up credentials via oauth_accounts if oauth-based
```

---

## Implementation Phases

### Phase 1: Tuya (Weeks 1-2)

**What you'll build:**
1. OAuth flow endpoints (QR code or redirect)
2. Token storage (encrypt in database)
3. Device discovery (call Tuya API)
4. Device creation (store reference to oauth_account)
5. Device control (use stored token)

**Files to create:**
- `internal/api/brand_auth_handlers.go` — OAuth endpoints
- `internal/provider/tuya_oauth.go` — Tuya SDK wrapper
- `internal/store/sql_oauth_accounts_store.go` — Token storage

**Database migrations:**
- Add `oauth_accounts` table
- Alter `device_credentials` table

**Testing:**
- Tuya test account + test devices (or simulator)

**Effort:** 3-4 days (OAuth flow + API integration)

---

### Phase 2: Govee & LIFX (Weeks 3-4)

**What you'll build:**
1. Token input UI endpoints (simple token paste)
2. Device discovery API calls
3. Device registration flow

**Similar to Tuya but simpler** (no OAuth redirect, just token copy/paste)

**Effort:** 2-3 days (simpler than Tuya)

---

### Phase 3: Philips Hue Local (Week 5+)

**What you'll build:**
1. mDNS bridge discovery
2. Bridge button pairing flow
3. Local device listing

**Only if users demand LAN support**

**Effort:** 2-3 days

---

## Testing Checklist

### For Tuya:
- [ ] Can register app on platform.tuya.com
- [ ] Can generate QR code
- [ ] Can scan QR with Smart Life app
- [ ] Can receive callback with auth code
- [ ] Can exchange code for tokens
- [ ] Can list user's devices from Tuya cloud
- [ ] Tokens persist across server restart
- [ ] Token refresh works when expired
- [ ] Device control executes via Tuya API
- [ ] Tokens are encrypted in database

### For Govee:
- [ ] User can paste API key
- [ ] Can list Govee devices with API key
- [ ] Device discovery includes all capabilities
- [ ] Device control works via discovered parameters

### For LIFX:
- [ ] User can paste personal token
- [ ] Can list LIFX devices
- [ ] Device discovery includes groups/locations
- [ ] Device control works

---

## Questions to Answer Before Starting

1. **Tuya Developer Account:** Will you create one? When?
2. **Encryption:** Database encryption, or external KMS?
3. **Regional Support:** US-only or multi-region (China, India)?
4. **Timeline:** Start this week? Next sprint?
5. **User Communication:** How will you tell users about this change?

---

## Rough Effort Estimate

| Task | Effort | Notes |
|------|--------|-------|
| Tuya OAuth implementation | 3-4 days | Includes token storage, refresh, discovery |
| Govee API key + discovery | 1-2 days | Similar pattern to LIFX |
| LIFX token + discovery | 1-2 days | Simpler OAuth-like flow |
| Database migrations + testing | 1 day | Schema changes, data migrations |
| Documentation & frontend integration | 1-2 days | API docs, Postman collection |
| **Total** | **7-11 days** | Or 2 weeks with other work |

---

## Decision Framework

**Choose Tier 1 (Tuya) if:**
- ✅ You want best user experience (no API key pasting)
- ✅ You're willing to register developer account
- ✅ You can handle OAuth complexity
- ✅ Massive device ecosystem is appealing

**Choose Tier 2 (Govee + LIFX) if:**
- ✅ You want simple implementation
- ✅ User expects to paste tokens (okay with UX)
- ✅ Want to avoid OAuth complexity
- ✅ Time-constrained

**Choose Tier 1 + 2 if:**
- ✅ Resources available for both
- ✅ Want coverage across multiple brands
- ✅ Can phase implementation

---

## Next Steps

1. **Read:** Full research document (`DEVICE_AUTHENTICATION_RESEARCH.md`)
2. **Decide:** Which tier/brands to implement (Action Plan section above)
3. **Register:** Tuya developer account (if choosing Tuya)
4. **Design:** Database schema changes with team
5. **Plan:** Implementation phases in sprint backlog
6. **Implement:** Start with Phase 1 (Tuya) or Phase 2 (Govee)

---

## Resources

- Tuya IoT Platform: https://platform.tuya.com
- Govee OpenAPI: https://developer.govee.com
- LIFX Cloud API: https://api.developer.lifx.com
- Full research: `DEVICE_AUTHENTICATION_RESEARCH.md` (in this folder)
- Quick comparison: `DEVICE_AUTH_COMPARISON.txt` (in this folder)
