#!/usr/bin/env python3
"""Static architecture checks for the Aiko Skipo application."""

from pathlib import Path
import sys

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".")

required = [
    ".skipo/project.json",
    "src/frontend/pages/auth/page.tsx",
    "src/frontend/pages/menus/workspaces/page.tsx",
    "src/frontend/pages/main/page.tsx",
    "src/frontend/pages/settings/page.tsx",
    "src/frontend/pages/settings/tabs/themes/page.tsx",
    "src/frontend/pages/settings/tabs/accounts/page.tsx",
]

for rel in required:
    if not (ROOT / rel).is_file():
        raise SystemExit(f"missing required Skipo path: {rel}")

if (ROOT / "src/libraries/skipo").exists():
    raise SystemExit("embedded Skipo library remains")

for forbidden in (".aiko_vault", "docustack_vault"):
    if (ROOT / forbidden).exists():
        raise SystemExit(f"runtime/credential vault is tracked: {forbidden}")

backend_markers = ("src/backend/", "../backend/", "../../backend/")
violations = []
import_re = __import__("re").compile(r"^\\s*import(?!\\s+type\\b)[^;]*from\\s+[\"']([^\"']*backend/[^\"']*)[\"']", __import__("re").MULTILINE)
for path in (ROOT / "src/frontend").rglob("*"):
    if path.is_file() and path.suffix in {".ts", ".tsx"}:
        text = path.read_text(encoding="utf-8", errors="ignore")
        if import_re.search(text):
            violations.append(str(path))
if violations:
    print("frontend/backend implementation boundary violations:")
    for violation in violations:
        print(f" - {violation}")
    raise SystemExit(1)

settings = (ROOT / "src/frontend/pages/settings/page.tsx").read_text(encoding="utf-8")
for marker in ("LOCAL_VAULT", "Skipo Unified Local System DB", "latencyMs || 8", "AES-256"):
    if marker in settings:
        raise SystemExit(f"fake/default live system value remains in settings: {marker}")

print("Aiko Skipo architecture validation: PASS")
