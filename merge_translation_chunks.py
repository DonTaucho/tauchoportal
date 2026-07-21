#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge translated chunks back into final language files
Run this after all chunks are translated
"""
import json
import os
from pathlib import Path

os.chdir(r'C:\dev\tauchoportal\internal\i18n\locales')

languages = {
    'de': 'German',
    'fr': 'French', 
    'es': 'Spanish',
}

chunks_dir = 'translation_chunks'

print("Merging translated chunks...\n")

for lang_code, lang_name in languages.items():
    lang_chunks_dir = os.path.join(chunks_dir, lang_code)
    
    if not os.path.isdir(lang_chunks_dir):
        print(f"[SKIP] {lang_name}: chunk directory not found ({lang_chunks_dir})")
        continue
    
    # Get all chunk files in this language directory, sorted
    chunk_files = sorted([f for f in os.listdir(lang_chunks_dir) if f.endswith('.json')])
    
    if not chunk_files:
        print(f"[SKIP] {lang_name}: no translated chunks found")
        continue
    
    print(f"Merging {lang_name} ({len(chunk_files)} chunks)...")
    
    merged_data = {}
    
    for chunk_file in chunk_files:
        chunk_path = os.path.join(lang_chunks_dir, chunk_file)
        try:
            with open(chunk_path, 'r', encoding='utf-8') as f:
                chunk_data = json.load(f)
                merged_data.update(chunk_data)
                print(f"  + {chunk_file}: {len(chunk_data)} keys")
        except Exception as e:
            print(f"  [ERROR] {chunk_file}: {e}")
    
    # Write merged file
    output_file = f'{lang_code}.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] {lang_name}: merged {len(merged_data)} keys -> {output_file}\n")

print("="*70)
print("Merge complete!")
print("="*70)
