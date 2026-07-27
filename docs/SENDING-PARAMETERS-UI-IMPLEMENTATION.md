# Sending Parameters UI Implementation

## Overview
Implemented a comprehensive UI for the new device action parameter design in the condition modal dialog (`/templates/layouts/channels.html`). This allows users to specify device request bodies and parameter evaluators for dynamic device control.

## Files Modified

### 1. `/templates/layouts/channels.html`
**Added:** New "Sending Parameters" section in the condition modal with:
- **Device Action Body Template** (textarea)
  - JSON editor for specifying the complete request body
  - Real-time JSON validation with parameter count feedback
  - `oninput` triggers update of param dropdown and preview

- **Parameter Name Selection** (dropdown)
  - Dynamically populated from parsed JSON body template
  - Allows user to select which field receives the evaluated value
  - Updates preview on change

- **Parameter Evaluator Configuration** (nested form)
  - **Evaluator Type** selector with 6 options:
    1. `extract_number` - Extract numeric values with range
    2. `extract_hex_color` - Extract hex color codes (#RRGGBB)
    3. `extract_text` - Extract text by pattern
    4. `regex_extract` - Extract using regex pattern
    5. `conditional` - Conditional logic with default value
    6. `fixed_value` - Use a fixed/static value
  
  - **Evaluator UI Container** - Dynamic fields populated based on type
    - Number range input (e.g., "0-100")
    - Regex pattern input
    - Text pattern input
    - Default/fixed value inputs

- **Result Preview**
  - Shows example of how the body will look after parameter replacement
  - Displays `[evaluated_value]` placeholder
  - Updates in real-time as user modifies fields

### 2. `/public/css/modals.css`
**Added:** Styling for new form elements:
- `.json-editor` - Monospace font, light background for code blocks
- `.form-help` - Small gray text for field descriptions
- `.section-note` - Highlighted note boxes with blue background
- `.result-preview` - Code preview box with monospace font
- `.form-section` - Grouped fieldset styling
- `.optional-label` - Small label for optional fields
- `.checkbox-label` - Flexible checkbox styling

### 3. `/public/js/channels-shared.js`
**Added:** Helper functions for parameter management:

#### Utility Functions
- `parseJSON(jsonStr)` - Safe JSON parsing with error handling
- `getParamNamesFromBody(bodyJson)` - Extract object keys from JSON
- `buildEvaluatorUI(evaluatorType)` - Generate UI based on evaluator type

#### Event Handlers
- `updateParamNameDropdown()` - Parse body JSON and update param dropdown
- `updateEvaluatorUI()` - Generate evaluator-specific form fields
- `updateResultPreview()` - Show example of merged result

#### Evaluator Structure Builders
- `buildEvaluatorStructure(evaluatorType)` - Create ConditionLogicStructure JSON
  - Reads UI values and creates appropriate operator structure
  - Supports all 6 evaluator types

## UI Flow

```
User inputs Device Action Body (JSON)
  ↓
updateParamNameDropdown()
  - Parses JSON
  - Extracts keys (state, brightness, etc.)
  - Populates dropdown
  - Shows validation message
  ↓
User selects Parameter Name from dropdown
  ↓
updateResultPreview()
  - Clones body template
  - Shows example with placeholder value
  ↓
User selects Evaluator Type
  ↓
updateEvaluatorUI()
  - Generates type-specific input fields
  - e.g., number range, regex pattern, etc.
  ↓
User enters evaluator config
  ↓
updateResultPreview()
  - Updates preview with example result
```

## Data Structure

### Device Action Body
```json
{
  "state": "on",
  "brightness": 50,
  "transition_ms": 300
}
```

### Parameter Name
Selected from body keys: `brightness`

### Evaluator Structure
```json
{
  "Operator": "EXTRACT_NUMBER",
  "Variables": ["0-100"]
}
```

## Example Usage

**User Wants:** Extract brightness value from chat comment (0-100 range)

1. **Body Template:**
   ```json
   {"state":"on","brightness":50,"transition_ms":300}
   ```

2. **Parameter Name:** `brightness`

3. **Evaluator Type:** `extract_number`

4. **Evaluator Config:** Range = `0-100`

5. **Result Preview:**
   ```json
   {"state":"on","brightness":"[evaluated_value]","transition_ms":300}
   ```

6. **When Triggered:** Comment = "set brightness to 75"
   - Extracts: `75`
   - Final Result: `{"state":"on","brightness":75,"transition_ms":300}`

## Evaluator Types Reference

### 1. Extract Number
- **Use:** Numeric values with optional range constraints
- **UI Input:** Number range (e.g., "0-100", "1-255")
- **Structure:**
  ```json
  {"Operator":"EXTRACT_NUMBER","Variables":["0-100"]}
  ```

### 2. Extract Hex Color
- **Use:** RGB hex color codes
- **UI Input:** None (auto-configured)
- **Structure:**
  ```json
  {"Operator":"REGEX_EXTRACT","Variables":["#([0-9A-Fa-f]{6})"]}
  ```

### 3. Extract Text
- **Use:** Text matching patterns
- **UI Input:** Text pattern/keyword
- **Structure:**
  ```json
  {"Operator":"EXTRACT_TEXT","Variables":["pattern"]}
  ```

### 4. Regex Extract
- **Use:** Custom regex extraction
- **UI Input:** Regex pattern with capture group
- **Structure:**
  ```json
  {"Operator":"REGEX_EXTRACT","Variables":["(pattern)"]}
  ```

### 5. Conditional
- **Use:** Multiple outcomes based on conditions
- **UI Input:** Default value
- **Structure:**
  ```json
  {"Operator":"CONDITION","SubConditions":[{"Operator":"DEFAULT","Result":"value"}]}
  ```

### 6. Fixed Value
- **Use:** Static value regardless of event
- **UI Input:** Fixed value
- **Structure:**
  ```json
  {"Operator":"FIXED_VALUE","Result":"fixed_value"}
  ```

## Integration with Condition Save

When condition is saved, include:
1. `DeviceActionBody` - JSON string or parsed object
2. `DeviceActionParamName` - Selected parameter name
3. `DeviceActionParamEvaluator` - Result of `buildEvaluatorStructure()`

These complement the existing:
- `DeviceAction` - e.g., "brightness"
- `DeviceID` - Device to control

## Backward Compatibility

- Old `DeviceActionParams` field still supported for legacy conditions
- New design uses three separate fields:
  - `DeviceActionBody`
  - `DeviceActionParamName`
  - `DeviceActionParamEvaluator`
- Cannot mix both in the same condition

## Future Enhancements

1. **Visual Body Editor** - Point-and-click JSON builder
2. **Template Library** - Pre-built templates for common devices
3. **Live Testing** - Test evaluator against sample event data
4. **Syntax Highlighting** - Code highlighting in JSON editor
5. **Validation Rules** - Warn if param name doesn't match body structure
