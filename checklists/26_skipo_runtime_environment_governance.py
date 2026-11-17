#!/usr/bin/env python3
"""Aspect 26: hard enforcement of the canonical Skipo environment contract."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from skipo_environment_contract import diagnose, verify
from common import Violation, ChecklistResult, parse_standard_args, print_checklist_report

ASPECT_ID = "26"
ASPECT_TITLE = "Canonical Skipo Environment Contract"


def validate(root: Path) -> ChecklistResult:
    diagnostic = diagnose(root)
    verification = verify(root)
    violations = []
    for finding in diagnostic["findings"]:
        classification = finding["classification"]
        if classification == "explicitly_supported_product_specific":
            continue
        if classification == "canonical":
            continue
        name = finding["variable"]
        if classification == "missing_required":
            message = f"Required canonical environment variable {name} is not declared."
        elif classification == "known_deprecated_alias":
            message = f"Deprecated environment alias {name} must be migrated to {finding['target']}."
        elif classification == "known_obsolete_framework_variable":
            message = f"Obsolete framework variable {name} must be migrated or removed."
        else:
            message = f"Undeclared framework/application environment variable {name} violates the canonical Skipo contract."
        violations.append(Violation(
            rule_id="ENV-001",
            severity="error",
            message=message,
            file_path=finding["path"],
            line=finding.get("line"),
            suggestion="Use only SYSTEM_DATABASE_URL, SYSTEM_DATABASE_URL_2, SYSTEM_DATABASE_URL_3 and APP_URL; declare genuinely product-specific settings in architecture/environment/contract.json.",
        ))
    return ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=verification["ok"],
        violations=violations,
        files_scanned=diagnostic["files_scanned"],
        score=100.0 if verification["ok"] else 0.0,
    )


def main():
    args = parse_standard_args(ASPECT_TITLE)
    result = validate(Path(args.path).resolve())
    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, args.verbose)
    sys.exit(0 if result.passed else 1)


if __name__ == "__main__":
    main()
