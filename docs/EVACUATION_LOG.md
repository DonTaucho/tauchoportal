# Localization Evacuation & Refresh - 2026-07-20

## Summary
All existing language translations have been backed up to allow creating fresh, complete language files from English as the source of truth.

**Status:**
- ✅ English (en.json): 875 keys - Complete, source of truth
- 🔄 German (de.json): Fresh from English, ready for translation
- 🔄 French (fr.json): Fresh from English, ready for translation  
- 🔄 Spanish (es.json): Fresh from English, ready for translation
- 🆕 Italian (it.json): Fresh from English, new language
- 🔄 Japanese (ja.json): Fresh from English, will auto-translate + user review
- 🔄 Chinese (zh.json): Fresh from English, will auto-translate + user modify
- 🔄 Korean (ko.json): Fresh from English, will auto-translate + user modify

## Evacuated Files
Original translations (with manually tweaked strings for UI fit) backed up to `/internal/i18n/evacuate/`:

| File | Original Size | Keys | Notes |
|------|---|---|---|
| de.json | 11.6 KB | ~130 | Partial: top page mostly translated |
| fr.json | 11.9 KB | ~130 | Partial: top page mostly translated |
| es.json | 11.7 KB | ~130 | Partial: top page mostly translated |
| ja.json | 19.7 KB | ~200 | Partial: various pages translated |
| zh.json | 33.7 KB | ~300 | Partial: substantial translations |
| ko.json | 34.2 KB | ~300 | Partial: substantial translations |

## Translation Workflow

### Phase 1: European Languages (User manually translates)
```
1. Translate de.json (German) - based on English
2. Translate fr.json (French) - based on English
3. Translate es.json (Spanish) - based on English
4. Translate it.json (Italian) - based on English
```

### Phase 2: Japanese (Auto-translate + User review)
```
1. Auto-translate en.json → ja.json
2. User manually reviews and modifies Japanese
```

### Phase 3: Chinese & Korean (Auto-translate + User modify)
```
1. Auto-translate en.json → zh.json
2. Auto-translate en.json → ko.json
3. User modifies Chinese and Korean
```

### Phase 4: Merge with Evacuated Originals (Selective restoration)
For each language, review evacuated translations:
- If evacuated translation is better (e.g., fits in small UI space better), overwrite fresh translation
- If fresh translation is better (e.g., more complete, better phrasing), keep fresh translation
- Mark decisions to avoid re-evaluating same keys

## Script: Selective Merge (when ready)
```powershell
# Usage: Compare evacuate/xx.json with locales/xx.json
# For each key: keep the better translation
# Document reasoning for each override
```

## Build Status
✅ Go build passes with fresh language files
- No functionality changes
- All language files now have same structure (complete key set)
- Frontend will use English fallback for untranslated keys in all languages

---
**Created:** 2026-07-20  
**Reason:** Complete en.json to 875 keys, create consistent language file structure  
**Reverting:** If needed, restore from `/internal/i18n/evacuate/` directory
