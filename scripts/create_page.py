#!/usr/bin/env python3
"""Generate a canonical Skipo page through the Frnl CLI."""

from pathlib import Path
import argparse
import subprocess
import sys


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("page")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    result = subprocess.run(
        ["pnpm", "exec", "frnl", "generate", "page", args.page],
        cwd=root,
        check=False,
    )
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
