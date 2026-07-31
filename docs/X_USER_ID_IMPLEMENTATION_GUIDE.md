# X-User-ID to Session/JWT Migration Guide

## Quick Start

The current authentication uses client-supplied `X-User-ID` header, which is vulnerable to forgery. This guide walks through replacing it with server-verified sessions.

### Status: NOT YET IMPLEMENTED
- Current code: Uses vulnerable `parseUserID()` 
- Warning added: `internal/api/middleware.go` has TODO comment
- Plan document: `X_USER_ID_VULNERABILITY_PLAN.md`

---

## Step 1: Implement SessionManager Interface

Create `internal/auth/session.go`:

```go
package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

// SessionToken represents an authenticated session
type SessionToken struct {
	Token     string
	UserID    int
	CreatedAt time.Time
	ExpiresAt time.Time
}

// SessionManager handles user session tokens
type SessionManager interface {
	// CreateSession creates a new session for the user
	CreateSession(ctx context.Context, userID int, ttl time.Duration) (*SessionToken, error)
	
	// GetSession retrieves session info by token
	GetSession(ctx context.Context, token string) (*SessionToken, error)
	
	// DeleteSession revokes a session
	DeleteSession(ctx context.Context, token string) error
	
	// RefreshSession extends an existing session
	RefreshSession(ctx context.Context, token string, newTTL time.Duration) (*SessionToken, error)
	
	// CleanupExpiredSessions removes expired sessions
	CleanupExpiredSessions(ctx context.Context) error
}

// InMemorySessionManager stores sessions in memory (for single-server deployments)
type InMemorySessionManager struct {
	sessions map[string]*SessionToken
}

func NewInMemorySessionManager() *InMemorySessionManager {
	return &InMemorySessionManager{
		sessions: make(map[string]*SessionToken),
	}
}

func (m *InMemorySessionManager) CreateSession(ctx context.Context, userID int, ttl time.Duration) (*SessionToken, error) {
	token := generateSecureToken()
	now := time.Now()
	
	sess := &SessionToken{
		Token:     token,
		UserID:    userID,
		CreatedAt: now,
		ExpiresAt: now.Add(ttl),
	}
	
	m.sessions[token] = sess
	return sess, nil
}

func (m *InMemorySessionManager) GetSession(ctx context.Context, token string) (*SessionToken, error) {
	sess, exists := m.sessions[token]
	if !exists {
		return nil, fmt.Errorf("session not found")
	}
	
	if time.Now().After(sess.ExpiresAt) {
		delete(m.sessions, token)
		return nil, fmt.Errorf("session expired")
	}
	
	return sess, nil
}

func (m *InMemorySessionManager) DeleteSession(ctx context.Context, token string) error {
	delete(m.sessions, token)
	return nil
}

func (m *InMemorySessionManager) RefreshSession(ctx context.Context, token string, newTTL time.Duration) (*SessionToken, error) {
	sess, err := m.GetSession(ctx, token)
	if err != nil {
		return nil, err
	}
	
	// Delete old session
	m.DeleteSession(ctx, token)
	
	// Create new session with same userID
	return m.CreateSession(ctx, sess.UserID, newTTL)
}

func (m *InMemorySessionManager) CleanupExpiredSessions(ctx context.Context) error {
	now := time.Now()
	for token, sess := range m.sessions {
		if now.After(sess.ExpiresAt) {
			delete(m.sessions, token)
		}
	}
	return nil
}

// generateSecureToken creates a cryptographically secure random token
func generateSecureToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(err)  // In production, handle this gracefully
	}
	return hex.EncodeToString(b)
}
```

---

## Step 2: Update HandleLogin()

In `internal/auth/handler.go`, update the login handler:

```go
// HandleLogin authenticates a user and returns a session token
func (h *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	// Verify credentials (existing code)
	user, err := h.userStore.GetUserByEmail(r.Context(), req.Email)
	if err != nil || !bcrypt.CheckPasswordHash(req.Password, user.PasswordHash) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}
	
	// ✅ NEW: Create session token instead of returning bare userID
	sessionToken, err := h.sessionMgr.CreateSession(r.Context(), user.ID, 7*24*time.Hour)
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}
	
	// ✅ NEW: Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken.Token,
		HttpOnly: true,              // Prevent JavaScript access
		Secure:   true,              // Only send over HTTPS
		SameSite: http.SameSiteLax,  // CSRF protection
		MaxAge:   int(7 * 24 * 3600),// 7 days
		Path:     "/",
	})
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
		"name":    user.Name,
		// Don't return token here - it's in the cookie
	})
}

// HandleLogout revokes the session
func (h *AuthHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	// Get and delete session token
	token, err := r.Cookie("session_token")
	if err == nil {
		h.sessionMgr.DeleteSession(r.Context(), token.Value)
	}
	
	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:   "session_token",
		Value:  "",
		MaxAge: -1,
	})
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "logged out"})
}
```

---

## Step 3: Update middleware.go

Replace `parseUserID()` with secure version:

```go
// getAuthenticatedUserID verifies session token and returns the authenticated user ID.
// Returns the user ID and true on success; writes a 401 response and returns false on failure.
//
// Supports multiple auth methods (in order of preference):
// 1. Session cookie (from login)
// 2. X-User-ID header (deprecated, for backward compatibility)
func getAuthenticatedUserID(w http.ResponseWriter, r *http.Request, sessionMgr auth.SessionManager) (int, bool) {
	// Try session cookie first
	token, err := r.Cookie("session_token")
	if err == nil {
		sess, err := sessionMgr.GetSession(r.Context(), token.Value)
		if err == nil && sess != nil {
			return sess.UserID, true  // ✅ VERIFIED by server
		}
	}
	
	// Fallback: X-User-ID header (DEPRECATED, UNSAFE)
	// Only use for backward compatibility during transition period
	raw := r.Header.Get("X-User-ID")
	if raw != "" {
		slog.Warn("deprecated X-User-ID header used (vulnerable to forgery)",
			"method", r.Method, "path", r.URL.Path)
		uid, err := strconv.Atoi(raw)
		if err == nil && uid > 0 {
			return uid, true
		}
	}
	
	http.Error(w, "Authentication required", http.StatusUnauthorized)
	return 0, false
}

// DEPRECATED: Use getAuthenticatedUserID() instead
func parseUserID(w http.ResponseWriter, r *http.Request) (int, bool) {
	// For now, keep for backward compatibility
	raw := r.Header.Get("X-User-ID")
	uid, err := strconv.Atoi(raw)
	if err != nil || uid <= 0 {
		http.Error(w, "Missing or invalid X-User-ID header", http.StatusUnauthorized)
		return 0, false
	}
	return uid, true
}
```

---

## Step 4: Update All Handlers

Replace `parseUserID(w, r)` calls with `getAuthenticatedUserID(w, r, sessionMgr)` in all API handlers.

For example, in `internal/api/watch_handlers.go`:

```go
// OLD (vulnerable):
func (a *WatchAPI) HandleListWatches(w http.ResponseWriter, r *http.Request) {
	userID, ok := parseUserID(w, r)  // ❌ Client can forge this
	if !ok {
		return
	}
	// ...
}

// NEW (secure):
func (a *WatchAPI) HandleListWatches(w http.ResponseWriter, r *http.Request) {
	userID, ok := getAuthenticatedUserID(w, r, a.sessionMgr)  // ✅ Server verified
	if !ok {
		return
	}
	// ...
}
```

---

## Step 5: Frontend Integration

Update frontend to send credentials:

```javascript
// OLD (vulnerable):
fetch('/watches', {
	headers: {
		'X-User-ID': userId  // ❌ Forged by user
	}
})

// NEW (secure):
fetch('/watches', {
	credentials: 'include',  // ✅ Automatically sends session cookie
	headers: {
		'Content-Type': 'application/json'
	}
})
```

---

## Testing

### Before Fix (Vulnerable):
```bash
# Attacker can impersonate other users:
curl -H "X-User-ID: 999" http://localhost:8080/watches
# Returns user 999's data - VULNERABLE!
```

### After Fix (Secure):
```bash
# 1. Login
curl -c cookies.txt -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Access protected resource
curl -b cookies.txt http://localhost:8080/watches
# Returns authenticated user's data ✅

# 3. Try forging header
curl -b cookies.txt -H "X-User-ID: 999" http://localhost:8080/watches
# Still returns authenticated user's data (forged header ignored) ✅

# 4. Try without cookie
curl -H "X-User-ID: 999" http://localhost:8080/watches
# Returns 401 Unauthorized ✅
```

---

## Migration Timeline

### Immediate (Before External Launch)
- [ ] Create `internal/auth/session.go` with SessionManager
- [ ] Update `HandleLogin()` and `HandleLogout()` 
- [ ] Update `middleware.go` with `getAuthenticatedUserID()`
- [ ] Update all handlers to use new auth function
- [ ] Test end-to-end

### Optional (After Initial Launch)
- [ ] Remove deprecated X-User-ID support
- [ ] Add JWT token support for mobile apps
- [ ] Add session refresh logic
- [ ] Add device fingerprinting

---

## Summary

**Current State:** ❌ Vulnerable to header forgery  
**After Implementation:** ✅ Server-verified sessions  
**Time to Implement:** 2-3 hours  
**Criticality:** MUST DO before external launch
