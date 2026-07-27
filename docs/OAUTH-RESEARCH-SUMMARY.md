# OAuth Implementation Reference - Research + Specification

This document combines the OAuth research with your tauchoportal specifics.

## ✅ Key Findings

### OAuth Response Format
Your current response is correct:
```json
{ "auth_url": "https://provider.com/authorize?..." }
```

Extended response with state for CSRF protection:
```json
{
  "auth_url": "https://provider.com/authorize?...",
  "state": "random-csrf-token",
  "expires_in": 300
}
```

### QR Code Format
For QR-based OAuth (Device Flow or Tuya QR):
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgo...",
  "qr_format": "png",
  "qr_content": "tuyaSmart--qrLogin?token=AZc72de000...",
  "expires_in": 300,
  "user_code": "WDJB-MJHT"
}
```

### Brand-Specific OAuth

#### Tuya
- Uses standard OAuth 2.0 + proprietary QR login
- `/auth/brand/tuya/connect` initiates OAuth
- Returns `auth_url` or QR code depending on mode
- `/auth/brand/tuya/oauth-callback` handles code exchange
- Developer credentials needed: `client_id`, `client_secret`, `device_id`, `region`

#### Govee
- **NO OAuth** - Uses API key only
- API key obtained in Govee Home app: Profile → About Us → Request API Key
- Key is emailed to user, user enters it manually
- No `/authorize` or `/token` endpoints

#### Other Services
- Philips Hue: OAuth 2.0 standard flow (or local token for bridge)
- LIFX: API key only
- Nanoleaf, Kasa, Yeelight, WLED: No OAuth, local device access

### PKCE & State Handling
- `state` token prevents CSRF attacks
- `code_verifier` is generated server-side and stored in session (never returned to frontend)
- Session is keyed by the `state` value
- On callback, verify that returned `state` matches stored session

---

## Next Steps for Your Backend Implementation

1. **For OAuth brands (Tuya):**
   - Store session data in a temporary session store (Redis or database table `oauth_sessions`)
   - `state` → `{ code_verifier, created_at, brand_id }`
   - Endpoint: `POST /auth/brand/tuya/connect` returns `{ auth_url, state, expires_in }`
   - Endpoint: `POST /auth/brand/tuya/oauth-callback` validates state and exchanges code

2. **For API key brands (Govee):**
   - Just validate the key works via test endpoint
   - Store in brand_credentials table
   - No OAuth infrastructure needed

3. **For QR Code OAuth (if implementing):**
   - Generate via Tuya's API or RFC 8628
   - Return base64-encoded PNG in JSON response
   - Implement polling endpoint if using RFC 8628 device flow

---

## Frontend Implementation Notes

The frontend should:
1. For auth_url flow: Open in new window or redirect
2. For QR flow: Display as image, user scans with phone
3. Both: Wait for callback to same origin (redirect + postMessage)
4. On callback: Extract `code` and `state` from URL
5. Call `/auth/brand/{brand}/oauth-callback` with code + state
6. Backend exchanges code for token and stores it

The key insight: **Your backend API is the OAuth client, not the frontend.**
Frontend just displays URLs/QR codes and handles redirects back to the callback.
