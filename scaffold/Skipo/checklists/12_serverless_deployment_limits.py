#!/usr/bin/env python3
"""
Aspect 12: Serverless Function Code Size & Vercel Deployment Budget Governance
Verifies:
1. Output File Tracing (Next.js): Mandatory `output: 'standalone'` in next.config
2. Dependency Tree-Shaking & Heavy Library Ban:
   - Bans barrel/monolithic imports (e.g., `import _ from 'lodash'`) in favor of direct subpaths
   - Bans heavy legacy packages (e.g., `moment`) in favor of lightweight alternatives (`date-fns`, `dayjs`)
3. Static Asset CDN Decoupling:
   - Bans large static media (>300KB) and binary assets inside serverless routes (`api/`, `pages/api/`)
   - Assets must be moved to public/ or external CDN / object storage (S3/B2/Blob)
4. Database Client & Engine Optimization (Prisma):
   - Bans bundled heavy Prisma binary engines in serverless functions
   - Enforces Prisma Data Proxy, Prisma Accelerate, or `@prisma/client/edge` runtime
5. Build & Dev Dependency Segregation:
   - Ensures linters, testing frameworks, and compilers are strictly in devDependencies
"""

from pathlib import Path
import json
import re
import sys
import time
from typing import List, Dict, Any, Set

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

ASPECT_ID = "aspect_12_serverless_code_size_limits"
ASPECT_TITLE = "Serverless Function Storage & Deployment Code Size Governance"

MONOLITHIC_IMPORT_PATTERNS = [
    (re.compile(r'import\s+([A-Za-z0-9_$]+)\s+from\s+[\'"]lodash[\'"]'), "lodash", "import specific methods directly, e.g. import debounce from 'lodash/debounce'"),
    (re.compile(r'import\s+\*\s+as\s+[A-Za-z0-9_$]+\s+from\s+[\'"]lodash[\'"]'), "lodash", "import specific methods directly, e.g. import debounce from 'lodash/debounce'"),
    (re.compile(r'import\s+.*\s+from\s+[\'"]moment[\'"]'), "moment", "replace heavy 'moment' with lightweight 'date-fns' or 'dayjs'"),
]

DEV_TOOLING_PACKAGES = {
    "eslint", "jest", "vitest", "cypress", "playwright", "@playwright/test",
    "prettier", "typescript", "ts-node", "tsx", "@types/node",
    "@types/react", "@types/react-dom", "webpack", "vite"
}

def validate_serverless_code_size(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    files_scanned = 0

    # 1. Output File Tracing (Next.js): Check next.config.js / next.config.mjs / next.config.ts
    next_config_candidates = [
        root_dir / "next.config.js",
        root_dir / "next.config.mjs",
        root_dir / "next.config.ts",
        root_dir / "backend" / "control-plane" / "code" / "next.config.js",
        root_dir / "backend" / "control-plane" / "code" / "next.config.mjs",
    ]

    for cfg in next_config_candidates:
        if cfg.exists():
            files_scanned += 1
            content = read_text_safe(cfg) or ""
            rel_path = str(cfg.relative_to(root_dir))
            if "standalone" not in content:
                violations.append(Violation(
                    rule_id="missing-standalone-output-tracing",
                    severity="error",
                    message="Next.js config does not enable output: 'standalone'. Output file tracing is required to prevent exceeding the 50MB function code size limit.",
                    file_path=rel_path,
                    suggestion="Add `output: 'standalone'` to your next.config to automatically prune unused node_modules from serverless bundles."
                ))
            if "outputFileTracingExcludes" not in content:
                violations.append(Violation(
                    rule_id="missing-output-file-tracing-excludes",
                    severity="warning",
                    message="Next.js config does not specify 'outputFileTracingExcludes'. Heavy compiler tools may be bundled into serverless functions.",
                    file_path=rel_path,
                    suggestion="Add `outputFileTracingExcludes: { '*': ['@swc/core', 'esbuild', 'terser', 'uglify-js', 'typescript'] }` to minimize function size."
                ))

    # 2. Dependency Audit in package.json
    pkg_candidates = [
        root_dir / "package.json",
        root_dir / "backend" / "control-plane" / "code" / "package.json",
    ]

    for pkg_path in pkg_candidates:
        if pkg_path.exists():
            files_scanned += 1
            rel_path = str(pkg_path.relative_to(root_dir))
            try:
                pkg_data = json.loads(read_text_safe(pkg_path) or "{}")
                deps = pkg_data.get("dependencies", {})

                for dep in deps:
                    if dep in DEV_TOOLING_PACKAGES:
                        violations.append(Violation(
                            rule_id="dev-tooling-in-production-deps",
                            severity="error",
                            message=f"Development tool '{dep}' is listed in production dependencies. Vercel bundles production dependencies into serverless functions.",
                            file_path=rel_path,
                            suggestion=f"Move '{dep}' to devDependencies to keep serverless function bundles below the 50MB limit."
                        ))

                if "moment" in deps:
                    violations.append(Violation(
                        rule_id="heavy-dependency-banned-moment",
                        severity="error",
                        message="Heavy library 'moment' detected in dependencies. Moment adds excessive bundle weight.",
                        file_path=rel_path,
                        suggestion="Replace 'moment' with modular 'date-fns' or 'dayjs'."
                    ))

            except Exception as e:
                violations.append(Violation(
                    rule_id="package-json-parse-error",
                    severity="error",
                    message=f"Failed to parse {rel_path}: {e}",
                    file_path=rel_path
                ))

    # 3. Source Code Scanning: Tree-shaking, Prisma Engines & Asset Storage
    code_files = scan_files(root_dir, {".ts", ".tsx", ".js", ".jsx"})
    for file_path in code_files:
        rel_path = file_path.relative_to(root_dir)
        rel_str = str(rel_path)

        if "node_modules" in rel_str or "dist" in rel_str or ".next" in rel_str or ".git" in rel_str:
            continue

        files_scanned += 1
        content = read_text_safe(file_path)
        if not content:
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines, 1):
            line_strip = line.strip()
            if not line_strip.startswith("import"):
                continue

            for pattern, pkg_name, fix_sugg in MONOLITHIC_IMPORT_PATTERNS:
                if pattern.search(line_strip):
                    violations.append(Violation(
                        rule_id="monolithic-import-anti-tree-shaking",
                        severity="error",
                        message=f"Monolithic import of '{pkg_name}' prevents bundler tree-shaking, inflating serverless deployment size.",
                        file_path=rel_str,
                        line=line_idx,
                        snippet=line_strip[:100],
                        suggestion=fix_sugg
                    ))

        if "/api/" in rel_str or "/server/" in rel_str:
            if "@prisma/client" in content and "@prisma/client/edge" not in content and "accelerate" not in content.lower():
                if "new PrismaClient(" in content:
                    violations.append(Violation(
                        rule_id="unoptimized-prisma-engine-in-serverless",
                        severity="warning",
                        message="Standard PrismaClient instantiated in serverless route without Prisma Accelerate or Edge runtime. Heavy Prisma engine binaries can exhaust function limits.",
                        file_path=rel_str,
                        suggestion="Use '@prisma/client/edge' or Prisma Accelerate / Data Proxy to eliminate bundling heavy binary query engines."
                    ))

    # 4. Large Static Assets inside API / Function Directories
    api_dirs = [root_dir / "src" / "app" / "api", root_dir / "api", root_dir / "pages" / "api"]
    media_extensions = {".png", ".jpg", ".jpeg", ".gif", ".mp4", ".mov", ".pdf", ".zip", ".tar", ".gz", ".woff", ".woff2", ".ttf"}
    for api_dir in api_dirs:
        if api_dir.exists() and api_dir.is_dir():
            for p in api_dir.rglob("*"):
                if p.is_file() and p.suffix.lower() in media_extensions:
                    size_kb = p.stat().st_size / 1024
                    if size_kb > 300:
                        violations.append(Violation(
                            rule_id="large-static-asset-in-serverless-dir",
                            severity="error",
                            message=f"Static asset '{p.name}' ({size_kb:.1f} KB) stored inside serverless function directory.",
                            file_path=str(p.relative_to(root_dir)),
                            suggestion="Move static assets to public/ or an external CDN / S3 / Vercel Blob store to protect the 50MB function storage limit."
                        ))

    # 5. Clean Environment Variable Audit: Enforce 3-Tier Postgres Architecture
    banned_env_keys = {
        "DOCUSTACK_ADMIN_PASS", "ADMIN_PASSWORD", "ADMIN_EMAIL",
        "SYSTEM_BUCKET_KEY", "SYSTEM_BUCKET_ACCESS_KEY", "SYSTEM_BUCKET_SECRET_KEY",
        "B2_APPLICATION_KEY_ID", "B2_APPLICATION_KEY"
    }
    env_files = [root_dir / ".env", root_dir / ".env.example", root_dir / ".env.local"]
    for env_file in env_files:
        if env_file.exists():
            files_scanned += 1
            env_content = read_text_safe(env_file) or ""
            rel_path = str(env_file.relative_to(root_dir))
            for line_no, line in enumerate(env_content.splitlines(), 1):
                clean_line = line.strip()
                if not clean_line or clean_line.startswith("#"):
                    continue
                key_name = clean_line.split("=")[0].strip()
                if key_name in banned_env_keys:
                    violations.append(Violation(
                        rule_id="legacy-unmanaged-env-variable",
                        severity="error",
                        message=f"Banned environment variable '{key_name}' found. Admin credentials and bucket secrets must reside dynamically inside the 'ultrst_credentials' database table.",
                        file_path=rel_path,
                        line=line_no,
                        suggestion="Remove this variable. Rely on SYSTEM_DATABASE_URL and fetch credentials dynamically from the database."
                    ))

    # 6. Read-Only Serverless Filesystem & Seed Bundling Audit
    vercel_json = root_dir / "vercel.json"
    data_dir = root_dir / "data"
    if vercel_json.exists() and data_dir.exists():
        files_scanned += 1
        try:
            v_data = json.loads(read_text_safe(vercel_json) or "{}")
            fn_cfg = v_data.get("functions", {}).get("api/index.js", {})
            include_files = fn_cfg.get("includeFiles", "")
            if "data/**" not in include_files:
                violations.append(Violation(
                    rule_id="missing-data-in-serverless-bundle",
                    severity="warning",
                    message="Project has a 'data/' directory but 'vercel.json' does not include 'data/**' in functions.api/index.js.includeFiles.",
                    file_path=str(vercel_json.relative_to(root_dir)),
                    suggestion="Add 'data/**' to includeFiles in vercel.json: '{node_modules/sql.js/dist/sql-wasm.wasm,data/**}'."
                ))
        except Exception:
            pass

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
    args = parse_standard_args("Aspect 12: Serverless Function Code Size & Deployment Budget Validator")
    root_path = Path(args.path).resolve()
    result = validate_serverless_code_size(root_path)

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
