# Translation Workflow - Chunk-Based Approach

**Goal:** Translate 873 keys 100 at a time to ensure 100% completion with no partial/mixed translations.

## Workflow Overview

```
1. Open chunk file (chunk_01_keys_0-99.json, etc.)
2. Copy all content (JSON)
3. Use online translator (Google Translate, DeepL, etc.) to translate entire JSON
4. Copy translated result
5. Save to language-specific folder
6. Repeat for next chunk
7. When all chunks done, run merge script
```

## Step-by-Step Instructions

### For German (de)

1. **Chunk 1 (keys 0-99)**
   - Open: `translation_chunks/chunk_01_keys_0-99.json`
   - Copy entire JSON content
   - Paste into [Google Translate](https://translate.google.com/) or [DeepL](https://www.deepl.com/translator)
   - Select: English → German
   - Copy translated JSON result
   - Save as: `translation_chunks/de/chunk_01_keys_0-99.json`

2. **Repeat for chunks 2-9**
   - Each chunk → Translate → Save to `translation_chunks/de/`

3. **Verify:** All 9 chunk files should be in `translation_chunks/de/`

### For French (fr) and Spanish (es)
- Same process, but save to `translation_chunks/fr/` and `translation_chunks/es/`

## File Structure

```
translation_chunks/
├── chunk_01_keys_0-99.json       ← Source chunk (English)
├── chunk_02_keys_100-199.json
├── ... (9 chunks total)
├── de/
│   ├── chunk_01_keys_0-99.json   ← Translated to German
│   ├── chunk_02_keys_100-199.json
│   └── ... (all 9 chunks)
├── fr/
│   ├── chunk_01_keys_0-99.json   ← Translated to French
│   └── ...
└── es/
    ├── chunk_01_keys_0-99.json   ← Translated to Spanish
    └── ...
```

## After All Chunks Are Translated

Run merge script to combine chunks into final files:

```powershell
cd C:\dev\tauchoportal
python merge_translation_chunks.py
```

This will:
- Combine all de/* chunks → `locales/de.json` (complete)
- Combine all fr/* chunks → `locales/fr.json` (complete)
- Combine all es/* chunks → `locales/es.json` (complete)

## Important Notes

✅ **DO:**
- Translate ENTIRE JSON (all key-value pairs) for each chunk
- Save translated JSON as-is (keep the JSON structure)
- Save to the correct language folder (`de/`, `fr/`, or `es/`)

❌ **DON'T:**
- Mix English and translated text (100% or nothing)
- Modify key names (left side of `:`)
- Change JSON structure

## Tips

- **Google Translate:** Supports JSON import/export
- **DeepL:** Excellent quality, also supports JSON
- **Batch:** Do multiple chunks in one session to keep context
- **Quality:** Review first chunk in each language to ensure quality before continuing

---

**Status:**
- ✅ Chunks prepared (9 chunks, 873 total keys)
- ⏳ Waiting: German translation (chunks 1-9)
- ⏳ Waiting: French translation (chunks 1-9)
- ⏳ Waiting: Spanish translation (chunks 1-9)
- 📝 Next: Japanese (you'll manually translate)
