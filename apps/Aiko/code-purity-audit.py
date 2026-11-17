#!/usr/bin/env python3
import sys
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
skipo_audit = HERE / "Skipo" / "code-purity-audit.py"

if __name__ == "__main__":
    result = subprocess.run([sys.executable, str(skipo_audit)] + sys.argv[1:])
    sys.exit(result.returncode)
