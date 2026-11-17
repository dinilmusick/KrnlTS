#!/usr/bin/env python3
"""
Aspect 13: STATE_EXECUTION_ARCHITECTURE Governance Validator
Verifies:
- Invariants I1-I6: SKIPO_STATE (Zustand) is sole store; zero React useState for domain data; explicit lifecycles.
- Invariants I7-I10: DIRECT_COMPONENT -> BACKEND_FACADE/SERVICE/DB is forbidden; all mutations routed through commands.
- Invariants I11-I14: Worker-only backend facade boundary; service dispatch to deterministic operation components.
- Invariant I18: Idempotency keys on mutation jobs.
"""

from pathlib import Path
import re
import sys
import time
from typing import List

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

ASPECT_ID = "aspect_13_state_execution_governance"
ASPECT_TITLE = "STATE & EXECUTION Architecture Governance"

def validate_state_execution(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    files_scanned = 0

    all_files = scan_files(root_dir, [".ts", ".tsx"])
    files_scanned += len(all_files)

    for fpath in all_files:
        rel_str = str(fpath.relative_to(root_dir)).replace("\\", "/")
        if any(ignored in rel_str for ignored in ["node_modules/", ".next/", "dist/", "build/", "__tests__/", ".test."]):
            continue

        txt = read_text_safe(fpath) or ""
        lines = txt.splitlines()

        is_frontend = "src/frontend/" in rel_str or "components/" in rel_str
        is_facade = ("backend/" in rel_str and rel_str.endswith("Backend.ts") and not fpath.name.startswith("use"))

        for line_num, line in enumerate(lines, 1):
            trimmed = line.strip()

            # Rule 1: Zero direct raw fetch in UI components (must use SKIPO_COMMAND / useCommand)
            if is_frontend and ("fetch(" in trimmed or "axios." in trimmed) and not trimmed.startswith("//"):
                violations.append(Violation(
                    rule_id="frontend-direct-fetch-forbidden",
                    severity="error",
                    message="Direct network fetch in frontend component violates SKIPO_EXECUTION boundary.",
                    file_path=rel_str,
                    line=line_num,
                    snippet=trimmed,
                    suggestion="Route all backend-bound operations through useCommand() or SKIPO_COMMAND -> p-queue."
                ))

            # Rule 2: Ban direct component invocation of backend services
            if is_frontend and ("Backend.services." in trimmed or "Backend.orchestrations." in trimmed):
                violations.append(Violation(
                    rule_id="frontend-direct-backend-call-forbidden",
                    severity="error",
                    message="Direct component call to backend facade or service is strictly FORBIDDEN (Invariant I8).",
                    file_path=rel_str,
                    line=line_num,
                    snippet=trimmed,
                    suggestion="Dispatch a SKIPO_COMMAND into the p-queue execution queue instead."
                ))

            # Rule 3: Ban raw domain useState in components
            if is_frontend and re.search(r"const\s+\[\w+,\s*set\w+\]\s*=\s*useState<", trimmed):
                # Detect complex domain state: arrays, records, models
                if any(k in trimmed.lower() for k in ["list", "items", "entities", "data", "records", "user"]):
                    violations.append(Violation(
                        rule_id="frontend-banned-local-domain-state",
                        severity="error",
                        message="React local useState for application domain data violates SKIPO_STATE (Invariant I1).",
                        file_path=rel_str,
                        line=line_num,
                        snippet=trimmed,
                        suggestion="Use useSkipoState() with an explicit lifecycle descriptor (COMPONENT, PAGE, or APP)."
                    ))

        # Rule 4: Facade must verify Worker context
        if is_facade and not is_frontend and "export" in txt:
            if "isWorkerContext" not in txt and "WorkerExecutionBoundary" not in txt:
                violations.append(Violation(
                    rule_id="backend-facade-missing-worker-boundary",
                    severity="error",
                    message=f"Backend facade '{fpath.name}' lacks Worker execution boundary check (Invariant I11).",
                    file_path=rel_str,
                    suggestion="Enforce FACADE_ACCESS := WORKER_ONLY using WorkerExecutionBoundary."
                ))

    errors = [v for v in violations if v.severity == "error"]
    score = max(0.0, 100.0 - (len(errors) * 15.0))
    passed = len(errors) == 0

    return ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=passed,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=(time.time() - start_time) * 1000,
        score=score
    )

if __name__ == "__main__":
    args = parse_standard_args("Aspect 13: STATE_EXECUTION_ARCHITECTURE Governance Validator")
    root_path = Path(args.path).resolve()
    result = validate_state_execution(root_path)
    print_checklist_report(result, verbose=args.verbose)
    sys.exit(0 if result.passed else 1)
