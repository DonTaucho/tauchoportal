# Device Action Parameters Design - Solution

## Current Problem

The current implementation stores `DeviceActionParams` as a `ConditionLogicStructure` that evaluates to a single result value (e.g., "50"). This loses critical context:

1. **Which parameter should receive this value?** (brightness? delay? temperature?)
2. **What should other parameters be?** (state="on"? transition_time="500"?)
3. **Complete device request body is unknown**

### Example Issue
```json
{
  "condition_logic": {
    "Operator": "WHOLESENTENCE"
  },
  "device_action": "brightness",
  "device_action_params": {
    "Operator": "EXTRACT_BRIGHTNESS_FROM_TEXT"
  }
}
```

When condition evaluates to "50", the code doesn't know:
- Is "50" the brightness level?
- Should state also be "on"?
- What about transition speed?
- What's the complete request body?

## Proposed Solution

Extend `Condition` model with **three new fields** to provide complete context:

1. **`DeviceActionBody`** (JSON object) - The complete request body template
2. **`DeviceActionParamName`** (string) - The field in the template to replace with evaluated result
3. **`DeviceActionParamEvaluator`** (ConditionLogicStructure) - Logic to compute the value to inject

### Updated Condition Model

```go
type Condition struct {
    ID                 string                  `json:"id"`
    WatchID            string                  `json:"watch_id"`
    Name               string                  `json:"name"`
    EventType          string                  `json:"event_type"`
    Filter             string                  `json:"filter"`
    ConditionLogic     ConditionLogicStructure `json:"condition_logic,omitempty"`
    IsEnabled          bool                    `json:"is_enabled"`
    DeviceID           string                  `json:"device_id,omitempty"`
    DeviceAction       string                  `json:"device_action,omitempty"`
    
    // OLD (kept for backward compatibility):
    DeviceActionParams ConditionLogicStructure `json:"device_action_params,omitempty"`
    
    // NEW fields:
    DeviceActionBody           json.RawMessage        `json:"device_action_body,omitempty"`     // Template request body
    DeviceActionParamName      string                 `json:"device_action_param_name,omitempty"` // Field to replace
    DeviceActionParamEvaluator ConditionLogicStructure `json:"device_action_param_evaluator,omitempty"` // How to compute value
    
    LastTriggeredAt    *time.Time              `json:"last_triggered_at"`
    CreatedAt          time.Time               `json:"created_at"`
    UpdatedAt          time.Time               `json:"updated_at"`
}
```

## API Request/Response Format

### Example 1: Brightness Control from Chat Comments

**POST /conditions** with brightness extracted from text:

```json
{
  "watch_id": "watch_123",
  "name": "Brightness Control from Chat",
  "event_type": "comment",
  "filter": "",
  "device_id": "device_456",
  "device_action": "brightness",
  "device_action_body": {
    "state": "on",
    "brightness": 50,
    "transition_ms": 300
  },
  "device_action_param_name": "brightness",
  "device_action_param_evaluator": {
    "Operator": "EXTRACT_NUMBER",
    "Variables": ["0-100"]
  }
}
```

**Execution:** Comment text = "set brightness to 75" → Extract "75" → Replace brightness in template → Send `{"state":"on","brightness":75,"transition_ms":300}`

### Example 2: Color Control from Chat

```json
{
  "watch_id": "watch_123",
  "name": "Color Control",
  "event_type": "comment",
  "filter": "#",
  "device_id": "device_456",
  "device_action": "color",
  "device_action_body": {
    "state": "on",
    "color_rgb": "#FF0000",
    "effect": "none",
    "brightness": 100
  },
  "device_action_param_name": "color_rgb",
  "device_action_param_evaluator": {
    "Operator": "REGEX_EXTRACT",
    "Variables": ["#([0-9A-Fa-f]{6})"]
  }
}
```

**Execution:** Comment text = "change to #00FF00" → Extract "#00FF00" → Replace color_rgb in template → Send `{"state":"on","color_rgb":"#00FF00","effect":"none","brightness":100}`

### Example 3: Scene Selection

```json
{
  "watch_id": "watch_123",
  "name": "Scene from Gift Amount",
  "event_type": "gift",
  "filter": "",
  "device_id": "device_456",
  "device_action": "scene",
  "device_action_body": {
    "scene": "party",
    "duration_ms": 5000
  },
  "device_action_param_name": "scene",
  "device_action_param_evaluator": {
    "Operator": "CONDITION",
    "SubConditions": [
      {
        "Operator": "IF_GREATER_THAN",
        "Variables": ["$gift_value", "1000"],
        "Result": "party"
      },
      {
        "Operator": "DEFAULT",
        "Result": "relax"
      }
    ]
  }
}
```

## Execution Flow

### Step 1: Trigger
Condition is triggered by an event (comment, gift, etc.)

### Step 2: Evaluate Param
```
Evaluator = {
  "Operator": "EXTRACT_NUMBER",
  "Variables": ["0-100"]
}
Event Text = "set brightness to 75"
Result = "75"
```

### Step 3: Merge Into Template
```
Template:  {"state":"on","brightness":50,"transition_ms":300}
ParamName: "brightness"
Value:     "75"

Output: {"state":"on","brightness":75,"transition_ms":300}
```

### Step 4: Send to Device API
```
POST /api/device/{device_id}/execute
Content-Type: application/json

{"state":"on","brightness":75,"transition_ms":300}
```

## Database Schema

Add three new columns to `conditions` table:

```sql
ALTER TABLE conditions ADD COLUMN (
    device_action_body JSONB,
    device_action_param_name VARCHAR(255),
    device_action_param_evaluator JSONB
);
```

## Frontend UI Guidance

### Create/Edit Condition Form

1. **Choose Device Action** → Show available actions (brightness, color, scene, etc.)

2. **Load Template** → For selected device/action, show template UI:
   ```
   Device Action: Brightness
   Template Preview:
   ┌─────────────────────────────────────┐
   │ {                                   │
   │   "state": "on",                    │
   │   "brightness": 50,                 │
   │   "transition_ms": 300              │
   │ }                                   │
   └─────────────────────────────────────┘
   ```

3. **Copy Template** → User clicks "Copy" → Template goes to:
   - Device Action Body input (textbox or JSON editor)

4. **Choose Dynamic Param** → Dropdown showing all keys in template:
   - state
   - brightness
   - transition_ms

5. **Define Evaluator** → Visual/text editor for ConditionLogicStructure:
   ```
   Operator: EXTRACT_NUMBER
   Variables: ["0-100"]
   ```

### Result Preview

```
Template:        {"state":"on","brightness":50,"transition_ms":300}
Param to Replace: brightness
Evaluator:       EXTRACT_NUMBER from comment
Example Input:   "hey set brightness to 75"
Example Result:  {"state":"on","brightness":75,"transition_ms":300}
```

## Validation Rules

1. **DeviceActionParamName** must be a valid key in DeviceActionBody
2. **DeviceActionParamEvaluator** result type must match param type
3. **At least one path must be provided:**
   - Legacy: `device_action_params` (backward compat)
   - New: `device_action_body` + `device_action_param_name` + `device_action_param_evaluator`
4. **Cannot mix both paths** in the same condition

## Backward Compatibility

- Old conditions with only `device_action_params` continue to work
- New conditions use the three new fields
- Migration is optional (no forced update)

## Implementation Checklist

- [ ] Update Condition model with three new fields
- [ ] Create database migration (ALTER TABLE conditions)
- [ ] Update CreateConditionRequest/UpdateConditionRequest types
- [ ] Update condition_handlers.go with new field support
- [ ] Update condition_executor.go convertConditionParams() to handle new format
- [ ] Add validation for param name existence in template
- [ ] Add tests for template merging logic
- [ ] Update API spec documentation
