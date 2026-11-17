#!/usr/bin/env python3
"""Aspect 27: Guest-mode contract governance.

Invariant: Guest access is standard access in a reduced state with no persistent workspace.
There are NO extra code assets like separate UIs or separate backend lease systems.
"Continue as guest" (onContinueAsGuest on LuthAuthPage / LoginGate) is the ONLY extra UI for it.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SOURCE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
BANNED_GUEST_UI_FILES = ("GuestAccessGate.tsx", "GuestAccessGate.js")
BANNED_GUEST_DIRS = ("src/guest", "src/backend/guest")
BANNED_GUEST_ENDPOINTS = ("/api/guest/lease", "/api/auth/guest/session", "/api/auth/guest/status")


def source_files(root: Path):
    for base in (root / "src", root / "app", root / "scaffolds" / "nextjs", root / "scaffolds" / "vite"):
        if not base.exists():
            continue
        yield from (p for p in base.rglob("*") if p.is_file() and p.suffix.lower() in SOURCE_SUFFIXES)


def validate_guest_contract(root: Path) -> list[str]:
    errors: list[str] = []

    # 1. Banned separate guest UI components & directories
    for banned in BANNED_GUEST_UI_FILES:
        for found in root.rglob(banned):
            if "node_modules" not in found.parts and ".git" not in found.parts:
                errors.append(f"separate guest UI asset is forbidden: {found.relative_to(root)}")

    for banned_dir in BANNED_GUEST_DIRS:
        target_dir = root / banned_dir
        if target_dir.is_dir():
            errors.append(f"separate guest subsystem directory is forbidden: {banned_dir}")

    # Check scaffolds for separate guest directories
    for scaffold in ("scaffolds/nextjs", "scaffolds/vite"):
        scaffold_guest = root / scaffold / "src/backend/guest"
        if scaffold_guest.is_dir():
            errors.append(f"scaffold separate guest backend directory is forbidden: {scaffold_guest.relative_to(root)}")

    # 2. Check login/auth gates expose guest via onContinueAsGuest only (no separate UI components)
    for relative in (
        "scaffolds/nextjs/app/login/page.tsx",
        "scaffolds/vite/src/frontend/components/gates/LoginGate.tsx",
    ):
        path = root / relative
        if path.is_file():
            source = path.read_text(encoding="utf-8", errors="replace")
            if "onContinueAsGuest" not in source:
                errors.append(f"{relative} does not wire onContinueAsGuest")
            if "GuestAccessGate" in source:
                errors.append(f"{relative} must not use separate GuestAccessGate UI")

    # 3. Ensure no separate guest lease endpoints or identity synthesis
    for path in source_files(root):
        source = path.read_text(encoding="utf-8", errors="replace")
        for endpoint in BANNED_GUEST_ENDPOINTS:
            if endpoint in source:
                errors.append(f"separate guest endpoint reference is forbidden ({endpoint}): {path.relative_to(root)}")

        is_guest_scoped = "guest" in path.name.lower() or "/guest/" in path.as_posix().lower()
        if "x-user-id" in source and (is_guest_scoped or re.search(r'["\']x-user-id["\']\s*:\s*["\']guest', source, re.IGNORECASE)):
            errors.append(f"guest-aware source must not synthesize x-user-id: {path.relative_to(root)}")
        if "AuthServiceFacade" in source and "LuthAuthServiceFacade" not in source:
            errors.append(f"legacy local AuthServiceFacade reference: {path.relative_to(root)}")

    return errors


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors = validate_guest_contract(root)
    if errors:
        for error in errors:
            print("GUEST CONTRACT VIOLATION:", error, file=sys.stderr)
        return 1
    print("Guest reduced-state and single-entrypoint contract: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
