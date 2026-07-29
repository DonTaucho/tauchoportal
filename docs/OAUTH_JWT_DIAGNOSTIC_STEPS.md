# OAuth JWT Diagnostic Steps

## Current Implementation Status

Three critical fixes have been implemented:

### 1. ✅ Comprehensive OAuth Logging Added
All OAuth callback handlers now log the complete flow:

**Google OAuth Handler** (`internal/oauth/google.go`):
- When authorization code is received
- When token is exchanged with Google
- When user info is retrieved
- When user is found/created in database
- When OAuth token is stored
- When JWT session cookie is set
- When final redirect happens

Log Pattern:
```
[INFO] google oauth callback: authorization code received (code_length=...)
[INFO] google oauth callback: token exchanged successfully (token_expiry=...)
[INFO] google oauth callback: user info retrieved (google_user_id=..., email=..., name=...)
[INFO] google oauth callback: user authenticated (user_id=..., email=..., provider=google)
[INFO] google oauth callback: setting session cookie (user_id=..., email=...)
[INFO] session cookie set (user_id=..., email=..., secure=..., max_age_seconds=604800)
[INFO] google oauth callback: redirecting to dashboard (user_id=..., redirect_url=...)
```

### 2. ✅ Secure Cookie Flag Fixed
**Location**: `internal/bootstrap/stores.go`

The `secureCookie` flag is now environment-aware:

```go
portalURL := os.Getenv("PORTAL_BASE_URL")
forceSecure := os.Getenv("FORCE_SECURE_COOKIES") == "true"
secureCookie := forceSecure || strings.HasPrefix(portalURL, "https://")
```

**Behavior**:
- **Development** (`http://localhost`): `secureCookie=false` → Cookie sent over HTTP
- **Production** (`https://...`): `secureCookie=true` → Cookie only sent over HTTPS
- **Override**: Set `FORCE_SECURE_COOKIES=true` to force secure mode

**Important**: Browser won't send cookies with `Secure` flag over HTTP connections.

### 3. ✅ JWT Validation Logging Added
**Location**: `internal/auth/session.go`

Added detailed logging to JWT validation flow:

```go
// When cookie is not found
[DEBUG] jwt validation: cookie not found (cookie_name=tauchoportal_session, error=...)

// When cookie is found and validated
[DEBUG] jwt validation: cookie found (cookie_name=tauchoportal_session, token_length=...)
[DEBUG] jwt validation: token validated successfully (user_id=..., email=..., expires_at=...)

// When validation fails
[WARN] jwt validation: token validation failed (error=..., cookie_name=tauchoportal_session)
```

---

## Testing Steps

### Step 1: Enable Debug Logging
Set environment variable (in `.env` or shell):
```bash
LOG_LEVEL=debug
```

### Step 2: Verify Environment Configuration
Check that `PORTAL_BASE_URL` is set correctly:

**Development**:
```bash
PORTAL_BASE_URL=http://localhost:3000
# Should result in secureCookie=false ✓
```

**Production**:
```bash
PORTAL_BASE_URL=https://yourdomain.com
# Should result in secureCookie=true ✓
```

### Step 3: Clear Cookies and Cache
Before testing, clear browser cookies:

1. Open DevTools (F12)
2. Go to Application → Cookies
3. Delete all cookies for `localhost:8080` and `localhost:3000`
4. Clear browser cache (Ctrl+Shift+Del)

### Step 4: Perform Complete OAuth Flow

1. **Start the server**:
   ```bash
   LOG_LEVEL=debug go run ./cmd
   ```

2. **Open login page** (your frontend):
   ```
   http://localhost:3000/login
   ```

3. **Click "Login with Google"** (or any OAuth provider)

4. **Watch server logs**:
   - Should see "authorization code received"
   - Should see "token exchanged successfully"
   - Should see "user info retrieved"
   - Should see "user authenticated"
   - Should see "setting session cookie"
   - Should see "session cookie set" (with secure flag status)
   - Should see "redirecting to dashboard"

5. **Check browser DevTools** (F12 → Application → Cookies):
   - Should see `tauchoportal_session` cookie
   - Check if `HttpOnly` is set
   - Check if `Secure` flag matches environment (false for http://, true for https://)
   - Check `Max-Age` is 604800 (7 days)

### Step 5: Verify /auth/user Endpoint

After OAuth redirect, check if `/auth/user` returns the user:

```bash
# In browser console or via curl:
curl -X GET http://localhost:8080/auth/user \
  -H "Cookie: tauchoportal_session=<cookie_value>"

# Should return:
{
  "id": <user_id>,
  "email": "<email>",
  "username": "<username>",
  ...
}

# Check server logs for:
[DEBUG] jwt validation: cookie found
[DEBUG] jwt validation: token validated successfully
```

---

## Debugging Checklist

### ❓ OAuth Callback Not Logging Anything

**Possible Causes**:
- LOG_LEVEL not set to "debug" or "info"
- OAuth callback URL misconfigured
- Request not reaching server

**Fix**:
```bash
LOG_LEVEL=debug
# Restart server and try again
```

### ❓ Cookie Not Being Set (Session Cookie Log Missing)

**Possible Causes**:
- User not being created in database
- SetSessionCookie() not being called
- Error in token creation

**Check Logs For**:
```
[ERROR] google oauth callback: failed to find or create user
```

**Fix**:
- Check user creation is working
- Verify database connection
- Check OAuth user identity uniqueness

### ❓ Cookie Being Set But Not Sent to /auth/user

**Possible Causes**:
1. **Secure flag mismatch**: 
   - If `secureCookie=true` but using `http://`, browser won't send cookie
   - If `secureCookie=false` but using `https://`, browser may reject cookie

2. **Frontend not sending credentials**:
   - Frontend must include `credentials: 'include'` in fetch calls
   - Without it, browser doesn't send cookies with cross-origin requests

3. **SameSite=Strict too restrictive**:
   - Cookie only sent on same-site navigations
   - Cross-origin requests blocked

**Check**:
```bash
# Verify secure flag in cookie
# DevTools → Application → Cookies → tauchoportal_session
# Should see: Secure=[false for http, true for https]

# Verify frontend is using credentials: 'include'
# In frontend code:
fetch('/auth/user', {
  credentials: 'include'  # THIS IS REQUIRED
})
```

### ❓ JWT Validation Failing (jwt validation: token validation failed)

**Possible Causes**:
1. **Signing key mismatch**: Key changes if app restarts
2. **Token expired**: 7-day TTL exceeded
3. **Corrupted token**: Cookie value tampered with
4. **Wrong algorithm**: Token not using HS256

**Check**:
```bash
# Look for error message in logs:
[WARN] jwt validation: token validation failed (error=...)

# Common errors:
- "token is expired"  → Need new login
- "signature is invalid"  → App restarted, signing key changed
- "could not unmarshal token"  → Token corrupted
```

### ❓ User Authenticated But Frontend Shows Login Page

**Possible Causes**:
1. **Frontend not calling /auth/user after redirect**:
   - OAuth redirect happens server-side (HTTP 303 See Other)
   - Frontend needs to verify session with `/auth/user` call
   - If frontend auto-redirects without verification, it won't know user is logged in

2. **Frontend calling /auth/user without credentials**:
   - Must use `credentials: 'include'`
   - Otherwise cookie not sent, /auth/user returns 401

3. **/auth/user endpoint not working**:
   - Check logs for JWT validation errors
   - Verify cookie is being received

**Fix**:
Frontend implementation checklist:
- [ ] OAuth callback redirects user to backend OAuth handler
- [ ] Backend sets JWT cookie and redirects to dashboard
- [ ] Frontend receives redirect response (Location header)
- [ ] Frontend follows redirect to dashboard
- [ ] Frontend calls `/auth/user` with `credentials: 'include'`
- [ ] If response is 401, redirect back to login
- [ ] If response is 200 with user data, render dashboard

---

## Key Log Messages to Look For

### Successful OAuth Flow:
```
[INFO] google oauth callback: authorization code received (code_length=...)
[INFO] google oauth callback: token exchanged successfully
[INFO] google oauth callback: user info retrieved (email=...)
[INFO] google oauth callback: user authenticated (user_id=..., email=...)
[INFO] session cookie set (user_id=..., secure=...)
[INFO] google oauth callback: redirecting to dashboard (redirect_url=...)
[DEBUG] jwt validation: cookie found
[DEBUG] jwt validation: token validated successfully (user_id=..., email=...)
```

### Failure Points:
```
[ERROR] google oauth callback: failed to exchange token (error=...)
[ERROR] google oauth callback: failed to find or create user (error=...)
[ERROR] google oauth callback: failed to set session cookie (error=...)
[WARN] jwt validation: cookie not found
[WARN] jwt validation: token validation failed (error=...)
```

---

## Environment Configuration Template

Add to `.env` or pass to app:

```env
# Required for secure cookie detection
PORTAL_BASE_URL=http://localhost:3000    # Development
# PORTAL_BASE_URL=https://yourdomain.com  # Production

# Override secure cookie setting (optional)
# FORCE_SECURE_COOKIES=true

# Enable debug logging
LOG_LEVEL=debug    # While debugging
# LOG_LEVEL=info   # Normal operation
```

---

## Questions to Answer

After testing, frontend team should provide answers to:

1. **Is JWT cookie being set?**
   - Check: Server logs show "session cookie set" message
   - Check: DevTools shows cookie in Application → Cookies

2. **Is /auth/user validating correctly?**
   - Check: Server logs show "jwt validation: token validated successfully"
   - Check: /auth/user endpoint returns 200 with user data
   - Not 401 Unauthorized

3. **Is frontend calling /auth/user after redirect?**
   - Check: Frontend network tab shows /auth/user request
   - Check: Request includes `credentials: 'include'` in fetch call
   - Not making cross-origin request without credentials

---

## Common Fixes Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Cookie not sent over HTTP | `Secure=true` on http:// | Set `PORTAL_BASE_URL=http://...` |
| Cookie not sent to /auth/user | Missing `credentials: 'include'` | Update frontend fetch calls |
| Token validation fails | App restarted, signing key changed | Login again to get new token |
| /auth/user returns 401 | JWT validation failed | Check logs for JWT error details |
| Frontend shows login page | Not calling /auth/user | Add /auth/user verification step |
| Cookie deleted unexpectedly | MaxAge too short or Secure mismatch | Verify cookie flags in DevTools |

