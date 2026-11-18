#!/usr/bin/env python3
"""
Parivartan Snippet - Production Release Packager
Packages the extension into a clean .zip ready for Chrome Web Store & Firefox AMO.
"""

import json
import os
import zipfile

def build():
    # 1. Validate manifest.json
    with open('manifest.json', 'r') as f:
        manifest = json.load(f)

    version = manifest.get('version', '1.0.0')
    zip_name = f"parivartan-snippet-v{version}.zip"

    # Files to include in the release zip
    include_files = [
        'manifest.json',
        'background.js',
        'content_script.js',
        'content_style.css',
        'dashboard.html',
        'dashboard.css',
        'dashboard.js',
        'popup.html',
        'popup.css',
        'popup.js',
        'README.md',
        'PRIVACY_POLICY.md',
        'psychz_support_snippets.json'
    ]

    include_dirs = [
        'shared',
        'icons',
        'rules'
    ]

    # Clean existing zip
    if os.path.exists(zip_name):
        os.remove(zip_name)

    print(f"📦 Packaging Parivartan Snippet v{version} into {zip_name}...")

    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add root files
        for filename in include_files:
            if os.path.exists(filename):
                zf.write(filename, arcname=filename)
                print(f"  + {filename}")
            else:
                print(f"  ⚠️ Warning: {filename} missing!")

        # Add directories
        for directory in include_dirs:
            for root, dirs, files in os.walk(directory):
                for file in files:
                    # Skip hidden / temp files
                    if file.startswith('.') or file.endswith('~'):
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, '.')
                    zf.write(full_path, arcname=rel_path)
                    print(f"  + {rel_path}")

    size_kb = os.path.getsize(zip_name) / 1024
    print(f"\n✅ Build complete! Release package: {zip_name} ({size_kb:.1f} KB)")
    print(f"🚀 Ready to upload to Chrome Web Store and Firefox AMO.")

if __name__ == '__main__':
    build()
