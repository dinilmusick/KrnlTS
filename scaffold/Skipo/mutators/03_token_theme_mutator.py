#!/usr/bin/env python3
"""
Aspect 03 Mutator: Design Token & Theme Normalization Mutator
Transforms:
- Identifies hardcoded color literals (#hex, rgb(...), rgba(...)) in code
- Replaces hardcoded colors with standard Skipo theme tokens (var(--skipo-*))
- Normalizes style objects and CSS declarations to pass Aspect 02 validation gates
"""

from pathlib import Path
from typing import List, Dict, Any, Tuple
import os
import re
import sys
import time

try:
    from .common import (
        MutationAction, MutatorResult, rewrite_file_safe,
        parse_mutator_args, print_mutator_report
    )
except ImportError:
    from common import (
        MutationAction, MutatorResult, rewrite_file_safe,
        parse_mutator_args, print_mutator_report
    )

MUTATOR_ID = "03_token_theme"
MUTATOR_TITLE = "Design Token & Theme Normalization Mutator"

# Mapping from common hex colors to Skipo CSS variables
COLOR_REPLACEMENTS = [
    # Backgrounds and dark surfaces
    (re.compile(r"['\"]#(?:121214|0a0a0c|000000|000|18181b|111113)['\"]", re.IGNORECASE), "'var(--skipo-surface-background, #121214)'"),
    (re.compile(r"['\"]#(?:1e1e24|1f1f23|27272a|232328|2a2a30)['\"]", re.IGNORECASE), "'var(--skipo-surface, #1e1e24)'"),
    (re.compile(r"['\"]#(?:2d2d34|3f3f46|333339|323238)['\"]", re.IGNORECASE), "'var(--skipo-surface-elevated, #2d2d34)'"),
    # Borders
    (re.compile(r"['\"]#(?:333333|333|444444|444|52525b|3a3a42)['\"]", re.IGNORECASE), "'var(--skipo-border-color, #3a3a42)'"),
    # Primary & Secondary text
    (re.compile(r"['\"]#(?:ffffff|fff|f3ede0|f4f4f5|fafafa)['\"]", re.IGNORECASE), "'var(--skipo-text-primary, #ffffff)'"),
    (re.compile(r"['\"]#(?:a1a1aa|9ca3af|888888|888|71717a)['\"]", re.IGNORECASE), "'var(--skipo-text-secondary, #a1a1aa)'"),
    # Accents & Semantics
    (re.compile(r"['\"]#(?:d4af37|b59443|3b82f6|6366f1|2563eb)['\"]", re.IGNORECASE), "'var(--skipo-accent, #d4af37)'"),
    (re.compile(r"['\"]#(?:2a9d8f|10b981|22c55e|16a34a)['\"]", re.IGNORECASE), "'var(--skipo-success, #2a9d8f)'"),
    (re.compile(r"['\"]#(?:e76f51|ef4444|dc2626|f43f5e)['\"]", re.IGNORECASE), "'var(--skipo-error, #e76f51)'"),
    (re.compile(r"['\"]#(?:f59e0b|eab308|d97706)['\"]", re.IGNORECASE), "'var(--skipo-warning, #f59e0b)'"),
]

def mutate_file_tokens(file_path: Path, dry_run: bool, backup: bool) -> Tuple[bool, int, str]:
    content = file_path.read_text(encoding="utf-8", errors="replace")
    original = content
    replacements_count = 0

    mutated = content
    for pattern, token in COLOR_REPLACEMENTS:
        matches = len(pattern.findall(mutated))
        if matches > 0:
            mutated = pattern.sub(token, mutated)
            replacements_count += matches

    if mutated == original:
        return False, 0, ""

    changed, diff = rewrite_file_safe(file_path, mutated, dry_run=dry_run, backup=backup)
    return changed, replacements_count, diff or ""

def mutate_tokens(target_path: Path, params: Dict[str, Any]) -> MutatorResult:
    start_time = time.time()
    actions: List[MutationAction] = []
    messages: List[str] = []
    dry_run = params.get("dry_run", False)
    backup = params.get("backup", False)

    target_files = []
    if target_path.is_file():
        target_files.append(target_path)
    else:
        for root, dirs, files in os.walk(target_path):
            dirs[:] = [d for d in dirs if d not in {"node_modules", "dist", ".next", ".git"}]
            for fname in files:
                if fname.endswith((".tsx", ".jsx", ".css", ".ts", ".js")) and not fname.endswith(".d.ts"):
                    target_files.append(Path(root) / fname)

    total_tokens_replaced = 0
    for f in target_files:
        changed, count, diff = mutate_file_tokens(f, dry_run=dry_run, backup=backup)
        if changed:
            total_tokens_replaced += count
            actions.append(MutationAction(
                action_type="rewrite",
                source_path=str(f.relative_to(target_path) if target_path.is_dir() else f.name),
                description=f"Replaced {count} hardcoded color literals with standard var(--skipo-*) tokens",
                diff=diff
            ))

    messages.append(f"Normalized {total_tokens_replaced} hardcoded colors across {len(actions)} files.")
    return MutatorResult(
        mutator_id=MUTATOR_ID,
        mutator_title=MUTATOR_TITLE,
        success=True,
        target_path=str(target_path),
        actions=actions,
        messages=messages,
        duration_ms=(time.time() - start_time) * 1000
    )

def main():
    args = parse_mutator_args("Skipo Design Token & Theme Normalization Mutator")
    target_path = Path(args["target_path"]).resolve()
    result = mutate_tokens(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_mutator_report(result, verbose=args["verbose"])

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
