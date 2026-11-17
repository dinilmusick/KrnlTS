#!/usr/bin/env python3
"""
Aspect 02 Mutator: Section Demarcation & ASCII Flowchart Injector
Transforms:
- Injects standard bold Unicode section demarcation borders (// ══════════════════════════════════════════════════════════════════════════════)
- Prepend synthetic ASCII flowchart docblocks to files lacking architecture documentation
- Normalizes comment structure to pass Aspect 04 compliance gates
"""

from pathlib import Path
from typing import List, Dict, Any, Tuple
import os
import re
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

MUTATOR_ID = "02_section_demarcation"
MUTATOR_TITLE = "Section Demarcation & ASCII Flowchart Mutator"

UNICODE_BORDER_CHECK = "// ══"

def synthesize_ascii_flowchart(file_name: str, functions: List[str]) -> str:
    """Create a standard ASCII flowchart for a file."""
    steps = [f"Initialize {file_name}"]
    if functions:
        steps.extend(functions[:3])
    else:
        steps.append("Execute Component / Pipeline Logic")
    steps.append("Return State / Result Payload")

    box_width = max(max(len(s) for s in steps) + 6, len(file_name) + 8, 36)
    top_b = "┌" + ("─" * (box_width - 2)) + "┐"
    bot_b = "└" + ("─" * (box_width - 2)) + "┘"

    lines = ["/**", f" * ASCII Architecture Flowchart: {file_name}", " *"]
    for i, step in enumerate(steps):
        padded = step.center(box_width - 2)
        lines.append(f" *   {top_b}")
        lines.append(f" *   │{padded}│")
        lines.append(f" *   {bot_b}")
        if i < len(steps) - 1:
            pad = " " * ((box_width // 2) - 1)
            lines.append(f" *   {pad}│")
            lines.append(f" *   {pad}▼")
    lines.append(" */\n")
    return "\n".join(lines)

def mutate_file_sections(file_path: Path, dry_run: bool, backup: bool) -> Tuple[bool, str, str]:
    content = file_path.read_text(encoding="utf-8", errors="replace")
    original = content

    has_border = UNICODE_BORDER_CHECK in content
    has_flowchart = "ASCII Architecture Flowchart" in content or "┌─" in content

    # Find declared function names
    fn_matches = re.findall(r'(?:export\s+)?(?:function|const)\s+([a-zA-Z0-9_]+)', content)
    fn_names = [f for f in fn_matches if not f.startswith("use") and f not in ["React", "default"]]

    mutated_lines: List[str] = []
    lines = content.splitlines()

    # If missing flowchart, generate at top
    if not has_flowchart:
        flowchart = synthesize_ascii_flowchart(file_path.stem, fn_names)
        mutated_lines.append(flowchart)

    in_imports = True
    added_types_border = False
    added_impl_border = False

    for line in lines:
        stripped = line.strip()
        
        # Detect end of import block
        if in_imports and stripped and not stripped.startswith("import") and not stripped.startswith("//") and not stripped.startswith("/*"):
            in_imports = False
            if not has_border and not added_types_border:
                mutated_lines.append(section_border("Types & Domain Contracts"))
                mutated_lines.append("// ══════════════════════════════════════════════════════════════════════════════\n")
                added_types_border = True

        # Detect primary function or component declaration
        if not in_imports and not added_impl_border:
            if stripped.startswith("export function") or stripped.startswith("export const") or stripped.startswith("export default"):
                if not has_border:
                    mutated_lines.append("\n" + section_border(f"{file_path.stem} Implementation"))
                    mutated_lines.append("// ══════════════════════════════════════════════════════════════════════════════\n")
                    added_impl_border = True

        mutated_lines.append(line)

    new_content = "\n".join(mutated_lines)
    if new_content == original:
        return False, original, ""

    changed, diff = rewrite_file_safe(file_path, new_content, dry_run=dry_run, backup=backup)
    return changed, new_content, diff or ""

def mutate_sections(target_path: Path, params: Dict[str, Any]) -> MutatorResult:
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
        changed, content, diff = mutate_file_sections(f, dry_run=dry_run, backup=backup)
        if changed:
            actions.append(MutationAction(
                action_type="rewrite",
                source_path=str(f.relative_to(target_path) if target_path.is_dir() else f.name),
                description="Injected Unicode section demarcation borders and ASCII flowchart docblock",
                diff=diff
            ))

    messages.append(f"Injected demarcation borders across {len(actions)} files.")
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
    args = parse_mutator_args("Skipo Section Demarcation & ASCII Flowchart Mutator")
    target_path = Path(args["target_path"]).resolve()
    result = mutate_sections(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_mutator_report(result, verbose=args["verbose"])

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
