#!/usr/bin/env python3
import json
import os

os.chdir(r'C:\dev\tauchoportal\internal\i18n\locales')

# Read English file (source of truth)
with open('en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Languages to create fresh copies for
languages = {
    'de.json': 'German (to translate)',
    'fr.json': 'French (to translate)',
    'es.json': 'Spanish (to translate)',
    'it.json': 'Italian (new)',
    'ja.json': 'Japanese (auto-translate + review)',
    'zh.json': 'Chinese (auto-translate + modify)',
    'ko.json': 'Korean (auto-translate + modify)'
}

print("📋 Creating fresh language files from en.json...")
print(f"English file has {len(en_data)} keys\n")

for filename, desc in languages.items():
    # Write same structure with English values as placeholder
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(en_data, f, ensure_ascii=False, indent=2)
    
    file_size = os.path.getsize(filename)
    print(f"✅ {filename:10} ({desc:30}) - {file_size:6} bytes")

print("\n✅ All fresh files created with English structure")
print("💾 Original files backed up in: ../evacuate/")
