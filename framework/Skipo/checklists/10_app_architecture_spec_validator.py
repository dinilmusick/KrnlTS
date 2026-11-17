#!/usr/bin/env python3
"""
Aspect 10: APP_ARCHITECTURE_SPEC Governance Validator
Verifies:
- Canonical Planes: src/frontend, src/backend, src/libraries, src/frontend-state
- Single Entrypoint Facade: src/backend/<AppName>Backend.ts
- Service Facades: <service>.ts exporting runtime, deployment, service
- Runtime Model Invariants:
    deployment == "remote" => runtime == "server"
    runtime == "client" => deployment == "local"
- Import Boundaries:
    frontend -> AppNameBackend & libraries ONLY (never service internals, gateway, repositories)
    orchestrations -> service facades ONLY (never repositories, gateway, server/remote internals)
    libraries -> environment-neutral (never frontend or backend)
    server ⇏ client, client ⇏ server
- Root Preservation:
    Vite apps retain index.html at root
    Next.js apps retain package.json & next.config at root
"""

from pathlib import Path
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

ASPECT_ID = "aspect_10_app_architecture_spec"
ASPECT_TITLE = "APP_ARCHITECTURE_SPEC Governance"

def validate_app_architecture_spec(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    files_scanned = 0

    src_dir = root_dir / "src"
    if not src_dir.exists() or not src_dir.is_dir():
        # Check if root has frontend & backend (fallback for multi-root)
        if not (root_dir / "frontend").exists() and not (root_dir / "backend").exists():
            violations.append(Violation(
                rule_id="missing-src-plane-root",
                severity="error",
                message="Project is missing canonical 'src/' directory containing frontend and backend planes.",
                file_path=str(root_dir.name),
                suggestion="Create 'src/' with 'frontend', 'backend', 'libraries', and 'frontend-state'."
            ))
            return ChecklistResult(
                aspect_id=ASPECT_ID,
                aspect_title=ASPECT_TITLE,
                passed=False,
                violations=violations,
                files_scanned=1,
                duration_ms=(time.time() - start_time) * 1000,
                score=0.0
            )

    # 1. Directory Structure Checks
    subdirs = {d.name.lower() for d in src_dir.iterdir() if d.is_dir()} if src_dir.exists() else set()
    
    # Check for frontend plane
    if "frontend" not in subdirs and not (root_dir / "frontend").exists():
        violations.append(Violation(
            rule_id="missing-frontend-plane",
            severity="error",
            message="Canonical 'src/frontend/' plane directory is missing.",
            file_path="src/",
            suggestion="Create 'src/frontend/' and place all UI presentation logic, components, and views inside."
        ))

    # Check for backend plane
    backend_dir = src_dir / "backend" if "backend" in subdirs else (root_dir / "backend")
    if not backend_dir.exists():
        violations.append(Violation(
            rule_id="missing-backend-plane",
            severity="error",
            message="Canonical 'src/backend/' plane directory is missing.",
            file_path="src/",
            suggestion="Create 'src/backend/' with services, orchestrations, gateway, and master facade."
        ))

    # Check for libraries
    lib_dir = src_dir / "libraries" if "libraries" in subdirs else (root_dir / "libraries" if (root_dir / "libraries").exists() else None)
    has_libraries = lib_dir is not None and lib_dir.exists()
    if not has_libraries:
        violations.append(Violation(
            rule_id="missing-libraries-directory",
            severity="warning",
            message="Canonical 'src/libraries/' directory for app-specific concept libraries is missing.",
            file_path="src/",
            suggestion="Create 'src/libraries/' with '<library-name>_concepts/' and root '<AppName>Concepts.ts'."
        ))
    elif lib_dir:
        # Validate concept library conventions
        concept_dirs = [d for d in lib_dir.iterdir() if d.is_dir() and not d.name.startswith('.')]
        for cdir in concept_dirs:
            if not cdir.name.endswith("_concepts"):
                violations.append(Violation(
                    rule_id="invalid-concept-library-name",
                    severity="warning",
                    message=f"Library directory '{cdir.name}' should follow the '<name>_concepts' naming convention.",
                    file_path=str(cdir.relative_to(root_dir)),
                    suggestion=f"Rename '{cdir.name}' to '{cdir.name}_concepts'."
                ))
            else:
                facade_name = f"{cdir.name}.ts"
                if not (cdir / facade_name).exists() and not (cdir / f"{cdir.name}.js").exists():
                    violations.append(Violation(
                        rule_id="missing-concept-library-facade",
                        severity="error",
                        message=f"Concept library '{cdir.name}' is missing its facade '{facade_name}'.",
                        file_path=str(cdir.relative_to(root_dir)),
                        suggestion=f"Create '{facade_name}' inside '{cdir.name}/' to aggregate all contained code assets."
                    ))

    # Check for frontend-state
    has_state = "frontend-state" in subdirs or (src_dir / "frontend" / "state").exists() or (src_dir / "frontend" / "stores").exists()
    if not has_state:
        violations.append(Violation(
            rule_id="missing-frontend-state",
            severity="warning",
            message="Canonical 'src/frontend-state/' (or 'src/frontend/stores/') directory is missing.",
            file_path="src/",
            suggestion="Create 'src/frontend-state/' with 'stores/' (Zustand) and 'events/'."
        ))

    # 2. Single Backend Entrypoint Facade Check
    backend_facades = []
    if backend_dir.exists():
        for f in backend_dir.iterdir():
            if f.is_file() and (f.name.endswith("Backend.ts") or f.name.endswith("Backend.js") or f.name == "index.ts"):
                backend_facades.append(f)

        if not backend_facades:
            violations.append(Violation(
                rule_id="missing-backend-facade",
                severity="error",
                message="Single backend entrypoint facade (e.g. 'src/backend/<AppName>Backend.ts') is missing.",
                file_path=str(backend_dir.relative_to(root_dir) if backend_dir.is_relative_to(root_dir) else "backend"),
                suggestion="Create 'src/backend/<AppName>Backend.ts' exporting { services, orchestrations }."
            ))
        else:
            # Inspect facade content
            for f in backend_facades:
                files_scanned += 1
                txt = read_text_safe(f) or ""
                if "services" not in txt or "orchestrations" not in txt:
                    violations.append(Violation(
                        rule_id="incomplete-backend-facade",
                        severity="warning",
                        message=f"Backend facade '{f.name}' should explicitly declare both 'services' and 'orchestrations'.",
                        file_path=str(f.relative_to(root_dir)),
                        suggestion="Export an object containing 'services' and 'orchestrations' mappings."
                    ))

    # 3. Services Facade & Invariants Check
    services_dir = backend_dir / "services" if backend_dir.exists() else None
    if services_dir and services_dir.exists() and services_dir.is_dir():
        for sdir in services_dir.iterdir():
            if sdir.is_dir() and not sdir.name.startswith(".") and sdir.name != "core":
                facade_file = sdir / f"{sdir.name}.ts"
                if not facade_file.exists():
                    # Try camelCase, lowercase or index.ts
                    candidates = list(sdir.glob("*.ts"))
                    found_facade = next((c for c in candidates if c.stem.lower() == sdir.name.lower() or c.name == "index.ts"), None)
                    facade_file = found_facade

                if not facade_file or not facade_file.exists():
                    violations.append(Violation(
                        rule_id="missing-service-facade",
                        severity="error",
                        message=f"Service directory '{sdir.name}' is missing service facade '{sdir.name}.ts'.",
                        file_path=str(sdir.relative_to(root_dir)),
                        suggestion=f"Create '{sdir.name}.ts' exporting 'runtime', 'deployment', and 'service'."
                    ))
                else:
                    files_scanned += 1
                    txt = read_text_safe(facade_file) or ""
                    # Check runtime and deployment declaration
                    has_runtime = "runtime" in txt
                    has_deployment = "deployment" in txt
                    if not has_runtime or not has_deployment:
                        violations.append(Violation(
                            rule_id="untyped-service-runtime",
                            severity="warning",
                            message=f"Service facade '{facade_file.name}' should explicitly export 'runtime' and 'deployment'.",
                            file_path=str(facade_file.relative_to(root_dir)),
                            suggestion="Add: export const runtime: 'client' | 'server' = ...; export const deployment: 'local' | 'remote' = ...;"
                        ))
                    
                    # Check mathematical invariant: remote => server
                    if "remote" in txt and ("'client'" in txt or '"client"' in txt) and "runtime" in txt:
                        # Check if runtime is assigned client while deployment is remote
                        if re.search(r"runtime\s*[:=]\s*['\"]client['\"]", txt) and re.search(r"deployment\s*[:=]\s*['\"]remote['\"]", txt):
                            violations.append(Violation(
                                rule_id="invalid-runtime-model-remote-client",
                                severity="error",
                                message=f"Service facade '{facade_file.name}' violates invariant: deployment=REMOTE implies runtime=SERVER (found runtime=client).",
                                file_path=str(facade_file.relative_to(root_dir)),
                                suggestion="Change runtime to 'server' or deployment to 'local'."
                            ))

    # 4. Import Boundaries Validation
    all_ts_files = scan_files(root_dir, [".ts", ".tsx", ".js", ".jsx"])
    files_scanned += len(all_ts_files)

    for fpath in all_ts_files:
        rel_str = str(fpath.relative_to(root_dir)).replace("\\", "/")
        # Skip vendored Skipo/ or node_modules/
        if "Skipo/" in rel_str or "node_modules/" in rel_str or ".next/" in rel_str or "dist/" in rel_str:
            continue

        txt = read_text_safe(fpath) or ""
        lines = txt.splitlines()

        is_frontend = rel_str.startswith("src/frontend/") or rel_str.startswith("components/")
        is_orchestration = "orchestration" in rel_str
        is_library = rel_str.startswith("src/libraries/") or rel_str.startswith("libraries/")
        is_server = "/server/" in rel_str
        is_client = "/client/" in rel_str

        for line_num, line in enumerate(lines, 1):
            trimmed = line.strip()
            if not trimmed.startswith("import ") and "from " not in trimmed:
                continue

            # Frontend checks
            if is_frontend:
                # Rule 003: frontend cannot import internal service implementations
                if re.search(r"from\s+['\"].*backend/services/.+/(server|remote|repositories)/.*['\"]", trimmed):
                    violations.append(Violation(
                        rule_id="frontend-import-service-internals-forbidden",
                        severity="error",
                        message="Frontend plane is importing internal service implementation directly.",
                        file_path=rel_str,
                        line=line_num,
                        snippet=trimmed,
                        suggestion="Import capability exclusively from <AppName>Backend facade."
                    ))
                # Rule 004: frontend cannot import backend gateway directly
                if re.search(r"from\s+['\"].*backend/gateway.*['\"]", trimmed):
                    violations.append(Violation(
                        rule_id="frontend-import-gateway-forbidden",
                        severity="error",
                        message="Frontend plane is directly importing backend gateway.",
                        file_path=rel_str,
                        line=line_num,
                        snippet=trimmed,
                        suggestion="Route calls through <AppName>Backend facade."
                    ))
                # Rule 005: frontend cannot import repositories directly
                if re.search(r"from\s+['\"].*repositories/.*['\"]", trimmed):
                    violations.append(Violation(
                        rule_id="frontend-import-repositories-forbidden",
                        severity="error",
                        message="Frontend plane is directly importing persistence repositories.",
                        file_path=rel_str,
                        line=line_num,
                        snippet=trimmed,
                        suggestion="Database access is restricted to server services."
                    ))

            # Orchestrations checks
            if is_orchestration:
                if re.search(r"from\s+['\"].*repositories/.*['\"]", trimmed):
                    violations.append(Violation(
                        rule_id="orchestration-import-repositories-forbidden",
                        severity="error",
                        message="Orchestration is directly importing repositories.",
                        file_path=rel_str,
                        line=line_num,
                        snippet=trimmed,
                        suggestion="Orchestrations must only invoke service facades."
                    ))
                if re.search(r"from\s+['\"].*/server/.*['\"]", trimmed):
                    violations.append(Violation(
                        rule_id="orchestration-import-server-forbidden",
                        severity="error",
                        message="Orchestration is directly importing server implementation.",
                        file_path=rel_str,
                        line=line_num,
                        snippet=trimmed,
                        suggestion="Orchestrations must coordinate via service facades."
                    ))

            # Libraries checks (must not import from other planes)
            if is_library:
                if re.search(r"['\"](?:\.{2}/|@/|\.\./)backend/", trimmed) or re.search(r"['\"](?:\.{2}/|@/|\.\./)frontend/", trimmed):
                    violations.append(Violation(
                        rule_id="library-environment-dependency-forbidden",
                        severity="error",
                        message="Environment-neutral library is importing from frontend or backend planes.",
                        file_path=rel_str,
                        line=line_num,
                        snippet=trimmed,
                        suggestion="Keep libraries/* pure and free of environment-specific dependencies."
                    ))

            # Server / Client isolation
            if is_server and "/client/" in trimmed:
                violations.append(Violation(
                    rule_id="server-import-client-forbidden",
                    severity="error",
                    message="Server implementation is importing client code.",
                    file_path=rel_str,
                    line=line_num,
                    snippet=trimmed,
                    suggestion="Decouple server logic from client implementations."
                ))

    # 5. Root Preservation Check
    # For Vite apps: index.html must exist at root
    is_vite = (root_dir / "vite.config.ts").exists() or (root_dir / "vite.config.js").exists()
    if is_vite:
        index_html = root_dir / "index.html"
        files_scanned += 1
        if not index_html.exists():
            violations.append(Violation(
                rule_id="missing-root-index-html",
                severity="error",
                message="Vite app is missing root 'index.html' required for Google AI Studio & Vercel deployment.",
                file_path="index.html",
                suggestion="Preserve 'index.html' directly in the root directory loading the canonical browser entry '/src/frontend/main.tsx'."
            ))
        else:
            html = read_text_safe(index_html) or ""
            script_tags = re.findall(r"<script\b[^>]*>", html, re.IGNORECASE)
            canonical_entry = any(
                re.search(r'\btype\s*=\s*["\']module["\']', tag, re.IGNORECASE)
                and re.search(r'\bsrc\s*=\s*["\']/src/frontend/main\.tsx["\']', tag, re.IGNORECASE)
                for tag in script_tags
            )
            if not canonical_entry:
                violations.append(Violation(
                    rule_id="vite-frontend-entrypoint-noncanonical",
                    severity="error",
                    message="Vite index.html must load /src/frontend/main.tsx as its browser entrypoint.",
                    file_path="index.html",
                    suggestion="Set the module script source to '/src/frontend/main.tsx'; do not point to the obsolete '/src/main.tsx'."
                ))
            frontend_entry = root_dir / "src" / "frontend" / "main.tsx"
            if not frontend_entry.is_file():
                violations.append(Violation(
                    rule_id="missing-vite-frontend-entrypoint",
                    severity="error",
                    message="Canonical Vite frontend entrypoint 'src/frontend/main.tsx' is missing.",
                    file_path="src/frontend/main.tsx",
                    suggestion="Place the React browser bootstrap in src/frontend/main.tsx."
                ))

    duration_ms = (time.time() - start_time) * 1000
    errors = sum(1 for v in violations if v.severity == "error")
    score = max(0.0, 100.0 - (errors * 25.0) - (len(violations) - errors) * 5.0)

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
    args = parse_standard_args("Aspect 10: APP_ARCHITECTURE_SPEC Governance Validator")
    root_path = Path(args.path).resolve()
    result = validate_app_architecture_spec(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
