# Frontend JWT Implementation Guide

## 🎯 Summary for Frontend Team

**Backend Status:** ✅ JWT authentication fully implemented  
**Frontend Change:** ⚡ Enable cookie-based auth (5-15 min update)  
**Impact:** ✅ Zero breaking changes to API responses

---

## What Changed on Backend

### Login Endpoint (No Changes)
```
POST /auth/login
Response: { id, email, username, picture, ... } (same as before)
```

### What's Different (Internal)
**Before:** Response included X-User-ID header to be sent with every request  
**After:** Response includes JWT in httpOnly cookie (automatic)

---

## Frontend Implementation (3 Simple Steps)

### Step 1: Remove X-User-ID Header ❌

**Find & Delete:**
```javascript
// REMOVE THIS FROM ALL REQUESTS:
headers: {
  'X-User-ID': userId,  // ❌ DELETE THIS LINE
  'Content-Type': 'application/json'
}
```

### Step 2: Enable Cookie Credentials ✅

**Update All Fetch Calls:**
```javascript
// ADD THIS TO ALL FETCH REQUESTS:
fetch(url, {
  method: 'GET',
  credentials: 'include',  // ✅ AUTO-SENDS COOKIES
  headers: {
    'Content-Type': 'application/json'
    // No X-User-ID header needed
  }
})
```

### Step 3: Verify Cookie Presence

After login, verify JWT is in cookies:
```javascript
// Check in browser DevTools:
// Application → Cookies → localhost
// Should see: tauchoportal_session=eyJhbGc...
```

---

## Code Examples

### Before (Vulnerable)
```javascript
async function fetchUserWatches() {
  const response = await fetch('http://localhost:8080/watches', {
    method: 'GET',
    headers: {
      'X-User-ID': currentUserID,  // ❌ VULNERABLE: Can be forged
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### After (Secure)
```javascript
async function fetchUserWatches() {
  const response = await fetch('http://localhost:8080/watches', {
    method: 'GET',
    credentials: 'include',  // ✅ SECURE: Sends JWT cookie automatically
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

---

## Login Flow Update

### Before
```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password })
  });
  const user = await response.json();
  
  // Store user ID locally (VULNERABLE)
  localStorage.setItem('userID', user.id);
  
  return user;
}
```

### After
```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    credentials: 'include',  // ✅ Capture JWT cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password })
  });
  const user = await response.json();
  
  // Don't store user ID (JWT in cookie handles auth)
  // But you can still store user profile data if needed:
  // localStorage.setItem('userProfile', JSON.stringify(user));
  
  return user;
}
```

---

## Protected Endpoint Pattern

### All protected endpoints (GET /watches, POST /devices, etc.)

```javascript
// Pattern: Same for all endpoints
fetch(ANY_PROTECTED_ENDPOINT, {
  method: 'GET|POST|DELETE|PATCH',
  credentials: 'include',  // ✅ ALWAYS include this
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)  // if POST/PATCH
})
```

---

## Testing Checklist

- [ ] Remove all `X-User-ID` headers from code
- [ ] Add `credentials: 'include'` to all fetch calls
- [ ] Test login creates `tauchoportal_session` cookie
- [ ] Test protected endpoints work with cookie
- [ ] Test logout clears cookie
- [ ] Test can't access protected endpoints without cookie (401)
- [ ] Test cannot forge user ID with header (header ignored)

---

## Common Issues & Fixes

### Issue: 401 Unauthorized on Protected Endpoints

**Cause:** Missing `credentials: 'include'` in fetch  
**Fix:** Add `credentials: 'include'` to all fetch calls

### Issue: Cookie Not Appearing

**Cause:** Login fetch missing `credentials: 'include'`  
**Fix:** Update login fetch to include credentials

```javascript
// Fix login:
fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  credentials: 'include',  // ✅ ADD THIS
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier, password })
})
```

### Issue: Can Still Forge X-User-ID Header

**Cause:** Backend now ignores X-User-ID header (by design)  
**Expected:** Frontend stops sending it  
**Status:** ✅ Correct behavior (server uses JWT instead)

---

## Security Benefit

**Before:**
```bash
# Attack: Change X-User-ID header
curl -H "X-User-ID: 999" http://localhost:8080/watches
# Result: ❌ Sees user 999's watches (account takeover)
```

**After:**
```bash
# Attack: Try to change header (ignored)
curl -H "X-User-ID: 999" http://localhost:8080/watches
# Result: ✅ 401 Unauthorized (signature invalid, forged token rejected)
```

---

## Environment Variables (if applicable)

No frontend environment variable changes needed.

API URL should remain the same:
- `VITE_API_URL` = `http://localhost:8080` (dev)
- `VITE_API_URL` = `https://api.taucho.com` (prod)

---

## Rollback Plan

If needed, can temporarily revert by:
1. Remove `credentials: 'include'` from fetch calls
2. Re-add `X-User-ID: userId` headers
3. Backend still accepts X-User-ID for backward compatibility

But this is NOT recommended (less secure).

---

## Questions?

Refer to:
- `docs/JWT_IMPLEMENTATION_PHASE1.md` - Technical deep dive
- `docs/X_USER_ID_IMPLEMENTATION_GUIDE.md` - Architecture details
- Backend team - For any auth-related issues

---

## Timeline

- **Now:** Frontend reviews this guide
- **5-15 min:** Update all fetch calls (find & replace)
- **5 min:** Test login & protected endpoints
- **Total:** ~30 minutes for complete implementation

---

**Status:** Ready for frontend implementation ✅
