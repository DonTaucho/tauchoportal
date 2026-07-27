# Brand Settings Page - Issues and Fix Plan

## Issue 1: Button Visibility Not Working (`.hidden` vs `style="display"`)

### Problem
Lines 674-675 of `brand-settings.js`:
```javascript
if (testBtn) testBtn.hidden = !isLastStep;
if (saveBtn) saveBtn.hidden = !isLastStep;
```

Template has inline styles (`style="display:none"`):
```html
<button type="button" class="btn-primary" data-wizard-action="test" style="display:none">Test</button>
<button type="button" class="btn-primary" data-wizard-action="save" style="display:none">Save</button>
```

### Root Cause
CSS cascade conflict:
- Inline `style="display:none"` has specificity 1000 (inline styles)
- `HTMLElement.hidden` property sets the `[hidden]` attribute, which has specificity 0 (attribute selector in UA stylesheet)
- **Result:** Inline styles always win, so buttons stay hidden regardless of `.hidden` property

The `nextBtn` and `backBtn` work differently because they also have `style="display:none"` initially:
```html
<button type="button" class="btn-secondary" data-wizard-action="back" style="display:none">Back</button>
<button type="button" class="btn-secondary" data-wizard-action="next">Next</button>
```

Note: `next` button doesn't have inline style, so when `.hidden` is set to false, it becomes visible!

### Solution
**Option A (Recommended):** Use inline style in JavaScript (most reliable)
```javascript
if (backBtn) backBtn.style.display = stepIndex === 0 ? 'none' : '';
if (nextBtn) nextBtn.style.display = isLastStep ? 'none' : '';
if (testBtn) testBtn.style.display = !isLastStep ? 'none' : '';
if (saveBtn) saveBtn.style.display = !isLastStep ? 'none' : '';
```

**Option B:** Remove inline styles from template, use `.hidden` in JavaScript
```html
<!-- Template (remove style="display:none") -->
<button type="button" class="btn-secondary" data-wizard-action="back">Back</button>
<button type="button" class="btn-secondary" data-wizard-action="next">Next</button>
<button type="button" class="btn-primary" data-wizard-action="test">Test</button>
<button type="button" class="btn-primary" data-wizard-action="save">Save</button>
```

Choose Option A to avoid CSS conflicts with inline styles.

---

## Issue 2: Wrong API Endpoints

### Current Implementation (Incorrect)
```javascript
// Line 543
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/api-key`, {
  api_key: key,
  token: key,
  key
});

// Line 578
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/local`, {
  ip,
  token,
  auth_token: token
});
```

**Problem:** Endpoints `/auth/brand/{brand}/api-key` and `/auth/brand/{brand}/local` do not exist in the API spec.

### API Specification (Correct - lines 1919-2056)

#### For Saving Credentials
**Endpoint:** `POST /auth/brand/<brand_id>/connect`

**Supported auth types:**
1. `api_key` - For Govee, Lifx, etc.
2. `local` - For Hue, Nanoleaf (bridge IP + API key)
3. `oauth` - For Tuya (OAuth code + state)

**Request body format (varies by auth type):**

```json
// For API-key brands (Govee, Lifx)
{
  "auth_type": "api_key",
  "credentials": {
    "api_key": "...",
    "device_id": "..." // optional, brand-dependent
  }
}

// For local IP brands (Hue, Nanoleaf)
{
  "auth_type": "local",
  "credentials": {
    "bridge_ip": "192.168.1.50",
    "api_key": "...",
    "light_id": "..." // optional
  }
}

// For OAuth brands (Tuya)
{
  "auth_type": "oauth",
  "oauth_code": "...",
  "oauth_state": "..."
}
```

**Response:**
```json
{
  "id": "ubcred_...",
  "brand_id": "govee",
  "status": "connected",
  "connected_at": "2026-06-24T23:27:37Z",
  "error_message": null
}
```

#### For Testing Credentials (Optional)
**Endpoint:** `POST /auth/brand/<brand_id>/test`

**Request body:** Same as `/connect`

**Response if valid:**
```json
{
  "is_valid": true,
  "message": "✅ Credentials verified. Found 3 devices.",
  "device_count": 3,
  "devices": [
    { "id": "device_1", "name": "Living Room Light", "status": "online" }
  ]
}
```

**Response if invalid:**
```json
{
  "is_valid": false,
  "error": "Invalid API key. Check your Govee app settings."
}
```

#### For Disconnecting
**Endpoint:** `POST /auth/brand/<brand_id>/disconnect`

**Response:**
```json
{ "status": "disconnected" }
```

---

## Required Fix: Update JavaScript to Use Correct Endpoints

### Fix #1: Replace API-key endpoint with `/connect`

**Current (wrong):**
```javascript
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/api-key`, {
  api_key: key,
  token: key,
  key
});
```

**Fixed:**
```javascript
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/connect`, {
  auth_type: 'api_key',
  credentials: {
    api_key: key
  }
});
```

### Fix #2: Replace local endpoint with `/connect`

**Current (wrong):**
```javascript
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/local`, {
  ip,
  token,
  auth_token: token
});
```

**Fixed:**
```javascript
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/connect`, {
  auth_type: 'local',
  credentials: {
    bridge_ip: ip,
    api_key: token
  }
});
```

### Fix #3: Add test endpoint support

When user clicks "Test Credentials":
```javascript
await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/test`, {
  auth_type: 'api_key', // or 'local'
  credentials: {
    api_key: key
  }
});
```

### Fix #4: Update saveWizardCredentials to use correct format

**Current:**
```javascript
async function saveWizardCredentials(brandId) {
  const meta = getBrandMeta(brandId);
  if (meta.authType === 'api-key') {
    const credValues = Object.values(setupWizardState.credentials).filter(v => v);
    await saveApiKey(brandId, credValues[0]);
  } else if (meta.authType === 'local') {
    const ip = setupWizardState.credentials.device_ip || '';
    const token = setupWizardState.credentials.api_key || '';
    await saveLocalDeviceAuth(brandId, ip, token);
  }
}
```

**Should be:**
```javascript
async function saveWizardCredentials(brandId) {
  const meta = getBrandMeta(brandId);
  if (!meta) return;

  try {
    const credentials = buildCredentialsPayload(meta, setupWizardState.credentials);
    
    await apiRequest('POST', `/auth/brand/${encodeURIComponent(brandId)}/connect`, {
      auth_type: meta.authType,
      credentials: credentials
    });
    
    closeModal('setupWizardModal');
    showToast('Brand credentials saved successfully!');
    await loadBrandAuthStatus();
  } catch (error) {
    showToast(`Failed to save credentials: ${error.message}`, 'error');
  }
}

function buildCredentialsPayload(meta, wizardCredentials) {
  if (meta.authType === 'api_key') {
    return {
      api_key: wizardCredentials.api_key || wizardCredentials.token
    };
  } else if (meta.authType === 'local') {
    return {
      bridge_ip: wizardCredentials.device_ip,
      api_key: wizardCredentials.api_key || wizardCredentials.token
    };
  }
  return {};
}
```

---

## Summary of Required Changes

| Issue | File | Location | Fix |
|-------|------|----------|-----|
| Button visibility | brand-settings.js | 671-675 | Change `.hidden` to `style.display` |
| API endpoint (save key) | brand-settings.js | 543 | Replace `/auth/brand/{brand}/api-key` with `/auth/brand/{brand}/connect` |
| API endpoint (local) | brand-settings.js | 578 | Replace `/auth/brand/{brand}/local` with `/auth/brand/{brand}/connect` |
| Payload format (api-key) | brand-settings.js | 543-547 | Wrap in `{ auth_type, credentials }` |
| Payload format (local) | brand-settings.js | 578-582 | Change field names to match spec |
| Wizard save | brand-settings.js | 763-783 | Use correct endpoint and payload format |

---

## Implementation Status

- [x] API endpoints identified in spec (lines 1919-2056)
- [x] Correct payload format documented
- [ ] Button visibility fixed in JavaScript
- [ ] API calls updated to use `/connect` endpoint
- [ ] Payload format updated to match spec
- [ ] Test button implementation added
- [ ] Error handling improved
- [ ] UI tested with real credentials

---

## Notes

- The API backend should be ready (as of 2026-06-24)
- All endpoints use `POST` method
- All endpoints require authentication (Bearer token in Authorization header)
- Credentials are stored in `user_brand_credentials` table per user
- Unique constraint ensures only one credential set per brand per user
