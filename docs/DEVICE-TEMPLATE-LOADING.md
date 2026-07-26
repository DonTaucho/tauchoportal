# Device Template Loading for Sending Parameters

## Overview
When users select a device in the condition modal, the application now automatically loads device templates from the API and populates the "Sending Parameters" form with:
- Pre-filled device action body template (JSON)
- Available parameter names for the device
- Constraints for each parameter

## Implementation Details

### User Flow
```
1. User opens Condition Modal
2. User enables "Trigger Device" checkbox
3. User selects a Device from dropdown
   ↓
4. API Call: GET /device-templates?brand={brand_id}
   ↓
5. Response populates:
   - condDeviceActionBody textarea with http_body_template
   - condParamName dropdown with required_parameters
   - sendingParamsSection becomes visible
   ↓
6. User can now configure sending parameters
```

### Files Modified

#### `/public/js/conditions-list.js`
**Function: `updateCondActionSelect()`**
- Made function `async` to support device template loading
- Added logic to find selected device from `deviceCache`
- Added `await loadDeviceTemplates(device.brand)` when device is selected
- Hides `sendingParamsSection` if no device selected or load fails
- Maintains backward compatibility with existing action/color/brightness fields

```javascript
async function updateCondActionSelect() {
    const device = deviceCache.find(d => d.id === select.value);
    
    // ... existing logic ...
    
    // NEW: Load device templates for sending parameters
    if (sendingParamsSection && device.brand) {
        await loadDeviceTemplates(device.brand);
    }
}
```

#### `/public/js/channels-shared.js`
**Function: `loadDeviceTemplates(brandId)`**
- Called when device is selected
- Makes GET request to `/device-templates?brand={brandId}`
- Extracts first template from API response
- Populates three form fields:

1. **Device Action Body** (textarea)
   - Takes `http_body_template` from API response
   - Formats JSON for readability (pretty-prints)
   - Example: `{"brightness": 50, "state": "on"}`

2. **Parameter Name** (dropdown)
   - Populates from `required_parameters` array in API response
   - Each parameter becomes a selectable option
   - Example: `["brightness", "state", "transition_ms"]`

3. **Sending Parameters Section** (visibility)
   - Shows section only when device has templates
   - Hides section if no device selected or load fails

**Error Handling:**
- Logs warnings if no templates found for brand
- Hides sending parameters section on API error
- Continues gracefully without breaking existing functionality

### API Response Structure

**Endpoint:** `GET /device-templates?brand={brand_id}`

**Expected Response:**
```json
[
  {
    "id": "template_id",
    "brand": "govee",
    "category": "brightness",
    "http_method": "PUT",
    "http_url": "https://api.govee.com/v1/devices/control",
    "http_body_template": "{\"device\": \"...\", \"brightness\": 50}",
    "required_parameters": ["brightness"],
    "parameter_constraints": {
      "brightness": {
        "type": "number",
        "min": 1,
        "max": 100
      }
    },
    "http_headers": {},
    "authentication_type": "api_key"
  }
]
```

**Key Fields Used:**
- `http_body_template` - JSON template for device request body
- `required_parameters` - Array of parameter names user can configure
- `parameter_constraints` - (Future use) Validation rules for parameters

### Integration Flow

```
BEFORE (Only color/brightness actions):
Device Selected
  → Show color/brightness UI
  → No template-based parameters

AFTER (With device templates):
Device Selected
  → Show color/brightness UI (unchanged)
  → Load device templates (NEW)
  → Show Sending Parameters section (NEW)
  → User can configure body + parameters
```

### Example: Govee Brightness Control

**User scenario:** User wants to send a brightness command to Govee device

1. **Device Selection:**
   - User selects "Govee Light #1" from dropdown

2. **Template Loaded:**
   ```json
   {
     "http_body_template": "{\"device\": \"abc123\", \"brightness\": 50}",
     "required_parameters": ["brightness"]
   }
   ```

3. **Form Populated:**
   - Body textarea shows: `{"device": "abc123", "brightness": 50}`
   - Parameter dropdown shows: `brightness`

4. **User Configuration:**
   - Selects `brightness` parameter
   - Selects `extract_number` evaluator type
   - Enters range: `1-100`

5. **Result:**
   - When condition triggers, extracts number from event
   - Validates against 1-100 range
   - Sends to device with updated brightness value

### Error Scenarios

**No Brand Information:**
```javascript
if (!device.brand) {
    // Skip template loading
    sendingParamsSection.style.display = 'none';
}
```

**API Fails to Return Templates:**
```javascript
if (!response || !response.length) {
    console.warn('No templates found');
    sendingParamsSection.style.display = 'none';
}
```

**Invalid JSON in Template:**
```javascript
try {
    const parsed = JSON.parse(template.http_body_template);
    bodyTextarea.value = JSON.stringify(parsed, null, 2);
} catch (e) {
    bodyTextarea.value = template.http_body_template; // Use as-is
}
```

### Performance Considerations

1. **First Template Used:**
   - API returns array of templates
   - Implementation uses first template (index 0)
   - Could be extended to allow template selection UI

2. **No Caching:**
   - Template loaded each time device is selected
   - Reduces memory usage
   - Keeps UI in sync with API updates

3. **Async/Await:**
   - `updateCondActionSelect()` is async
   - Prevents blocking while API loads
   - UI updates as soon as response arrives

### Future Enhancements

1. **Template Selection UI**
   - If brand has multiple templates, show dropdown
   - Allow user to pick which template to use

2. **Parameter Constraints Validation**
   - Display min/max ranges next to evaluator inputs
   - Warn if user enters out-of-range values

3. **Template Caching**
   - Cache templates per brand in sessionStorage
   - Reduce API calls if same device selected multiple times

4. **Custom Template Editor**
   - Allow advanced users to modify http_body_template
   - Add JSON schema validation

### Backward Compatibility

- Existing conditions without sending parameters still work
- Color/brightness UI remains unchanged
- Sending parameters section is optional
- If API doesn't return templates, gracefully falls back to old UI
- Device action save/load unchanged

### Testing Checklist

- [ ] Select device → templates load → section shows
- [ ] Select different device → templates update
- [ ] Device without templates → section hides
- [ ] API error → section hides, no console errors
- [ ] Invalid JSON in template → formats gracefully
- [ ] Multiple parameters → all show in dropdown
- [ ] Existing conditions → still work without templates
