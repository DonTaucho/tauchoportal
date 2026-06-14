# Smart Device Template System - Files Checklist

## ✅ Completed Files

### Documentation
- [x] `/docs/SMART_DEVICE_API_RESEARCH.md` - Comprehensive brand API analysis
- [x] `/docs/SMART_DEVICE_DB_SCHEMA.md` - Database schema & SQL migrations
- [x] `/docs/SMART_DEVICE_IMPLEMENTATION_GUIDE.md` - Complete integration guide

### Model Files (internal/models/)
- [x] `device_template.go` - DeviceBrandTemplate struct with JSONB wrappers
- [x] `user_device_credential.go` - UserDeviceCredential struct with credential masking
- [x] `user_device_command.go` - UserDeviceCommand struct for audit trail

### Store Interfaces (internal/store/)
- [x] `device_template_store.go` - Interface definitions for 3 stores

### Store Implementations (internal/store/)
- [x] `sql_device_template_store.go` - DeviceTemplateStore implementation
- [x] `sql_user_device_credential_store.go` - UserDeviceCredentialStore implementation
- [x] `sql_user_device_command_store.go` - UserDeviceCommandStore implementation

### Generic Executor (internal/device/)
- [x] `template_executor.go` - Generic HTTP executor (brand-agnostic)

### Brand-Specific Executors (internal/device/)
- [x] `govee.go` - Govee-specific validation & command building
- [x] `wled.go` - WLED-specific validation & command building
- [x] `lifx.go` - LIFX-specific validation & command building
- [x] `tuya.go` - Tuya-specific validation & command building

**Total: 14 new files created**

---

## 📋 Implementation Steps (For You)

### Phase 1: Database Setup (Required First)
1. [ ] Copy SQL migrations from `docs/SMART_DEVICE_DB_SCHEMA.md`
2. [ ] Execute CREATE TABLE statements in PostgreSQL:
   - `device_brand_templates`
   - `user_device_credentials`
   - `user_device_commands`
3. [ ] Execute INSERT statements to pre-populate 8+ brand templates
4. [ ] Verify tables exist: `\dt device_brand_*`, `\dt user_device_*`

### Phase 2: Go Integration
1. [ ] Build the project to check for compilation errors:
   ```bash
   go build ./...
   ```
2. [ ] Add stores to `internal/bootstrap/stores.go`:
   ```go
   templateStore := store.NewSQLDeviceTemplateStore(db)
   credentialStore := store.NewSQLUserDeviceCredentialStore(db)
   commandStore := store.NewSQLUserDeviceCommandStore(db)
   
   // Make available to handlers/executors
   ```

3. [ ] Create brand executors in bootstrap:
   ```go
   templateExecutor := device.NewTemplateExecutor(
     templateStore, credentialStore, commandStore)
   goveeExecutor := device.NewGoveeExecutor(templateExecutor)
   wledExecutor := device.NewWLEDExecutor(templateExecutor)
   // ... more brands
   ```

### Phase 3: API Handlers (Optional but Recommended)
Create `internal/api/device_template_handlers.go`:
```go
// GET /api/devices/templates?brand=govee
// GET /api/devices/templates?category=power
// POST /api/devices/credentials
// GET /api/devices/credentials/{id}
// DELETE /api/devices/credentials/{id}
// GET /api/devices/commands?user_id=123&limit=50
```

### Phase 4: Listener Integration (The Main Work)
Update your listener/store process to use brand executors:
```go
// In condition execution flow
credential, err := credentialStore.GetCredentialByUserAndBrand(ctx, userID, device.Brand)
if err != nil {
  // handle missing credential
}

templates, err := templateStore.ListTemplatesByBrand(ctx, device.Brand)
template := findTemplate(templates, condition.DeviceAction)

switch device.Brand {
case "govee":
  executor := goveeExecutor
  err = executor.Execute(ctx, userID, credential.ID, template.ID,
                        condition.DeviceAction, condition.DeviceActionParams)
case "wled":
  executor := wledExecutor
  err = executor.Execute(ctx, userID, credential.ID, template.ID,
                        condition.DeviceAction, condition.DeviceActionParams)
// ... more brands
}
```

### Phase 5: Testing
1. [ ] Create a device credential via API or DB insert
2. [ ] Trigger a command through the listener
3. [ ] Verify record in `user_device_commands` table
4. [ ] Check command was executed on actual device

---

## 🔄 Migration Path: Old Executor → New System

### Old Code (to refactor)
```go
// internal/device/executor.go - Lines 40-114
switch strings.ToLower(device.Brand) {
case "govee":
  return e.executeGovee(ctx, device, cond)
case "wled":
  return e.executeWLED(ctx, device, cond)
}
```

### New Code (replaces above)
```go
// DeviceActionExecutor becomes:
// - calls credentialStore.GetCredentialByUserAndBrand()
// - calls templateStore.ListTemplatesByBrand()
// - invokes brand executor (GoveeExecutor, WLEDExecutor, etc.)
// - no more switch statements in common code

// Brand-specific logic moves to:
// - internal/device/govee.go (BuildGoveeCommand, GoveeExecutor)
// - internal/device/wled.go (BuildWLEDCommand, WLEDExecutor)
// - etc.
```

**Benefit:** executor.go remains ~30 lines of generic code, not 350+ lines with brand switches.

---

## 🎯 Key Design Principles

1. **Generic Common Code**
   - `template_executor.go` has NO brand-specific logic
   - Works with any HTTP API that follows template pattern
   - No if/switch on brand names

2. **Isolated Brand Logic**
   - Each brand gets its own file
   - `BuildXxxCommand()` functions handle validation
   - ValidateXxxCredential() checks required fields

3. **Database-Driven**
   - Templates stored in DB (not hardcoded)
   - Credentials encrypted and isolated
   - Commands audited for every execution

4. **Extensible**
   - Add new brand: create `newbrand.go` file only
   - No changes to executor or common code
   - Template can be added via API or direct DB insert

---

## 📊 File Organization

```
internal/
├── models/
│   ├── device_template.go ✅
│   ├── user_device_credential.go ✅
│   └── user_device_command.go ✅
├── store/
│   ├── device_template_store.go ✅ (interfaces)
│   ├── sql_device_template_store.go ✅
│   ├── sql_user_device_credential_store.go ✅
│   └── sql_user_device_command_store.go ✅
└── device/
    ├── executor.go (existing - to be refactored)
    ├── template_executor.go ✅ (new - generic)
    ├── govee.go ✅ (brand-specific)
    ├── wled.go ✅ (brand-specific)
    ├── lifx.go ✅ (brand-specific)
    └── tuya.go ✅ (brand-specific)

docs/
├── SMART_DEVICE_API_RESEARCH.md ✅
├── SMART_DEVICE_DB_SCHEMA.md ✅
├── SMART_DEVICE_IMPLEMENTATION_GUIDE.md ✅
└── SMART_DEVICE_FILES_CHECKLIST.md ✅ (this file)
```

---

## ✨ Expected Result

After implementation:
- ✅ 3 new database tables with proper schema
- ✅ 14 new Go files (models, stores, executors)
- ✅ All brand-specific logic isolated
- ✅ Generic executor handles all HTTP request mechanics
- ✅ Audit trail of every device command
- ✅ Easy to add new brands (just create brand.go file)
- ✅ Credentials managed securely per user per brand
- ✅ Templates managed in database (future: user-created templates)

---

## 🐛 Troubleshooting

### Compilation Errors
- If imports fail: check `go.mod` has all packages
- Check capitalization in struct field names
- Run `go fmt ./...` to fix formatting

### Database Errors
- If table creation fails: check PostgreSQL version (9.6+)
- If INSERT fails: verify JSON types are correct
- Use `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'device_brand_templates'` to inspect

### Runtime Errors
- If credential not found: verify user has created credentials
- If template not found: verify template inserted correctly
- Check `user_device_commands` table for error logs

---

## 📞 Questions/Issues

Refer to:
1. `SMART_DEVICE_IMPLEMENTATION_GUIDE.md` - How the system works
2. `SMART_DEVICE_DB_SCHEMA.md` - SQL and schema details
3. `SMART_DEVICE_API_RESEARCH.md` - Brand API specifics
4. Code comments in each `.go` file

