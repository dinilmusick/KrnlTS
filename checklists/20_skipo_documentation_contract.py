#!/usr/bin/env python3
"""Aspect 20: Canonical Skipo documentation contract."""

from pathlib import Path
import sys
import time

try:
    from .common import Violation, ChecklistResult, parse_standard_args, print_checklist_report
except ImportError:
    from common import Violation, ChecklistResult, parse_standard_args, print_checklist_report

ASPECT_ID = "aspect_20_skipo_documentation_contract"
ASPECT_TITLE = "Skipo Documentation Contract"

REQUIRED_FILES = (
    "architecture/app-architecture/SKILL.md",
    "architecture/workspace-architectures/SKILL.md",
    "SKILL.md",
    "README.md",
)

REQUIRED_MARKERS = {
    "architecture/app-architecture/SKILL.md": (
        "SKIPO APPLICATION CONTRACT",
        "assistant.py advise",
        "python3 assistant.py validate .",
        "Workspace Storage Architecture",
    ),
    "architecture/workspace-architectures/SKILL.md": (
        "Unified Workspace & Storage Architecture",
        "Backblaze B2",
        "Google Drive",
        "mermaid",
    ),
    "SKILL.md": (
        "architecture/app-architecture/SKILL.md",
        "BLOCKING VERIFICATION GATE",
    ),
    "README.md": (
        "Canonical Application Contract",
        "architecture/app-architecture/SKILL.md",
        "architecture/workspace-architectures/SKILL.md",
    ),
}

def validate_documentation_contract(root_dir: Path) -> ChecklistResult:
    start = time.time()
    violations = []
    scanned = 0

    for rel in REQUIRED_FILES:
        path = root_dir / rel
        scanned += 1
        if not path.is_file():
            violations.append(Violation(
                "missing-canonical-skipo-doc",
                "error",
                f"Missing canonical Skipo documentation: {rel}",
                rel,
            ))
            continue

        content = path.read_text(encoding="utf-8", errors="ignore")
        for marker in REQUIRED_MARKERS.get(rel, ()):
            if marker not in content:
                violations.append(Violation(
                    "missing-skipo-doc-contract-marker",
                    "error",
                    f"Canonical documentation marker is missing: {marker}",
                    rel,
                ))

    app_doc = root_dir / "architecture/app-architecture/SKILL.md"
    workspace_doc = root_dir / "architecture/workspace-architectures/SKILL.md"
    if app_doc.is_file() and workspace_doc.is_file():
        app_text = app_doc.read_text(encoding="utf-8", errors="ignore")
        workspace_text = workspace_doc.read_text(encoding="utf-8", errors="ignore")
        if "../workspace-architectures/SKILL.md" not in app_text:
            violations.append(Violation(
                "broken-workspace-doc-link",
                "error",
                "The canonical application contract must link to the workspace architecture.",
                str(app_doc.relative_to(root_dir)),
            ))
        if "../app-architecture/SKILL.md" not in workspace_text:
            violations.append(Violation(
                "broken-application-doc-link",
                "error",
                "The workspace architecture must link back to the canonical application contract.",
                str(workspace_doc.relative_to(root_dir)),
            ))

    errors = sum(v.severity == "error" for v in violations)
    score = max(0.0, 100.0 - errors * 20.0)
    return ChecklistResult(
        ASPECT_ID,
        ASPECT_TITLE,
        errors == 0,
        violations,
        scanned,
        (time.time() - start) * 1000,
        score,
    )

if __name__ == "__main__":
    args = parse_standard_args("Aspect 20: Canonical Skipo documentation contract")
    result = validate_documentation_contract(Path(args.path).resolve())
    print_checklist_report(result, verbose=args.verbose)
    raise SystemExit(0 if result.passed else 1)
