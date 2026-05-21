# API Usage Quick Reference

## 📍 Current UI Status

✅ **Fully Implemented** (using original API endpoints):
- OAuth login flow
- User authentication
- Session management

❌ **Not Implemented** (endpoints available but not in UI):
- User registration UI
- User login with email/password
- Watch management
- Poller controls

---

## 🔗 Endpoints Currently Used by UI

### Authentication
| Endpoint | Method | Status | Used By |
|----------|--------|--------|---------|
| `/auth/user` | GET | ✅ Original | auth.js, all pages |
| `/oauth/login` | GET | ✅ Original | auth.js login button |
| `/auth/logout` | POST | 🆕 NEW | auth.js logout button |

### Preferences (Optional)
| Endpoint | Method | Status | Used By |
|----------|--------|--------|---------|
| `/api/user/preferences` | GET | 🆕 NEW (Optional) | localization.js |
| `/api/user/preferences` | POST | 🆕 NEW (Optional) | localization.js |

---

## 📚 Available Original Endpoints (For Future Use)

### Registration & Login
```
POST /auth/register       - Create account
POST /auth/login          - Login with credentials
```

### Watch Management
```
GET  /api/watches         - List watches
POST /api/watches/create  - Add watch
DELETE /api/watches/delete?id=  - Remove watch
```

### Poller Control
```
GET  /api/poller/status   - Check poller status
POST /api/poller/start    - Start poller
POST /api/poller/stop     - Stop poller
```

### Health Check
```
GET  /health              - Health check
```

---

## 🎯 Critical vs Optional

### 🔴 CRITICAL (Must Implement)
- `POST /auth/logout` - UI calls this when user clicks logout

### 🟡 OPTIONAL (Has Fallback)
- `GET /api/user/preferences` - Falls back to cookies if not available
- `POST /api/user/preferences` - Falls back to cookies if not available

### 🟢 NOT NEEDED YET
- All other endpoints (watch management, poller, registration, etc.)

---

## 🚀 Next Steps for API Server

### Minimum (For current functionality):
1. ✅ Verify `GET /auth/user` works
2. ✅ Verify `GET /oauth/login` returns auth_url
3. 🔴 **IMPLEMENT** `POST /auth/logout`

### Recommended (For better UX):
4. 🟡 Implement `GET /api/user/preferences` (optional)
5. 🟡 Implement `POST /api/user/preferences` (optional)

### Later (When you add more UI pages):
6. Register page → need `POST /auth/register`
7. Login form → need `POST /auth/login`
8. Watch management → need watch endpoints
9. Admin dashboard → need poller endpoints

---

## 📄 API Response Formats

### User Profile
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "picture": "https://..."
}
```

### OAuth Login URL
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### Logout Response
```json
{
  "message": "logged out"
}
```

### User Preferences (Optional)
```json
{
  "user_id": 1,
  "language": "ja",
  "theme": "light",
  "updated_at": "2026-05-21T12:00:00Z"
}
```

---

## 🧪 Testing Commands

### Test Authentication
```bash
# Get current user (should work if logged in)
curl -b "session=your_cookie" http://localhost:8081/auth/user

# Start OAuth login
curl "http://localhost:8081/oauth/login?provider=google"

# Logout
curl -X POST -b "session=your_cookie" http://localhost:8081/auth/logout
```

### Test with UI Proxy
```bash
# Through UI server (localhost:8080)
curl http://localhost:8080/api/auth/user

# This proxies to API server as:
curl http://localhost:8081/auth/user
```

---

## 📋 Postman Collection

- **File**: `tauchoapis.postman_collection.json`
- **Updated**: YES ✓
  - Added `POST /auth/logout`
  - Added `GET /api/user/preferences`
  - Added `POST /api/user/preferences`

**To Use**: 
1. Import into Postman
2. Set `baseUrl` variable to `http://localhost:8081` or `https://api.taucho.org`
3. Test endpoints

---

## 📞 API Documentation Files

| File | Purpose |
|------|---------|
| [API_INTEGRATION.md](API_INTEGRATION.md) | How UI integrates with API |
| [API_ENDPOINTS_AUDIT.md](API_ENDPOINTS_AUDIT.md) | Complete audit of original vs new |
| [NEW_API_ENDPOINTS.md](NEW_API_ENDPOINTS.md) | Details of 3 new endpoints |
| [tauchoapis.postman_collection.json](tauchoapis.postman_collection.json) | Updated Postman collection |

---

## ❓ FAQ

**Q: Do I need to implement all the endpoints immediately?**  
A: No. Implement `POST /auth/logout` (critical). The preference endpoints are optional with fallback.

**Q: What if I don't implement user preferences endpoints?**  
A: Users' language preference will be stored in cookies instead of the database. Still works fine.

**Q: Can I use the existing endpoints I already have?**  
A: Yes! The original endpoints (`/auth/user`, `/oauth/login`, etc.) are exactly what the UI expects.

**Q: Why does the UI use `/api/` prefix?**  
A: The UI server proxies `/api/*` to the API server and strips the prefix. It's a clean separation of concerns.

**Q: Which endpoints need session authentication?**  
A: 
- `GET /auth/user` - requires session cookie
- `POST /auth/logout` - should work with or without session
- `GET /api/user/preferences` - requires session cookie
- `POST /api/user/preferences` - requires session cookie

---

## 🔄 API Server Environment Variables

Make sure these are set:

```bash
# Critical
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
API_LISTEN_ADDR=:8081           # or your port

# Optional (for preferences)
DATABASE_URL=your_db_connection
```

---

## ✨ Summary

Original API endpoints are being used correctly ✓  
New endpoints added: 3 (1 critical, 2 optional) ✓  
UI proxy working correctly ✓  
Documentation updated ✓  

**Action Item**: Implement `POST /auth/logout` on API server
