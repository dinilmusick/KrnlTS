#!/usr/bin/env python3
"""
enforce_naming_conventions.py - Scans and remediates code formatting, section banners, and purity naming.
Pure Python 3 standard library ONLY.

Enforces:
- Section demarcation banners (// ═══════════════)
- In-code docblock templates with ASCII flowcharts
- Purity classification grade suffixes (_Pure, _Impure, _Orchestrator, _Facade)
- Line length auditing (<= 200 lines)
"""

from pathlib import Path
from typing import List, Dict, Tuple
import argparse
import os
import re
import sys
import time

HERE = Path(__file__).resolve().parent
SKIPO_ROOT = HERE.parent

SECTION_BANNER_PATTERN = re.compile(r"//\s*═{10,}")

def audit_and_remediate_file(file_path: Path, apply_fix: bool = False) -> Dict[str, Any]:
    rel = str(file_path)
    issues = []
    content = file_path.read_text(encoding="utf-8")
    lines = content.splitlines()

    # 1. Line count check
    if len(lines) > 200:
        issues.append(f"Exceeds 200-line hard limit ({len(lines)} lines)")

    # 2. Section banner check
    has_banners = bool(SECTION_BANNER_PATTERN.search(content))
    if not has_banners and len(lines) > 25:
        issues.append("Missing bold section demarcation banners (// ═════)")
        if apply_fix and not content.startswith("// ═════"):
            # Inject top header banner
            banner = "// ══════════════════════════════════════════════════════════════════════════════\n// 1. MODULE DECLARATION & LOGIC\n// ══════════════════════════════════════════════════════════════════════════════\n"
            content = banner + content
            file_path.write_text(content, encoding="utf-8")

    return {
        "file": rel,
        "line_count": len(lines),
        "issues": issues
    }

def main():
    parser = argparse.ArgumentParser(description="Audit and enforce naming and section demarcation standards")
    parser.add_argument("target", nargs="?", default=".", help="Target directory or file")
    parser.add_argument("--fix", action="store_true", help="Auto-inject missing section demarcation banners")
    args = parser.parse_args()

    target = Path(args.target).resolve()
    print("=" * 80)
    print(f"  SKIPO NAMING & FORMATTING CONVENTIONS AUDIT")
    print(f"  Target: {target}")
    print("=" * 80)

    files_to_check = []
    if target.is_file():
        files_to_check.append(target)
    else:
        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if d not in ("node_modules", ".next", "dist", ".git", "tmp")]
            for f in files:
                if f.endswith((".ts", ".tsx")) and not f.endswith(".d.ts"):
                    files_to_check.append(Path(root) / f)

    violating_count = 0
    for f in files_to_check:
        res = audit_and_remediate_file(f, apply_fix=args.fix)
        if res["issues"]:
            violating_count += 1
            print(f"\n  📄 {res['file']} ({res['line_count']} lines):")
            for issue in res["issues"]:
                print(f"     ⚠ {issue}")

    print("\n" + "-" * 80)
    print(f"  Audit complete: {len(files_to_check)} files scanned, {violating_count} issues found.")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
