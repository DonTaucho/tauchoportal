# Condition Page: TEST & SUBMIT Button Implementation

## Overview
Added complete functionality for TEST and SUBMIT buttons on the condition page (`/templates/pages/condition.html`). These buttons now enable users to test condition logic and save condition configurations.

## Changes Made

### 1. Button HTML Updates (lines 61-62)
- Added `id="testConditionButton"` and `onclick="openTestModal()"` to TEST button
- Added `id="submitConditionButton"` and `onclick="submitCondition()"` to SUBMIT button

### 2. JavaScript Implementation
Added comprehensive JavaScript handlers in condition.html:

#### Helper Functions:
- **`getConditionData()`** - Extracts condition logic and device action params from textareas
- **`parseJSON(str)`** - Safely parses JSON with error handling
- **`getTestEventParams()`** - Collects custom test event parameters from form

#### TEST Button Handler:
- **`openTestModal()`** 
  - Opens the existing `testConditionModal` from channels.html
  - Populates event type dropdown from shared `PLATFORM_EVENTS` data
  - Selects the current condition's event type

- **`updateTestEventParams()`**
  - Dynamically generates form fields based on selected event type
  - Uses shared `EVENT_PARAMETERS` to show relevant input fields
  - Supports text, number, and checkbox input types

- **`runConditionTest()`**
  - Validates condition logic JSON
  - Calls shared `buildTestEvent()` function with custom parameters
  - POSTs to `/api/conditions/test-draft` endpoint
  - Displays results with:
    - Full JSON response
    - Matched status (✓ Yes / ✗ No)
    - Would trigger status
    - Computed values extracted by logic
    - Execution errors/results

#### SUBMIT Button Handler:
- **`submitCondition()`**
  - Validates condition logic JSON
  - Determines if creating new condition or updating existing
  - POSTs to `/api/conditions` for new conditions
  - PATCHes to `/api/conditions/update?id=<condition_id>` for updates
  - Includes:
    - name
    - event_type
    - is_enabled (true)
    - condition_logic (parsed JSON)
    - device_id, device_action, device_action_params
    - watch_id (only for new conditions)
  - Shows loading state during submission
  - Redirects to conditions list on success
  - Displays error messages on failure

## Data Structures

### Test Request (POST /api/conditions/test-draft)
```json
{
  "condition_logic": { /* parsed JSON from textarea */ },
  "test_event": {
    "id": "evt_test_<timestamp>",
    "user_id": 1,
    "watch_target_id": "<channel_id>",
    "platform": "<platform>",
    "event_type": "<selected_type>",
    "message": "<custom_or_default>",
    "amount_value": <number>,
    "amount_currency": "USD",
    "sender_name": "<custom_or_default>",
    "sender_id": "<custom_or_default>",
    "is_member": <boolean>,
    "is_mod": <boolean>,
    "badges": [],
    "received_at": "<ISO8601>",
    "created_at": "<ISO8601>"
  },
  "device_id": "<from_condition>",
  "device_action": "<from_condition>",
  "device_action_params": { /* parsed JSON */ },
  "trigger_real_device": <checkbox_state>
}
```

### Submit Request (POST/PATCH /api/conditions)
```json
{
  "watch_id": "<channel_id>",  // POST only
  "name": "<condition_name>",
  "event_type": "<event_type>",
  "is_enabled": true,
  "condition_logic": { /* parsed JSON */ },
  "device_id": "<device_id>",
  "device_action": "<device_action>",
  "device_action_params": { /* parsed JSON */ }
}
```

## Integration Points

### Shared Dependencies (from channels-shared.js):
- `openModal(id)` - Opens modal by ID
- `closeModal(id)` - Closes modal by ID
- `PLATFORM_EVENTS` - Map of event types by platform
- `EVENT_PARAMETERS` - Map of test event parameters by event type
- `buildTestEvent()` - Creates sample test event object

### Existing Modal (channels.html):
- `testConditionModal` - Already has form structure:
  - Event type dropdown
  - Dynamic parameter container
  - Real device trigger checkbox
  - Results display area
  - Test button

## Error Handling
- **JSON Parse Errors**: Caught and displayed as alerts
- **Empty Event Type**: Validation before test
- **Invalid Logic**: Validation before submission
- **API Errors**: Displayed in alerts with error messages
- **Network Errors**: Caught and shown to user

## Notes for Future Enhancement

### Known Limitations:
1. Backend API endpoints not yet verified (waiting for backend implementation)
2. Device action params structure changed to recursive JSON - may need validation
3. Sample events use default values; fully customizable event parameters possible

### Potential Improvements:
1. Add front-end JSON validation for condition logic structure
2. Add visual JSON editor for condition logic and device params
3. Add history of recent test results
4. Add condition templates/presets
5. Add drag-and-drop logic builder (if not already implemented)

## Testing Checklist

- [ ] TEST button opens modal with correct event types
- [ ] TEST event parameters populate based on event type
- [ ] TEST runs successfully with dry-run (trigger_real_device: false)
- [ ] TEST shows results properly formatted
- [ ] SUBMIT creates new condition (verify watch_id is sent)
- [ ] SUBMIT updates existing condition (verify PATCH endpoint)
- [ ] SUBMIT redirects to conditions list on success
- [ ] Error messages display on validation failures
- [ ] Loading states work (button text, disabled state)

## API Endpoints Used

- `POST /api/conditions/test-draft` - Test unsaved condition logic
- `POST /api/conditions` - Create new condition
- `PATCH /api/conditions/update?id=<condition_id>` - Update existing condition

---

**Implementation Date**: 2026-07-19
**Status**: Ready for testing (awaiting backend API implementation)
