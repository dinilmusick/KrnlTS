#!/usr/bin/env python3
"""
rename_app.py - Automated Application Renaming Utility for Skipo Scaffolds
Converts all template tokens (MyApp, my-app, MY_APP, myapp, AppBackend) to target app name.
Standard Python 3 only. Conforms to Skipo Governance (< 200 lines).
Usage: python3 Skipo/scripts/rename_app.py "TargetAppName"
"""

import sys
import re
from pathlib import Path

def to_kebab(s: str) -> str:
    s = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1-\2', s)
    s = re.sub(r'([a-z\d])([A-Z])', r'\1-\2', s)
    return s.replace('_', '-').lower()

def to_pascal(s: str) -> str:
    parts = re.split(r'[-_\s]+', s)
    return ''.join(p[:1].upper() + p[1:] for p in parts if p)

def to_camel(s: str) -> str:
    p = to_pascal(s)
    return p[:1].lower() + p[1:] if p else ''

def to_upper_snake(s: str) -> str:
    return to_kebab(s).replace('-', '_').upper()

def rename_app(root_dir: Path, target_name: str):
    pascal = to_pascal(target_name)
    kebab = to_kebab(target_name)
    camel = to_camel(target_name)
    upper = to_upper_snake(target_name)
    lower = target_name.lower().replace('-', '').replace('_', '')

    print(f"\n==================================================")
    print(f"  SKIPO APP RENAMING ENGINE")
    print(f"==================================================")
    print(f"  Target:      {pascal} (kebab: {kebab}, camel: {camel}, upper: {upper})")
    print(f"  Root Dir:    {root_dir}")
    print(f"--------------------------------------------------")

    replacements = [
        ("MyAppBackend", f"{pascal}Backend"),
        ("AppBackend", f"{pascal}Backend"),
        ("appBackend", f"{camel}Backend"),
        ("appWorkerBoundary", f"{camel}WorkerBoundary"),
        ("my-app-worker", f"{kebab}-worker"),
        ("my-app", kebab),
        ("MY_APP", upper),
        ("MyApp", pascal),
        ("'myapp'", f"'{lower}'"),
        ('"myapp"', f'"{lower}"'),
    ]

    target_extensions = {".ts", ".tsx", ".js", ".cjs", ".mjs", ".json", ".toml", ".html", ".md"}
    modified_files = []

    # 1. Substitute text tokens in all relevant files
    for path in root_dir.rglob("*"):
        if not path.is_file() or path.suffix not in target_extensions:
            continue
        rel = path.relative_to(root_dir)
        if any(part in {"node_modules", "dist", ".git", ".next", ".turbo"} for part in rel.parts):
            continue

        try:
            content = path.read_text(encoding="utf-8")
        except Exception:
            continue

        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)

        if new_content != content:
            path.write_text(new_content, encoding="utf-8")
            modified_files.append(str(rel))

    # 2. Rename backend facade file if present
    facade_old = root_dir / "src" / "backend" / "AppBackend.ts"
    facade_new = root_dir / "src" / "backend" / f"{pascal}Backend.ts"
    if facade_old.exists() and facade_old != facade_new:
        facade_old.rename(facade_new)
        print(f"  [RENAME] src/backend/AppBackend.ts -> src/backend/{pascal}Backend.ts")

    print(f"  Modified {len(modified_files)} files:")
    for f in modified_files[:15]:
        print(f"    - {f}")
    if len(modified_files) > 15:
        print(f"    ... and {len(modified_files) - 15} more.")
    print(f"--------------------------------------------------")
    print(f"  SUCCESS: Application renamed to '{pascal}' successfully!\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 rename_app.py <TargetAppName>")
        sys.exit(1)

    target_name = sys.argv[1].strip()
    script_dir = Path(__file__).resolve().parent

    # If inside Skipo/scripts/, root is either Skipo's parent (the app) or current dir
    if script_dir.parent.name == "Skipo":
        app_root = script_dir.parent.parent
    elif script_dir.name == "scripts":
        app_root = script_dir.parent
    else:
        app_root = Path.cwd()

    rename_app(app_root, target_name)

if __name__ == "__main__":
    main()
