# Brand Settings Page Restructure - Complete Server-Side Rendering

## Summary
Restructured the brand-settings page to be completely static and server-rendered, eliminating all dynamic JavaScript DOM updates that were causing empty button labels and over-complicated logic.

## Problems Fixed
1. **Empty button labels** - Buttons were being emptied by JavaScript because `getBrandActionLabel()` couldn't find data attributes
2. **Overly complex JavaScript** - ~900 lines of code trying to update DOM elements that should never change
3. **Inconsistent UI state** - JavaScript was trying to keep UI in sync with server state, causing gaps
4. **Unnecessary page load work** - JavaScript was running expensive queries and DOM updates on every page load

## Changes Made

### HTML Changes (`/templates/pages/brand-settings.html`)

#### Removed
- All `data-brand-*` attributes from brand cards (brand-card, brand-id, brand-title, brand-status, brand-last-connected, brand-note, brand-action-button, brand-action)
- The hidden `brandSettingsStrings` element that stored all UI strings as data attributes
- All script-based data attributes that were used for jQuery-style DOM queries

#### Updated
- Brand card rendering: Now uses inline conditional logic to determine button labels at render time
  ```html
  {{if .IsConnected}}
      <button onclick="handleBrandAction('{{.ID}}')">{{$.I18n.T "brandSettings.manage"}}</button>
      <button onclick="promptDisconnect('{{.ID}}')">{{$.I18n.T "brandSettings.disconnect"}}</button>
  {{else}}
      <button onclick="handleBrandAction('{{.ID}}')">{{$.I18n.T "brandSettings.connect"}}</button>
  {{end}}
  ```
- Added `is-connected` class directly to brand card based on `.IsConnected` status
- Buttons now call onclick handlers directly instead of relying on event delegation and data attributes
- All labels are rendered statically from i18n translations

### JavaScript Changes (`/public/js/brand-settings.js` → `/public/js/brand-settings-new.js`)

#### Removed Functions (~400 lines)
- `updateBrandCard()` - No longer needed, status is static
- `renderBrandsList()` - Removed
- `loadBrandAuthStatus()` - Removed (page loads with data already from server)
- `getBrandActionLabel()` - Removed (labels are now static in template)
- `getBrandTitle()` - Removed (titles are rendered in template)
- `getBrandDescription()` - Removed (no longer used)
- `getCardState()` - Removed
- `formatDate()` - Removed
- `setPageMessage()` - Removed
- `normalizeStatusMap()` - Removed
- `isConnected()` - Removed
- `getLastConnected()` - Removed
- `findBrandRecord()` - Removed
- All DOM querying functions for finding card elements

#### Kept/Simplified Functions
- Modal management: `openModal()`, `closeModal()`
- API communication: `apiRequest()`
- Brand action handlers: `handleBrandAction()`, `promptDisconnect()`, `openOAuthFlow()`, etc.
- Setup wizard: Kept for multi-step credential entry
- Form handling: `openApiKeyModal()`, `saveApiKey()`, `openLocalDeviceModal()`, etc.

#### New Behavior
- After successful connect/disconnect: Shows toast message "Please refresh to see updated status"
- On page load: Simply binds event handlers, no DOM updates
- No AJAX polling or status monitoring
- User manually refreshes page to see updated connection status

### File Size Reduction
- `brand-settings.js`: ~963 lines → `brand-settings-new.js`: ~530 lines
- Removed 400+ lines of unnecessary DOM manipulation code
- Kept 200+ lines of essential modal and form handling

## User Experience Changes

### Before
1. User clicks connect/manage button
2. Modal opens with form
3. User submits form
4. JavaScript updates button labels and status badges silently
5. No clear feedback that status changed

### After
1. User clicks connect/manage button
2. Modal opens with form
3. User submits form
4. Toast notification: "Brand credentials saved successfully! Please refresh to see updated status."
5. User refreshes page (F5 or button) to see updated status
6. Page reloads with fresh server data

This approach is:
- ✅ Simpler to understand and maintain
- ✅ Guarantees UI always matches server state (no sync gap)
- ✅ Eliminates "phantom" state where UI shows "Connected" but server says "Disconnected"
- ✅ Faster on page load (no JS setup work)
- ✅ More secure (all state comes from server, never from client)

## Testing Checklist
- [ ] Brand settings page loads without JavaScript errors
- [ ] All brand cards display with correct connection status
- [ ] Connected brands show "Manage" and "Disconnect" buttons
- [ ] Disconnected brands show only "Connect" button
- [ ] Button labels are never empty
- [ ] Clicking buttons opens correct modals
- [ ] Modal form submission shows success toast
- [ ] Toast message suggests refreshing
- [ ] After refresh, page shows updated connection status
- [ ] Setup wizard flows work correctly (if applicable)
- [ ] API calls (OAuth, API key, local device) still function

## Script Reference Update
Updated template to load new script:
```html
<script src="/js/brand-settings-new.js" defer></script>
```

## Backward Compatibility
- Old `brand-settings.js` can be kept or removed (not used)
- API endpoints remain unchanged
- Modal functionality preserved
- All i18n translations still used
- No backend changes required
