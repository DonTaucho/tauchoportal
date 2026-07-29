# Backend Cookie & Response Header Audit

## Summary
All critical auth endpoints **ARE** already setting `Set-Cookie` headers in response. No missing points found.

## Complete Audit of All Auth Endpoints

### ✅ Endpoints Currently Setting Cookies

#### Authentication Endpoints (internal/auth/handler.go)
1. **POST /auth/register** → SetSessionCookie ✓
   - Sets JWT cookie after successful account creation
   
2. **POST /auth/login** → SetSessionCookie ✓
   - Sets JWT cookie after password verification
   
3. **POST /auth/logout** → ClearSessionCookie ✓
   - Clears session cookie (MaxAge=-1)

#### Email Verification (internal/auth/verification.go)
4. **GET /auth/verify-email** → SetSessionCookie ✓
   - Sets JWT cookie after email verification
   - Redirects with cookie in response header

#### OAuth Callbacks (9 providers in internal/oauth/)
All OAuth callback endpoints set the cookie before redirecting:

5. **GET /auth/callback/google** → SetSessionCookie ✓
6. **GET /auth/callback/twitch** → SetSessionCookie ✓
7. **GET /auth/callback/x** → SetSessionCookie ✓
8. **GET /auth/callback/tiktok** → SetSessionCookie ✓
9. **GET /auth/callback/instagram** → SetSessionCookie ✓
10. **GET /auth/callback/kick** → SetSessionCookie ✓
11. **GET /auth/callback/facebook** → SetSessionCookie ✓
12. **GET /auth/callback/twitcasting** → SetSessionCookie ✓
13. **GET /auth/callback/bilibili** → SetSessionCookie ✓

#### NicoNico Login (internal/niconico/handler.go)
14. **POST /niconico/login** (and related session endpoints) → SetSessionCookie ✓
    - Sets JWT cookie after NicoNico authentication

---

## Endpoints NOT Setting Cookies (By Design)

These endpoints intentionally do NOT set cookies because they're read-only or don't change auth state:

### Auth Service Endpoints
- **GET /auth/user** - Returns current user (reads cookie, doesn't write)
- **PATCH /auth/user** - Updates profile (reads cookie, doesn't write new auth)
- **DELETE /auth/user** - Deletes account (calls ClearSessionCookie via HandleDeleteUser)
- **PATCH /auth/password** - Updates password (reads cookie, doesn't write new auth)
- **GET /auth/connections** - Lists OAuth connections (reads cookie, doesn't write)
- **DELETE /auth/connections/{provider}** - Unlinks provider (reads cookie, doesn't write)

**Rationale**: These endpoints don't change the authentication state, so no new session cookie needed.

---

## Current Cookie-Setting Implementation

### How SetSessionCookie Works

**File**: `internal/auth/session.go`

```go
func (sm *SessionManager) SetSessionCookie(w http.ResponseWriter, userID int, email string) error {
	token, err := sm.CreateToken(userID, email)
	if err != nil {
		slog.Error("failed to create JWT token", "user_id", userID, "email", email, "error", err)
		return err
	}

	cookie := &http.Cookie{
		Name:     sm.cookieName,              // "tauchoportal_session"
		Value:    token,                      // JWT token
		MaxAge:   int(sm.tokenTTL.Seconds()), // 604800 (7 days)
		Path:     "/",
		HttpOnly: true,                       // JavaScript cannot access
		Secure:   sm.secureCookie,            // true for HTTPS, false for HTTP
		SameSite: http.SameSiteStrictMode,   // Only same-site requests
	}
	http.SetCookie(w, cookie)
	
	slog.Info("session cookie set", 
		"user_id", userID, 
		"email", email, 
		"cookie_name", sm.cookieName,
		"secure", sm.secureCookie,
		"max_age_seconds", int(sm.tokenTTL.Seconds()),
		"token_length", len(token),
	)
	return nil
}
```

**Important**: `http.SetCookie()` automatically adds `Set-Cookie` header to response.

---

## Potential Missing Header Points

### 1. ❌ Response Header: `Cache-Control` (Not Set Anywhere)

**Issue**: Auth responses shouldn't be cached by browser.

**Affected Endpoints**:
- `/auth/user` (GET)
- `/auth/login` (POST)
- `/auth/register` (POST)
- `/auth/logout` (POST)

**Solution**: Add to writeAuthJSON() or individual handlers:
```go
w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
```

### 2. ❌ Response Header: `Pragma` (Not Set Anywhere)

**Issue**: HTTP/1.0 compatibility for no-cache directive.

**Affected Endpoints**: Same as Cache-Control

**Solution**: Add to auth response headers:
```go
w.Header().Set("Pragma", "no-cache")
```

### 3. ⚠️ Response Header: `Vary` (Not Set Anywhere)

**Issue**: Important for caching to account for Cookie header variations.

**Affected Endpoints**: GET /auth/user

**Solution**: Add to writeAuthJSON():
```go
w.Header().Set("Vary", "Cookie")
```

### 4. ⚠️ CORS Headers on OAuth Callbacks

**Issue**: OAuth callbacks are redirects, not API calls, so CORS headers not needed.

**Status**: ✓ Correctly NOT set (redirects don't need CORS)

### 5. ⚠️ Content-Type Header

**Status**: ✓ Already set via `writeAuthJSON()`

---

## Frontend Cookie Propagation Points

The backend is correctly setting cookies. The issue appears to be frontend propagation:

### Frontend Proxy Flow
1. Frontend receives OAuth callback (HTTP 303 redirect + Set-Cookie header)
2. Frontend proxy should forward Set-Cookie to browser
3. Browser should store cookie
4. Browser should send cookie on subsequent requests

**Potential Issues**:
- Frontend proxy not forwarding Set-Cookie header → Cookie never reaches browser
- Frontend fetch calls not using `credentials: 'include'` → Cookie not sent back
- SameSite=Strict preventing cookie on redirects
- Secure flag mismatch (https vs http)

---

## Recommendations

### Immediate: Add Cache-Control Headers

Add to all auth endpoints to prevent browser caching:

```go
// In internal/auth/handler.go, at top of writeAuthJSON function:
func writeAuthJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Vary", "Cookie")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write response error: %v", err)
	}
}
```

### Optional: Add CORS Headers to Auth Endpoints

If frontend makes cross-origin requests to auth endpoints:

```go
// Add to SessionManagerMiddleware in internal/api/middleware.go
w.Header().Set("Access-Control-Allow-Credentials", "true")
```

Note: Already handled by CORS middleware on mux.

### Verify: Cookie Propagation at Frontend Level

Frontend proxy must:
1. Capture `Set-Cookie` header from OAuth callback response
2. Forward it in the response to the browser
3. Ensure all fetch calls to backend use `credentials: 'include'`

---

## Testing Checklist

- [ ] Set `LOG_LEVEL=debug`
- [ ] Clear all cookies
- [ ] Perform OAuth login
- [ ] Check server logs for: `session cookie set`
- [ ] Check browser DevTools: Application → Cookies → `tauchoportal_session`
- [ ] Call `/auth/user` endpoint
- [ ] Check server logs for: `jwt validation: token validated successfully`
- [ ] Verify `/auth/user` returns user data (not 401)

---

## Conclusion

**All critical cookie-setting endpoints are correctly implemented.**

The issue is likely in the **frontend proxy not forwarding cookies** from OAuth callback to the browser, or the frontend not sending cookies back with subsequent requests.

**Next steps**: Implement the Cache-Control header recommendations and verify frontend proxy behavior.
