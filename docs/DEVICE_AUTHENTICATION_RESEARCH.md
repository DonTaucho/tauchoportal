# Device Authentication Research: OAuth vs. API Key Approaches

**Goal:** Move from manual API key/token pasting to user-login-based device discovery and control.

**Research Date:** June 14, 2026  
**Coverage:** 10 smart device brands in your system

---

## Executive Summary

### The Verdict: **3 Tiers of Implementation**

| Tier | Brands | Approach | Complexity | UX Score |
|------|--------|----------|-----------|----------|
| **🟢 Login-Only (Ideal)** | **Tuya** | QR code OAuth + cloud device list | Medium | ⭐⭐⭐⭐⭐ |
| **🟡 Hybrid (Good)** | Govee, LIFX, Philips Hue | One-time paste, then auto-discovery | Low-Medium | ⭐⭐⭐⭐ |
| **🔴 Local-Only (Compromised)** | Nanoleaf, Yeelight, TP-Link, WLED | LAN discovery only, no cloud | Medium-High | ⭐⭐⭐ |
| **❌ Not Feasible** | Amazon Alexa, Wyze | Wrong paradigm or unstable API | — | — |

---

## Detailed Breakdown

### 🟢 TIER 1: Login-Only (Cloud OAuth + Auto Device Discovery)

#### **Tuya** ⭐ RECOMMENDED (Feasibility: 4/5)

**Authentication Flow:**
```
User Flow:
1. You register app on platform.tuya.com → get client_id
2. App generates QR code
3. User scans QR with Smart Life or Tuya app (on their phone)
4. App polls for auth result → returns access_token + refresh_token + uid
5. App uses token to list all user's devices from Tuya cloud
6. User never enters their Tuya password — OAuth handled entirely by the app
```

**Post-Auth Capabilities:**
- ✅ **Device Discovery:** `GET /v1.0/users/{uid}/devices` → returns all devices with:
  - Device ID, name, category (light, switch, plug, etc.), online status
  - Full property list (brightness, color, temperature, modes)
  - Product model
- ✅ **Device Control:** `POST /v1.0/devices/{device_id}/commands`
- ✅ **Device Status:** `GET /v1.0/devices/{device_id}/status`
- ✅ **Region-aware:** Login response includes regional cloud endpoint (US, EU, China, India)

**What Users See:**
```
[Login with Tuya]
  → Opens Smart Life app with in-app browser or OAuth popup
  → "Allow app to access your devices?" [Approve/Deny]
  → Returns to app with device list pre-populated
  → No API keys, no passwords in your system
  → No copy/pasting
```

**Key Parameters Auto-Discovered:**
- Device ID ✅
- Device type ✅  
- Capabilities (brightness range, color modes, temperature range) ✅
- Regional endpoint ✅

**Gotchas:**
- ⚠️ **Requires your developer account** at platform.tuya.com
  - You must register your app and get a `client_id`
  - Users cannot self-register with Tuya — they must use their Smart Life or Tuya app
- ⚠️ **Tiered API pricing:**
  - Free tier: limited calls/day (community reports ~1000-2000 calls/day)
  - Commercial tiers: scaled pricing based on volume
  - **Need to check Tuya IoT pricing page for production use**
- ⚠️ **White-label ecosystem:** Thousands of brands (Amazon Basics smart home, etc.) use Tuya firmware but with different apps
  - If you support Tuya, you automatically support many white-label brands
- ⚠️ **Token refresh:** Tokens are long-lived but will expire — need refresh endpoint
- ⚠️ **Data residency:** Some regions have data residency requirements

**Implementation Effort:** Medium
- Backend: Use Tuya IoT SDK, handle token refresh, store encrypted tokens
- Frontend: OAuth redirect handling (fairly standard)
- Testing: Need Tuya developer account + test devices

**Recommendation:** ✅ **PRIMARY recommendation for "login-only" flow**

---

### 🟡 TIER 2: Hybrid (One-Time Paste + Auto Discovery)

These brands require **one manual copy/paste step**, but after that, device discovery and control are fully automated.

#### **Govee** (Feasibility: 3/5)

**Authentication:**
- User: Open Govee Home app → Settings → "Apply for API Key" → API key emailed
- User: Paste API key into your app
- App: Stores key in database, uses for all future calls

**Device Discovery:**
- `GET https://openapi.api.govee.com/router/api/v1/user/devices`
- Returns all devices with:
  - SKU (product model) ✅
  - Device ID (MAC format) ✅
  - Full capability schema (brightness range, color modes, scenes) ✅

**Key Parameters Auto-Discovered:**
- Device SKU ✅
- Device MAC ✅
- Capabilities ✅

**What Users See:**
```
Paste Govee API Key
[__________________________]
[Authorize]
  → Lists your Govee devices
  → Let us use these? [Yes / No]
```

**Gotchas:**
- ⚠️ **API key policy changed (May 2026):** Only ONE active API key per account at a time
  - If user creates a new key, previous key is invalidated
  - In a multi-user production app, this is problematic (can't have separate keys per integration)
  - Workaround: Document that user must not generate new keys while the app is active
- ⚠️ **Beta API status:** No SLA; Govee can change/deprecate at any time
- ⚠️ **Rate limiting:** ~10 req/sec (undocumented)
- No local fallback

**Implementation Effort:** Low-Medium
- Store API key (encrypted)
- Call REST API to discover devices
- No OAuth flow needed — straight token auth

**Recommendation:** ✅ **Good for immediate implementation** (low complexity)

---

#### **LIFX** (Feasibility: 3/5)

**Authentication:**
- User: Visit [cloud.lifx.com/settings](https://cloud.lifx.com/settings) → Generate Personal Token
- User: Paste token into your app
- App: Stores token, uses for all future calls

**Device Discovery:**
- `GET https://api.lifx.com/v1/lights/all`
- Header: `Authorization: Bearer {token}`
- Returns all lights with:
  - Device ID (serial number) ✅
  - Device name ✅
  - Current state (power, brightness, color, temperature) ✅
  - Group and location info ✅
  - Product model with capability flags ✅

**Key Parameters Auto-Discovered:**
- Device ID ✅
- Group ID (if organized) ✅
- Location ID (if organized) ✅
- Capabilities (color, variable CT, etc.) ✅

**What Users See:**
```
LIFX Cloud Token
[Generate at cloud.lifx.com/settings]
[_________________________]
[Authorize]
  → Lists your LIFX devices
  → Let us use these? [Yes / No]
```

**Gotchas:**
- ⚠️ **No OAuth redirect flow:** Tokens are manually generated in the LIFX web UI
  - Cannot programmatically initiate a login from your app
  - No API endpoint to request a token — manual UI step required
- ⚠️ **Devices must be cloud-connected:** No local fallback
- ⚠️ **Future uncertainty:** LIFX was acquired by Feit Electric (2020)
  - Cloud API viability uncertain long-term
  - Some community concerns about API sustainability
- Rate limiting: Undocumented but community reports ~120 req/minute

**Implementation Effort:** Low
- Store Bearer token (encrypted)
- Call REST API to list and control devices
- Clean, well-documented API

**Recommendation:** ✅ **Excellent option** if user is willing to generate token manually once

---

#### **Philips Hue** (Feasibility: 3/5 for local; 4/5 if approved for remote OAuth)

**Two approaches:**

**Local API (Always Available):**
- Device: Hue Bridge (hardware required, ~$60)
- Setup: Discover bridge IP via mDNS or [discovery.meethue.com](https://discovery.meethue.com)
- Auth: Press physical button on bridge
- Access: Local HTTPS API from same network

**Remote API (Gated Behind Approval):**
- Requires: Signify developer account approval (not automatic)
- Access: Cloud API from anywhere

**Device Discovery (Local):**
- `GET https://{bridge_ip}/api/{app_key}/lights`
- Returns all lights with state, color, brightness, etc.

**Key Parameters Auto-Discovered:**
- Light ID ✅
- Capabilities ✅

**What Users See (Local):**
```
Press the Link button on your Hue Bridge
[Waiting for button press...]
  → Discovers bridge IP
  → Presses button → gets app key
  → Lists devices from local bridge
```

**Gotchas:**
- ⚠️ **Hardware required:** Hue Bridge (~$60 USD) — no bridge, no API
- ⚠️ **Remote OAuth is gated:** Must apply to Signify, approval process unknown (could take weeks)
- ⚠️ **Local only means LAN access:** Bridge must be accessible from your app server
  - If server is cloud, you'd need user to run a local agent or port-forward
- ⚠️ **Self-signed certs on bridge:** Must disable SSL verification or accept cert
- Rate limiting: ~10 commands/sec (well documented)

**Implementation Effort:** Medium (for local) to High (awaiting remote OAuth approval)
- Local discovery via mDNS or HTTP call to discovery service
- Button pairing flow
- Bridge communication (self-signed certs)

**Recommendation:** ⚠️ **Local works now; remote OAuth uncertain**

---

### 🔴 TIER 3: Local-Only (No Cloud, LAN Discovery Required)

These brands **do not have cloud device listing APIs**. Device discovery is limited to local network scanning.

#### **Nanoleaf** (Feasibility: 2/5)

**Authentication:**
- Device: Physical button press for 5 seconds (enter pairing mode)
- Setup: POST to local device → get auth token
- Access: Local HTTP only

**How it works:**
1. User presses button on Nanoleaf device
2. While blinking, POST to `http://{device_ip}:16021/api/v1/new` → get token
3. All future calls use token

**Device Discovery:**
- Via mDNS: `_nanoleafapi._tcp.local.`
- User must be on same LAN
- No central cloud registry

**Gotchas:**
- ⚠️ **Purely local** — no cloud component
- ⚠️ **No remote access** — can't control from outside home network
- ⚠️ **Physical button required** — for each device
- ⚠️ **Same-LAN requirement** — your app must be able to reach device IP

**Not suitable for "login-only" user flow** — requires physical interaction with device.

**Recommendation:** ❌ **Not recommended for your use case**

---

#### **Yeelight** (Feasibility: 2/5)

**Authentication:**
- No auth required (open LAN HTTP)
- User must enable "LAN Control" in Yeelight app first

**Device Discovery:**
- Via SSDP multicast on local network
- User must be on same LAN

**How it works:**
1. SSDP discovery finds devices: `yeelight://192.168.1.x:55443`
2. Connect via unencrypted TCP/JSON
3. Send JSON commands directly

**Gotchas:**
- ⚠️ **User must enable LAN Control** — disabled by default
- ⚠️ **Unencrypted protocol** — passwords/sensitive data on LAN visible to packet sniffers
- ⚠️ **No cloud API** — Xiaomi/Yeelight does not offer 3rd-party cloud access
- ⚠️ **Same-LAN requirement** — must be on same network as devices

**Not suitable for "login-only" user flow.**

**Recommendation:** ❌ **Not recommended for your use case**

---

#### **TP-Link Kasa/Tapo** (Feasibility: 2/5)

**Authentication:**
- Local: No auth (older Kasa devices)
- Cloud: Email + password for newer Tapo devices (but still requires local access)
- Note: No public cloud API for device listing

**Device Discovery:**
- Via UDP broadcast on LAN
- Devices respond with IP, model, firmware
- No central cloud registry

**Key Parameters:**
- Device IP ✅ (discovered locally)
- Device MAC ✅ (discovered locally)
- For newer Tapo devices: user email/password needed (but still local control)

**Gotchas:**
- ⚠️ **No public cloud API** — TP-Link has not opened their cloud for 3rd parties
- ⚠️ **Same-LAN requirement** — local discovery only
- ⚠️ **Newer Tapo devices require credentials** — but for local use, not cloud
- ⚠️ **python-kasa is community reverse-engineering** — no official support

**Not suitable for "login-only" user flow.**

**Recommendation:** ❌ **Not recommended for your use case**

---

#### **WLED** (Feasibility: 1/5)

**Authentication:**
- None — open HTTP API
- Optional: HTTP basic auth password (disabled by default)

**Device Discovery:**
- No cloud registry at all
- Must know device IP or scan LAN for mDNS

**What WLED is:**
- Open-source firmware for ESP32/ESP8266
- Controlled directly by users on their own servers
- No company, no cloud, no user accounts

**Gotchas:**
- ⚠️ **No user accounts** — each device is independent
- ⚠️ **No cloud API** — purely local HTTP
- ⚠️ **User must know/enter device IP** — no auto-discovery

**Not suitable for "login-only" user flow.**

**Recommendation:** ❌ **Not recommended for your use case** (unless you want to support DIY users with local IPs)

---

### ❌ NOT FEASIBLE

#### **Amazon Alexa** (Feasibility: 1/5)

**Why it's different:**
Alexa is not a device brand with a cloud API you query. It's a *development platform*.

**The paradigm:**
- You build a "Skill" that runs on Amazon's infrastructure (Lambda)
- Alexa calls *your* Skill to discover devices and execute commands
- You integrate with device brands (Govee, LIFX, etc.) *inside* your Skill

**This is backwards from what you need:**
- You want: "User logs in with brand X, we list their devices"
- Alexa model: "User links Skill to their account, Skill discovers devices"

**Not suitable for your architecture.**

**Recommendation:** ❌ **Separate from device cloud integration** (if you want Alexa support later, it's a different feature layer)

---

#### **Wyze** (Feasibility: 2/5)

**Why it's not recommended:**
- Reverse-engineered unofficial API (Wyze has not published docs)
- Can break with any app update
- Developer portal documentation returns 404s
- Rate limiting on auth attempts
- 2FA friction (TOTP must be provided; SMS/email not automatable)
- No token refresh endpoint documented
- Developer program appears to be in flux

**You could implement it, but:**
- High maintenance burden if Wyze changes API
- Risk of your app breaking suddenly
- No official support channel

**Recommendation:** ⚠️ **Last resort if needed by users; not a primary focus**

---

## Recommendation Matrix

### **For Implementation Priority:**

```
Priority 1 (Do First):
├─ Tuya (4/5) — Best "login-only" experience
└─ Govee (3/5) — Easiest implementation (low complexity)

Priority 2 (Do Next):
├─ LIFX (3/5) — Clean API, once token is provided
└─ Philips Hue (3/5) — Wait for local implementation or Signify approval

Priority 3 (Consider Later):
├─ Nanoleaf (2/5) — If you need LAN-only discovery
├─ Yeelight (2/5) — If you need LAN-only discovery
└─ TP-Link Kasa (2/5) — If you need LAN-only discovery

Do Not Implement:
├─ WLED — No user accounts; purely local
├─ Amazon Alexa — Wrong paradigm (platform, not cloud)
└─ Wyze — Unstable reverse-engineered API
```

---

## Implementation Roadmap

### **Phase 1: Tuya (Recommended First)**

```go
// User workflow:
1. POST /auth/brand-login?provider=tuya
   → Generate QR code via Tuya SDK
   → Return QR code to frontend

2. [Frontend] User scans QR with Smart Life app
   → OAuth flow happens in their app

3. User returns to your app with auth code
   → POST /auth/brand-login/callback?code=XXX
   → Backend exchanges code for access_token + refresh_token
   → Backend lists user's devices from Tuya cloud
   → User selects devices they want to control

4. Selected devices stored with encrypted Tuya credential reference
   → No API keys in your database — just Tuya device IDs
   → All control uses stored Tuya token (not user's password)
```

**Database Changes:**
- `oauth_accounts` table: Add `provider_user_id` (Tuya UID), `refresh_token`
- `device_credentials` table: Reference `oauth_accounts` entry instead of storing API key

**API Changes:**
- `GET /platform/tuya/qr` — Generate QR code
- `POST /platform/tuya/callback` — Handle auth callback
- `GET /platform/tuya/devices` — List user's Tuya devices (uses stored token)

**Pros:**
- ✅ No API key pasting
- ✅ Token refresh handled automatically
- ✅ Massive device ecosystem (white-label brands included)
- ✅ Standard OAuth flow (portable knowledge)

---

### **Phase 2: Govee & LIFX (Similar Implementation)**

```go
// User workflow:
1. Paste API key / Personal token into your app
   → Backend calls `/devices` endpoint
   → Lists devices with auto-discovered parameters
   → User selects devices

2. Stored key used for all control commands
   → Token refresh not needed (long-lived tokens)
   → No user password in your database
```

**Pros:**
- ✅ Low implementation complexity
- ✅ Clean REST APIs
- ✅ Complete capability auto-discovery
- ✅ Can be done in parallel with Tuya

---

### **Phase 3: Philips Hue Local**

```go
// User workflow:
1. System auto-discovers bridge (mDNS or HTTP call)
   OR user enters bridge IP manually
2. User presses button on bridge
3. System gets app key and lists devices
4. User selects devices to control
```

**Pros:**
- ✅ Works without approval
- ✅ Excellent capability discovery
- ✅ Reliable local API

**Cons:**
- ⚠️ Requires LAN access
- ⚠️ Requires hardware purchase

---

## Updated Device Credential Model

Instead of:
```go
type UserDeviceCredential struct {
    ApiKey string  // ❌ User had to paste this
    Token string   // ❌ User had to generate this
}
```

Consider:
```go
type UserDeviceCredential struct {
    // For OAuth providers (Tuya):
    OAuthProviderID string    // e.g., "tuya"
    OAuthAccountID  string    // FK → oauth_accounts.id
    RefreshToken    string    // For token refresh
    
    // For static token/key providers (Govee, LIFX):
    ApiKey          string    // OR:
    BearerToken     string    // OR:
    PersonalToken   string
    
    // Brand-specific non-sensitive metadata:
    DeviceModel     string    // Auto-discovered
    Capabilities    []string  // Auto-discovered
}
```

---

## Questions for You

1. **Tuya Developer Account:** Do you have or can you create an account at platform.tuya.com?
   - This is required to get a `client_id` for the QR login flow

2. **Token Storage:** How will you encrypt the stored tokens/API keys?
   - Environment variable KMS key? AWS KMS? Application-level encryption?

3. **Regional Support:** For Tuya, do you want to support multiple regions?
   - Tuya provides regional endpoints; important for users outside US/EU

4. **Rate Limiting:** Should you implement request throttling per brand?
   - Some brands have stricter quotas than others

5. **Fallback Strategy:** For brands with local-only APIs (Hue, Kasa), do you want to:
   - a) Require LAN access (run agent on home network)
   - b) Skip local-only brands entirely
   - c) Require manual IP entry

---

## References & Sources

- **Tuya IoT Platform:** https://platform.tuya.com
- **Govee OpenAPI:** https://developer.govee.com
- **LIFX Cloud API:** https://api.developer.lifx.com
- **Philips Hue Developers:** https://developers.meethue.com
- **Home Assistant Integration Configs:** (gold standard for reverse-engineering undocumented APIs)
  - kasa, tuya, hue, lifx, nanoleaf, wyze, yeelight: https://github.com/home-assistant/core/tree/dev/homeassistant/components
