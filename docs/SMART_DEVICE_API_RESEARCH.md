# Smart Device Template API Research & Implementation Plan

## Executive Summary

Your template-based API approach is **absolutely viable** for smart home device control. All 10 brands primarily use **JSON-shaped HTTP POST/PUT bodies** with parameter tweaking. This document provides:

1. **API patterns for each brand** (authentication, endpoints, body structure)
2. **Confirmation that template approach works**
3. **Database schema recommendations**
4. **Implementation architecture**

---

## ✅ Validation: JSON Template Approach IS Viable

**KEY FINDING:** Every brand (except TP-Link Kasa, which needs local protocol translation) supports **HTTP POST/PUT with JSON payloads where the structure is consistent and parameters can be tweaked**.

This means:
- ✅ Store URL pattern in DB: `"https://api.{brand}.com/v1/devices/{device_id}/control"`
- ✅ Store body template in DB: `{"power": "{state}", "brightness": {brightness}}`
- ✅ Store parameters in DB: `["state", "brightness"]`
- ✅ User provides values: `{"state": "on", "brightness": 50}`
- ✅ System renders and sends

---

## 1. GOVEE

### Authentication
- **Type:** API Key
- **Header:** `Govee-API-Key: YOUR_KEY`
- **Where:** Authorization header

### API Endpoint
```
POST https://openapi.api.govee.com/router/api/v1/device/control
```

### Body Template Pattern
```json
{
  "device": "{device_id}",
  "model": "{model_id}",
  "cmd": {
    "name": "{command_name}",
    "value": {value}
  }
}
```

### Example Commands
```json
// Turn on
{"device": "MAC_ADDRESS", "model": "H6008", "cmd": {"name": "turn", "value": "on"}}

// Set brightness
{"device": "MAC_ADDRESS", "model": "H6008", "cmd": {"name": "brightness", "value": 50}}

// Set color (RGB)
{"device": "MAC_ADDRESS", "model": "H6008", "cmd": {"name": "color", "value": {"r": 255, "g": 100, "b": 50}}}
```

### Parameters
- `device_id`: MAC address of device
- `model_id`: Model number (e.g., H6008)
- `command_name`: turn, brightness, color
- `value`: Varies by command

---

## 2. PHILIPS HUE

### Authentication
- **Type:** Bearer Token
- **Header:** None (uses username in URL path)
- **Where:** Local network or cloud

### API Endpoint
```
PUT http://<bridge_ip>/api/<username>/lights/<light_id>/state
OR
PUT http://<bridge_ip>/api/<username>/groups/<group_id>/action
```

### Body Template Pattern
```json
{
  "on": {boolean},
  "bri": {brightness},
  "hue": {hue_value},
  "sat": {saturation},
  "xy": {xy_coordinates}
}
```

### Example Commands
```json
// Turn on
{"on": true}

// Set brightness
{"on": true, "bri": 200}

// Set color (Hue/Saturation)
{"on": true, "bri": 254, "hue": 46920, "sat": 254}

// Set color (XY)
{"on": true, "bri": 254, "xy": [0.15, 0.1]}
```

### Parameters
- `bridge_ip`: Local IP of Hue Bridge
- `username`: API token
- `light_id`: Light number (1, 2, 3...)
- `brightness`: 1-254
- `hue`: 0-65535
- `saturation`: 1-254
- `xy`: CIE 1931 coordinates [0-1, 0-1]

---

## 3. LIFX

### Authentication
- **Type:** Bearer Token
- **Header:** `Authorization: Bearer YOUR_API_TOKEN`
- **Where:** Authorization header

### API Endpoint
```
PUT https://api.lifx.com/v1/lights/{selector}/state
```

### Body Template Pattern
```json
{
  "power": "{state}",
  "brightness": {brightness},
  "color": "{color_string}",
  "duration": {transition_duration}
}
```

### Example Commands
```json
// Turn on
{"power": "on"}

// Set brightness
{"power": "on", "brightness": 0.5}

// Set color
{"power": "on", "brightness": 0.5, "color": "blue", "duration": 2.0}

// Hex color
{"power": "on", "color": "#00ff00"}

// Full control
{"power": "on", "color": "hue:120 saturation:1.0 brightness:0.8"}
```

### Parameters
- `selector`: "all", label, id, or group_id
- `state`: "on" or "off"
- `brightness`: 0.0 to 1.0
- `color`: Color name, hex, or hue:sat:bri format
- `duration`: Seconds (float)

---

## 4. NANOLEAF

### Authentication
- **Type:** API Key (Generated on device)
- **Header:** None (in URL or body)
- **Where:** Local network

### API Endpoint
```
PUT http://<nanoleaf_ip>:16021/api/v1/<api_key>/state
```

### Body Template Pattern
```json
{
  "brightness": {
    "value": {brightness}
  },
  "effect": "{effect_name}"
}
```

### Example Commands
```json
// Set brightness
{"brightness": {"value": 50}}

// Set effect
{"effect": "Rhythm"}

// Combined
{"brightness": {"value": 80}, "effect": "Fireworks"}
```

### Parameters
- `nanoleaf_ip`: Local IP address
- `api_key`: Generated via pairing
- `brightness`: 0-100
- `effect`: Effect name string

---

## 5. TP-LINK KASA

### ⚠️ SPECIAL CASE: No Direct HTTP POST

**Finding:** Kasa **does not support direct HTTP POST** for control. Requires:

### Options

**Option A: Local LAN Protocol (Recommended)**
- **Protocol:** Custom encrypted JSON over TCP port 9999
- **Solution:** Use `python-kasa` or `tplink-smarthome-api` library
- **Implementation:** Need intermediate service to accept HTTP and translate to Kasa protocol

**Option B: Unofficial Cloud API**
- **Risk:** TP-Link frequently blocks/changes this
- **Not recommended for production**

### Workaround Architecture

For your template system to support Kasa:
```
User's HTTP POST
  ↓
Your API (translates to Kasa protocol)
  ↓
python-kasa library (handles encryption)
  ↓
Kasa Device (local LAN on port 9999)
```

### Recommendation
**Skip direct integration in v1**. Add Kasa support through:
- Home Assistant bridge (Kasa already integrated)
- Or custom Kasa translation layer later

---

## 6. TUYA

### Authentication
- **Type:** OAuth 2.0 Access Token
- **Header:** `Authorization: Bearer {access_token}`
- **Where:** Authorization header

### API Endpoint
```
POST https://openapi.tuya{region}.com/v1.0/devices/{device_id}/commands
```

### Body Template Pattern
```json
{
  "commands": [
    {
      "code": "{function_code}",
      "value": {value}
    }
  ]
}
```

### Example Commands
```json
// Turn on switch
{"commands": [{"code": "switch_led", "value": true}]}

// Turn off switch
{"commands": [{"code": "switch_led", "value": false}]}

// Multi-gang switches
{"commands": [{"code": "switch_1", "value": true}]}

// With multiple commands
{
  "commands": [
    {"code": "switch_led", "value": true},
    {"code": "brightness", "value": 50}
  ]
}
```

### Parameters
- `region`: us, eu, cn (API region)
- `device_id`: Tuya device ID
- `function_code`: switch_led, switch_1-3, brightness, etc. (device-specific)
- `value`: Boolean or number depending on function

**Note:** Function codes are device-specific. Users need to look up their device's codes from Tuya API docs.

---

## 7. WLED

### Authentication
- **Type:** None (local network)
- **Where:** N/A

### API Endpoint
```
POST http://<wled_device_ip>/json/state
```

### Body Template Pattern
```json
{
  "bri": {brightness},
  "seg": [
    {
      "col": [[{r}, {g}, {b}]],
      "fx": {effect_id}
    }
  ]
}
```

### Example Commands
```json
// Set brightness
{"bri": 128}

// Set color and effect
{
  "bri": 180,
  "seg": [{
    "col": [[0, 255, 0]],
    "fx": 42
  }]
}

// With speed and intensity
{
  "bri": 180,
  "seg": [{
    "col": [[255, 0, 0]],
    "fx": 37,
    "sx": 128,
    "ix": 128
  }]
}
```

### Parameters
- `wled_device_ip`: Local IP
- `brightness`: 0-255
- `color`: [R, G, B] where each is 0-255
- `effect_id`: Numeric effect ID (GET /json/state to see available)
- `speed`: 0-255
- `intensity`: 0-255

---

## 8. WYZE

### ⚠️ SPECIAL CASE: No Official API

**Finding:** Wyze **does not officially publish API**. Uses reverse-engineered endpoints.

### Workaround Endpoint (Unofficial)
```
POST https://api.wyze.com/app/device/control
Authorization: Bearer {access_token}

Body:
{
  "device_mac": "{mac_address}",
  "device_model": "{model}",
  "cmd": "{command}"
}
```

### Example Commands
```json
// Turn on
{"device_mac": "MAC", "device_model": "WLPP1CFH", "cmd": "turn_on"}

// Turn off
{"device_mac": "MAC", "device_model": "WLPP1CFH", "cmd": "turn_off"}

// Set brightness (if supported)
{"device_mac": "MAC", "device_model": "MODEL", "cmd": "set_brightness", "param": 50}
```

### Risks
- ⚠️ Endpoints change frequently
- ⚠️ Wyze may block unauthorized access
- ⚠️ Not recommended for production without constant maintenance

### Recommendation
**Consider Wyze as lower priority** or through Home Assistant integration instead.

---

## 9. YEELIGHT

### ⚠️ SPECIAL CASE: TCP Socket-Based

**Finding:** Yeelight uses **JSON over TCP (port 55443)**, not HTTP POST.

### Workaround: TCP to HTTP Bridge
```
User's HTTP POST
  ↓
Your API converts to Yeelight JSON
  ↓
TCP socket to Yeelight device:55443
```

### Body Template Pattern (TCP)
```json
{
  "id": {command_id},
  "method": "{method_name}",
  "params": [{param1}, {param2}, ...]
}
```

### Example Commands
```json
// Set brightness
{"id": 1, "method": "set_bright", "params": [50, "smooth", 500]}

// Set color (RGB)
{"id": 2, "method": "set_rgb", "params": [16711680, "smooth", 500]}

// Set scene
{"id": 3, "method": "set_scene", "params": ["color", 255, 0, 0, 50]}
```

### Parameters
- `device_ip`: Local IP of Yeelight
- `port`: 55443
- `command_id`: Numeric ID (1, 2, 3...)
- `method`: set_bright, set_rgb, set_scene
- `params`: Method-specific parameters

### Recommendation
**Add Yeelight support through intermediate layer** (like python library) or in phase 2.

---

## 10. AMAZON ALEXA

### ⚠️ SPECIAL CASE: Indirect Control

**Finding:** Alexa Smart Home API is for **skill endpoints**, not direct device control.

### API Pattern
Alexa sends JSON directives to your skill endpoint:
```
POST https://your-skill-endpoint.com
Body:
{
  "directive": {
    "header": {
      "namespace": "Alexa.PowerController",
      "name": "TurnOn",
      ...
    },
    "endpoint": {"endpointId": "{device_id}"}
  }
}
```

### Your Response
```json
{
  "event": {
    "header": {...},
    "payload": {}
  }
}
```

### Implication
You don't directly control devices via Alexa. Instead:
- User speaks to Alexa
- Alexa calls your skill
- Your skill controls the actual device
- Your skill responds to Alexa

### Recommendation
**Alexa is for voice control integration, not programmatic API control**. Users still control devices through their original APIs (Govee, LIFX, Philips Hue, etc.) but can **also** link accounts to Alexa for voice commands.

---

## Summary Table

| Brand | Protocol | Auth | HTTP-Ready? | Complexity |
|-------|----------|------|------------|-----------|
| Govee | POST | API Key | ✅ Yes | Low |
| Philips Hue | PUT | Token (URL) | ✅ Yes | Low |
| LIFX | PUT | Bearer | ✅ Yes | Low |
| Nanoleaf | PUT | API Key (URL) | ✅ Yes | Low |
| TP-Link Kasa | TCP Encrypted | None | ❌ No | High |
| Tuya | POST | OAuth Token | ✅ Yes | Medium |
| WLED | POST | None | ✅ Yes | Low |
| Wyze | POST | OAuth Token | ⚠️ Unofficial | Medium |
| Yeelight | TCP JSON | None | ❌ No | High |
| Amazon Alexa | POST | OAuth Token | ⏳ Indirect | N/A |

---

## Recommended Implementation Approach

### Phase 1 (v1.0) - Core Implementation
**Support:** Govee, Philips Hue, LIFX, Nanoleaf, WLED, Tuya

- ✅ Pure HTTP POST/PUT
- ✅ Clean JSON templating
- ✅ Easy to test and maintain
- ✅ ~80% of use cases

### Phase 2 (v2.0) - Extended Support
**Add:** Wyze (with caution), Yeelight (via intermediate layer)

- ⚠️ Requires translation layer
- ⚠️ More maintenance
- ⚠️ Additional server resources

### Phase 3 (v3.0) - Advanced
**Add:** TP-Link Kasa, Amazon Alexa

- ❌ Significant complexity
- ❌ Multiple protocol support needed
- ❌ Consider Home Assistant integration instead

---

## Database Schema Recommendation

### Table: `device_brand_templates`
```sql
CREATE TABLE device_brand_templates (
  id BIGINT PRIMARY KEY,
  brand_name VARCHAR(50),           -- "Govee", "Philips Hue", etc.
  
  -- Template metadata
  template_name VARCHAR(100),        -- "Turn On Light", "Set Brightness", etc.
  category VARCHAR(50),              -- "power", "brightness", "color", "effect"
  description TEXT,                  -- "Turn light on/off"
  
  -- API configuration
  http_method VARCHAR(10),           -- POST, PUT, GET
  endpoint_url VARCHAR(500),         -- URL pattern: https://api.../devices/{device_id}/...
  authentication_type VARCHAR(50),   -- "api_key", "bearer_token", "oauth", "none"
  auth_header VARCHAR(200),          -- "Govee-API-Key", "Authorization", etc.
  
  -- Body template
  body_template JSON,                -- {"device": "{device_id}", "cmd": {"name": "{command}", "value": {value}}}
  
  -- Parameters
  required_parameters JSON,          -- ["device_id", "command", "value"]
  optional_parameters JSON,          -- ["duration", "effect"]
  parameter_defaults JSON,           -- {"effect": "smooth", "duration": 0}
  parameter_constraints JSON,        -- {"brightness": {"min": 0, "max": 255}}
  
  -- UI metadata
  ui_fields JSON,                    -- [{name: "brightness", type: "slider", min: 0, max: 100}]
  examples JSON,                     -- {"on": true, "brightness": 50}
  
  -- Support flags
  requires_authentication BOOLEAN,
  supports_batch_commands BOOLEAN,
  local_network_only BOOLEAN,        -- For Nanoleaf, WLED, Yeelight
  note VARCHAR(500),                 -- "⚠️ Unofficial API", "TCP socket required", etc.
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table: `user_device_credentials`
```sql
CREATE TABLE user_device_credentials (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  brand_name VARCHAR(50),
  
  -- Credentials
  api_key VARCHAR(500),              -- Govee API key
  bearer_token VARCHAR(1000),        -- LIFX, Tuya tokens
  username VARCHAR(200),             -- Philips Hue username
  host_ip VARCHAR(50),               -- Local device IP
  mac_address VARCHAR(50),           -- Device MAC
  device_id VARCHAR(200),            -- Device ID
  region VARCHAR(10),                -- Tuya region
  
  -- Settings
  device_name VARCHAR(100),
  device_model VARCHAR(100),
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table: `user_device_commands`
```sql
CREATE TABLE user_device_commands (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  credential_id BIGINT,              -- References user_device_credentials
  template_id BIGINT,                -- References device_brand_templates
  
  -- Command instance
  command_name VARCHAR(100),         -- "living_room_lights_on"
  parameters JSON,                   -- {"brightness": 50, "color": "blue"}
  
  executed_at TIMESTAMP,
  status VARCHAR(50),                -- "pending", "success", "failed"
  response_code INT,
  response_body TEXT,
  
  created_at TIMESTAMP
);
```

---

## Implementation Architecture

```
User Interface Layer
├─ Template Selector
│  └─ Shows all templates for selected brand
├─ Parameter Input
│  └─ Dynamic form based on template's UI fields
└─ Command History
   └─ Shows executed commands

Business Logic Layer
├─ Template Renderer
│  ├─ Load template from DB
│  ├─ Substitute parameters
│  └─ Build final HTTP request
├─ Credential Manager
│  ├─ Encrypt/decrypt credentials
│  └─ Retrieve for API calls
└─ Request Executor
   ├─ Add authentication headers
   ├─ Make HTTP request
   └─ Log results

Translation Layer (For Non-HTTP Protocols)
├─ Kasa Translator
│  └─ python-kasa bridge
├─ Yeelight Translator
│  └─ TCP socket wrapper
└─ Wyze Translator
   └─ Unofficial API handler

Smart Device APIs
├─ Govee (HTTP POST)
├─ Philips Hue (HTTP PUT)
├─ LIFX (HTTP PUT)
├─ Nanoleaf (HTTP PUT)
├─ WLED (HTTP POST)
├─ Tuya (HTTP POST)
├─ TP-Link Kasa (TCP 9999)
├─ Yeelight (TCP 55443)
└─ Wyze (HTTP POST - unofficial)
```

---

## Code Example: Template Renderer (Pseudocode)

```go
type DeviceBrandTemplate struct {
    BrandName          string
    HTTPMethod         string
    EndpointURL        string
    BodyTemplate       string // JSON template
    RequiredParameters []string
    AuthHeader         string
}

func (t *DeviceBrandTemplate) RenderRequest(
    params map[string]interface{},
    credential UserDeviceCredential,
) (*http.Request, error) {
    // 1. Substitute parameters in URL
    url := t.EndpointURL
    for _, param := range t.RequiredParameters {
        placeholder := "{" + param + "}"
        value := params[param]
        url = strings.ReplaceAll(url, placeholder, fmt.Sprint(value))
    }
    
    // 2. Substitute parameters in body
    bodyJSON := t.BodyTemplate
    for key, value := range params {
        placeholder := "{" + key + "}"
        jsonValue, _ := json.Marshal(value)
        bodyJSON = strings.ReplaceAll(bodyJSON, placeholder, string(jsonValue))
    }
    
    // 3. Create request
    req, _ := http.NewRequest(t.HTTPMethod, url, strings.NewReader(bodyJSON))
    
    // 4. Add authentication
    switch t.AuthType {
    case "api_key":
        req.Header.Set(t.AuthHeader, credential.APIKey)
    case "bearer":
        req.Header.Set("Authorization", "Bearer "+credential.BearerToken)
    }
    
    req.Header.Set("Content-Type", "application/json")
    
    return req, nil
}
```

---

## Conclusion

✅ **Your template approach is HIGHLY VIABLE** for:
- Govee, Philips Hue, LIFX, Nanoleaf, WLED, Tuya (Phase 1 - Recommended)
- Wyze, Yeelight (Phase 2 - With translation layer)

❌ **Not suitable** for:
- TP-Link Kasa (requires custom protocol library)
- Amazon Alexa (indirect control model)

**Recommended Strategy:**
1. Start with 6 core brands (all HTTP-native)
2. Store templates + parameters in database
3. User selects template → fills parameters → system renders request → execute
4. Add other brands in phases as needed

This approach gives you:
- ✅ Clean separation of concerns
- ✅ Easy to add new templates/brands
- ✅ Minimal code changes for new API patterns
- ✅ User-friendly (template selection + parameter input)
- ✅ Auditable (all commands logged with parameters)
