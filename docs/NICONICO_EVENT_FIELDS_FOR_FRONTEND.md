# NicoNico Event Fields Documentation

**Purpose:** Frontend localization guide for all NicoNico event types and their properties.

For 7-language support, frontend developers need to localize all field names and enum values listed below.

---

## Event Type: `comment`

Regular text messages from viewers (danmaku style).

### Common Fields (All Events)
| Field | Type | Required | Example | Localization Key |
|-------|------|----------|---------|------------------|
| `id` | string (UUID) | ✅ yes | `"550e8400-e29b-41d4-a716-446655440000"` | - |
| `user_id` | number | ✅ yes | `12345` | - |
| `watch_target_id` | string (UUID) | ✅ yes | `"550e8400-e29b-41d4-a716-446655440000"` | - |
| `stream_event_id` | string (UUID) | ✅ yes | `"550e8400-e29b-41d4-a716-446655440000"` | - |
| `platform` | string | ✅ yes | `"niconico"` | - |
| `event_type` | string | ✅ yes | `"comment"` | `event.type.comment` |
| `received_at` | timestamp (ISO 8601) | ✅ yes | `"2026-08-13T12:34:56Z"` | - |
| `created_at` | timestamp (ISO 8601) | ✅ yes | `"2026-08-13T12:34:56Z"` | - |

### Comment-Specific Fields

#### Message Content
| Field | Type | Required | Example | Localization Key |
|-------|------|----------|---------|------------------|
| `sender_id` | string | ❌ optional | `"user123"` | `field.sender_id` |
| `sender_name` | string | ✅ yes | `"太郎"` | `field.sender_name` |
| `sender_avatar` | string (URL) | ❌ optional | `"https://..."` | `field.sender_avatar` |
| `message` | string | ✅ yes | `"見てる？"` | `field.message` |

#### Comment Styling (NicoNico danmaku)
| Field | Type | Required | Values | Localization Key |
|-------|------|----------|--------|------------------|
| `color` | string (hex) | ❌ optional | `"#547698"`, `"#FF0000"` | `field.color` |
| `color_rgb` | object | ❌ optional | See below | `field.color_rgb` |
| ├─ `r` | number (0-255) | ✅ (if color_rgb present) | `84` | `field.color_rgb.r` |
| ├─ `g` | number (0-255) | ✅ (if color_rgb present) | `118` | `field.color_rgb.g` |
| ├─ `b` | number (0-255) | ✅ (if color_rgb present) | `152` | `field.color_rgb.b` |
| └─ `hex` | string | ✅ (if color_rgb present) | `"#547698"` | `field.color_rgb.hex` |
| `position` | string (enum) | ❌ optional | `"ue"`, `"naka"`, `"shita"` | `field.position` |
| `size` | string (enum) | ❌ optional | `"small"`, `"medium"`, `"big"` | `field.size` |
| `font` | string (enum) | ❌ optional | `"defont"`, `"mincho"`, `"gothic"` | `field.font` |
| `opacity` | string (enum) | ❌ optional | `"Normal"`, `"Translucent"` | `field.opacity` |

### Enum Values for Comment Styling

**Position:**
```
"ue"    → Top (上)
"naka"  → Middle/Center (中央)
"shita" → Bottom (下)
```

**Size:**
```
"small"  → Small (小)
"medium" → Medium/Normal (通常)
"big"    → Large (大)
```

**Font:**
```
"defont"  → Default/Standard
"mincho"  → Mincho/Serif (明朝)
"gothic"  → Gothic/Sans-serif (ゴシック)
```

**Opacity:**
```
"Normal"      → Opaque (普通)
"Translucent" → Semi-transparent (薄い)
```

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 12345,
  "watch_target_id": "550e8400-e29b-41d4-a716-446655440111",
  "stream_event_id": "550e8400-e29b-41d4-a716-446655440222",
  "platform": "niconico",
  "event_type": "comment",
  "sender_id": "user123",
  "sender_name": "太郎",
  "sender_avatar": "https://nico.ms/user/user123/icon",
  "message": "見てる？",
  "color": "#547698",
  "color_rgb": {
    "r": 84,
    "g": 118,
    "b": 152,
    "hex": "#547698"
  },
  "position": "shita",
  "size": "big",
  "font": "gothic",
  "opacity": "Normal",
  "received_at": "2026-08-13T12:34:56Z",
  "created_at": "2026-08-13T12:34:56Z"
}
```

---

## Event Type: `nicoru` (Emotion/Reaction)

Like/reaction button on comments or stream during live broadcast.

### Fields

#### Common Fields
Same as comment type (see above).

#### Nicoru-Specific Fields
| Field | Type | Required | Example | Localization Key |
|-------|------|----------|---------|------------------|
| `sender_id` | string | ❌ optional | `"user456"` | `field.sender_id` |
| `sender_name` | string | ✅ yes | `"花子"` | `field.sender_name` |
| `sender_avatar` | string (URL) | ❌ optional | `"https://..."` | `field.sender_avatar` |
| `message` | string | ❌ optional | Empty or emoji-like | `field.message` |

#### Nicoru Styling (Emotion Type)
| Field | Type | Required | Values | Localization Key |
|-------|------|----------|--------|------------------|
| `color` | string (hex) | ❌ optional | `"#FFFF00"` | `field.color` |
| `color_rgb` | object | ❌ optional | See below | `field.color_rgb` |
| ├─ `r` | number (0-255) | ✅ (if color_rgb present) | `255` | `field.color_rgb.r` |
| ├─ `g` | number (0-255) | ✅ (if color_rgb present) | `255` | `field.color_rgb.g` |
| ├─ `b` | number (0-255) | ✅ (if color_rgb present) | `0` | `field.color_rgb.b` |
| └─ `hex` | string | ✅ (if color_rgb present) | `"#FFFF00"` | `field.color_rgb.hex` |
| `position` | string (enum) | ❌ optional | `"ue"`, `"naka"`, `"shita"` | `field.position` |
| `size` | string (enum) | ❌ optional | `"small"`, `"medium"`, `"big"` | `field.size` |
| `opacity` | string (enum) | ❌ optional | `"Normal"`, `"Translucent"` | `field.opacity` |

**Note:** Nicoru styling is similar to comments but typically has different color/size distributions.

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440333",
  "user_id": 12345,
  "watch_target_id": "550e8400-e29b-41d4-a716-446655440111",
  "stream_event_id": "550e8400-e29b-41d4-a716-446655440222",
  "platform": "niconico",
  "event_type": "nicoru",
  "sender_id": "user456",
  "sender_name": "花子",
  "sender_avatar": "https://nico.ms/user/user456/icon",
  "message": "",
  "color": "#FFFF00",
  "color_rgb": {
    "r": 255,
    "g": 255,
    "b": 0,
    "hex": "#FFFF00"
  },
  "position": "naka",
  "size": "medium",
  "opacity": "Normal",
  "received_at": "2026-08-13T12:34:57Z",
  "created_at": "2026-08-13T12:34:57Z"
}
```

---

## Event Type: `gift`

Virtual gift or super chat donation.

### Fields

#### Common Fields
Same as comment type (see above).

#### Gift-Specific Fields
| Field | Type | Required | Example | Localization Key |
|-------|------|----------|---------|------------------|
| `sender_id` | string | ✅ yes | `"user789"` | `field.sender_id` |
| `sender_name` | string | ✅ yes | `"次郎"` | `field.sender_name` |
| `sender_avatar` | string (URL) | ✅ yes | `"https://..."` | `field.sender_avatar` |
| `message` | string | ❌ optional | `"頑張ってください！"` | `field.message` |
| `amount_value` | number | ✅ yes | `50` | `field.amount_value` |
| `amount_currency` | string | ✅ yes | `"JPY"` | `field.amount_currency` |
| `amount_display` | string | ✅ yes | `"50pt"`, `"¥500"` | `field.amount_display` |
| `is_member` | boolean | ❌ optional | `true` | `field.is_member` |
| `badges` | array of strings | ❌ optional | `["subscriber", "supporter"]` | `field.badges` |

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440444",
  "user_id": 12345,
  "watch_target_id": "550e8400-e29b-41d4-a716-446655440111",
  "stream_event_id": "550e8400-e29b-41d4-a716-446655440222",
  "platform": "niconico",
  "event_type": "gift",
  "sender_id": "user789",
  "sender_name": "次郎",
  "sender_avatar": "https://nico.ms/user/user789/icon",
  "message": "頑張ってください！",
  "amount_value": 50,
  "amount_currency": "JPY",
  "amount_display": "50pt",
  "is_member": false,
  "badges": ["supporter"],
  "received_at": "2026-08-13T12:34:58Z",
  "created_at": "2026-08-13T12:34:58Z"
}
```

---

## Event Type: `follow`

New channel follower.

### Fields

#### Common Fields (Partial)
| Field | Type | Required | Example |
|-------|------|----------|---------|
| `id` | string (UUID) | ✅ yes | `"550e8400-e29b-41d4-a716-446655440555"` |
| `user_id` | number | ✅ yes | `12345` |
| `watch_target_id` | string (UUID) | ✅ yes | - |
| `stream_event_id` | string (UUID) | ✅ yes | - |
| `platform` | string | ✅ yes | `"niconico"` |
| `event_type` | string | ✅ yes | `"follow"` |
| `received_at` | timestamp | ✅ yes | - |
| `created_at` | timestamp | ✅ yes | - |

#### Follow-Specific Fields
| Field | Type | Required | Example | Localization Key |
|-------|------|----------|---------|------------------|
| `sender_id` | string | ✅ yes | `"user123"` | `field.sender_id` |
| `sender_name` | string | ✅ yes | `"新規フォロワー"` | `field.sender_name` |
| `sender_avatar` | string (URL) | ✅ yes | `"https://..."` | `field.sender_avatar` |

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440555",
  "user_id": 12345,
  "watch_target_id": "550e8400-e29b-41d4-a716-446655440111",
  "stream_event_id": "550e8400-e29b-41d4-a716-446655440222",
  "platform": "niconico",
  "event_type": "follow",
  "sender_id": "user_new",
  "sender_name": "新規フォロワー",
  "sender_avatar": "https://nico.ms/user/user_new/icon",
  "received_at": "2026-08-13T12:34:59Z",
  "created_at": "2026-08-13T12:34:59Z"
}
```

---

## Event Type: `stream_start`

Live stream started (system event).

### Fields

#### Common Fields (Partial)
| Field | Type | Required | Example |
|-------|------|----------|---------|
| `id` | string (UUID) | ✅ yes | - |
| `user_id` | number | ✅ yes | - |
| `watch_target_id` | string (UUID) | ✅ yes | - |
| `stream_event_id` | string (UUID) | ✅ yes | - |
| `platform` | string | ✅ yes | `"niconico"` |
| `event_type` | string | ✅ yes | `"stream_start"` |
| `received_at` | timestamp | ✅ yes | - |
| `created_at` | timestamp | ✅ yes | - |

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440666",
  "user_id": 12345,
  "watch_target_id": "550e8400-e29b-41d4-a716-446655440111",
  "stream_event_id": "550e8400-e29b-41d4-a716-446655440222",
  "platform": "niconico",
  "event_type": "stream_start",
  "received_at": "2026-08-13T12:00:00Z",
  "created_at": "2026-08-13T12:00:00Z"
}
```

---

## Event Type: `stream_end`

Live stream ended (system event).

### Fields

Same as `stream_start` (except `event_type` = `"stream_end"`).

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440777",
  "user_id": 12345,
  "watch_target_id": "550e8400-e29b-41d4-a716-446655440111",
  "stream_event_id": "550e8400-e29b-41d4-a716-446655440222",
  "platform": "niconico",
  "event_type": "stream_end",
  "received_at": "2026-08-13T13:00:00Z",
  "created_at": "2026-08-13T13:00:00Z"
}
```

---

## Localization Keys Reference

Frontend should use these keys for i18n translations (supporting 7 languages):

### Event Types
```
event.type.comment = "Comment"
event.type.nicoru = "Emotion"
event.type.gift = "Gift"
event.type.follow = "Follow"
event.type.stream_start = "Stream Started"
event.type.stream_end = "Stream Ended"
```

### Field Names
```
field.sender_id = "User ID"
field.sender_name = "User Name"
field.sender_avatar = "User Avatar"
field.message = "Message"
field.color = "Color"
field.color_rgb = "RGB Color"
field.color_rgb.r = "Red"
field.color_rgb.g = "Green"
field.color_rgb.b = "Blue"
field.color_rgb.hex = "Hex Color"
field.position = "Position"
field.size = "Size"
field.font = "Font"
field.opacity = "Opacity"
field.amount_value = "Amount"
field.amount_currency = "Currency"
field.amount_display = "Display Amount"
field.is_member = "Is Member"
field.badges = "Badges"
```

### Enum Values (Position)
```
position.ue = "Top"
position.naka = "Middle"
position.shita = "Bottom"
```

### Enum Values (Size)
```
size.small = "Small"
size.medium = "Medium"
size.big = "Large"
```

### Enum Values (Font)
```
font.defont = "Default"
font.mincho = "Serif (Mincho)"
font.gothic = "Sans-serif (Gothic)"
```

### Enum Values (Opacity)
```
opacity.normal = "Normal"
opacity.translucent = "Translucent"
```

---

## API Endpoint for Event Metadata

### GET /event-metadata/niconico/comment

Returns the complete schema for NicoNico comment events.

### GET /event-metadata/niconico/nicoru

Returns the complete schema for NicoNico nicoru (emotion) events.

### GET /event-metadata/niconico/gift

Returns the complete schema for NicoNico gift events.

### GET /event-metadata/niconico/follow

Returns the complete schema for NicoNico follow events.

### GET /event-metadata/niconico/stream_start

Returns the complete schema for NicoNico stream_start system events.

### GET /event-metadata/niconico/stream_end

Returns the complete schema for NicoNico stream_end system events.

---

## Summary for Frontend Developers

### When Building Localization Files:

1. **Copy all localization keys** from the "Localization Keys Reference" section
2. **Translate values** for your 7 supported languages
3. **Use `/event-metadata/niconico/{event}` endpoint** to validate field names
4. **Store enum values** (position, size, font, opacity) separately for dropdowns/filters

### When Displaying Events:

1. **Always show**: `sender_name`, `message`, `received_at`
2. **Show styling if available**: `color`, `position`, `size`, `font`, `opacity`
3. **Show monetary info for gifts**: `amount_display`, `sender_name`
4. **Handle optional fields gracefully**: If `sender_id` is null, show "(Anonymous)"

### Condition Builder:

When users build rules like "trigger on comment color = red", UI should:

1. Call `GET /event-metadata/niconico/comment`
2. Extract `color` field
3. Suggest known colors or allow hex input
4. Validate against captured event history

---

**Last Updated:** 2026-08-13  
**Platform:** NicoNico Live  
**Event Types Documented:** 6 (comment, nicoru, gift, follow, stream_start, stream_end)
