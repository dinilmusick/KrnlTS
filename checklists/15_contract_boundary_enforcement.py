#!/usr/bin/env python3
"""
checklists/15_contract_boundary_enforcement.py - Aspect 15: Contract Boundary Enforcement Validator.
Pure Python 3 standard library ONLY - zero pip dependencies.

Enforces docs/02_CONTRACT_BOUNDARY_ENFORCEMENT.md:
- Rule 15.1: Banned Internal Imports (no node_modules/*/internal/*, ../sibling/src/*, deep internal paths)
- Rule 15.2: Local Canonical Symbol Shim Detector (no local duplicate declarations of canonical library symbols)
- Rule 15.3: Canonical Public Import Enforcement (must use valid @ultrst-armada/kloks/* or @ultrst-armada/floks/* subpaths)
- Rule 15.4: Consumer Contract Requirements Verification (InstalledContract ⊇ ConsumerRequirements)
"""

from pathlib import Path
from typing import List, Dict, Set, Optional, Any
import re
import time
import json
import os

try:
    from .common import ChecklistResult, Violation
except ImportError:
    from common import ChecklistResult, Violation

CANONICAL_LIBRARY_SYMBOLS = {
    # State-Graph & Sockets
    "GraphEntityMetadata": "@ultrst-armada/kloks/state-graph",
    "SocketPosition2D": "@ultrst-armada/kloks/state-graph",
    "SocketGeometryConfig": "@ultrst-armada/kloks/state-graph",
    "SocketStyleConfig": "@ultrst-armada/kloks/state-graph",
    "AudioStereoSocket": "@ultrst-armada/kloks/state-graph",
    "AudioMonoSocket": "@ultrst-armada/kloks/state-graph",
    "AudioPacketSocket": "@ultrst-armada/kloks/state-graph",
    "TriggerSocket": "@ultrst-armada/kloks/state-graph",
    "MidiStreamSocket": "@ultrst-armada/kloks/state-graph",
    "CurveStreamSocket": "@ultrst-armada/kloks/state-graph",
    "ComponentSocket": "@ultrst-armada/kloks/state-graph",
    "PrimitiveSocket": "@ultrst-armada/kloks/state-graph",
    "createSocketInstance": "@ultrst-armada/kloks/state-graph",
    # Wires
    "WireEndpoint2D": "@ultrst-armada/kloks/state-graph",
    "WireCurveStyle": "@ultrst-armada/kloks/state-graph",
    "WireVisualConfig": "@ultrst-armada/kloks/state-graph",
    "createWireInstance": "@ultrst-armada/kloks/state-graph",
    # Nodes
    "GraphNodeParent": "@ultrst-armada/kloks/state-graph",
    "NodeDimensions2D": "@ultrst-armada/kloks/state-graph",
    "createNodeInstance": "@ultrst-armada/kloks/state-graph",
    "StateLifecycleServiceFacade": "@ultrst-armada/kloks/state-graph",
    "NodeGraphEngineServiceFacade": "@ultrst-armada/kloks/state-graph",
    # Audio-Midi
    "AudioHardwareServiceFacade": "@ultrst-armada/kloks/audio-midi",
    "MidiServiceFacade": "@ultrst-armada/kloks/audio-midi",
    "AudioMidiOrchestratorFacade": "@ultrst-armada/kloks/audio-midi",
    # Orchestrations
    "WorkspaceBackendFacade": "@ultrst-armada/kloks/orchestrations",
    # Floks UI
    "UIParent": "@ultrst-armada/floks/ui",
    "ButtonModel": "@ultrst-armada/floks/ui",
    "ButtonProps": "@ultrst-armada/floks/ui",
    "PanelModel": "@ultrst-armada/floks/ui",
    "PanelProps": "@ultrst-armada/floks/ui",
    "AppShell": "@ultrst-armada/floks/ui",
    "TopToolbar": "@ultrst-armada/floks/ui",
    "BottomStrip": "@ultrst-armada/floks/ui",
    "BaseButton": "@ultrst-armada/floks/ui",
    "BaseCard": "@ultrst-armada/floks/ui",
    "BaseInput": "@ultrst-armada/floks/ui",
    "BaseSelect": "@ultrst-armada/floks/ui",
    "BaseToggle": "@ultrst-armada/floks/ui",
    "BaseBadge": "@ultrst-armada/floks/ui",
    "LoginModal": "@ultrst-armada/floks/ui",
    "CredentialField": "@ultrst-armada/floks/ui",
    "WorkspaceTilesMenu": "@ultrst-armada/floks/ui",
    "StatusIndicator": "@ultrst-armada/floks/ui",
    "ConfirmDialog": "@ultrst-armada/floks/ui",
    "FloatingDetailsPanel": "@ultrst-armada/floks/ui",
    "SettingsTab": "@ultrst-armada/floks/ui",
    "InfiniteCanvas": "@ultrst-armada/floks/canvas-ui",
    "DockBar": "@ultrst-armada/floks/canvas-ui",
    "TileGrid": "@ultrst-armada/floks/canvas-ui",
    "MonacoEditor": "@ultrst-armada/floks/canvas-ui",
}

VALID_KLOKS_SUBPATHS = {
    "",
    "client",
    "shared",
    "functions",
    "state-graph",
    "state-graph/state",
    "state-graph/domain",
    "state-graph/rules",
    "state-graph/spatial",
    "state-graph/store",
    "audio-midi",
    "services",
    "backend",
    "backend/client",
    "backend/krnl-services",
    "orchestrations",
    "contracts",
    "development",
    "ai-provider",
    "ai-inference",
    "ai-models",
    "ai-routing",
    "ai-keys",
    "ai-tools",
    "krnl-ai-services",
    "auth",
}

DATABASE_PACKAGES = {
    "better-sqlite3", "sqlite3", "pg", "mysql", "mysql2",
    "@neondatabase/serverless", "@supabase/supabase-js",
    "typeorm", "prisma", "@prisma/client", "drizzle-orm"
}
DATABASE_PREFIXES = ("@aws-sdk/", "@google-cloud/", "firebase-admin")

SERVER_PACKAGES = {"bullmq", "ioredis", "redis"}
NODE_BUILTINS = {
    "fs", "node:fs", "path", "node:path", "crypto", "node:crypto",
    "child_process", "node:child_process", "net", "node:net",
    "os", "node:os", "http", "node:http", "https", "node:https",
    "stream", "node:stream", "cluster", "node:cluster",
    "worker_threads", "node:worker_threads"
}
BACKEND_ONLY_SYMBOLS = {
    "SrklCredentialRegistry", "globalCredentialRegistry", "nodeGraphPersistence",
    "RemoteWorkspaceService", "WorkingWorkspaceService", "BackendFacade",
    "WorkerExecutionBoundary", "backendFacade", "workerExecutionBoundary",
    "ExecutableBackendFacade"
}

VALID_FLOKS_SUBPATHS = {
    "",
    "ui",
    "canvas-ui",
    "contracts",
    "auth",
}

IMPORT_REGEX = re.compile(
    r"""import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]*\})|(?:[\w\s,{}*]+))\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE
)

# Pattern detecting actual local declarations (interface Foo {, type Foo =, class Foo {, const Foo =, etc.)
LOCAL_DECL_REGEX = re.compile(
    r"""^\s*(?:export\s+)?(?:interface\s+([A-Za-z0-9_]+)\s*(?:\{|<|extends)|type\s+([A-Za-z0-9_]+)\s*(?:<[^=]*>)?\s*=|class\s+([A-Za-z0-9_]+)\s*(?:\{|<|extends|implements)|function\s+([A-Za-z0-9_]+)\s*(?:<|\()|const\s+([A-Za-z0-9_]+)\s*(?::|=))""",
    re.MULTILINE
)

def validate_contract_boundaries(target: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    files_scanned = 0

    target = target.resolve()
    is_kloks = False
    is_floks = False
    target_pkg = target / "package.json"
    if target_pkg.exists():
        try:
            pkg_data = json.loads(target_pkg.read_text(encoding="utf-8"))
            p_name = pkg_data.get("name", "")
            if "@ultrst-armada/kloks" in p_name or p_name == "kloks":
                is_kloks = True
            elif "@ultrst-armada/floks" in p_name or p_name == "floks":
                is_floks = True
        except Exception:
            pass
    if "Kloks" in target.parts:
        is_kloks = True
    if "Floks" in target.parts:
        is_floks = True

    if target.is_file():
        code_files = [target]
    else:
        code_files = [
            f for f in target.rglob("*")
            if f.suffix in {".ts", ".tsx", ".js", ".jsx"}
            and "node_modules" not in f.parts
            and ".git" not in f.parts
            and "dist" not in f.parts
            and "build" not in f.parts
            and ".next" not in f.parts
            and not f.name.endswith(".d.ts")
        ]

    for fpath in code_files:
        files_scanned += 1
        rel_path = str(fpath.relative_to(target)) if not target.is_file() else fpath.name

        try:
            content = fpath.read_text(encoding="utf-8")
        except Exception:
            continue

        rel_posix = rel_path.replace("\\", "/")
        is_fixture = "fixture" in rel_posix.lower() or "temp" in rel_posix.lower() or "skipo_fixture" in str(fpath).lower()
        is_test_file = any(t in rel_posix for t in [".test.", ".spec.", "__tests__/"]) and not is_fixture

        is_ui = (not is_kloks and not is_floks and not is_test_file) and (
            "src/frontend/" in rel_posix or
            "/frontend/" in rel_posix or
            "/components/" in rel_posix or
            "/canvas-ui/" in rel_posix or
            "/ui/" in rel_posix or
            "scaffolds/nextjs/app/" in rel_posix or
            "scaffolds/vite/app/" in rel_posix or
            (fpath.suffix in {".tsx", ".jsx"} and not any(k in rel_posix for k in ["backend/", "worker/", "api/", "server/"]))
        )

        is_worker = (not is_kloks and not is_floks and not is_test_file) and (
            "/worker/" in rel_posix or
            "/workers/" in rel_posix or
            "worker." in fpath.name.lower() or
            fpath.name.lower().endswith("worker.ts") or
            fpath.name.lower().endswith("worker.js")
        )

        lines = content.splitlines()

        # Check 1: Forbidden internal imports
        for idx, line in enumerate(lines, 1):
            for match in IMPORT_REGEX.finditer(line):
                import_src = match.group(1)

                # Ban 1: internal paths
                if "/internal" in import_src:
                    violations.append(Violation(
                        rule_id="15.1-internal-import-banned",
                        severity="error",
                        message=f"Forbidden internal import '{import_src}'. Consumer must only import public library entrypoints.",
                        file_path=rel_path,
                        line=idx,
                        snippet=line.strip(),
                        suggestion="Import from canonical package export surface instead of internal path."
                    ))

                # Ban 2: raw source path imports across packages (importing another package's /src/ or ../<Package>/src/)
                is_internal_pkg_ref = (is_kloks and ("/packages/" in import_src or import_src.startswith("./") or import_src.startswith("../"))) or \
                                      (is_floks and ("/packages/" in import_src or import_src.startswith("./") or import_src.startswith("../")))
                if not is_internal_pkg_ref:
                    if re.search(r"@(?:ultrst-armada/)?(?:kloks|floks)/.*/src/", import_src) or \
                       re.search(r"\.\./(?:Floks|Kloks|Theta|Skipo|Qwnsr)/.*src/", import_src) or \
                       (not (is_kloks or is_floks) and "/packages/" in import_src):
                        violations.append(Violation(
                            rule_id="15.6-raw-src-import-banned",
                            severity="error",
                            message=f"Forbidden raw source/package import '{import_src}'.",
                            file_path=rel_path,
                            line=idx,
                            snippet=line.strip(),
                            suggestion="Use canonical package subpath without /src/ or /packages/."
                        ))

                # Ban 3: invalid subpaths on @ultrst-armada/kloks
                if import_src.startswith("@ultrst-armada/kloks/") or import_src.startswith("@kloks/"):
                    prefix = "@ultrst-armada/kloks/" if import_src.startswith("@ultrst-armada/kloks/") else "@kloks/"
                    subpath = import_src[len(prefix):]
                    if subpath not in VALID_KLOKS_SUBPATHS:
                        violations.append(Violation(
                            rule_id="15.3-invalid-public-subpath",
                            severity="error",
                            message=f"Unknown or unexported Kloks subpath '{subpath}' in import '{import_src}'.",
                            file_path=rel_path,
                            line=idx,
                            snippet=line.strip(),
                            suggestion=f"Valid subpaths are: {', '.join(sorted(VALID_KLOKS_SUBPATHS))}"
                        ))

                # Ban 4: invalid subpaths on @ultrst-armada/floks
                if import_src.startswith("@ultrst-armada/floks/") or import_src.startswith("@floks/"):
                    prefix = "@ultrst-armada/floks/" if import_src.startswith("@ultrst-armada/floks/") else "@floks/"
                    subpath = import_src[len(prefix):]
                    if subpath not in VALID_FLOKS_SUBPATHS:
                        violations.append(Violation(
                            rule_id="15.3-invalid-public-subpath",
                            severity="error",
                            message=f"Unknown or unexported Floks subpath '{subpath}' in import '{import_src}'.",
                            file_path=rel_path,
                            line=idx,
                            snippet=line.strip(),
                            suggestion=f"Valid subpaths are: {', '.join(sorted(VALID_FLOKS_SUBPATHS))}"
                        ))

                # Ban 5: UI execution boundary violations
                if is_ui:
                    # UI -> backend implementation
                    is_kloks_backend = (
                        import_src == "@ultrst-armada/kloks/backend" or
                        (import_src.startswith("@ultrst-armada/kloks/backend/") and import_src != "@ultrst-armada/kloks/backend/client") or
                        import_src == "@kloks/backend" or
                        (import_src.startswith("@kloks/backend/") and import_src != "@kloks/backend/client")
                    )
                    if is_kloks_backend:
                        violations.append(Violation(
                            rule_id="15.9-ui-backend-import-forbidden",
                            severity="error",
                            message=f"UI component directly imports backend implementation '{import_src}'. Frontend must only import '@ultrst-armada/kloks/client' or route through API.",
                            file_path=rel_path,
                            line=idx,
                            snippet=line.strip(),
                            suggestion="Move backend operations behind an authenticated API endpoint or use client-safe contract imports."
                        ))

                    # UI -> database/provider
                    if import_src in DATABASE_PACKAGES or any(import_src.startswith(p) for p in DATABASE_PREFIXES):
                        violations.append(Violation(
                            rule_id="15.10-ui-database-provider-forbidden",
                            severity="error",
                            message=f"UI component directly imports database or provider SDK '{import_src}'.",
                            file_path=rel_path,
                            line=idx,
                            snippet=line.strip(),
                            suggestion="Database and cloud provider interactions must reside strictly in server/backend services."
                        ))

                    # UI -> BullMQ / Node builtins
                    if import_src in SERVER_PACKAGES or import_src in NODE_BUILTINS:
                        violations.append(Violation(
                            rule_id="15.11-ui-server-builtin-forbidden",
                            severity="error",
                            message=f"UI component imports server queue or Node builtin module '{import_src}'.",
                            file_path=rel_path,
                            line=idx,
                            snippet=line.strip(),
                            suggestion="Frontend code must be pure and browser-safe. Remove server-only modules."
                        ))

                # Ban 6: Worker direct service bypass
                if is_worker:
                    if "@ultrst-armada/kloks/services" in import_src or "@kloks/services" in import_src or "/services/" in import_src:
                        violations.append(Violation(
                            rule_id="15.12-worker-direct-service-forbidden",
                            severity="error",
                            message=f"Worker directly imports domain service '{import_src}' bypassing BackendFacade.",
                            file_path=rel_path,
                            line=idx,
                            snippet=line.strip(),
                            suggestion="Dispatch operations through BackendFacade or WorkerExecutionBoundary instead of direct service invocation."
                        ))

        # Check 1.1: Worker must route through BackendFacade / WorkerExecutionBoundary
        if is_worker:
            has_facade = any(k in content for k in [
                "BackendFacade",
                "WorkerExecutionBoundary",
                "backendFacade",
                "workerExecutionBoundary",
                "ExecutableBackendFacade"
            ])
            if not has_facade:
                violations.append(Violation(
                    rule_id="15.13-worker-missing-facade",
                    severity="error",
                    message=f"Worker entrypoint '{rel_path}' does not route execution through BackendFacade / WorkerExecutionBoundary.",
                    file_path=rel_path,
                    line=1,
                    snippet="",
                    suggestion="Worker must process jobs strictly through WorkerExecutionBoundary and BackendFacade."
                ))

        # Check 2: Local canonical symbol shim detection & Export authorization
        in_reexport_block = False
        for idx, line in enumerate(lines, 1):
            stripped = line.strip()

            if "export {" in stripped and " from " not in stripped:
                in_reexport_block = True
            if in_reexport_block:
                if "} from " in stripped or "};" in stripped:
                    in_reexport_block = False
                continue

            if stripped.startswith("import ") or " from " in stripped:
                continue

            match = LOCAL_DECL_REGEX.match(line)
            if match:
                # Find which group captured the symbol name
                sym = next((g for g in match.groups() if g is not None), None)
                if sym and sym in CANONICAL_LIBRARY_SYMBOLS:
                    canonical_src = CANONICAL_LIBRARY_SYMBOLS[sym]
                    if is_kloks and canonical_src.startswith("@ultrst-armada/kloks"):
                        continue
                    if is_floks and canonical_src.startswith("@ultrst-armada/floks"):
                        continue
                    violations.append(Violation(
                        rule_id="15.2-local-canonical-shim-detected",
                        severity="error",
                        message=f"Local definition of canonical library symbol '{sym}' detected. Local shims are strictly forbidden.",
                        file_path=rel_path,
                        line=idx,
                        snippet=stripped,
                        suggestion=f"Delete local definition and import '{sym}' from canonical library '{canonical_src}'."
                    ))

    # Check 3: Installed Contract vs Consumer Requirements & Export Authorization
    skipo_contracts_dir = target / ".skipo" / "contracts"
    if skipo_contracts_dir.is_dir():
        for req_file in skipo_contracts_dir.glob("*.json"):
            try:
                data = json.loads(req_file.read_text(encoding="utf-8"))
                req_symbols = data.get("requiredSymbols", [])
                public_symbols = set(data.get("publicSymbols", []))
                for sym in req_symbols:
                    if public_symbols and sym not in public_symbols:
                        violations.append(Violation(
                            rule_id="15.4-incompatible-contract-requirement",
                            severity="error",
                            message=f"Required symbol '{sym}' in {req_file.name} is missing from installed library public contract.",
                            file_path=str(req_file.relative_to(target)),
                            suggestion="Upgrade library or reconcile required symbol names."
                        ))

                # Export authorization check:
                approved_exports = set(data.get("approvedExports", []))
                exported_symbols = data.get("exportedSymbols", [])
                if approved_exports and exported_symbols:
                    for sym in exported_symbols:
                        if sym not in approved_exports:
                            violations.append(Violation(
                                rule_id="15.5-unauthorized-symbol-export",
                                severity="error",
                                message=f"Package exports unauthorized symbol '{sym}' not in approved public contract.",
                                file_path=str(req_file.relative_to(target)),
                                suggestion="Remove symbol export or add it to approved public contract manifest."
                            ))
            except Exception:
                pass

    # Check 4: Filesystem escapes in tsconfig.json and vite.config.ts
    tsconfig_file = target / "tsconfig.json"
    if tsconfig_file.exists():
        try:
            ts_content = tsconfig_file.read_text(encoding="utf-8")
            if re.search(r'"\.\./(?:Floks|Kloks|Theta|Skipo|Qwnsr)', ts_content):
                violations.append(Violation(
                    rule_id="15.7-filesystem-escape-detected",
                    severity="error",
                    message="Filesystem escape detected in tsconfig.json: references sibling package directory directly.",
                    file_path="tsconfig.json",
                    suggestion="Use canonical package names installed in node_modules."
                ))
        except Exception:
            pass

    vite_file = target / "vite.config.ts"
    if vite_file.exists():
        try:
            vite_content = vite_file.read_text(encoding="utf-8")
            if re.search(r'resolve\([^)]*"\.\./(?:Floks|Kloks|Theta|Skipo|Qwnsr)', vite_content) or re.search(r'"\.\./(?:Floks|Kloks|Theta|Skipo|Qwnsr)', vite_content):
                violations.append(Violation(
                    rule_id="15.7-filesystem-escape-detected",
                    severity="error",
                    message="Filesystem escape detected in vite.config.ts: references sibling package directory directly.",
                    file_path="vite.config.ts",
                    suggestion="Use canonical package names installed in node_modules."
                ))
        except Exception:
            pass

    # Check 5: Disaggregated package names in package.json
    if target_pkg.exists():
        try:
            pkg_data = json.loads(target_pkg.read_text(encoding="utf-8"))
            for dep_type in ("dependencies", "devDependencies", "peerDependencies"):
                deps = pkg_data.get(dep_type, {})
                for dep_name in deps.keys():
                    if dep_name.startswith("@kloks/") or dep_name.startswith("@floks/"):
                        violations.append(Violation(
                            rule_id="15.8-disaggregated-package-name-detected",
                            severity="error",
                            message=f"Disaggregated package name '{dep_name}' declared in {dep_type}. Must use canonical unified package identity '@ultrst-armada/kloks' or '@ultrst-armada/floks'.",
                            file_path="package.json",
                            suggestion="Replace with '@ultrst-armada/kloks' or '@ultrst-armada/floks'."
                        ))
        except Exception:
            pass

    duration = (time.time() - start_time) * 1000.0
    passed = len(violations) == 0
    score = 100.0 if passed else max(0.0, 100.0 - (len(violations) * 10.0))

    return ChecklistResult(
        aspect_id="aspect_15",
        aspect_title="Contract Boundary Enforcement",
        passed=passed,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=duration,
        score=score,
    )

if __name__ == "__main__":
    import sys
    target_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    res = validate_contract_boundaries(target_path)
    print(f"Aspect 15: {res.aspect_title} - {'PASSED' if res.passed else 'FAILED'} (Score: {res.score:.1f}%)")
    for v in res.violations:
        print(f"  [{v.severity.upper()}] {v.file_path}:{v.line} - {v.message}")
    sys.exit(0 if res.passed else 1)
