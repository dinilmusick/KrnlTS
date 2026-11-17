#!/usr/bin/env python3
"""
Aspect 05: Real Data & Anti-Placeholder Invariant (Zero-Mock)
Verifies:
- Absolute Ban on Placeholder Tokens ("placeholder", "lorem ipsum", "mock", "dummy", "test user", "sample item")
- Ban on Static Dummy Arrays Simulating Tables ([{ id: 1, name: "..." }])
- Mandate for Real API/DB Queries or Explicit @skipo/ui <EmptyState>
"""

from pathlib import Path
import re
import sys
import time

try:
    from .common import (
        Violation, ChecklistResult, scan_files, read_text_safe,
        print_checklist_report, parse_standard_args
    )
except ImportError:
    from common import (
        Violation, ChecklistResult, scan_files, read_text_safe,
        print_checklist_report, parse_standard_args
    )

ASPECT_ID = "aspect_05_real_data_anti_mock"
ASPECT_TITLE = "Real Data & Anti-Placeholder Invariant (Zero-Mock)"

BANNED_LITERAL_PATTERNS = [
    (re.compile(r'["\']lorem ipsum', re.IGNORECASE), "Banned placeholder text 'lorem ipsum' detected."),
    (re.compile(r'["\']mock[-_\s]?(data|user|item|response|event)', re.IGNORECASE), "Banned mock identifier/token detected."),
    (re.compile(r'["\']dummy[-_\s]?(data|user|item|value|record)', re.IGNORECASE), "Banned dummy identifier/token detected."),
    (re.compile(r'["\']sample[-_\s]?(item|user|product|event)', re.IGNORECASE), "Banned sample data literal detected."),
    (re.compile(r'["\']test\s+user["\']', re.IGNORECASE), "Banned dummy user token 'test user' detected.")
]

# Pattern detecting hardcoded dummy data arrays like: const data = [{ id: 1, name: ... }]
DUMMY_ARRAY_REGEX = re.compile(
    r'(?:const|let|var)\s+[a-zA-Z0-9_]+\s*=\s*\[\s*\{\s*(?:id|name|title)\s*:\s*[\'"]?[0-9a-zA-Z_\s]+[\'"]?'
)

def validate_real_data(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []

    files = scan_files(root_dir, {".ts", ".tsx", ".js", ".jsx"})
    files_scanned = len(files)

    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        fname = file_path.name

        # Exclude test files, mocks directories, and documentation
        if ".test." in fname or ".spec." in fname or "__tests__" in str(rel_path) or "mocks" in str(rel_path):
            continue

        content = read_text_safe(file_path)
        if not content:
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines, 1):
            trimmed = line.strip()
            if trimmed.startswith("//") or trimmed.startswith("/*"):
                continue

            for pattern, msg in BANNED_LITERAL_PATTERNS:
                if pattern.search(line):
                    violations.append(Violation(
                        rule_id="banned-placeholder-token",
                        severity="error",
                        message=msg,
                        file_path=str(rel_path),
                        line=line_idx,
                        snippet=trimmed[:100],
                        suggestion="Connect to real database/API query or render @skipo/ui <EmptyState>."
                    ))

            if DUMMY_ARRAY_REGEX.search(line):
                # Ensure it's not inside a configuration list or menu definition
                if "menu" not in fname.lower() and "tab" not in fname.lower() and "route" not in fname.lower():
                    violations.append(Violation(
                        rule_id="hardcoded-dummy-array-simulated-table",
                        severity="warning",
                        message="Hardcoded dummy array detected simulating tabular backend data.",
                        file_path=str(rel_path),
                        line=line_idx,
                        snippet=trimmed[:100],
                        suggestion="Replace with real data fetcher or @skipo/ui <EmptyState> with action button."
                    ))

    duration_ms = (time.time() - start_time) * 1000
    errors = sum(1 for v in violations if v.severity == "error")
    score = max(0.0, 100.0 - (errors * 15.0) - (len(violations) - errors) * 5.0)

    return ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=errors == 0,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=duration_ms,
        score=score
    )

def main():
    args = parse_standard_args("Aspect 05: Real Data & Anti-Placeholder Invariant Validator")
    root_path = Path(args.path).resolve()
    result = validate_real_data(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
