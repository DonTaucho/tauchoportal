# API Update: Platform-Specific Event Metadata

## Overview
Updated the event metadata API integration to use the platform-specific and event-specific endpoints as per the new API spec (lines 2381-2510 of `/docs/api-spec.md`).

## Changes Made

### 1. `internal/controller/conditions.go`

#### Type Changes:
- **Removed**: `EventMetadata` struct (which had Providers and EventSchema fields)
- **Added**: `EventMetadataResponse` struct that matches the new API response:
  ```go
  type EventMetadataResponse struct {
      Platform  string                       `json:"platform"`
      EventType string                       `json:"event_type"`
      Fields    map[string]EventSchemaField  `json:"fields"`
  }
  ```

#### Function Changes:
- **Updated**: `GetEventMetadata()` method signature
  - **Old**: `func (Conditions) GetEventMetadata() EventMetadata`
  - **New**: `func (Conditions) GetEventMetadata(platform, eventType string) EventMetadataResponse`
  - Now calls: `GET /event-metadata/{platform}/{event_type}`
  - Example: `GET /event-metadata/youtube/comment`

### 2. `internal/controller/template.go`

#### `GetPlatformMetadata()` Function:
- **Changed approach**: Now uses hardcoded platform metadata instead of API
- **Reason**: The new API doesn't provide a general providers list
- **Returns**: Map with platform icons and labels
- **No longer calls**: `GetEventMetadata()`

#### `GetEventBadgeClasses()` Function:
- **Changed approach**: Now uses hardcoded event-to-CSS-class mapping
- **Reason**: The new API doesn't provide a general badge mapping
- **Returns**: Map of event types to CSS classes (comment, gift, follow, effect, stream, etc.)
- **No longer calls**: `GetEventMetadata()`

#### `GetEventFieldOptions()` Function:
- **Updated signature**: 
  - **Old**: `func GetEventFieldOptions(cond Conditions) []EventFieldOption`
  - **New**: `func GetEventFieldOptions(cond Conditions, platform, eventType string) []EventFieldOption`
- **Now calls**: `GetEventMetadata(platform, eventType)` to fetch fields
- **Returns**: Sorted list of available event fields with descriptions
- **Converts API response**: Maps from `Fields` (map) to `EventFieldOption` (slice of name+label pairs)

### 3. Call Sites Updated

#### `PrepareConditionPageData()` (line 625):
- **Before**: `GetEventFieldOptions(cond)`
- **After**: `GetEventFieldOptions(cond, currentChannel.Platform, condition.EventType)`
- **Data flow**: Fetches options specific to the platform and event type of the condition being edited

#### `PrepareConditionsPageData()` (line 311):
- **Before**: `GetEventFieldOptions(cond)`
- **After**: `[]EventFieldOption{}` (empty, not needed for list page)
- **Reason**: Conditions list page shows multiple conditions with different event types, so no single set of options applies

## API Endpoints Used

### Previous (No Longer Used):
- `GET /event-metadata` — General metadata endpoint

### New (Now Used):
- `GET /event-metadata/{platform}/{event_type}` — Platform and event-specific metadata
  - Example: `GET /event-metadata/youtube/comment`
  - Returns: Fields available for YouTube comments with descriptions and optional flags

## Field Response Structure

### Sample Response: `GET /event-metadata/youtube/comment`
```json
{
  "platform": "youtube",
  "event_type": "comment",
  "fields": {
    "id": {"name": "id", "type": "string", "description": "Unique identifier...", "optional": false},
    "sender_name": {"name": "sender_name", "type": "string", "description": "Display name...", "optional": false},
    "message": {"name": "message", "type": "string", "description": "Comment text", "optional": false},
    ...
  }
}
```

## Key Differences by Platform

Per API spec (lines 2496-2501):
- **YouTube comments**: Include `is_member` flag; no color/position fields
- **NicoNico comments**: Include `color`, `size`, `position` (danmaku styling); `sender_id` is optional
- **Twitch comments**: Include `is_mod`, `badges`, channel-specific badges
- **Bilibili comments**: Include `color`, `size`, `position` like NicoNico
- **TikTok/Instagram/Facebook**: Minimal field set (sender, message only)

## Fallback Behavior

If API call fails or returns empty fields, hardcoded fallback list is used:
```
- message — Message content for comments, gifts, or subs
- sender_id — Platform user ID of the sender
- sender_name — Display name of the sender
- amount_value — Numeric amount for monetary events
- amount_display — Formatted display string
- is_member — Whether the sender is a channel member
- is_mod — Whether the sender is a moderator
```

## Template Usage

On the condition editor page (`templates/pages/condition.html`), the `EventFieldOptions` dropdown is populated server-side:

```html
<select id="textEnvSelect">
    {{range .EventFieldOptions}}
    <option value="{{.Name}}">{{.Label}}</option>
    {{end}}
</select>
```

Now correctly shows only the fields available for that specific platform-event combination.

## Build Status

✅ **No compilation errors**

## Testing Notes

To test the changes:
1. Navigate to a condition editor page
2. Verify that event field options are populated from the API
3. Try different platforms/event types to see field differences
4. Verify fallback values appear if API is unavailable

---

**Last Updated**: 2026-07-19
**API Spec Reference**: `/docs/api-spec.md` lines 2381-2510
