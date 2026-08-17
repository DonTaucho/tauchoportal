# i18n Translation Fix - Channel Validation Keys

## Problem
When users switched to a language other than English (e.g., Japanese), the channel validation messages were still displaying in English:
- "Cannot Add" button text
- "Failed to validate channel access" error message
- "Validating…" status text

## Root Cause
The translation keys were using the wrong prefix:
- **Added as:** `channelLayout.validating`, `channelLayout.cannotAdd`, etc.
- **Should be:** `sidebarChannels.validating`, `sidebarChannels.cannotAdd`, etc.

The JavaScript code uses `window.sidebarChannelsTranslations` which only includes keys with the `sidebarChannels.*` prefix. Keys with `channelLayout.*` prefix are not loaded into this object.

## Solution
Changed all 5 validation-related translation keys from `channelLayout.*` to `sidebarChannels.*` prefix across all 7 language files.

## What Changed

### Translation Keys (5 keys in each language file)
```
OLD PREFIX: channelLayout.*
NEW PREFIX: sidebarChannels.*

Keys:
- validating
- cannotAdd
- failedValidateChannel
- channelNotAccessible
- addChannelTitle
```

### Files Updated
All 7 language files:
- `internal/i18n/locales/en.json` - English
- `internal/i18n/locales/de.json` - German
- `internal/i18n/locales/es.json` - Spanish
- `internal/i18n/locales/fr.json` - French
- `internal/i18n/locales/ja.json` - Japanese
- `internal/i18n/locales/ko.json` - Korean
- `internal/i18n/locales/zh.json` - Chinese

### How It Works

**Template Loading (channels.html):**
```html
<script id="sidebarChannelsTranslations" type="application/json">
  {{.I18n.TByPrefix "sidebarChannels" | jsonMarshal}}
</script>
<script>
  window.sidebarChannelsTranslations = JSON.parse(...);
</script>
```

**JavaScript Usage (channels-sidebar.js):**
```javascript
const t = window.sidebarChannelsTranslations || {};

// These keys now work:
t.validating              // "検証中…" (in Japanese)
t.cannotAdd               // "追加できません" (in Japanese)
t.failedValidateChannel   // "チャンネルへのアクセス確認に失敗しました" (in Japanese)
```

## Verification

✅ All 7 i18n JSON files are valid
✅ Go compilation successful
✅ No conflicting `channelLayout.` prefixes remain for validation keys
✅ All `sidebarChannels.` keys present and loaded

## Example Flow

### Before Fix (English only)
1. User switches language to Japanese
2. User clicks "Add Channel"
3. Validation drawer shows "Validating…" (ALWAYS IN ENGLISH)
4. If validation fails: Button shows "Cannot Add" (ALWAYS IN ENGLISH)

### After Fix (Proper localization)
1. User switches language to Japanese
2. User clicks "Add Channel"
3. Validation drawer shows "検証中…" (properly translated)
4. If validation fails: Button shows "追加できません" (properly translated)

## Git Commit
**99fb930** - Fix i18n key prefix for channel validation translations

## Technical Note

The `sidebarChannels.*` prefix is extracted at page load time by:
```javascript
{{.I18n.TByPrefix "sidebarChannels" | jsonMarshal}}
```

This only includes keys that START with "sidebarChannels." - keys starting with "channelLayout." are NOT included. Since the JavaScript code references `window.sidebarChannelsTranslations`, using the wrong prefix means those keys won't be found, and the English fallback text is used instead.

This is now fixed and all validation messages will display properly in the user's selected language.
