#!/usr/bin/env python3
"""Aspect 19: Canonical provider-neutral Skipo application frontend structure."""

from pathlib import Path
import json
import time
import sys

try:
    from .common import Violation, ChecklistResult, parse_standard_args, print_checklist_report
except ImportError:
    try:
        from common import Violation, ChecklistResult, parse_standard_args, print_checklist_report
    except ImportError:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from common import Violation, ChecklistResult, parse_standard_args, print_checklist_report

ASPECT_ID = "aspect_19_skipo_frontend_structure"
ASPECT_TITLE = "Skipo Frontend Structure"

REQUIRED_FILES = (
    "src/frontend/pages/auth/page.tsx",
    "src/frontend/pages/menus/workspaces/page.tsx",
    "src/frontend/pages/main/page.tsx",
    "src/frontend/pages/settings/page.tsx",
    "src/frontend/pages/settings/tabs/themes/page.tsx",
    "src/frontend/pages/settings/tabs/accounts/page.tsx",
)

REQUIRED_DIRS = ("src/frontend/pages/main/tabs",)
ALLOWED_PAGE_ROOTS = {"auth", "menus", "main", "settings"}
FORBIDDEN_APP_TABS = ("fo" + "d", "ai" + "ko")


def validate_skipo_frontend_structure(root_dir: Path) -> ChecklistResult:
    start = time.time()
    violations = []
    package_path = root_dir / "package.json"

    if not package_path.exists():
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, True, [], 0, (time.time() - start) * 1000, 100.0)

    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
    except Exception as exc:
        violations.append(Violation("skipo-package-invalid", "error", f"Unable to parse package.json: {exc}", "package.json"))
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, False, violations, 1, (time.time() - start) * 1000, 0.0)

    if "skipo" not in package:
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, True, [], 1, (time.time() - start) * 1000, 100.0)

    # Vite applications have one canonical frontend bootstrap inside the frontend plane.
    is_vite = (root_dir / "vite.config.ts").is_file() or (root_dir / "vite.config.js").is_file()
    if is_vite:
        entrypoint = root_dir / "src" / "frontend" / "main.tsx"
        index_html = root_dir / "index.html"
        if not entrypoint.is_file():
            violations.append(Violation(
                "missing-skipo-vite-frontend-entrypoint", "error",
                "Vite Skipo applications must provide src/frontend/main.tsx as the canonical browser bootstrap.",
                "src/frontend/main.tsx",
                suggestion="Keep the React bootstrap inside src/frontend/; do not add a parallel src/main.tsx entrypoint."
            ))
        if not index_html.is_file() or "/src/frontend/main.tsx" not in index_html.read_text(encoding="utf-8", errors="ignore"):
            violations.append(Violation(
                "noncanonical-skipo-vite-entry-reference", "error",
                "Root index.html must load /src/frontend/main.tsx.",
                "index.html",
                suggestion="Point the Vite module script at /src/frontend/main.tsx."
            ))

    pages = root_dir / "src" / "frontend" / "pages"
    for rel in REQUIRED_DIRS:
        if not (root_dir / rel).is_dir():
            violations.append(Violation("missing-skipo-page-directory", "error", f"Missing mandatory Skipo frontend directory: {rel}", rel))
    for rel in REQUIRED_FILES:
        if not (root_dir / rel).is_file():
            violations.append(Violation("missing-skipo-page", "error", f"Missing mandatory Skipo frontend page: {rel}", rel))

    if pages.is_dir():
        for entry in pages.iterdir():
            if entry.is_file():
                violations.append(Violation(
                    "loose-skipo-page-file", "error",
                    "src/frontend/pages must contain only the canonical page directories.",
                    str(entry.relative_to(root_dir)),
                    suggestion="Move application UI behind auth/, menus/, main/, or settings/."
                ))
            elif entry.is_dir() and entry.name not in ALLOWED_PAGE_ROOTS:
                violations.append(Violation(
                    "invalid-skipo-page-root", "error",
                    f"Non-canonical page root '{entry.name}' found under src/frontend/pages.",
                    str(entry.relative_to(root_dir)),
                    suggestion="Use auth/, menus/, main/, or settings/."
                ))

    tabs = pages / "main" / "tabs"
    if tabs.is_dir():
        for forbidden in FORBIDDEN_APP_TABS:
            if (tabs / forbidden).exists():
                violations.append(Violation(
                    "forbidden-application-tab", "error",
                    "Generic Skipo scaffolds must not contain application-specific tabs.",
                    str((tabs / forbidden).relative_to(root_dir)),
                    suggestion="Keep application-specific workflows in their own application."
                ))

    main_page = pages / "main" / "page.tsx"
    if main_page.exists():
        text = main_page.read_text(encoding="utf-8", errors="ignore").lower()
        if "immersive" not in text and "fullscreen" not in text:
            violations.append(Violation(
                "missing-main-immersive-mode", "error",
                "Main page must expose application-level immersive/fullscreen mode.",
                str(main_page.relative_to(root_dir)),
                suggestion="Implement a shell toggle that removes the Main top and bottom bars while preserving tab content."
            ))

    accounts_page = pages / "settings" / "tabs" / "accounts" / "page.tsx"
    if accounts_page.exists():
        text = accounts_page.read_text(encoding="utf-8", errors="ignore").lower()
        if "account" not in text and "connection" not in text:
            violations.append(Violation(
                "missing-settings-account-connections", "error",
                "Accounts tab must provide a provider-neutral account-connections surface.",
                str(accounts_page.relative_to(root_dir)),
                suggestion="Expose account connections without assuming a particular application or storage provider."
            ))

    files_scanned = len(REQUIRED_FILES) + len(REQUIRED_DIRS)
    errors = sum(v.severity == "error" for v in violations)
    score = max(0.0, 100.0 - errors * 20.0)
    return ChecklistResult(ASPECT_ID, ASPECT_TITLE, errors == 0, violations, files_scanned, (time.time() - start) * 1000, score)


if __name__ == "__main__":
    args = parse_standard_args("Aspect 19: Canonical Skipo application frontend structure")
    result = validate_skipo_frontend_structure(Path(args.path).resolve())
    print_checklist_report(result, verbose=args.verbose)
    raise SystemExit(0 if result.passed else 1)
