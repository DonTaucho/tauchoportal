# JWT Phase 2 - Handler Updates Checklist

## Overview
Replace all ~38 instances of `parseUserID(w, r)` with `getAuthenticatedUserID(w, r)` across API handlers.

**Estimated Time:** 30-45 minutes  
**Complexity:** Low (mechanical find & replace)  
**Risk:** Very Low (new function has same signature & return type)

## The Change

### Pattern
```go
// BEFORE (insecure)
userID, ok := parseUserID(w, r)

// AFTER (secure)
userID, ok := getAuthenticatedUserID(w, r)
```

That's it. No handler logic changes needed.

## Files to Update

### API Handlers (in internal/api/)

File | Count | Status
-----|-------|--------
watch_handlers.go | 4 | ⏳
device_handlers.go | 4 | ⏳
device_group_handlers.go | 4 | ⏳
condition_handlers.go | 4 | ⏳
stream_handlers.go | 2 | ⏳
stream_account_handlers.go | 3 | ⏳
device_credential_handlers.go | 2 | ⏳
custom_product_handlers.go | 2 | ⏳
brand_credentials_handlers.go | 2 | ⏳
dashboard_handlers.go | 2 | ⏳
condition_test_handlers.go | 1 | ⏳
live_event_handlers.go | 2 | ⏳
**TOTAL** | **38** | ⏳

## Verification

After all replacements, verify:

```bash
# 1. No remaining parseUserID calls (except in middleware.go where it's defined)
grep -r "parseUserID" internal/api/ | grep -v "middleware.go"
# Should return: (empty - no results)

# 2. No remaining getAuthenticatedUserID calls without context
grep -r "getAuthenticatedUserID.*sessionMgr" internal/api/
# Should return: (empty - no results, all calls now use context extraction)

# 3. Build succeeds
go build -o ./bin/tauchoapis ./cmd/main.go
```

## Testing Checklist

After Phase 2 completion:

- [ ] Build compiles without errors
- [ ] Server starts successfully
- [ ] Login creates JWT token in cookie
- [ ] JWT token sent with all requests
- [ ] Accessing protected endpoint without cookie returns 401
- [ ] Invalid/expired token returns 401
- [ ] Forged X-User-ID header is ignored
- [ ] Can't access other user's data with forged token
- [ ] Logout clears token
- [ ] After logout, protected endpoints return 401

## Quick Reference

### New Function Signature
```go
// From middleware.go
func getAuthenticatedUserID(w http.ResponseWriter, r *http.Request) (int, bool) {
    // Extracts SessionManager from context
    // Validates JWT from httpOnly cookie
    // Returns verified user ID or 401 error
}
```

### How It Works (Behind the Scenes)
1. SessionManagerMiddleware (in main.go) injects SessionManager into request context
2. getAuthenticatedUserID reads SessionManager from context
3. Calls sessionMgr.GetUserIDFromCookie(r)
4. Validates JWT signature and expiration
5. Returns user ID or false + HTTP 401 error

### Error Handling
```go
userID, ok := getAuthenticatedUserID(w, r)
if !ok {
    // Handler already sent HTTP 401 Unauthorized response
    // Safe to return early
    return
}
// Continue with verified userID (type: int)
```

## Emergency Revert
If issues arise, keep parseUserID() available for backup:

```go
// OLD (until Phase 2 complete)
userID, ok := parseUserID(w, r)

// NEW (Phase 2)
userID, ok := getAuthenticatedUserID(w, r)

// FALLBACK (if emergency revert needed)
userID, ok := parseUserID(w, r)
```

## Success Criteria

✅ Phase 2 is complete when:
1. All 38 instances replaced
2. Build succeeds
3. No parseUserID calls in handler files (only in middleware.go)
4. All auth tests pass
5. Manual testing confirms JWT validation works
6. No behavioral changes in API responses

---

## Timeline Estimate

| Step | Time |
|------|------|
| Find all instances | 2 min |
| Batch replace in files | 10 min |
| Manual review | 5 min |
| Build & test | 10 min |
| Verify error handling | 5 min |
| Documentation update | 5 min |
| **TOTAL** | **37 min** |

Ready to proceed? Follow the pattern above and replace in any order (all files are independent).
