"""
generators/common.py - Shared infrastructure for Skipo Deterministic Code Generators.
Pure Python 3 standard library ONLY - zero pip dependencies.
Compatible with Google AI Studio Code Execution, Project IDX, macOS, Linux, and Windows.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional
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
class GeneratedFile:
    relative_path: str
    content: str
    description: str = ""
    lines: int = 0

    def __post_init__(self):
        if not self.lines:
            self.lines = len(self.content.splitlines())

@dataclass
class GeneratorResult:
    generator_id: str
    generator_title: str
    success: bool
    target_directory: str
    files: List[GeneratedFile] = field(default_factory=list)
    messages: List[str] = field(default_factory=list)
    duration_ms: float = 0.0

    @property
    def total_lines(self) -> int:
        return sum(f.lines for f in self.files)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "generator_id": self.generator_id,
            "generator_title": self.generator_title,
            "success": self.success,
            "target_directory": self.target_directory,
            "file_count": len(self.files),
            "total_lines": self.total_lines,
            "duration_ms": round(self.duration_ms, 2),
            "files": [
                {
                    "relative_path": f.relative_path,
                    "description": f.description,
                    "lines": f.lines
                } for f in self.files
            ],
            "messages": self.messages
        }

# ══════════════════════════════════════════════════════════════════════════════
# FORMATTING & DOCUMENTATION HELPERS
# ══════════════════════════════════════════════════════════════════════════════
def section_header(title: str, width: int = 80) -> str:
    """Generate a standard Skipo bold Unicode section demarcation border."""
    fill_len = max(2, width - len(title) - 4)
    line = "═" * fill_len
    return f"// ════ {title.upper()} {line}"

def generate_ascii_flowchart(title: str, steps: List[str]) -> str:
    """Generate a clean, standard ASCII flowchart block for JSDoc docblocks."""
    if not steps:
        return ""
    
    max_len = max(len(s) for s in steps)
    box_width = max(max_len + 4, len(title) + 6, 32)

    lines = ["/**", f" * ASCII Architecture Flowchart: {title}", " *"]
    top_border = "┌" + ("─" * (box_width - 2)) + "┐"
    bot_border = "└" + ("─" * (box_width - 2)) + "┘"

    for i, step in enumerate(steps):
        padded = step.center(box_width - 2)
        lines.append(f" *   {top_border}")
        lines.append(f" *   │{padded}│")
        lines.append(f" *   {bot_border}")
        if i < len(steps) - 1:
            arrow_pad = " " * ((box_width // 2) - 1)
            lines.append(f" *   {arrow_pad}│")
            lines.append(f" *   {arrow_pad}▼")

    lines.append(" */")
    return "\n".join(lines)

# ══════════════════════════════════════════════════════════════════════════════
# SAFE DIRECTORY & FILE EMITTER
# ══════════════════════════════════════════════════════════════════════════════
def emit_directory(
    target_dir: Path,
    files: List[GeneratedFile],
    dry_run: bool = False,
    force: bool = False
) -> GeneratorResult:
    """Write an entire directory tree of files safely with overwrite guards."""
    start_time = time.time()
    messages: List[str] = []

    if not dry_run:
        target_dir.mkdir(parents=True, exist_ok=True)

    for gen_file in files:
        file_path = target_dir / gen_file.relative_path
        if file_path.exists() and not force:
            messages.append(f"Skipped existing file (use --force to overwrite): {gen_file.relative_path}")
            continue

        if dry_run:
            messages.append(f"[DRY RUN] Would write {gen_file.relative_path} ({gen_file.lines} lines)")
        else:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(gen_file.content, encoding="utf-8")
            messages.append(f"Created {gen_file.relative_path} ({gen_file.lines} lines)")

    duration = (time.time() - start_time) * 1000
    return GeneratorResult(
        generator_id="emitter",
        generator_title="Directory Emitter",
        success=True,
        target_directory=str(target_dir),
        files=files,
        messages=messages,
        duration_ms=duration
    )

# ══════════════════════════════════════════════════════════════════════════════
# PARAMETER PARSER (CLI + JSON CONFIG / STDIN)
# ══════════════════════════════════════════════════════════════════════════════
def parse_generator_args(description: str) -> Dict[str, Any]:
    """
    Parse arguments supporting CLI flags, JSON string (--params),
    config file (--config), and standard input (-).
    """
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("target_path", nargs="?", default="", help="Target output path or directory")
    parser.add_argument("--name", "-n", type=str, default="", help="Artifact name (Component, Entity, Service, etc.)")
    parser.add_argument("--type", "-t", type=str, default="default", help="Type or sub-variant of generator")
    parser.add_argument("--params", "-p", type=str, default="", help="JSON string of detailed custom parameters")
    parser.add_argument("--config", "-c", type=str, default="", help="Path to JSON configuration file")
    parser.add_argument("--dry-run", action="store_true", help="Preview generated files without writing to disk")
    parser.add_argument("--force", "-f", action="store_true", help="Overwrite existing files if they exist")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON summary")
    parser.add_argument("--env", type=str, default="standard", choices=["standard", "nextjs", "vite", "electron", "monorepo"], help="Target development environment")
    
    args, unknown = parser.parse_known_args()

    data: Dict[str, Any] = {
        "target_path": args.target_path,
        "name": args.name,
        "type": args.type,
        "dry_run": args.dry_run,
        "force": args.force,
        "json": args.json,
        "env": args.env,
        "custom": {}
    }

    # Load from config file if provided
    if args.config:
        cfg_path = Path(args.config)
        if cfg_path.exists():
            try:
                cfg_data = json.loads(cfg_path.read_text(encoding="utf-8"))
                if isinstance(cfg_data, dict):
                    data["custom"].update(cfg_data)
                    if not data["name"] and "name" in cfg_data:
                        data["name"] = cfg_data["name"]
                    if not data["target_path"] and "target_path" in cfg_data:
                        data["target_path"] = cfg_data["target_path"]
            except Exception as e:
                print(red(f"Error reading config file: {e}"), file=sys.stderr)

    # Load from inline JSON string if provided
    if args.params:
        try:
            param_data = json.loads(args.params)
            if isinstance(param_data, dict):
                data["custom"].update(param_data)
        except Exception as e:
            print(red(f"Error parsing --params JSON: {e}"), file=sys.stderr)

    # Check stdin if target_path is '-' or piped input available
    if args.target_path == "-" or (not sys.stdin.isatty() and not args.params and not args.config):
        try:
            stdin_content = sys.stdin.read().strip()
            if stdin_content and stdin_content.startswith("{"):
                stdin_data = json.loads(stdin_content)
                if isinstance(stdin_data, dict):
                    data["custom"].update(stdin_data)
                    if not data["name"] and "name" in stdin_data:
                        data["name"] = stdin_data["name"]
                    if (not data["target_path"] or data["target_path"] == "-") and "target_path" in stdin_data:
                        data["target_path"] = stdin_data["target_path"]
        except Exception:
            pass

    return data

# ══════════════════════════════════════════════════════════════════════════════
# FORMATTED OUTPUT REPORTERS
# ══════════════════════════════════════════════════════════════════════════════
def print_generator_report(result: GeneratorResult) -> None:
    """Pretty-print a generator execution summary."""
    status_str = green("✔ COMPLETED") if result.success else red("✖ FAILED")
    
    print("\n" + bold("=" * 80))
    print(f"  GENERATOR: {bold(result.generator_title)}")
    print(bold("=" * 80))
    print(f"  Target: {cyan(result.target_directory)}")
    print(f"  Status: {status_str} | Files: {len(result.files)} | Total Lines: {result.total_lines} | Time: {result.duration_ms:.1f}ms")
    print(dim("-" * 80))

    for f in result.files:
        line_info = green(f"{f.lines}L") if f.lines <= 200 else red(f"{f.lines}L (LIMIT BREACH)")
        print(f"  📄 {bold(f.relative_path)} [{line_info}] {dim('- ' + f.description if f.description else '')}")

    if result.messages:
        print(dim("-" * 80))
        for msg in result.messages:
            print(f"  ℹ {dim(msg)}")
    print()
