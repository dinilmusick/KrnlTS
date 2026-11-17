#!/usr/bin/env python3
"""
Aspect 11: MULTI_TARGET_BUILD_SPEC Governance Validator
Verifies:
- Clean 4-Plane Root: Exactly src/{frontend, backend, libraries, frontend-state}
  (Strict ban on src/runtime/ and legacy root folders like src/components, src/core, etc.)
- Protocol Adapter Entrypoint: src/backend/adapters/httpsAdapter.ts exists and exports fetch handler
- Context-Neutral Flat Orchestrations: src/backend/orchestrations/ exists with NO client/ or server/ subfolders
- Service Implementations: Each service has client/ and server/ slots
- Build Manifests: config/build/manifests/fullstack.json and api.json exist
- Deployment Config: wrangler.toml exists with main pointing to dist/api/worker/index.js
- Dual Build Scripts: package.json has build:fullstack, build:api, build:all, validate:api
- Dual TSConfig: tsconfig.api.json exists
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

ASPECT_ID = "aspect_11_multi_target_build_spec"
ASPECT_TITLE = "MULTI_TARGET_BUILD_SPEC & Protocol Adapters Governance"

CANONICAL_PLANES = {"frontend", "backend", "libraries", "frontend-state"}
FORBIDDEN_SRC_DIRS = {"runtime", "components", "context", "core", "services", "types", "utils"}

def validate_multi_target_build_spec(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    files_scanned = 0

    src_dir = root_dir / "src"
    if not src_dir.exists() or not src_dir.is_dir():
        violations.append(Violation(
            rule_id="missing-src-directory",
            severity="error",
            message="Canonical 'src/' directory is missing.",
            file_path="src/",
            suggestion="Create 'src/' with frontend, backend, libraries, and frontend-state."
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

    # 1. Plane Isolation & Ban on Forbidden Dirs in src/
    subdirs = {d.name for d in src_dir.iterdir() if d.is_dir()}
    for bad_dir in FORBIDDEN_SRC_DIRS:
        if bad_dir in subdirs:
            violations.append(Violation(
                rule_id=f"forbidden-src-directory-{bad_dir}",
                severity="error",
                message=f"Forbidden legacy/redundant directory 'src/{bad_dir}' detected.",
                file_path=f"src/{bad_dir}",
                suggestion=f"Remove or migrate 'src/{bad_dir}' into canonical planes ('frontend', 'backend', or 'libraries')."
            ))

    # 2. Protocol Adapter Invariant (src/backend/adapters/httpsAdapter.ts)
    backend_dir = src_dir / "backend"
    adapter_file = backend_dir / "adapters" / "httpsAdapter.ts"
    if not adapter_file.exists():
        violations.append(Violation(
            rule_id="missing-https-adapter",
            severity="error",
            message="Protocol Adapter 'src/backend/adapters/httpsAdapter.ts' is missing.",
            file_path="src/backend/adapters/",
            suggestion="Create 'src/backend/adapters/httpsAdapter.ts' to expose the Backend facade to Cloudflare Workers / Fetch API."
        ))
    else:
        files_scanned += 1
        content = read_text_safe(adapter_file)
        if "fetch(" not in content and "fetch :" not in content and "fetch:" not in content:
            violations.append(Violation(
                rule_id="adapter-missing-fetch-handler",
                severity="error",
                message="'httpsAdapter.ts' does not export a standard 'fetch' handler.",
                file_path=str(adapter_file.relative_to(root_dir)),
                suggestion="Export an object with 'async fetch(request: Request): Promise<Response>'."
            ))
        if "ASSETS" not in content:
            violations.append(Violation(
                rule_id="adapter-missing-assets-fallback",
                severity="warning",
                message="'httpsAdapter.ts' does not delegate non-API requests to 'env.ASSETS.fetch(request)'. Navigation to non-API routes on Cloudflare will not render the frontend UI.",
                file_path=str(adapter_file.relative_to(root_dir)),
                suggestion="Add 'if (env.ASSETS && !pathname.startsWith(\"/api/\")) return env.ASSETS.fetch(request);' to httpsAdapter.ts."
            ))

        # Check 2.0a: Ban on /index.html rewrites in ASSETS fallback (Law L24: Prevents ERR_TOO_MANY_REDIRECTS)
        if "env.ASSETS" in content and ("/index.html" in content or "'/index.html'" in content or '"/index.html"' in content):
            if "pathname = '/index.html'" in content or 'pathname = "/index.html"' in content:
                violations.append(Violation(
                    rule_id="cf-assets-infinite-redirect-loop",
                    severity="error",
                    message="Manual rewrite to '/index.html' before env.ASSETS.fetch() detected. Cloudflare Assets normalizes /index.html -> /, causing an infinite redirect loop (ERR_TOO_MANY_REDIRECTS).",
                    file_path=str(adapter_file.relative_to(root_dir)),
                    suggestion="Pass the original request to env.ASSETS.fetch(request) as-is; not_found_handling='single-page-application' handles SPA fallback natively."
                ))

    # 2.0b Polyglot Universal Entry & ExportedHandler Plain Object Invariant (Law L8 & L24)
    universal_entry_file = backend_dir / "adapters" / "universalEntry.ts"
    if universal_entry_file.exists():
        files_scanned += 1
        ue_content = read_text_safe(universal_entry_file)
        if "export default universalHandler" in ue_content:
            violations.append(Violation(
                rule_id="cf-invalid-function-export",
                severity="error",
                message="universalEntry.ts exports a function as default export. Cloudflare Workers runtime rejects function exports, silently failing isolate startup and returning HTML 404 ('There is nothing here yet').",
                file_path=str(universal_entry_file.relative_to(root_dir)),
                suggestion="Use 'export default { async fetch(request, env, ctx) { return fetchHandler(request, env); } };' as a plain object literal."
            ))
        elif "export default {" not in ue_content and "export default cfHandler" not in ue_content:
            violations.append(Violation(
                rule_id="cf-missing-object-default-export",
                severity="warning",
                message="universalEntry.ts must provide an ExportedHandler plain object literal as default export ('export default { async fetch(...) }').",
                file_path=str(universal_entry_file.relative_to(root_dir)),
                suggestion="Add 'export default { async fetch(request, env, ctx) { return fetchHandler(request, env); } };'."
            ))

        # Check 2.0b.1: Mandatory normalizeEnv with Dynamic Origin Auto-Detection
        if "normalizeEnv" not in ue_content:
            violations.append(Violation(
                rule_id="universal-entry-missing-normalize-env",
                severity="error",
                message="universalEntry.ts must implement and export 'normalizeEnv' to standardize environment variables across local and cloud runtimes.",
                file_path=str(universal_entry_file.relative_to(root_dir)),
                suggestion="Export 'normalizeEnv(env, requestUrl)' normalizing SYSTEM_DATABASE_URL and APP_URL."
            ))
        elif "new URL(requestUrl).origin" not in ue_content and "new URL(request.url).origin" not in ue_content and "origin" not in ue_content:
            violations.append(Violation(
                rule_id="universal-entry-missing-dynamic-origin",
                severity="error",
                message="universalEntry.ts normalizeEnv does not auto-detect APP_URL from request origin. Fails dynamic deployment origin detection on Cloudflare/Vercel.",
                file_path=str(universal_entry_file.relative_to(root_dir)),
                suggestion="Add dynamic origin detection: 'APP_URL: (env.APP_URL as string) || (typeof process !== \"undefined\" ? process.env.APP_URL : undefined) || (requestUrl ? new URL(requestUrl).origin : undefined)'."
            ))

        # Check 2.0b.2: Pure Serverless Fetch Compliance (Ban on embedded http.createServer in universalEntry)
        if "http.createServer" in ue_content or "createServer(" in ue_content:
            violations.append(Violation(
                rule_id="universal-entry-embedded-node-server-banned",
                severity="error",
                message="universalEntry.ts instantiates a standalone Node HTTP server via 'http.createServer'. Canonical architecture is 100% serverless Fetch ('export default { async fetch(...) }'); dev servers must live in server.ts.",
                file_path=str(universal_entry_file.relative_to(root_dir)),
                suggestion="Remove http.createServer from universalEntry.ts to preserve pure serverless Fetch compatibility."
            ))

    # 2.0c Strict Ban on new Function() and eval() in Backend (Law L22: Cloudflare V8 Isolate Strict Security)
    all_backend_files = list(backend_dir.rglob("*.ts"))
    for bf in all_backend_files:
        if bf.is_file():
            b_text = read_text_safe(bf)
            if "new Function(" in b_text or "eval(" in b_text:
                violations.append(Violation(
                    rule_id="cf-v8-isolate-eval-forbidden",
                    severity="error",
                    message=f"Banned code generation string evaluation ('new Function' or 'eval') found in '{bf.relative_to(root_dir)}'. Fails Cloudflare Workers V8 isolate deployment with EvalError 10021.",
                    file_path=str(bf.relative_to(root_dir)),
                    suggestion="Replace dynamic string evaluation with native 'await import(module)' and mark as external in esbuild."
                ))

    # 2.1 Ban on Divergent Worker Adapter Directory (Law L23: Codebase Splitting Anti-Pattern)
    worker_adapter_dir = backend_dir / "adapters" / "worker"
    if worker_adapter_dir.exists() and worker_adapter_dir.is_dir():
        violations.append(Violation(
            rule_id="divergent-worker-adapters-forbidden",
            severity="error",
            message="Divergent worker adapter directory 'src/backend/adapters/worker/' detected. Split worker adapters violate Zero-Drift Law L23.",
            file_path="src/backend/adapters/worker/",
            suggestion="Consolidate all database/auth/storage logic into 'src/backend/services/core/' and delegate directly from httpsAdapter.ts."
        ))

    # 2.2 Zero-Drift Universal Database Client Check (Law L23)
    core_services_dir = backend_dir / "services" / "core"
    unified_db_file = core_services_dir / "unifiedDb.ts"
    all_ts_files = list(backend_dir.rglob("*.ts"))
    uses_db = any("neon" in read_text_safe(f) or "queryUnifiedDb" in read_text_safe(f) for f in all_ts_files if f.is_file())
    if uses_db and not unified_db_file.exists():
        violations.append(Violation(
            rule_id="missing-unified-db-core",
            severity="error",
            message="App queries databases but is missing isomorphic client 'src/backend/services/core/unifiedDb.ts'. Violates Zero-Drift Law L23.",
            file_path="src/backend/services/core/",
            suggestion="Create 'src/backend/services/core/unifiedDb.ts' using @neondatabase/serverless for identical execution on Vercel and Cloudflare."
        ))

    # 2.3 Ban on Express Serverless Layer (Law L8: Universal Protocol Adapter & Express Ban)
    forbidden_serverless_entries = [
        backend_dir / "server" / "serverless.ts",
        backend_dir / "server" / "appFactory.ts",
        src_dir / "server" / "serverless.ts",
    ]
    for bad_entry in forbidden_serverless_entries:
        if bad_entry.exists():
            violations.append(Violation(
                rule_id="forbidden-express-serverless-entry",
                severity="error",
                message=f"Forbidden Express serverless entry '{bad_entry.relative_to(root_dir)}' detected. Dual-backend Express layers violate Law L8.",
                file_path=str(bad_entry.relative_to(root_dir)),
                suggestion="Delete Express serverless layer and route Vercel api/index.js through universal 'src/backend/adapters/httpsAdapter.ts' via nodeBridge."
            ))

    # 2.3.1 Ban on Express in server.ts (Law L8: ExpressLayers(a) = ∅)
    server_ts = root_dir / "server.ts"
    if server_ts.is_file():
        s_text = read_text_safe(server_ts)
        if re.search(r"\bfrom\s+['\"]express['\"]|\brequire\s*\(\s*['\"]express['\"]\s*\)", s_text):
            violations.append(Violation(
                rule_id="forbidden-express-dev-server",
                severity="error",
                message="Express usage detected in 'server.ts'. ExpressLayers(a) = ∅ requires dev servers to use node:http and adaptNodeRequest to call httpsAdapter.ts directly.",
                file_path="server.ts",
                suggestion="Replace Express in server.ts with node:http + Vite middleware delegating directly to adaptNodeRequest."
            ))

    # 2.4 Require nodeBridge.ts for Universal Node HTTP / Fetch bridging (Law L8)
    node_bridge_file = backend_dir / "adapters" / "nodeBridge.ts"
    if not node_bridge_file.exists():
        violations.append(Violation(
            rule_id="missing-node-bridge-adapter",
            severity="error",
            message="Node.js HTTP bridge 'src/backend/adapters/nodeBridge.ts' is missing.",
            file_path="src/backend/adapters/",
            suggestion="Create 'src/backend/adapters/nodeBridge.ts' to adapt Node HTTP requests to Web Standard fetch for Vercel/server.ts execution."
        ))
    else:
        files_scanned += 1
        nb_content = read_text_safe(node_bridge_file)
        if "adaptNodeRequest" not in nb_content:
            violations.append(Violation(
                rule_id="node-bridge-missing-export",
                severity="error",
                message="'src/backend/adapters/nodeBridge.ts' must export 'adaptNodeRequest'.",
                file_path=str(node_bridge_file.relative_to(root_dir)),
                suggestion="Export 'adaptNodeRequest(req, res, fetchHandler, env)'."
            ))

    # 3. Context-Neutral Flat Orchestrations
    orch_dir = backend_dir / "orchestrations"
    if orch_dir.exists() and orch_dir.is_dir():
        orch_subdirs = {d.name for d in orch_dir.iterdir() if d.is_dir()}
        if "client" in orch_subdirs or "server" in orch_subdirs:
            violations.append(Violation(
                rule_id="orchestrations-split-anti-pattern",
                severity="error",
                message="Orchestrations must be context-neutral and FLAT. Found 'client/' or 'server/' subfolder.",
                file_path=str(orch_dir.relative_to(root_dir)),
                suggestion="Remove client/server subdirectories in orchestrations; orchestrations sequence services identically in browser and worker."
            ))

    # 4. Service client/ and server/ slots
    services_dir = backend_dir / "services"
    if services_dir.exists() and services_dir.is_dir():
        for s_dir in services_dir.iterdir():
            if s_dir.is_dir() and not s_dir.name.startswith(".") and s_dir.name != "core":
                has_client = (s_dir / "client").exists()
                has_server = (s_dir / "server").exists()
                if not has_client or not has_server:
                    violations.append(Violation(
                        rule_id="service-missing-runtime-slots",
                        severity="warning",
                        message=f"Service '{s_dir.name}' should have both 'client/' and 'server/' implementation slots.",
                        file_path=str(s_dir.relative_to(root_dir)),
                        suggestion="Ensure service provides client/ (browser) and server/ (worker/node) folders."
                    ))

    # 5. Build Manifests
    manifest_fullstack = root_dir / "config" / "build" / "manifests" / "fullstack.json"
    manifest_api = root_dir / "config" / "build" / "manifests" / "api.json"
    if not manifest_fullstack.exists():
        violations.append(Violation(
            rule_id="missing-manifest-fullstack",
            severity="error",
            message="Target manifest 'config/build/manifests/fullstack.json' is missing.",
            file_path="config/build/manifests/",
            suggestion="Create 'fullstack.json' specifying build targets and inclusions."
        ))
    else:
        files_scanned += 1

    if not manifest_api.exists():
        violations.append(Violation(
            rule_id="missing-manifest-api",
            severity="error",
            message="Target manifest 'config/build/manifests/api.json' is missing.",
            file_path="config/build/manifests/",
            suggestion="Create 'api.json' specifying entrypoint and exclusions."
        ))
    else:
        files_scanned += 1

    # 6. Wrangler Configuration
    wrangler_file = root_dir / "wrangler.toml"
    if not wrangler_file.exists():
        violations.append(Violation(
            rule_id="missing-wrangler-toml",
            severity="error",
            message="Cloudflare Worker deployment manifest 'wrangler.toml' is missing.",
            file_path="wrangler.toml",
            suggestion="Create 'wrangler.toml' configured with main = 'dist/api/worker/index.js'."
        ))
    else:
        files_scanned += 1
        w_text = read_text_safe(wrangler_file)
        if "[build]" not in w_text or "command" not in w_text:
            violations.append(Violation(
                rule_id="wrangler-missing-build-command",
                severity="error",
                message="wrangler.toml is missing [build] command = 'npm run build'. Direct wrangler deploy will fail if worker bundle is not yet built.",
                file_path="wrangler.toml",
                suggestion="Add '[build]\\ncommand = \"npm run build\"' to wrangler.toml."
            ))
        if "[assets]" not in w_text:
            violations.append(Violation(
                rule_id="wrangler-missing-assets-configuration",
                severity="warning",
                message="wrangler.toml is missing '[assets]' configuration. Without assets, Cloudflare Workers will only serve API JSON and will not serve the frontend UI.",
                file_path="wrangler.toml",
                suggestion="Add '[assets]\\ndirectory = \"dist\"\\nbinding = \"ASSETS\"\\nnot_found_handling = \"single-page-application\"' to wrangler.toml."
            ))
        else:
            is_vite_project = (root_dir / "vite.config.ts").exists() or (root_dir / "vite.config.js").exists()
            if is_vite_project and 'directory = "dist/client"' in w_text:
                violations.append(Violation(
                    rule_id="wrangler-assets-directory-mismatch",
                    severity="error",
                    message="wrangler.toml specifies directory = 'dist/client' for a Vite app, but Vite outputs to 'dist'. This causes Cloudflare to fail serving frontend assets.",
                    file_path="wrangler.toml",
                    suggestion="Change [assets] directory to 'dist' (or './dist') in wrangler.toml."
                ))

            # Check 6.0a: Mandatory run_worker_first = true (Law L24: Prevents API routing 404 bypass)
            if "run_worker_first" not in w_text:
                violations.append(Violation(
                    rule_id="wrangler-missing-run-worker-first",
                    severity="error",
                    message="wrangler.toml is missing 'run_worker_first = true' in [assets]. Without this, Cloudflare edge may route API requests to static storage and return 404.",
                    file_path="wrangler.toml",
                    suggestion="Add 'run_worker_first = true' under [assets] in wrangler.toml."
                ))
            elif "run_worker_first = [" in w_text:
                violations.append(Violation(
                    rule_id="wrangler-array-run-worker-first-forbidden",
                    severity="error",
                    message="wrangler.toml uses array syntax for 'run_worker_first'. Glob patterns fail on edge routing; must be boolean 'run_worker_first = true'.",
                    file_path="wrangler.toml",
                    suggestion="Change 'run_worker_first = [...]' to 'run_worker_first = true' under [assets] in wrangler.toml."
                ))

    # 6.1 Single Universal Build Pipeline Script Check (Law L22)
    skipo_build_file = root_dir / "scripts" / "skipo-build.cjs"
    if skipo_build_file.exists():
        files_scanned += 1
        build_text = read_text_safe(skipo_build_file)
        has_adapter = "httpsAdapter" in build_text or "universalEntry" in build_text
        has_frontend_build = "vite build" in build_text or "next build" in build_text
        if not has_frontend_build or not has_adapter:
            violations.append(Violation(
                rule_id="skipo-build-incomplete-pipeline",
                severity="warning",
                message="scripts/skipo-build.cjs should compile both frontend (vite build or next build) and universal backend adapter (universalEntry.ts or httpsAdapter.ts) in a single pass (Law L22).",
                file_path="scripts/skipo-build.cjs",
                suggestion="Ensure skipo-build.cjs builds frontend (Vite or Next.js) and bundles universalEntry.ts for multi-cloud deployments."
            ))

    # 7. tsconfig.api.json
    tsconfig_api = root_dir / "tsconfig.api.json"
    if tsconfig_api.exists():
        files_scanned += 1

    # 8. Single Universal Build Script in package.json (Law L22)
    pkg_file = root_dir / "package.json"
    is_vite = False
    if pkg_file.exists():
        files_scanned += 1
        try:
            pkg_data = json.loads(read_text_safe(pkg_file))
            scripts = pkg_data.get("scripts", {})
            if "build" not in scripts:
                violations.append(Violation(
                    rule_id="missing-script-build",
                    severity="error",
                    message="package.json missing required build script 'build'.",
                    file_path="package.json",
                    suggestion="Add '\"build\": \"node scripts/skipo-build.cjs\"' to package.json."
                ))
            if "dev" not in scripts:
                violations.append(Violation(
                    rule_id="missing-script-dev",
                    severity="error",
                    message="package.json missing required dev script 'dev'.",
                    file_path="package.json",
                    suggestion="Add '\"dev\": \"tsx server.ts\"' to package.json."
                ))

            # 9. Framework Anti-Hallucination (Ban 'next' in Vite-based apps)
            deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
            is_vite = "vite" in deps or (root_dir / "vite.config.ts").exists() or (root_dir / "vite.config.js").exists()
            if is_vite and "next" in deps:
                violations.append(Violation(
                    rule_id="vite-app-forbidden-next-dependency",
                    severity="error",
                    message="Vite app declares 'next' in package.json, causing Vercel to misdetect framework as Next.js and fail on missing '.next'.",
                    file_path="package.json",
                    suggestion="Remove 'next' from dependencies and devDependencies in package.json."
                ))
        except Exception as e:
            violations.append(Violation(
                rule_id="invalid-package-json",
                severity="error",
                message=f"Failed to parse package.json: {e}",
                file_path="package.json"
            ))

    # 10. Lockfile Purity (Ban conflicting multiple lockfiles)
    has_npm = (root_dir / "package-lock.json").exists()
    has_bun = (root_dir / "bun.lock").exists() or (root_dir / "bun.lockb").exists()
    has_pnpm = (root_dir / "pnpm-lock.yaml").exists()
    has_yarn = (root_dir / "yarn.lock").exists()
    lockfiles_found = sum([has_npm, has_bun, has_pnpm, has_yarn])
    if lockfiles_found > 1:
        conflicts = [n for n, exists in [("package-lock.json", has_npm), ("bun.lock", has_bun), ("pnpm-lock.yaml", has_pnpm), ("yarn.lock", has_yarn)] if exists]
        violations.append(Violation(
            rule_id="conflicting-lockfiles-detected",
            severity="error",
            message=f"Multiple conflicting lockfiles detected ({', '.join(conflicts)}). Causes Cloudflare/CI frozen-lockfile version failures.",
            file_path="bun.lock" if has_bun else conflicts[0],
            suggestion="Delete secondary lockfiles and standardize on a single lockfile matching your primary package manager."
        ))

    # 11. Vercel Fullstack Routing Contract
    vercel_file = root_dir / "vercel.json"
    if vercel_file.exists():
        files_scanned += 1
        try:
            v_data = json.loads(read_text_safe(vercel_file))
            rewrites = v_data.get("rewrites", [])
            has_api_rewrite = any("/api" in r.get("source", "") for r in rewrites)
            if not has_api_rewrite and is_vite:
                violations.append(Violation(
                    rule_id="vercel-missing-api-rewrite",
                    severity="warning",
                    message="vercel.json in fullstack Vite app should declare an /api/(.*) rewrite to /api.",
                    file_path="vercel.json",
                    suggestion="Add { 'source': '/api/(.*)', 'destination': '/api' } to vercel.json rewrites."
                ))
        except Exception:
            pass


    errors = [v for v in violations if v.severity == "error"]
    passed = len(errors) == 0
    score = max(0.0, 100.0 - (len(errors) * 15.0 + len([v for v in violations if v.severity == "warning"]) * 5.0))

    return ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=passed,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=(time.time() - start_time) * 1000,
        score=score
    )

def main():
    args = parse_standard_args("Aspect 11: MULTI_TARGET_BUILD_SPEC Validator")
    root_path = Path(args.path).resolve()
    result = validate_multi_target_build_spec(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
