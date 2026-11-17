#!/usr/bin/env python3
"""
Aspect 06: Anti-Stub & Genuine Implementation Integrity (CRITICAL)
Verifies:
- Absolute Ban on Empty / TODO Function Bodies (/* TODO */, throw new Error("Not implemented"))
- Ban on Trivial Dummy Returns (Functions that do not process arguments or perform genuine logic)
- Ban on No-Op Event Listeners (onClick={() => {}}, const handleX = () => {})
- Real Service & Library Connectivity (Services/APIs must connect to real SDKs/drivers, not simulate them)
- API Route Handler Depth (Route handlers must parse inputs and execute genuine logic)
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

ASPECT_ID = "aspect_06_anti_stub_asset_depth"
ASPECT_TITLE = "Anti-Stub & Genuine Implementation Integrity"

# Patterns detecting unimplemented stubs
TODO_STUB_PATTERNS = [
    (re.compile(r'throw\s+new\s+Error\s*\(\s*["\'](?:not\s+implemented|todo|unimplemented)["\']\s*\)', re.IGNORECASE),
     "Stub exception 'throw new Error(\"Not implemented\")' detected."),
    (re.compile(r'\{\s*(?:\/\/\s*todo|\/\*\s*todo\s*\*\/)\s*\}', re.IGNORECASE),
     "Empty function body with TODO comment detected."),
    (re.compile(r'\bfunction\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{\s*\}'),
     "Empty standalone function body 'function () {}' detected.")
]

# Trivial return pattern in non-empty functions
TRIVIAL_RETURN_REGEX = re.compile(
    r'(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*:\s*[^{]+\{\s*return\s+(?:null|undefined|\{\}|\[\]|true|false|""|\'\'|0);\s*\}'
)

# No-op event handlers in JSX
NOOP_JSX_HANDLER_REGEX = re.compile(
    r'on[A-Z][a-zA-Z0-9_]*\s*=\s*\{\s*(?:\(\s*\)\s*=>\s*\{\s*\}|\(\s*e(?:vent)?\s*\)\s*=>\s*\{\s*\})\s*\}'
)

# Route handler declaration
ROUTE_HANDLER_REGEX = re.compile(
    r'export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(([^)]*)\)'
)

def validate_anti_stub(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []

    files = scan_files(root_dir, {".ts", ".tsx", ".js", ".jsx"})
    files_scanned = len(files)

    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        fname = file_path.name

        # Skip test files and type definitions
        if fname.endswith(".d.ts") or ".test." in fname or ".spec." in fname or "__tests__" in str(rel_path):
            continue

        content = read_text_safe(file_path)
        if not content:
            continue

        lines = content.splitlines()

        # 1. Line-by-line stub pattern checks
        for line_idx, line in enumerate(lines, 1):
            trimmed = line.strip()
            if trimmed.startswith("//") or trimmed.startswith("/*"):
                continue

            if ".catch(" in line or "createContext" in line:
                continue

            for pattern, msg in TODO_STUB_PATTERNS:
                if pattern.search(line):
                    violations.append(Violation(
                        rule_id="unimplemented-stub-body",
                        severity="error",
                        message=msg,
                        file_path=str(rel_path),
                        line=line_idx,
                        snippet=trimmed[:100],
                        suggestion="Implement genuine operational logic, state mutation, or real service call."
                    ))

            # Check no-op JSX handlers
            if NOOP_JSX_HANDLER_REGEX.search(line):
                violations.append(Violation(
                    rule_id="no-op-event-handler",
                    severity="error",
                    message="No-op JSX event handler (e.g. onClick={() => {}}) detected.",
                    file_path=str(rel_path),
                    line=line_idx,
                    snippet=trimmed[:100],
                    suggestion="Connect handler to actual state transition, action dispatch, or event emitter."
                ))

        # 2. Trivial single-line return checks
        for match in TRIVIAL_RETURN_REGEX.finditer(content):
            fn_name = match.group(1)
            # Allow pure mock overrides or specific no-op lifecycle hooks
            if not (fn_name.startswith("noop") or fn_name.startswith("default")):
                violations.append(Violation(
                    rule_id="trivial-dummy-return-stub",
                    severity="error",
                    message=f"Function '{fn_name}' is a hollow stub returning a trivial dummy value with no computation.",
                    file_path=str(rel_path),
                    snippet=match.group(0)[:100],
                    suggestion="Perform genuine input parameter processing, algorithmic transformation, or service calls."
                ))

        # 3. API Route Handler Depth Check
        if fname == "route.ts" or fname == "route.js":
            for match in ROUTE_HANDLER_REGEX.finditer(content):
                method = match.group(1)
                # Find body of the route handler
                handler_start = match.end()
                handler_snippet = content[handler_start:handler_start + 500]
                
                # Verify that route handler actually does more than return static JSON
                has_processing = any(token in handler_snippet for token in [
                    ".json()", ".text()", ".formData()", ".nextUrl", "searchParams",
                    "await ", "db.", "table.", "storage.", "fetch(", "prisma.",
                    "sql", "service.", "execute", "validate", "auth", "session"
                ])
                
                if not has_processing and len(handler_snippet.strip().splitlines()) <= 4:
                    violations.append(Violation(
                        rule_id="shallow-api-route-stub",
                        severity="error",
                        message=f"API Route handler '{method}' appears to be a shallow stub without input parsing or service queries.",
                        file_path=str(rel_path),
                        suggestion="Parse request payload, authenticate session, and invoke backend storage/database logic."
                    ))

        # 4. Service & Backend Depth Check:
        # If file is declared as a service or repository, ensure it imports real drivers
        if ("service" in fname.lower() or "repository" in fname.lower() or "storage" in fname.lower()) and "type" not in fname.lower():
            if len(lines) > 30:
                has_real_driver = any(driver in content for driver in [
                    "fetch(", "axios", "sqlite", "pg", "postgres", "@aws-sdk", "fs.",
                    "fs/", "localStorage", "indexedDB", "crypto", "Buffer", "WebSocket",
                    "http", "https", "@skipo/backend"
                ])
                if not has_real_driver:
                    violations.append(Violation(
                        rule_id="unconnected-service-stub",
                        severity="warning",
                        message=f"Service asset '{fname}' does not appear to connect to any real I/O driver, SDK, or storage engine.",
                        file_path=str(rel_path),
                        suggestion="Wire service to authentic database, storage client, or network driver."
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
    args = parse_standard_args("Aspect 06: Anti-Stub & Genuine Implementation Integrity Validator")
    root_path = Path(args.path).resolve()
    result = validate_anti_stub(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
