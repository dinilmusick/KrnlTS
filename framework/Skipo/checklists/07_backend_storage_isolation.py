#!/usr/bin/env python3
"""
Aspect 07: Universal Backend & Storage Decoupling
Verifies:
- Control Plane vs Data Plane Strict Decoupling (/api/auth vs /api/storage)
- External Credential Link Law (CredentialField with direct web portal retrieval links)
- Zero Serverless Disk Buffer Invariant (Bans /tmp file upload proxying in favor of direct presigned URLs)
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

ASPECT_ID = "aspect_07_backend_storage_isolation"
ASPECT_TITLE = "Universal Backend & Storage Decoupling"

# Known external service credential names
CREDENTIAL_KEYWORDS = [
    "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GOOGLE_AI_STUDIO",
    "B2_APPLICATION_KEY", "AWS_SECRET_ACCESS_KEY", "SUPABASE_KEY", "NEON_DATABASE_URL"
]

TMP_PROXYING_REGEX = re.compile(
    r'(?:fs\.writeFile|fsp\.writeFile|fs\.createWriteStream)\s*\(\s*["\']/(?:tmp|var/tmp)/'
)

def validate_backend_storage(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []

    files = scan_files(root_dir, {".ts", ".tsx", ".js", ".jsx"})
    files_scanned = len(files)

    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        fname = file_path.name
        rel_str = str(rel_path)

        # Skip test files and node_modules
        if ".test." in fname or ".spec." in fname or "__tests__" in rel_str:
            continue

        content = read_text_safe(file_path)
        if not content:
            continue

        lines = content.splitlines()

        # 1. Ephemeral /tmp Buffer in Serverless API Routes Check
        if "api/" in rel_str and ("/storage/" in rel_str or "/upload" in rel_str):
            for line_idx, line in enumerate(lines, 1):
                if TMP_PROXYING_REGEX.search(line):
                    violations.append(Violation(
                        rule_id="ephemeral-tmp-proxying-forbidden",
                        severity="error",
                        message="Direct /tmp disk proxying detected in serverless upload route.",
                        file_path=rel_str,
                        line=line_idx,
                        snippet=line.strip()[:100],
                        suggestion="Generate presigned S3/B2 transfer URLs (getSignedUrl) and let client upload directly."
                    ))

        # 2. External Credential Link Law Check in UI components
        if file_path.suffix in {".tsx", ".jsx"} and "settings" in rel_str.lower() or "credential" in rel_str.lower():
            has_api_key_input = any(kw in content for kw in ["apiKey", "api_key", "secretKey", "accessKey", "token"])
            if has_api_key_input:
                if "CredentialField" not in content and "credentialUrl" not in content and "link" not in content.lower():
                    violations.append(Violation(
                        rule_id="missing-credential-portal-link",
                        severity="warning",
                        message="Credential input field does not feature a direct link to the external service dashboard.",
                        file_path=rel_str,
                        suggestion="Use @skipo/ui CredentialField with credentialUrl pointing to the provider's API key portal."
                    ))

        # 3. Control Plane vs Data Plane Plane Blurring:
        # Auth routes should not manipulate raw bucket storage directly
        if "/api/auth/" in rel_str and ("PutObjectCommand" in content or "createMultipartUpload" in content):
            violations.append(Violation(
                rule_id="control-plane-data-plane-leakage",
                severity="error",
                message="Auth route directly interacts with raw S3/B2 storage. Storage operations belong strictly in /api/storage.",
                file_path=rel_str,
                suggestion="Separate Control Plane authentication from Data Plane storage transfers."
            ))

        # 4. Invariant §16: Generic DATABASE_URL Obsolete Ban
        if "DATABASE_URL" in content and not rel_str.endswith(".md"):
            for line_idx, line in enumerate(lines, 1):
                raw = line.strip()
                if "DATABASE_URL" in line and "SYSTEM_DATABASE_URL" not in line and "NEON_DATABASE_URL" not in line:
                    if not raw.startswith("//") and not raw.startswith("#") and not raw.startswith("*") and "forbidden" not in raw.lower() and "obsolete" not in raw.lower():
                        violations.append(Violation(
                            rule_id="banned-generic-database-url",
                            severity="error",
                            message="Obsolete generic 'DATABASE_URL' reference detected. Must use SYSTEM_DATABASE_URL (or fallbacks 2/3).",
                            file_path=rel_str,
                            line=line_idx,
                            snippet=raw[:100],
                            suggestion="Replace with SYSTEM_DATABASE_URL (primary), SYSTEM_DATABASE_URL_2, or SYSTEM_DATABASE_URL_3."
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
    args = parse_standard_args("Aspect 07: Universal Backend & Storage Decoupling Validator")
    root_path = Path(args.path).resolve()
    result = validate_backend_storage(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
