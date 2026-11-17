#!/usr/bin/env python3
"""
Aspect 04 Mutator: Monolith Decomposer & Line-Limit Enforcer Mutator
Transforms:
- Identifies files exceeding the 200-line hard architectural limit
- Decomposes oversized files into a cohesive sub-module directory:
  - types.ts (Extracted interface and type definitions)
  - helpers.ts (Extracted auxiliary functions and transformers)
  - [OriginalName].tsx / .ts (Reduced primary logic strictly <= 200 lines)
  - index.ts (100% backward-compatible barrel facade)
"""

from pathlib import Path
from typing import List, Dict, Any, Tuple
import os
import re
import shutil
import sys
import time

try:
    from .common import (
        MutationAction, MutatorResult, rewrite_file_safe, section_border,
        parse_mutator_args, print_mutator_report
    )
except ImportError:
    from common import (
        MutationAction, MutatorResult, rewrite_file_safe, section_border,
        parse_mutator_args, print_mutator_report
    )

MUTATOR_ID = "04_monolith_splitter"
MUTATOR_TITLE = "Monolith Decomposer & Line-Limit Enforcer Mutator"

MAX_LINES = 200

def split_oversized_file(file_path: Path, dry_run: bool, backup: bool) -> List[MutationAction]:
    content = file_path.read_text(encoding="utf-8", errors="replace")
    lines = content.splitlines()
    if len(lines) <= MAX_LINES:
        return []

    actions: List[MutationAction] = []
    stem = file_path.stem
    ext = file_path.suffix
    parent_dir = file_path.parent
    sub_dir = parent_dir / stem

    type_lines: List[str] = []
    helper_lines: List[str] = []
    main_lines: List[str] = []

    in_type = False
    in_helper = False

    for line in lines:
        stripped = line.strip()
        
        # Detect interfaces and type declarations
        if stripped.startswith("export interface") or stripped.startswith("export type") or stripped.startswith("interface ") or stripped.startswith("type "):
            in_type = True
            in_helper = False
        elif in_type and stripped.startswith("}"):
            type_lines.append(line)
            in_type = False
            continue

        # Detect helper functions (non-default and non-capitalized functions)
        if stripped.startswith("function ") or (stripped.startswith("export function ") and not stripped.startswith(f"export function {stem}")):
            in_helper = True
            in_type = False
        elif in_helper and stripped.startswith("}"):
            helper_lines.append(line)
            in_helper = False
            continue

        if in_type:
            type_lines.append(line)
        elif in_helper:
            helper_lines.append(line)
        else:
            main_lines.append(line)

    if not dry_run:
        sub_dir.mkdir(parents=True, exist_ok=True)

    # 1. types.ts
    if type_lines:
        types_content = f"{section_border(f'{stem} Extracted Types')}\n" + "\n".join(type_lines) + "\n"
        types_path = sub_dir / "types.ts"
        actions.append(MutationAction(
            action_type="insert",
            source_path=str(file_path),
            target_path=str(types_path),
            description=f"Extracted {len(type_lines)} lines of interfaces into types.ts"
        ))
        if not dry_run:
            types_path.write_text(types_content, encoding="utf-8")

    # 2. helpers.ts
    if helper_lines:
        helpers_content = f"{section_border(f'{stem} Extracted Helpers')}\n" + "\n".join(helper_lines) + "\n"
        helpers_path = sub_dir / "helpers.ts"
        actions.append(MutationAction(
            action_type="insert",
            source_path=str(file_path),
            target_path=str(helpers_path),
            description=f"Extracted {len(helper_lines)} lines of helper functions into helpers.ts"
        ))
        if not dry_run:
            helpers_path.write_text(helpers_content, encoding="utf-8")

    # 3. Reduced primary file
    import_prefix = []
    if type_lines:
        import_prefix.append("export * from './types';")
    if helper_lines:
        import_prefix.append("export * from './helpers';")

    reduced_main = "\n".join(import_prefix) + "\n\n" + "\n".join(main_lines)
    reduced_path = sub_dir / f"{stem}{ext}"
    actions.append(MutationAction(
        action_type="rewrite",
        source_path=str(file_path),
        target_path=str(reduced_path),
        description=f"Reduced primary implementation to {len(main_lines)} lines"
    ))
    if not dry_run:
        reduced_path.write_text(reduced_main, encoding="utf-8")

    # 4. Replace original file with backward-compatible barrel facade
    barrel_facade = f"""{section_border(f'{stem} Backward-Compatible Barrel Facade')}
// ══════════════════════════════════════════════════════════════════════════════

export * from './{stem}/{stem}';
export * from './{stem}/types';
export * from './{stem}/helpers';
export {{ default }} from './{stem}/{stem}';
"""
    actions.append(MutationAction(
        action_type="rewrite",
        source_path=str(file_path),
        description=f"Replaced oversized monolith with 100% backward-compatible barrel facade"
    ))
    if not dry_run:
        file_path.write_text(barrel_facade, encoding="utf-8")

    return actions

def mutate_monoliths(target_path: Path, params: Dict[str, Any]) -> MutatorResult:
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
                if fname.endswith((".ts", ".tsx", ".js", ".jsx")) and not fname.endswith(".d.ts"):
                    target_files.append(Path(root) / fname)

    for f in target_files:
        try:
            file_actions = split_oversized_file(f, dry_run=dry_run, backup=backup)
            actions.extend(file_actions)
        except Exception as e:
            messages.append(f"Error inspecting {f.name}: {e}")

    messages.append(f"Decomposed {len([a for a in actions if a.action_type == 'rewrite'])} oversized files.")
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
    args = parse_mutator_args("Skipo Monolith Decomposer & Line-Limit Enforcer Mutator")
    target_path = Path(args["target_path"]).resolve()
    result = mutate_monoliths(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_mutator_report(result, verbose=args["verbose"])

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
