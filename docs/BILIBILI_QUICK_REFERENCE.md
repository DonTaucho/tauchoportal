# Bilibili QR Code Login - Quick Reference

## What Was Built (Backend)

✅ Complete backend implementation in `internal/bilibili/`:

### 1. **client.go** - Bilibili API Client
- `GenerateQRCode()` - Creates QR code and returns URL + key
- `PollQRCode()` - Polls Bilibili servers for scan status
- `GetUserInfo()` - Retrieves user details via SESSDATA
- `GetUserChannel()` - Gets user's own channel info
- `SearchChannels()` - Searches for channels by keyword
- `ExtractCredentialsFromURL()` - Parses credentials from redirect URL

### 2. **handler.go** - HTTP Endpoints
- `HandleGenerateQR()` - POST /bilibili/login/qrcode/generate
  - Returns: `{ qrcode_key, qrcode_url, ttl_seconds }`
  
- `HandlePollQR()` - GET /bilibili/login/qrcode/poll?qrcode_key=...
  - Returns: `{ status, message }` while scanning
  - Returns: `{ status: "confirmed", sessdata, bili_jct, refresh_token }` when done
  - Statuses: "waiting", "confirming", "confirmed", "expired", "invalid"
  
- `HandleFinishLogin()` - POST /bilibili/login/finish
  - Input: `{ sessdata, bili_jct, refresh_token }`
  - Returns: `{ status: "authenticated", user_id, redirect }`
  - Creates or links user account automatically
  
- `HandleGetChannelsMine()` - GET /bilibili/channels/mine (authenticated)
  - Returns: `{ channel_id, channel_name, avatar, platform }`

### 3. **store.go** - Session Persistence
- Creates `bilibili_sessions` table for storing user sessions
- `Upsert()` - Save/update session after login
- `Get()` - Retrieve session metadata
- `GetSessionData()` - Get credentials for API calls
- `FindUserIDByDedeID()` - Lookup user by Bilibili ID

---

## What Frontend Needs to Implement

### Three Screens/States:

#### 1. **Button** (Already exists)
```html
<button onclick="showBilibiliQRCode()">Sign in with Bilibili</button>
```

#### 2. **QR Code Modal** (NEW)
- Displays QR code image (can use `qrcode_url` directly or qrcode.js library)
- Shows countdown timer (usually 180 seconds)
- Shows status messages ("Waiting for scan...", "Please confirm...", etc.)
- Has Cancel button
- Automatically polls backend every 3-5 seconds

#### 3. **Automatic Completion** (NEW)
- Once polling returns `status: "confirmed"`, send credentials to finish endpoint
- Backend sets auth cookie automatically
- Redirect to dashboard

---

## Integration Checklist

### Phase 1: Routes Registration (Backend)
- [ ] Add Bilibili handler to `internal/bootstrap/routes.go`
- [ ] Register endpoints:
  - `GET /api/bilibili/login/qrcode/generate` → `handler.HandleGenerateQR`
  - `GET /api/bilibili/login/qrcode/poll` → `handler.HandlePollQR`
  - `POST /api/bilibili/login/finish` → `handler.HandleFinishLogin`
  - `GET /api/bilibili/channels/mine` → `handler.HandleGetChannelsMine`
- [ ] Initialize Bilibili store (create tables)

### Phase 2: Frontend Implementation
- [ ] Create QR code modal HTML structure
- [ ] Add JavaScript for QR generation
- [ ] Add polling logic with 3-5 second interval
- [ ] Add countdown timer
- [ ] Add error handling and retry buttons
- [ ] Style QR code modal to match existing design
- [ ] Test on both desktop and mobile browsers

### Phase 3: Testing
- [ ] Generate QR code (should return URL + key)
- [ ] Poll manually (should show "waiting" while not scanned)
- [ ] Scan with Bilibili app on phone
- [ ] Verify polling updates to "confirming" then "confirmed"
- [ ] Verify login completes and redirects to dashboard
- [ ] Test error cases (expired QR, network errors, etc.)

---

## Key Differences from OAuth Providers

| Aspect | OAuth (Google, Twitch, etc.) | Bilibili QR |
|--------|-----|------|
| **Auth URL** | Redirect to provider | Stay on our site |
| **User Action** | Click "Log in" on provider | Scan QR with phone app |
| **Session Duration** | Callback receives code | Long-lived via refresh_token |
| **API Design** | Standard OAuth2 | Custom polling pattern |
| **Table** | user_oauth_accounts | bilibili_sessions |

---

## Response Schemas

### Generate QR Response
```json
{
  "qrcode_key": "abc123def456",
  "qrcode_url": "https://passport.bilibili.com/h5-app/passport/login/scan?...",
  "ttl_seconds": 180
}
```

### Poll Response (Waiting)
```json
{
  "status": "waiting",
  "message": "User has not scanned QR code yet"
}
```

### Poll Response (Confirmed)
```json
{
  "status": "confirmed",
  "refresh_token": "refresh_token_value",
  "sessdata": "session_data_value",
  "bili_jct": "csrf_token_value",
  "dede_user_id": 12345
}
```

### Finish Login Response
```json
{
  "status": "authenticated",
  "user_id": 42,
  "redirect": "/dashboard"
}
```

### Get Channels Response
```json
{
  "channel_id": 12345,
  "channel_name": "username",
  "avatar": "https://i0.hdslb.com/...",
  "platform": "bilibili"
}
```

---

## Code Comments for Developers

**Why QR Code?**
- Bilibili requires Chinese citizen ID for traditional OAuth
- QR code login is standard Bilibili mobile login flow
- Users already familiar with scanning in Bilibili app

**Why Polling?**
- No webhook/callback URL needed (user scans on phone)
- Frontend controls timing and retry logic
- Can show real-time status updates to user

**Why Custom Credentials Storage?**
- bilibili_sessions table allows storing SESSDATA + refresh_token
- Same pattern as NicoNico for long-term session persistence
- Can refresh session automatically without user re-login

**How Account Linking Works:**
- `FindOrCreateOAuthUser()` handles both new users and existing users
- If Bilibili ID not seen before: creates new account
- If email matches existing user: links Bilibili to that account
- No auto-linking to currently-logged-in user (bug was fixed)

---

## Files Created

1. **Backend Implementation:**
   - `internal/bilibili/client.go` - API interactions
   - `internal/bilibili/handler.go` - HTTP handlers
   - `internal/bilibili/store.go` - Session persistence

2. **Documentation:**
   - `BILIBILI_IMPLEMENTATION_PLAN.md` - Architecture and research
   - `BILIBILI_FRONTEND_IMPLEMENTATION.md` - Complete frontend guide with code examples

---

## Next Steps

1. **Add routes** in `internal/bootstrap/routes.go`:
   ```go
   import "tauchoapis/internal/bilibili"
   
   // In routes setup:
   bilibiliStore := bilibili.NewSQLStore(db)
   bilibiliHandler := bilibili.NewHandler(sessionMgr, userStore, bilibiliStore)
   
   http.HandleFunc("GET /api/bilibili/login/qrcode/generate", bilibiliHandler.HandleGenerateQR)
   http.HandleFunc("GET /api/bilibili/login/qrcode/poll", bilibiliHandler.HandlePollQR)
   http.HandleFunc("POST /api/bilibili/login/finish", bilibiliHandler.HandleFinishLogin)
   http.HandleFunc("GET /api/bilibili/channels/mine", bilibiliHandler.HandleGetChannelsMine)
   ```

2. **Initialize database** in your DB setup:
   ```go
   bilibiliStore.InitTables(ctx)
   ```

3. **Add Bilibili button** to frontend sign-in page
4. **Implement QR modal** using provided code examples
5. **Test end-to-end** with real Bilibili account

---

## Support Reference

- **Bilibili QR Login API:** https://github.com/ultrazg/bilibili-API-collect/blob/main/docs/login/login_action/QR.md
- **Bilibili API Documentation:** https://docs.bilibili.com/
- **Session Persistence:** Similar to NicoNico implementation in `internal/niconico/`
