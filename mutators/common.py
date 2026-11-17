"""
mutators/common.py - Shared infrastructure for Skipo Codebase Mutators.
Pure Python 3 standard library ONLY - zero pip dependencies.
Compatible with Google AI Studio Code Execution, Project IDX, macOS, Linux, and Windows.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Set
import argparse
import difflib
import json
import os
import re
import sys
import time

# ══════════════════════════════════════════════════════════════════════════════
# ANSI COLOR CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════
USE_COLOR = sys.stdout.isatty() and (os.name != 'nt' or 'TERM' in os.environ)

def _c(code: str, text: str) -> str:
    return f"{code}{text}\033[0m" if USE_COLOR else text

def red(text: str) -> str: return _c("\033[91m", text)
def green(text: str) -> str: return _c("\033[92m", text)
def yellow(text: str) -> str: return _c("\033[93m", text)
def blue(text: str) -> str: return _c("\033[94m", text)
def magenta(text: str) -> str: return _c("\033[95m", text)
def cyan(text: str) -> str: return _c("\033[96m", text)
def bold(text: str) -> str: return _c("\033[1m", text)
def dim(text: str) -> str: return _c("\033[2m", text)

# ══════════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ══════════════════════════════════════════════════════════════════════════════
@dataclass
class MutationAction:
    action_type: str # "move", "rewrite", "insert", "delete"
    source_path: str
    target_path: Optional[str] = None
    description: str = ""
    diff: Optional[str] = None

@dataclass
class MutatorResult:
    mutator_id: str
    mutator_title: str
    success: bool
    target_path: str
    actions: List[MutationAction] = field(default_factory=list)
    messages: List[str] = field(default_factory=list)
    duration_ms: float = 0.0

    @property
    def action_count(self) -> int:
        return len(self.actions)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mutator_id": self.mutator_id,
            "mutator_title": self.mutator_title,
            "success": self.success,
            "target_path": self.target_path,
            "action_count": self.action_count,
            "duration_ms": round(self.duration_ms, 2),
            "actions": [
                {
                    "type": a.action_type,
                    "source": a.source_path,
                    "target": a.target_path,
                    "description": a.description
                } for a in self.actions
            ],
            "messages": self.messages
        }

# ══════════════════════════════════════════════════════════════════════════════
# SAFE FILE REWRITER & DIFF GENERATOR
# ══════════════════════════════════════════════════════════════════════════════
def rewrite_file_safe(
    file_path: Path,
    new_content: str,
    dry_run: bool = False,
    backup: bool = False
) -> Tuple[bool, Optional[str]]:
    """Safely rewrites a file with optional diff output and backup."""
    if not file_path.exists():
        if not dry_run:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(new_content, encoding="utf-8")
        return True, None

    old_content = file_path.read_text(encoding="utf-8", errors="replace")
    if old_content == new_content:
        return False, None

    # Generate unified diff
    diff_lines = list(difflib.unified_diff(
        old_content.splitlines(),
        new_content.splitlines(),
        fromfile=str(file_path),
        tofile=str(file_path),
        lineterm=""
    ))
    diff_text = "\n".join(diff_lines) if diff_lines else None

    if not dry_run:
        if backup:
            bak_path = file_path.with_suffix(file_path.suffix + ".bak")
            bak_path.write_text(old_content, encoding="utf-8")
        file_path.write_text(new_content, encoding="utf-8")

    return True, diff_text

# ══════════════════════════════════════════════════════════════════════════════
# SECTION HEADER & BORDER BUILDERS
# ══════════════════════════════════════════════════════════════════════════════
def section_border(title: str, width: int = 80) -> str:
    """Standard Skipo bold Unicode section demarcation border."""
    fill_len = max(2, width - len(title) - 4)
    line = "═" * fill_len
    return f"// ════ {title.upper()} {line}"

# ══════════════════════════════════════════════════════════════════════════════
# PARAMETER PARSER (CLI + JSON CONFIG)
# ══════════════════════════════════════════════════════════════════════════════
def parse_mutator_args(description: str) -> Dict[str, Any]:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("target_path", nargs="?", default=".", help="Target file or directory to mutate")
    parser.add_argument("--dry-run", action="store_true", help="Preview mutations without writing changes to disk")
    parser.add_argument("--backup", "-b", action="store_true", help="Create .bak backups before overwriting files")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON summary")
    parser.add_argument("--params", "-p", type=str, default="", help="JSON parameter string")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show full diffs")

    args, unknown = parser.parse_known_args()

    data = {
        "target_path": args.target_path,
        "dry_run": args.dry_run,
        "backup": args.backup,
        "json": args.json,
        "verbose": args.verbose,
        "custom": {}
    }

    if args.params:
        try:
            data["custom"].update(json.loads(args.params))
        except Exception:
            pass

    return data

# ══════════════════════════════════════════════════════════════════════════════
# FORMATTED OUTPUT REPORTERS
# ══════════════════════════════════════════════════════════════════════════════
def print_mutator_report(result: MutatorResult, verbose: bool = False) -> None:
    status_str = green("✔ MUTATIONS APPLIED") if result.success else red("✖ FAILED")
    
    print("\n" + bold("=" * 80))
    print(f"  MUTATOR: {bold(result.mutator_title)}")
    print(bold("=" * 80))
    print(f"  Target: {cyan(result.target_path)}")
    print(f"  Status: {status_str} | Actions: {result.action_count} | Time: {result.duration_ms:.1f}ms")
    print(dim("-" * 80))

    for a in result.actions:
        icon = green("  ✔ [MUTATE]") if a.action_type in ["rewrite", "insert"] else cyan("  ➜ [MOVE]")
        target_str = f" ➜ {a.target_path}" if a.target_path else ""
        print(f"{icon} {bold(a.source_path)}{target_str}: {dim(a.description)}")
        if verbose and a.diff:
            print(dim("\n    " + "\n    ".join(a.diff.splitlines()[:20])))
            print()

    if result.messages:
        print(dim("-" * 80))
        for msg in result.messages:
            print(f"  ℹ {dim(msg)}")
    print()
