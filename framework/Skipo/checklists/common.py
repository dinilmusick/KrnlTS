"""
checklists/common.py - Shared infrastructure for Skipo Dynamic Checklist Validators.
Pure Python 3 standard library ONLY - zero pip dependencies.
Compatible with Google AI Studio Code Execution, Project IDX, macOS, Linux, and Windows.
"""

from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
import argparse
import json
import os
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
class Violation:
    rule_id: str
    severity: str  # "error", "warning", "info"
    message: str
    file_path: str
    line: Optional[int] = None
    column: Optional[int] = None
    snippet: Optional[str] = None
    suggestion: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}

@dataclass
class ChecklistResult:
    aspect_id: str
    aspect_title: str
    passed: bool
    violations: List[Violation] = field(default_factory=list)
    files_scanned: int = 0
    duration_ms: float = 0.0
    score: float = 100.0  # 0.0 to 100.0%

    @property
    def error_count(self) -> int:
        return sum(1 for v in self.violations if v.severity == "error")

    @property
    def warning_count(self) -> int:
        return sum(1 for v in self.violations if v.severity == "warning")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "aspect_id": self.aspect_id,
            "aspect_title": self.aspect_title,
            "passed": self.passed,
            "error_count": self.error_count,
            "warning_count": self.warning_count,
            "score": round(self.score, 1),
            "files_scanned": self.files_scanned,
            "duration_ms": round(self.duration_ms, 2),
            "violations": [v.to_dict() for v in self.violations]
        }

# ══════════════════════════════════════════════════════════════════════════════
# REPOSITORY SCANNER & FILE WALKER
# ══════════════════════════════════════════════════════════════════════════════
DEFAULT_IGNORE_DIRS: Set[str] = {
    "node_modules", "dist", ".next", ".turbo", "build", "out",
    ".git", ".system_generated", "coverage", ".cache", "tmp", "Skipo",
    "scaffolds", "scaffold"
}

def scan_files(
    root_dir: Path,
    extensions: Set[str],
    ignore_dirs: Optional[Set[str]] = None,
    max_files: int = 5000
) -> List[Path]:
    """Walk directory recursively returning files matching extensions while skipping ignored dirs."""
    ignores = ignore_dirs or DEFAULT_IGNORE_DIRS
    matched: List[Path] = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune ignored directories in-place
        dirnames[:] = [d for d in dirnames if d not in ignores and not d.startswith('.')]
        
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext in extensions or fname in extensions:
                matched.append(Path(dirpath) / fname)
                if len(matched) >= max_files:
                    return matched
                    
    return matched

def read_text_safe(file_path: Path) -> Optional[str]:
    """Safely read text file with utf-8 fallback to latin-1."""
    try:
        return file_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return None

# ══════════════════════════════════════════════════════════════════════════════
# FORMATTED OUTPUT REPORTERS
# ══════════════════════════════════════════════════════════════════════════════
def print_checklist_report(result: ChecklistResult, verbose: bool = False) -> None:
    """Pretty-print a checklist result to terminal."""
    status_str = green("✔ PASSED") if result.passed else red("✖ FAILED")
    score_color = green if result.score >= 90 else (yellow if result.score >= 70 else red)
    
    print("\n" + bold("=" * 80))
    print(f"  {bold(result.aspect_id.upper())}: {result.aspect_title}")
    print(bold("=" * 80))
    print(f"  Status: {status_str} | Score: {score_color(f'{result.score:.1f}%')} | "
          f"Errors: {result.error_count} | Warnings: {result.warning_count} | "
          f"Files Scanned: {result.files_scanned} | Time: {result.duration_ms:.1f}ms")
    print(dim("-" * 80))

    if not result.violations:
        print(green("  ✨ No violations found! Full compliance confirmed.\n"))
        return

    # Group violations by file
    by_file: Dict[str, List[Violation]] = {}
    for v in result.violations:
        by_file.setdefault(v.file_path, []).append(v)

    for fpath, viols in by_file.items():
        print(f"\n  {bold(cyan(fpath))}:")
        for v in viols:
            icon = red("  ✖ [ERROR]") if v.severity == "error" else yellow("  ⚠ [WARN]")
            loc = f" line {v.line}" if v.line else ""
            print(f"    {icon} {bold(v.rule_id)}{loc}: {v.message}")
            if v.snippet:
                print(f"       {dim('Snippet:')} {dim(v.snippet.strip())}")
            if v.suggestion:
                print(f"       {cyan('Fix:')} {v.suggestion}")
    print()

def parse_standard_args(description: str) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("path", nargs="?", default=".", help="Target directory to scan (default: current directory)")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show verbose debugging information")
    return parser.parse_args()
