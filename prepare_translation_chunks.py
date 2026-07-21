#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Split en.json into 100-key chunks for batch translation
Creates a working directory structure to process translation incrementally
"""
import json
import os
from pathlib import Path

os.chdir(r'C:\dev\tauchoportal\internal\i18n\locales')

# Read English file
with open('en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Create chunks directory
chunks_dir = 'translation_chunks'
os.makedirs(chunks_dir, exist_ok=True)

keys_list = list(en_data.items())
chunk_size = 100
total_chunks = (len(keys_list) + chunk_size - 1) // chunk_size

print(f"Total keys: {len(en_data)}")
print(f"Chunk size: {chunk_size} keys")
print(f"Total chunks: {total_chunks}\n")

# Create chunk files
for i in range(total_chunks):
    start_idx = i * chunk_size
    end_idx = min(start_idx + chunk_size, len(keys_list))
    
    chunk_keys = dict(keys_list[start_idx:end_idx])
    chunk_num = i + 1
    
    chunk_file = os.path.join(chunks_dir, f'chunk_{chunk_num:02d}_keys_{start_idx}-{end_idx-1}.json')
    with open(chunk_file, 'w', encoding='utf-8') as f:
        json.dump(chunk_keys, f, ensure_ascii=False, indent=2)
    
    print(f"Chunk {chunk_num:2d}: keys {start_idx:3d}-{end_idx-1:3d} ({end_idx-start_idx} keys) -> {chunk_file}")

# Create template files for each language
languages = {
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
}

print("\n" + "="*70)
print("WORKFLOW:")
print("="*70)
print("1. For each chunk, open it in an online translator (Google Translate, DeepL, etc.)")
print("2. Copy the JSON from chunk file")
print("3. Paste into translator")
print("4. Translate to target language")
print("5. Copy translated result")
print("6. Paste into language-specific chunk folder")
print("7. Script will merge all chunks into final language files")
print()

for lang_code, lang_name in languages.items():
    lang_chunks_dir = os.path.join(chunks_dir, lang_code)
    os.makedirs(lang_chunks_dir, exist_ok=True)
    print(f"Created folder for {lang_name} translations: {chunks_dir}/{lang_code}/")

print("\n" + "="*70)
print("READY FOR TRANSLATION")
print("="*70)
print(f"Chunk files: {chunks_dir}/chunk_XX_*.json")
print(f"Output folders: {chunks_dir}/de/, {chunks_dir}/fr/, {chunks_dir}/es/")
