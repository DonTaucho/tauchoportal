# Smart Device Template System - Database Schema

## Overview

This document provides all SQL migration statements needed to add support for smart device brand templates, user credentials, and command history.

**Database:** PostgreSQL  
**3 New Tables:**
1. `device_brand_templates` - Stores API templates for each brand
2. `user_device_credentials` - Stores encrypted credentials per user per brand
3. `user_device_commands` - Stores command execution history

---

## SQL Migration Statements

### 1. CREATE TABLE: device_brand_templates

**Purpose:** Centralized template storage for all smart device brands. One template per control operation (e.g., "Turn Light On", "Set Brightness").

```sql
CREATE TABLE device_brand_templates (
  id BIGSERIAL PRIMARY KEY,
  brand_name VARCHAR(50) NOT NULL,
  
  -- Template metadata
  template_name VARCHAR(100) NOT NULL,        -- e.g., "Turn Light On"
  category VARCHAR(50) NOT NULL,              -- e.g., "power", "brightness", "color"
  description TEXT,
  
  -- API configuration
  http_method VARCHAR(10) NOT NULL,           -- POST, PUT, GET
  endpoint_url VARCHAR(500) NOT NULL,         -- URL pattern with placeholders
  authentication_type VARCHAR(50) NOT NULL,   -- "api_key", "bearer_token", "oauth", "none"
  auth_header VARCHAR(200),                   -- Header name if needed
  
  -- Request body template (JSON string with placeholders)
  body_template TEXT,                         -- e.g., '{"device":"{device_id}","cmd":{"name":"{command}","value":{value}}}'
  
  -- Parameters
  required_parameters JSONB NOT NULL DEFAULT '[]',    -- ["device_id", "command", "value"]
  optional_parameters JSONB DEFAULT '[]',             -- ["duration", "effect"]
  parameter_defaults JSONB DEFAULT '{}',              -- {"effect": "smooth"}
  parameter_constraints JSONB DEFAULT '{}',           -- {"brightness": {"min": 0, "max": 255}}
  
  -- UI metadata for parameter input
  ui_fields JSONB DEFAULT '[]',               -- Dynamic form generation
  examples JSONB DEFAULT '{}',                -- Example command bodies
  
  -- Support flags
  requires_authentication BOOLEAN DEFAULT true,
  supports_batch_commands BOOLEAN DEFAULT false,
  local_network_only BOOLEAN DEFAULT false,
  notes VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_brand_templates_brand ON device_brand_templates(brand_name);
CREATE INDEX idx_device_brand_templates_category ON device_brand_templates(category);
```

---

### 2. CREATE TABLE: user_device_credentials

**Purpose:** Store encrypted credentials for each user's device connections. One row per user-brand connection.

```sql
CREATE TABLE user_device_credentials (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  brand_name VARCHAR(50) NOT NULL,
  
  -- Credential storage (all encrypted at application level)
  api_key VARCHAR(1000),                  -- Govee API key
  bearer_token VARCHAR(2000),             -- LIFX, Tuya tokens
  username VARCHAR(200),                  -- Philips Hue username
  password VARCHAR(500),                  -- If brand requires it
  
  -- Connection details
  host_ip VARCHAR(50),                    -- Local device IP (Nanoleaf, WLED, Yeelight)
  port INT DEFAULT 80,                    -- Custom port if needed
  mac_address VARCHAR(50),                -- Device MAC address
  device_id VARCHAR(200),                 -- Device ID from brand API
  region VARCHAR(10),                     -- Cloud region (Tuya uses this)
  
  -- Device metadata
  device_name VARCHAR(100),               -- User-friendly name
  device_model VARCHAR(100),              -- Device model for brand-specific handling
  
  -- OAuth fields
  oauth_access_token VARCHAR(2000),       -- OAuth token
  oauth_refresh_token VARCHAR(2000),      -- OAuth refresh token
  oauth_token_expires_at TIMESTAMP,       -- When token expires
  oauth_scope VARCHAR(500),               -- Requested scopes
  
  -- Connection status
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP,
  last_error VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, brand_name),            -- One credential per user-brand combo
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_device_credentials_user ON user_device_credentials(user_id);
CREATE INDEX idx_user_device_credentials_brand ON user_device_credentials(brand_name);
```

---

### 3. CREATE TABLE: user_device_commands

**Purpose:** Audit trail and history of all device commands executed by users. Useful for debugging and analytics.

```sql
CREATE TABLE user_device_commands (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  credential_id BIGINT NOT NULL,
  template_id BIGINT NOT NULL,
  
  -- Command instance
  command_name VARCHAR(100),              -- User-friendly name ("living_room_lights_on")
  parameters JSONB NOT NULL DEFAULT '{}', -- {"brightness": 50, "color": "blue"}
  
  -- Execution details
  http_method VARCHAR(10),
  endpoint_url VARCHAR(500),
  request_headers JSONB DEFAULT '{}',
  request_body TEXT,
  
  -- Response
  status_code INT,
  response_headers JSONB DEFAULT '{}',
  response_body TEXT,
  error_message VARCHAR(1000),
  execution_time_ms INT,
  
  -- Metadata
  executed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(credential_id) REFERENCES user_device_credentials(id) ON DELETE SET NULL,
  FOREIGN KEY(template_id) REFERENCES device_brand_templates(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_device_commands_user ON user_device_commands(user_id);
CREATE INDEX idx_user_device_commands_executed_at ON user_device_commands(executed_at);
CREATE INDEX idx_user_device_commands_status ON user_device_commands(status_code);
```

---

## Rollback Statements

If you need to remove these tables:

```sql
-- Drop in reverse order (tables with FKs first)
DROP TABLE IF EXISTS user_device_commands CASCADE;
DROP TABLE IF EXISTS user_device_credentials CASCADE;
DROP TABLE IF EXISTS device_brand_templates CASCADE;
```

---

## Pre-populated Templates

After creating the tables, populate initial templates for all supported brands:

```sql
-- GOVEE: Turn On/Off
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples)
VALUES (
  'govee',
  'Turn On/Off',
  'power',
  'Turn a Govee light on or off',
  'POST',
  'https://openapi.api.govee.com/router/api/v1/device/control',
  'api_key',
  'Govee-API-Key',
  '{"device":"{device_id}","model":"{model_id}","cmd":{"name":"turn","value":"{state}"}}',
  '["device_id","model_id","state"]'::jsonb,
  '[]'::jsonb,
  '{"state":["on","off"]}'::jsonb,
  '[{"name":"state","type":"select","options":["on","off"]}]'::jsonb,
  '{"on":{"device":"MAC","model":"H6008","cmd":{"name":"turn","value":"on"}}}'::jsonb
);

-- GOVEE: Set Brightness
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples)
VALUES (
  'govee',
  'Set Brightness',
  'brightness',
  'Control brightness (0-100)',
  'POST',
  'https://openapi.api.govee.com/router/api/v1/device/control',
  'api_key',
  'Govee-API-Key',
  '{"device":"{device_id}","model":"{model_id}","cmd":{"name":"brightness","value":{brightness}}}',
  '["device_id","model_id","brightness"]'::jsonb,
  '[]'::jsonb,
  '{"brightness":{"min":0,"max":100}}'::jsonb,
  '[{"name":"brightness","type":"slider","min":0,"max":100}]'::jsonb,
  '{"example":{"device":"MAC","model":"H6008","cmd":{"name":"brightness","value":50}}}'::jsonb
);

-- PHILIPS HUE: Turn On/Off
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples)
VALUES (
  'hue',
  'Turn On/Off',
  'power',
  'Turn Philips Hue light on or off',
  'PUT',
  'http://{bridge_ip}/api/{username}/lights/{light_id}/state',
  'none',
  NULL,
  '{"on":{state}}',
  '["bridge_ip","username","light_id","state"]'::jsonb,
  '[]'::jsonb,
  '{"state":[true,false]}'::jsonb,
  '[{"name":"state","type":"toggle","label":"Turn On"}]'::jsonb,
  '{"on":true}'::jsonb
);

-- LIFX: Turn On/Off
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples)
VALUES (
  'lifx',
  'Turn On/Off',
  'power',
  'Turn LIFX light on or off',
  'PUT',
  'https://api.lifx.com/v1/lights/{selector}/state',
  'bearer_token',
  'Authorization',
  '{"power":"{state}"}',
  '["selector","state"]'::jsonb,
  '[]'::jsonb,
  '{"state":["on","off"]}'::jsonb,
  '[{"name":"state","type":"select","options":["on","off"]}]'::jsonb,
  '{"power":"on"}'::jsonb
);

-- TUYA: Turn On/Off
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples)
VALUES (
  'tuya',
  'Turn On/Off',
  'power',
  'Turn Tuya device on or off',
  'POST',
  'https://openapi.tuya{region}.com/v1.0/devices/{device_id}/commands',
  'bearer_token',
  'Authorization',
  '{"commands":[{"code":"{function_code}","value":{value}}]}',
  '["device_id","region","function_code","value"]'::jsonb,
  '[]'::jsonb,
  '{"value":[true,false]}'::jsonb,
  '[{"name":"function_code","type":"text","label":"Function Code (e.g. switch_led)"},{"name":"value","type":"toggle"}]'::jsonb,
  '{"commands":[{"code":"switch_led","value":true}]}'::jsonb
);

-- NANOLEAF: Set Brightness
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples, local_network_only)
VALUES (
  'nanoleaf',
  'Set Brightness',
  'brightness',
  'Control Nanoleaf brightness (0-100)',
  'PUT',
  'http://{host_ip}:16021/api/v1/{api_key}/state',
  'api_key',
  NULL,
  '{"brightness":{"value":{brightness}}}',
  '["host_ip","api_key","brightness"]'::jsonb,
  '[]'::jsonb,
  '{"brightness":{"min":0,"max":100}}'::jsonb,
  '[{"name":"brightness","type":"slider","min":0,"max":100}]'::jsonb,
  '{"brightness":{"value":50}}'::jsonb,
  true
);

-- WLED: Set Brightness
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples, local_network_only)
VALUES (
  'wled',
  'Set Brightness',
  'brightness',
  'Control WLED brightness (0-255)',
  'POST',
  'http://{host_ip}/json/state',
  'none',
  NULL,
  '{"bri":{brightness}}',
  '["host_ip","brightness"]'::jsonb,
  '[]'::jsonb,
  '{"brightness":{"min":0,"max":255}}'::jsonb,
  '[{"name":"brightness","type":"slider","min":0,"max":255}]'::jsonb,
  '{"bri":128}'::jsonb,
  true
);

-- YEELIGHT: Set Brightness (TCP wrapper needed)
INSERT INTO device_brand_templates 
(brand_name, template_name, category, description, http_method, endpoint_url, authentication_type, auth_header, body_template, required_parameters, optional_parameters, parameter_constraints, ui_fields, examples, local_network_only, notes)
VALUES (
  'yeelight',
  'Set Brightness',
  'brightness',
  'Control Yeelight brightness via TCP socket',
  'POST',
  'tcp://{host_ip}:55443',
  'none',
  NULL,
  '{"id":1,"method":"set_bright","params":[{brightness},"smooth",500]}',
  '["host_ip","brightness"]'::jsonb,
  '["effect","duration"]'::jsonb,
  '{"brightness":{"min":1,"max":100}}'::jsonb,
  '[{"name":"brightness","type":"slider","min":1,"max":100}]'::jsonb,
  '{"id":1,"method":"set_bright","params":[50,"smooth",500]}'::jsonb,
  true,
  'Requires TCP socket translation layer'
);
```

---

## Model Definitions (Go structs)

Create these Go structs in new files under `internal/models/`:

### File: `internal/models/device_template.go`

```go
package models

import "time"

// DeviceBrandTemplate represents a template for controlling a smart device brand.
type DeviceBrandTemplate struct {
	ID                       int64                  `json:"id"`
	BrandName                string                 `json:"brand_name"`
	TemplateName             string                 `json:"template_name"`
	Category                 string                 `json:"category"`
	Description              string                 `json:"description"`
	HTTPMethod               string                 `json:"http_method"`
	EndpointURL              string                 `json:"endpoint_url"`
	AuthenticationType       string                 `json:"authentication_type"`
	AuthHeader               string                 `json:"auth_header,omitempty"`
	BodyTemplate             string                 `json:"body_template,omitempty"`
	RequiredParameters       []string               `json:"required_parameters"`
	OptionalParameters       []string               `json:"optional_parameters,omitempty"`
	ParameterDefaults        map[string]interface{} `json:"parameter_defaults,omitempty"`
	ParameterConstraints     map[string]interface{} `json:"parameter_constraints,omitempty"`
	UIFields                 []map[string]interface{} `json:"ui_fields,omitempty"`
	Examples                 map[string]interface{} `json:"examples,omitempty"`
	RequiresAuthentication   bool                   `json:"requires_authentication"`
	SupportsBatchCommands    bool                   `json:"supports_batch_commands"`
	LocalNetworkOnly         bool                   `json:"local_network_only"`
	Notes                    string                 `json:"notes,omitempty"`
	CreatedAt                time.Time              `json:"created_at"`
	UpdatedAt                time.Time              `json:"updated_at"`
}
```

### File: `internal/models/user_device_credential.go`

```go
package models

import "database/sql"
import "time"

// UserDeviceCredential stores encrypted credentials for a user's device connection.
type UserDeviceCredential struct {
	ID                   int64          `json:"id"`
	UserID               int            `json:"user_id"`
	BrandName            string         `json:"brand_name"`
	APIKey               string         `json:"api_key,omitempty"`
	BearerToken          string         `json:"bearer_token,omitempty"`
	Username             string         `json:"username,omitempty"`
	Password             string         `json:"password,omitempty"`
	HostIP               string         `json:"host_ip,omitempty"`
	Port                 int            `json:"port,omitempty"`
	MACAddress           string         `json:"mac_address,omitempty"`
	DeviceID             string         `json:"device_id,omitempty"`
	Region               string         `json:"region,omitempty"`
	DeviceName           string         `json:"device_name,omitempty"`
	DeviceModel          string         `json:"device_model,omitempty"`
	OAuthAccessToken     string         `json:"oauth_access_token,omitempty"`
	OAuthRefreshToken    string         `json:"oauth_refresh_token,omitempty"`
	OAuthTokenExpiresAt  *time.Time     `json:"oauth_token_expires_at,omitempty"`
	OAuthScope           string         `json:"oauth_scope,omitempty"`
	IsActive             bool           `json:"is_active"`
	LastTestedAt         *time.Time     `json:"last_tested_at,omitempty"`
	LastError            sql.NullString `json:"last_error,omitempty"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
}
```

### File: `internal/models/user_device_command.go`

```go
package models

import "database/sql"
import "time"

// UserDeviceCommand records the execution of a device command.
type UserDeviceCommand struct {
	ID                 int64                  `json:"id"`
	UserID             int                    `json:"user_id"`
	CredentialID       sql.NullInt64          `json:"credential_id,omitempty"`
	TemplateID         sql.NullInt64          `json:"template_id,omitempty"`
	CommandName        string                 `json:"command_name,omitempty"`
	Parameters         map[string]interface{} `json:"parameters"`
	HTTPMethod         string                 `json:"http_method,omitempty"`
	EndpointURL        string                 `json:"endpoint_url,omitempty"`
	RequestHeaders     map[string]string      `json:"request_headers,omitempty"`
	RequestBody        string                 `json:"request_body,omitempty"`
	StatusCode         sql.NullInt64          `json:"status_code,omitempty"`
	ResponseHeaders    map[string]string      `json:"response_headers,omitempty"`
	ResponseBody       string                 `json:"response_body,omitempty"`
	ErrorMessage       sql.NullString         `json:"error_message,omitempty"`
	ExecutionTimeMs    sql.NullInt64          `json:"execution_time_ms,omitempty"`
	ExecutedAt         time.Time              `json:"executed_at"`
	CreatedAt          time.Time              `json:"created_at"`
}
```

---

## Existing Table Modifications

No modifications needed to existing tables. The `devices` table already has `device_group_id` and device grouping is already implemented.

---

## Next Steps

1. **Run the CREATE TABLE statements** above in your PostgreSQL database
2. **Insert the pre-populated templates** (at least the 8 core brands)
3. **Create the Go model files** (`device_template.go`, `user_device_credential.go`, `user_device_command.go`)
4. **Create store implementations** (similar to `sql_device_store.go`):
   - `sql_device_template_store.go`
   - `sql_user_device_credential_store.go`
   - `sql_user_device_command_store.go`
5. **Implement API handlers** for:
   - GET `/api/devices/templates?brand={brand}` - List templates for a brand
   - POST `/api/devices/credentials` - Create credential
   - GET `/api/devices/credentials/{id}` - Get credential
   - DELETE `/api/devices/credentials/{id}` - Delete credential
   - POST `/api/devices/commands` - Execute command
   - GET `/api/devices/commands` - Get command history

---

## Security Considerations

1. **Encrypt credentials at application level** before storing in DB
   - Use AES-256 or similar
   - Store encryption key in environment variables, not code
   
2. **Never return full credentials in API responses** after initial creation
   - Return masked values (e.g., `"api_key": "***GOVEE_KEY_LAST_4"`)
   
3. **Audit all command executions**
   - `user_device_commands` table captures all attempts
   
4. **Rate limit credential operations**
   - Prevent brute force password guessing
   
5. **OAuth token rotation**
   - Check expiry before using
   - Auto-refresh when needed

