#!/usr/bin/env python3
import sys
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
skipo_assistant = HERE.parent / "Skipo" / "assistant.py"
if not skipo_assistant.exists():
    skipo_assistant = HERE / "Skipo" / "assistant.py"

if __name__ == "__main__":
    result = subprocess.run([sys.executable, str(skipo_assistant)] + sys.argv[1:])
    sys.exit(result.returncode)
