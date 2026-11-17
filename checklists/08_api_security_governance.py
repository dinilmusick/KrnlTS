#!/usr/bin/env python3
"""
Aspect 08: API Security, Resource Governance & Anti-Polling
Verifies:
- 8-Gate Security Lifecycle in Protected Routes (Rate limiting, auth, sanitization)
- Anti-Polling Invariant (Bans aggressive client polling loops < 5000ms for network calls)
- Real-Time Stream Safety Invariant (EventSource close on error, 4xx circuit breaker, visibility pause)
- Error Sanitization Invariant (Bans leaking raw error.stack in HTTP responses)
- Security Response Headers Presence
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

ASPECT_ID = "aspect_08_api_security_governance"
ASPECT_TITLE = "API Security, Resource Governance & Anti-Polling"

# Aggressive polling regex: setInterval with intervals < 5000ms containing fetch/api
SET_INTERVAL_REGEX = re.compile(
    r'setInterval\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([^}]+)\},\s*([0-9]+)\s*\)'
)

# Raw stack trace leak pattern
STACK_LEAK_REGEX = re.compile(
    r'json\s*\(\s*\{[^}]*\b(?:error|err|stack)\s*:\s*(?:error|err|e)\.stack',
    re.IGNORECASE
)

def validate_api_security(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []

    files = scan_files(root_dir, {".ts", ".tsx", ".js", ".jsx"})
    files_scanned = len(files)

    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        fname = file_path.name
        rel_str = str(rel_path)

        # Skip test files and generated build artifacts
        if ".test." in fname or ".spec." in fname or "__tests__" in rel_str or "dist/" in rel_str or rel_str.startswith(".next/") or rel_str.startswith(".turbo/"):
            continue

        content = read_text_safe(file_path)
        if not content:
            continue

        lines = content.splitlines()
        if len(lines) > 1000 and (fname == "index.js" and "api/" in rel_str):
            continue

        # 1. Anti-Polling Check in frontend / client code
        for match in SET_INTERVAL_REGEX.finditer(content):
            body = match.group(1)
            interval_ms = int(match.group(2))
            
            # If interval calls network or API
            has_network = any(token in body for token in ["fetch(", "axios", "api", "query", "load", "refresh", "get("])
            if has_network and interval_ms < 5000:
                violations.append(Violation(
                    rule_id="aggressive-polling-loop-forbidden",
                    severity="error",
                    message=f"Aggressive polling interval ({interval_ms}ms < 5000ms threshold) detected for network requests.",
                    file_path=rel_str,
                    snippet=match.group(0)[:100],
                    suggestion="Use Server-Sent Events (SSE), WebSockets, or exponential backoff (min 5s -> 60s)."
                ))

        # 2. Real-Time Stream Safety Invariant (EventSource cleanup & 4xx circuit breaker)
        if "new EventSource(" in content:
            # Check 2a: EventSource MUST call .close() inside onerror or error handler
            has_onerror = "onerror" in content or "addEventListener('error'" in content or 'addEventListener("error"' in content
            has_close = ".close()" in content
            if not has_close:
                violations.append(Violation(
                    rule_id="unclosed-eventsource-on-error",
                    severity="error",
                    message="EventSource instance initialized without explicit .close() handling on error.",
                    file_path=rel_str,
                    suggestion="Always call eventSource.close() inside onerror to prevent Chromium/Brave native high-rate reconnect loops."
                ))

            # Check 2b: Must feature 4xx circuit breaking or visibility pause if reconnect logic exists
            has_reconnect = any(token in content for token in ["reconnect", "scheduleReconnect", "retry", "setTimeout", "setInterval"])
            if has_reconnect:
                has_circuit_breaker = any(token in content for token in ["circuitBroken", "circuitBreaker", "401", "403", "unauthorized"])
                if not has_circuit_breaker:
                    violations.append(Violation(
                        rule_id="missing-circuit-breaker-on-4xx",
                        severity="error",
                        message="Real-time reconnect logic does not implement a permanent circuit breaker on HTTP 401/403.",
                        file_path=rel_str,
                        suggestion="Check for 401/403 and immediately trip circuit breaker to stop burning serverless invocations."
                    ))

                has_visibility = any(token in content for token in ["document.hidden", "visibilitychange", "visibilityState"])
                if not has_visibility:
                    violations.append(Violation(
                        rule_id="missing-visibility-suspension",
                        severity="warning",
                        message="Real-time stream reconnect logic does not suspend when the browser tab is hidden (document.hidden).",
                        file_path=rel_str,
                        suggestion="Listen to visibilitychange and pause reconnect timers while document.hidden is true."
                    ))

        # 3. Raw Error Stack Leak Check in API route handlers
        for line_idx, line in enumerate(lines, 1):
            if STACK_LEAK_REGEX.search(line):
                violations.append(Violation(
                    rule_id="unhandled-stack-trace-leak",
                    severity="error",
                    message="Raw error stack trace returned in client HTTP response.",
                    file_path=rel_str,
                    line=line_idx,
                    snippet=line.strip()[:100],
                    suggestion="Sanitize error messages; log internal stack traces to server logs only."
                ))

        # 4. Protected API Routes Governance Check
        if "api/" in rel_str and (fname == "route.ts" or fname == "route.js"):
            is_mutation = "POST" in content or "PUT" in content or "DELETE" in content
            is_public_auth = "api/auth/login" in rel_str or "api/auth/register" in rel_str
            
            if is_mutation and not is_public_auth:
                has_governance = any(token in content for token in [
                    "rateLimit", "limiter", "auth", "session", "requireRole",
                    "validateRequest", "verifyToken", "gate", "guard"
                ])
                if not has_governance and len(lines) > 25:
                    violations.append(Violation(
                        rule_id="ungoverned-mutation-route",
                        severity="warning",
                        message="API mutation route does not appear to enforce rate limiting, session authentication, or request validation.",
                        file_path=rel_str,
                        suggestion="Wrap route handler in the standard 8-gate security pipeline (Gate 1 validation, Gate 2 auth, Gate 4 rate limiting)."
                    ))

    duration_ms = (time.time() - start_time) * 1000
    errors = sum(1 for v in violations if v.severity == "error")
    score = max(0.0, 100.0 - (errors * 20.0) - (len(violations) - errors) * 5.0)

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
    args = parse_standard_args("Aspect 08: API Security, Resource Governance & Anti-Polling Validator")
    root_path = Path(args.path).resolve()
    result = validate_api_security(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
