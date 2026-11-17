#!/usr/bin/env python3
"""
create_service.py - Skipo Service Installer and Application-Specific Wrapper Generator.
Conforms to the Skipo Builder Package Composition Architecture:
- Discovers and installs canonical services directly from @kloks/* packages.
- Only generates a local application wrapper when explicitly requested (--wrapper).
- Never generates 7-file local service trees duplicating Kloks functionality.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
import argparse
import subprocess
import sys

HERE = Path(__file__).resolve().parent
SKIPO_ROOT = HERE.parent

def main():
    parser = argparse.ArgumentParser(description="Install service from @kloks/* or create an app wrapper")
    parser.add_argument("name", help="Service ID (e.g., auth, storage, workspace, database, gemini)")
    parser.add_argument("--mode", choices=["backend", "fullstack"], default="backend", help="Installation mode")
    parser.add_argument("--wrapper", action="store_true", help="Generate an application-specific custom wrapper")
    parser.add_argument("--dry-run", action="store_true", help="Dry run without mutating source")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    args = parser.parse_args()

    builder_script = HERE / "skipo_builder.py"
    cmd = ["python3", str(builder_script), "install", "service", args.name, "--mode", args.mode]
    if args.dry_run:
        cmd.append("--dry-run")
    if args.json:
        cmd.append("--json")

    res = subprocess.run(cmd, cwd=str(SKIPO_ROOT))
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
