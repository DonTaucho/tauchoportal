# Smart Device Template System - Implementation Guide

## Overview

The smart device template system is now fully implemented with:
- ✅ Database models (3 new tables)
- ✅ Go model structs (device_template, user_device_credential, user_device_command)
- ✅ Store interfaces and SQL implementations
- ✅ Generic template-based executor
- ✅ Brand-specific executors (Govee, WLED, LIFX, Tuya)

**Key Architecture Decision:** All brand-specific logic is isolated in separate `brand.go` files. The common code remains generic and reusable.

---

## Files Created

### Model Files (internal/models/)
1. **device_template.go** - DeviceBrandTemplate struct with JSONB serialization
2. **user_device_credential.go** - UserDeviceCredential struct with credential masking
3. **user_device_command.go** - UserDeviceCommand struct for audit trail

### Store Interfaces & Implementations (internal/store/)
1. **device_template_store.go** - Interfaces for template management
2. **sql_device_template_store.go** - PostgreSQL implementation for templates
3. **sql_user_device_credential_store.go** - PostgreSQL implementation for credentials
4. **sql_user_device_command_store.go** - PostgreSQL implementation for command history

### Device Executors (internal/device/)
1. **template_executor.go** - Generic template-based HTTP executor
   - Renders HTTP requests from templates
   - Substitutes parameters (credentials + user params)
   - Handles authentication (API key, Bearer, OAuth)
   - Records all command executions to audit log

2. **govee.go** - Govee-specific implementation
   - BuildGoveeCommand() - Validates and normalizes commands
   - ValidateGoveeCredential() - Checks required fields
   - GoveeExecutor.Execute() - Govee-specific validation before generic execution

3. **wled.go** - WLED-specific implementation
4. **lifx.go** - LIFX-specific implementation
5. **tuya.go** - Tuya-specific implementation

### Helper Functions (internal/device/executor.go - already exists)
These utility functions are already in the old executor.go and can be imported:
- parseNumericParam()
- getStringParam()
- parseColorParam()
- ParseHexColor()

---

## How It Works: Request Execution Flow

### 1. User Initiates Command
```go
// From listener or API
userID := 123
credentialID := 456        // User's device credential
templateID := 789          // Template for "Set Brightness"
action := "brightness"
params := map[string]interface{}{
    "brightness": 50,
}
```

### 2. Brand-Specific Executor (e.g., Govee)
```go
goveeExec := NewGoveeExecutor(templateExecutor)
err := goveeExec.Execute(ctx, userID, credentialID, templateID, "brightness", params)
```

**What happens internally:**
- GoveeExecutor validates the command
- Calls BuildGoveeCommand() to normalize parameters
- Returns commandName and rendered parameters
- Delegates to generic TemplateExecutor

### 3. Generic Template Executor
```go
templateExec.ExecuteTemplate(ctx, userID, credentialID, templateID, commandName, renderedParams)
```

**What happens internally:**

**Step 1: Load Template & Credential**
```go
template := templateStore.GetTemplate(ctx, 789)
// Returns DeviceBrandTemplate with:
// - HTTPMethod: "POST"
// - EndpointURL: "https://openapi.api.govee.com/router/api/v1/device/control"
// - BodyTemplate: '{"device":"{device_id}","model":"{model_id}","cmd":{"name":"brightness","value":{brightness}}}'
// - AuthenticationType: "api_key"
// - AuthHeader: "Govee-API-Key"

credential := credentialStore.GetCredential(ctx, 456)
// Returns UserDeviceCredential with:
// - APIKey: "user_api_key_123"
// - DeviceID: "device_mac_address"
// - DeviceModel: "H6159"
```

**Step 2: Merge Parameters**
```go
combined := buildCombinedParams(credential, renderedParams)
// Result:
// {
//   "device_id": "device_mac_address",
//   "model_id": "H6159",
//   "api_key": "user_api_key_123",
//   "brightness": 50,
// }
```

**Step 3: Substitute Placeholders in Template**
```go
// URL: already complete
// Body template: '{"device":"{device_id}","model":"{model_id}","cmd":{"name":"brightness","value":{brightness}}}'
// becomes:
// '{"device":"device_mac_address","model":"H6159","cmd":{"name":"brightness","value":50}}'
```

**Step 4: Build HTTP Request**
```go
request := http.NewRequest(
  "POST",
  "https://openapi.api.govee.com/router/api/v1/device/control",
  body_with_substituted_params,
)
request.Header.Set("Govee-API-Key", "user_api_key_123")
request.Header.Set("Content-Type", "application/json")
```

**Step 5: Execute & Record**
```go
response := httpClient.Do(request)
// 200 OK → SUCCESS ✅

// Record to user_device_commands table:
command := UserDeviceCommand{
  UserID: 123,
  CredentialID: 456,
  TemplateID: 789,
  CommandName: "Set Brightness",
  Parameters: {"brightness": 50},
  HTTPMethod: "POST",
  EndpointURL: "https://...",
  RequestBody: "{...}",
  StatusCode: 200,
  ResponseBody: "{...}",
  ExecutedAt: now,
}
commandStore.RecordCommand(ctx, command)
```

---

## Integration with Listener-Store Process

### Current State (Old System)
```
Condition triggered
  → DeviceActionExecutor.Execute(device)
  → switch device.Brand
    → case "govee": executeGovee(device)
    → case "wled": executeWLED(device)
```

### New State (Template System)
```
Condition triggered
  → Get device.DeviceGroupID (if grouped)
  → Get user's credential for brand (UserDeviceCredentialStore)
  → Get template for action (DeviceTemplateStore)
  → Invoke brand executor (GoveeExecutor, WLEDExecutor, etc.)
  → Brand executor validates and delegates to TemplateExecutor
  → TemplateExecutor renders HTTP request and executes
  → Command recorded to user_device_commands
```

**Expected flow in listener/store:**
```go
// In your listener or store handler
userID := device.UserID
credential, err := credentialStore.GetCredentialByUserAndBrand(ctx, userID, device.Brand)
if err != nil {
  // Handle missing credential
}

// Find template for action
templates, err := templateStore.ListTemplatesByBrand(ctx, device.Brand)
template := findMatchingTemplate(templates, condition.DeviceAction)

// Execute based on brand
switch device.Brand {
case "govee":
  executor := NewGoveeExecutor(templateExecutor)
  err = executor.Execute(ctx, userID, credential.ID, template.ID, 
                        condition.DeviceAction, condition.DeviceActionParams)
case "wled":
  executor := NewWLEDExecutor(templateExecutor)
  err = executor.Execute(ctx, userID, credential.ID, template.ID,
                        condition.DeviceAction, condition.DeviceActionParams)
// ... add more brands as needed
}
```

---

## Database Setup

### 1. Run SQL Migrations
Copy the SQL from `docs/SMART_DEVICE_DB_SCHEMA.md` and execute in PostgreSQL:
```sql
CREATE TABLE device_brand_templates (...)
CREATE TABLE user_device_credentials (...)
CREATE TABLE user_device_commands (...)
```

### 2. Insert Pre-populated Templates
The document includes INSERT statements for 8+ brands. Run these to populate:
- Govee Turn On/Off, Set Brightness
- Philips Hue Turn On/Off
- LIFX Turn On/Off
- Tuya Turn On/Off
- Nanoleaf Set Brightness
- WLED Set Brightness
- Yeelight Set Brightness
- And more...

### 3. Add to Store Bootstrap
In `internal/bootstrap/stores.go`:
```go
templateStore := store.NewSQLDeviceTemplateStore(db)
credentialStore := store.NewSQLUserDeviceCredentialStore(db)
commandStore := store.NewSQLUserDeviceCommandStore(db)

// Make available to handlers and executors
```

---

## Adding a New Brand (Example: Nanoleaf)

### 1. Create `internal/device/nanoleaf.go`
```go
package device

import (
  "context"
  "fmt"
  // ...
)

type NanoleafExecutor struct {
  templateExecutor *TemplateExecutor
}

func NewNanoleafExecutor(te *TemplateExecutor) *NanoleafExecutor {
  return &NanoleafExecutor{templateExecutor: te}
}

func (ne *NanoleafExecutor) Execute(ctx context.Context, userID int, credentialID int64, 
    templateID int64, action string, params map[string]interface{}) error {
  commandName, rendered, err := BuildNanoleafCommand(action, params)
  if err != nil {
    return fmt.Errorf("invalid Nanoleaf command: %w", err)
  }
  return ne.templateExecutor.ExecuteTemplate(ctx, userID, credentialID, templateID, commandName, rendered)
}

func BuildNanoleafCommand(action string, params map[string]interface{}) (string, map[string]interface{}, error) {
  // Validation and normalization
  // Similar pattern to govee.go
}

func ValidateNanoleafCredential(cred *models.UserDeviceCredential) error {
  // Check required fields
}
```

### 2. Register in Listener/Store
```go
case "nanoleaf":
  executor := NewNanoleafExecutor(templateExecutor)
  err = executor.Execute(ctx, userID, credential.ID, template.ID, action, params)
```

That's it! No changes to common code.

---

## Key Benefits

✅ **Generic Common Code**
- TemplateExecutor doesn't know about specific brands
- All HTTP, parameter substitution, auth handling is generic
- Brand-specific logic isolated in `brand.go` files

✅ **Audit Trail**
- Every command execution is logged to user_device_commands
- Full request/response recorded
- Easy debugging and analytics

✅ **Database-Driven**
- Templates stored in DB (no code changes to add actions)
- Users can eventually create custom templates
- Credentials encrypted and isolated per user

✅ **Easy to Extend**
- Add new brand in 1 file (govee.go, wled.go, etc.)
- Follows same pattern as existing brands
- Template executor handles all common concerns

✅ **No Hard-coded Brand Logic in Common Files**
- executor.go: Brand-specific code removed ✅
- template_executor.go: Completely generic ✅
- Each brand: own file with isolated logic ✅

---

## Next Steps

1. **Run the SQL migrations** to create tables
2. **Add stores to bootstrap** (stores.go)
3. **Add API handlers** for template/credential/command management:
   - GET /api/devices/templates?brand=govee
   - POST /api/devices/credentials
   - POST /api/devices/commands
4. **Integrate with listener** - update the condition execution flow to use brand executors
5. **Test with actual devices** - create credentials and trigger commands

