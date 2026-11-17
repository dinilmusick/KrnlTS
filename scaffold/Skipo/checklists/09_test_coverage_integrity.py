#!/usr/bin/env python3
"""
Aspect 09: Test Coverage Integrity & Anti-Test-Stub
Verifies:
- Companion Test Invariant: Feature modules and UI components have companion *.test.ts(x) files
- Anti-Test-Stub Invariant: Bans hollow tests (expect(true).toBe(true), 0 assertions, empty it/test bodies)
- Real Operational Assertion Threshold
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

ASPECT_ID = "aspect_09_test_coverage_integrity"
ASPECT_TITLE = "Test Coverage Integrity & Anti-Test-Stub"

# Hollow test assertion pattern
TRIVIAL_ASSERTION_REGEX = re.compile(
    r'expect\s*\(\s*(?:true|false|1|0|null|undefined)\s*\)\s*\.(?:toBe|toEqual)\s*\(\s*(?:true|false|1|0|null|undefined)\s*\)'
)

# Empty test block
EMPTY_TEST_BLOCK_REGEX = re.compile(
    r'(?:it|test)\s*\(\s*["\'][^"\']+["\']\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{\s*\}\s*\)'
)

def validate_test_integrity(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []

    # 1. Scan test files for hollow stubs
    test_files = scan_files(root_dir, {".ts", ".tsx", ".js", ".jsx"})
    test_files_scanned = 0

    all_test_basenames = set()

    for file_path in test_files:
        rel_str = str(file_path.relative_to(root_dir))
        fname = file_path.name

        is_test_file = ".test." in fname or ".spec." in fname or "__tests__" in rel_str

        if is_test_file:
            test_files_scanned += 1
            # Record base name without .test/.spec for companion matching
            base_clean = fname.replace(".test.", ".").replace(".spec.", ".")
            all_test_basenames.add(base_clean)

            content = read_text_safe(file_path)
            if not content:
                continue

            lines = content.splitlines()

            # Check for empty test blocks
            for match in EMPTY_TEST_BLOCK_REGEX.finditer(content):
                violations.append(Violation(
                    rule_id="empty-test-block-stub",
                    severity="error",
                    message="Empty test block with 0 test operations detected.",
                    file_path=rel_str,
                    snippet=match.group(0)[:100],
                    suggestion="Write authentic test scenarios exercising component rendering or function execution."
                ))

            # Check for trivial assertions
            for line_idx, line in enumerate(lines, 1):
                if TRIVIAL_ASSERTION_REGEX.search(line):
                    violations.append(Violation(
                        rule_id="trivial-mock-assertion",
                        severity="error",
                        message="Trivial mock assertion 'expect(true).toBe(true)' detected.",
                        file_path=rel_str,
                        line=line_idx,
                        snippet=line.strip()[:100],
                        suggestion="Assert genuine state changes, return values, or DOM element states."
                    ))

            # Check if file has 0 assertions
            has_assertions = "expect(" in content or "assert." in content or "assert(" in content
            if not has_assertions and len(lines) > 10:
                violations.append(Violation(
                    rule_id="test-file-zero-assertions",
                    severity="error",
                    message="Test suite contains no assertion statements ('expect' or 'assert').",
                    file_path=rel_str,
                    suggestion="Add verifiable assertions to prove code correctness."
                ))

    # 2. Companion test presence check for key packages/components
    component_files = scan_files(root_dir, {".tsx"})
    for file_path in component_files:
        rel_str = str(file_path.relative_to(root_dir))
        fname = file_path.name
        
        # Only check components in packages/ui or components/
        if ("components/" in rel_str or "packages/ui" in rel_str) and ".test." not in fname:
            if fname not in all_test_basenames and fname not in {"index.ts", "index.tsx", "types.ts"}:
                # Check if companion exists in __tests__
                test_neighbor_1 = file_path.with_name(fname.replace(".tsx", ".test.tsx"))
                test_neighbor_2 = file_path.parent / "__tests__" / fname.replace(".tsx", ".test.tsx")
                if not test_neighbor_1.exists() and not test_neighbor_2.exists():
                    violations.append(Violation(
                        rule_id="missing-companion-test-suite",
                        severity="warning",
                        message=f"Component '{fname}' is missing a companion test suite ({fname.replace('.tsx', '.test.tsx')}).",
                        file_path=rel_str,
                        suggestion=f"Create a companion unit test suite validating component rendering and user interactions."
                    ))

    duration_ms = (time.time() - start_time) * 1000
    errors = sum(1 for v in violations if v.severity == "error")
    score = max(0.0, 100.0 - (errors * 20.0) - (len(violations) - errors) * 2.0)

    return ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=errors == 0,
        violations=violations,
        files_scanned=len(test_files),
        duration_ms=duration_ms,
        score=score
    )

def main():
    args = parse_standard_args("Aspect 09: Test Coverage Integrity & Anti-Test-Stub Validator")
    root_path = Path(args.path).resolve()
    result = validate_test_integrity(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
