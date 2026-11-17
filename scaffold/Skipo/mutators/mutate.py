#!/usr/bin/env python3
"""
mutators/mutate.py - Master Dispatcher & Auto-Remediation Mutator for Skipo.
Pure Python 3 standard library ONLY - zero pip dependencies.
Runs natively in Google AI Studio Code Execution, Project IDX, macOS, Linux, and Windows.

Orchestrates:
- Aspect 01 Mutator: Plane Restructure & Consolidation (01_plane_restructure_mutator.py)
- Aspect 02 Mutator: Section Demarcation & Flowcharts (02_section_demarcation_mutator.py)
- Aspect 03 Mutator: Design Token & Theme Normalizer (03_token_theme_mutator.py)
- Aspect 04 Mutator: Monolith Decomposer & Line Limits (04_monolith_splitter_mutator.py)
- Master Pipeline: Auto-Remediate All Deviations ('all')
"""

from pathlib import Path
import argparse
import importlib.util
import json
import os
import sys
import time
from typing import Dict, Any, List

def _load_module(rel_name: str, py_name: str):
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location(rel_name, here / py_name)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

try:
    from .common import (
        MutatorResult, MutationAction, bold, cyan, green, red, yellow, dim,
        print_mutator_report, parse_mutator_args
    )
except ImportError:
    from common import (
        MutatorResult, MutationAction, bold, cyan, green, red, yellow, dim,
        print_mutator_report, parse_mutator_args
    )

mod_01 = _load_module("mut_01", "01_plane_restructure_mutator.py")
mod_02 = _load_module("mut_02", "02_section_demarcation_mutator.py")
mod_03 = _load_module("mut_03", "03_token_theme_mutator.py")
mod_04 = _load_module("mut_04", "04_monolith_splitter_mutator.py")

MUTATOR_REGISTRY = {
    "planes": (mod_01.mutate_plane_structure, "Aspect 01: Plane Restructure & Consolidation"),
    "restructure": (mod_01.mutate_plane_structure, "Aspect 01: Plane Restructure & Consolidation"),
    "01": (mod_01.mutate_plane_structure, "Aspect 01: Plane Restructure & Consolidation"),
    "sections": (mod_02.mutate_sections, "Aspect 02: Section Demarcation & ASCII Flowcharts"),
    "banners": (mod_02.mutate_sections, "Aspect 02: Section Demarcation & ASCII Flowcharts"),
    "02": (mod_02.mutate_sections, "Aspect 02: Section Demarcation & ASCII Flowcharts"),
    "tokens": (mod_03.mutate_tokens, "Aspect 03: Design Token & Theme Normalizer"),
    "theme": (mod_03.mutate_tokens, "Aspect 03: Design Token & Theme Normalizer"),
    "03": (mod_03.mutate_tokens, "Aspect 03: Design Token & Theme Normalizer"),
    "split": (mod_04.mutate_monoliths, "Aspect 04: Monolith Decomposer & Line Limits"),
    "monolith": (mod_04.mutate_monoliths, "Aspect 04: Monolith Decomposer & Line Limits"),
    "04": (mod_04.mutate_monoliths, "Aspect 04: Monolith Decomposer & Line Limits")
}

def mutate_all_aspects(target_path: Path, params: Dict[str, Any]) -> MutatorResult:
    """Executes all mutators sequentially to auto-remediate an entire codebase."""
    start_time = time.time()
    all_actions: List[MutationAction] = []
    all_messages: List[str] = []

    for name, (mutator_fn, title) in [
        ("planes", (mod_01.mutate_plane_structure, "Planes")),
        ("split", (mod_04.mutate_monoliths, "Monoliths")),
        ("tokens", (mod_03.mutate_tokens, "Tokens")),
        ("sections", (mod_02.mutate_sections, "Sections"))
    ]:
        res = mutator_fn(target_path, params)
        all_actions.extend(res.actions)
        all_messages.extend(res.messages)

    duration = (time.time() - start_time) * 1000
    return MutatorResult(
        mutator_id="all_mutators",
        mutator_title="Full Autonomous Remediator Pipeline",
        success=True,
        target_path=str(target_path),
        actions=all_actions,
        messages=all_messages,
        duration_ms=duration
    )

def print_catalog():
    print("\n" + bold("=" * 80))
    print(f"  {bold('SKIPO CODEBASE MUTATORS CATALOG')}")
    print(bold("=" * 80))
    print(f"  {'Action / Alias':<26} {'Script File':<34} {'Description'}")
    print(dim("-" * 80))
    
    entries = [
        ("planes / restructure (01)", "01_plane_restructure_mutator.py", "Consolidate flat monolith into src/frontend & src/backend"),
        ("sections / banners (02)", "02_section_demarcation_mutator.py", "Inject // ════ banners and ASCII flowchart docblocks"),
        ("tokens / theme (03)", "03_token_theme_mutator.py", "Replace hardcoded #hex/rgb with var(--skipo-*) tokens"),
        ("split / monolith (04)", "04_monolith_splitter_mutator.py", "Split files >200L into submodules + barrel facade"),
        ("all / remediate", "mutate.py all", "Run all mutators sequentially to auto-remediate")
    ]

    for key, script, desc in entries:
        print(f"  {cyan(key):<35} {script:<34} {desc}")
    print(bold("=" * 80) + "\n")

def main():
    parser = argparse.ArgumentParser(description="Skipo Master Mutator Dispatcher")
    parser.add_argument("action", nargs="?", default="", help="Mutator action (e.g. planes, tokens, sections, split, all)")
    parser.add_argument("target_path", nargs="?", default=".", help="Target file or directory to mutate")
    parser.add_argument("--list", "-l", action="store_true", help="List all available mutators")
    parser.add_argument("--dry-run", action="store_true", help="Preview mutations without writing to disk")
    parser.add_argument("--backup", "-b", action="store_true", help="Create .bak backups before overwriting")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show full diffs")

    args, unknown = parser.parse_known_args()

    if args.list or not args.action:
        print_catalog()
        sys.exit(0)

    action_key = args.action.lower()
    target_path = Path(args.target_path).resolve()

    params = {
        "target_path": str(target_path),
        "dry_run": args.dry_run,
        "backup": args.backup,
        "json": args.json,
        "verbose": args.verbose
    }

    if action_key in ["all", "remediate"]:
        result = mutate_all_aspects(target_path, params)
    elif action_key in MUTATOR_REGISTRY:
        mutator_fn, title = MUTATOR_REGISTRY[action_key]
        result = mutator_fn(target_path, params)
    else:
        print(red(f"Unknown mutator action: '{args.action}'. Run with '--list' to inspect available mutators."), file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_mutator_report(result, verbose=args.verbose)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
