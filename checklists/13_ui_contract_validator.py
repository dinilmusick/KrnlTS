#!/usr/bin/env python3
"""Aspect 13: Service UI Contract & Provenance Governance Validator
Spec: ECOSYSTEM-TIGHTENING-PLAN §6-§14, KRUSBL-PLAN-PATCH §1, §13, §19 (< 200 lines)."""

from pathlib import Path
import json, re, sys, time
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

ASPECT_ID = "aspect_13_ui_contract"
ASPECT_TITLE = "Service UI Contract & Provenance Governance"

BOOTSTRAP_SERVICES: Dict[str, Dict[str, Any]] = {
    "auth": {"service_id": "kloks.service.auth", "package": "@ultrst-armada/kloks", "symbols": ["AuthService", "AuthClientServiceFacade"], "requirement_mode": "required", "canonical_component": "AuthPage", "canonical_export": "@ultrst-armada/floks/ui"},
    "storage": {"service_id": "kloks.service.storage", "package": "@ultrst-armada/kloks", "symbols": ["StorageService", "StorageClientServiceFacade"], "requirement_mode": "optional", "canonical_component": "WorkspaceTilesMenu", "canonical_export": "@ultrst-armada/floks/ui"},
    "systemDb": {"service_id": "kloks.service.systemDb", "package": "@ultrst-armada/kloks", "symbols": ["SystemDbService"], "requirement_mode": "none", "canonical_component": None, "canonical_export": None},
}

def load_services(root_dir: Path) -> Dict[str, Dict[str, Any]]:
    services: Dict[str, Dict[str, Any]] = {}
    manifest_paths = [
        root_dir / "node_modules/@ultrst-armada/kloks/packages/services/kloks.manifest.json",
        root_dir / "kloks.manifest.json",
        Path(__file__).resolve().parent.parent.parent / "Kloks/packages/services/kloks.manifest.json",
    ]
    for p in manifest_paths:
        if p.exists():
            try:
                data = json.loads(p.read_text())
                pkg_name = data.get("package", "@ultrst-armada/kloks")
                for s in data.get("services", []):
                    sid, name = s.get("id", ""), s.get("name", "")
                    backend, ui = s.get("backend", {}), s.get("ui", {})
                    facade = backend.get("facade", name)
                    req_mode = ui.get("requirementMode", "none") if ui else "none"
                    comp = ui.get("component") if ui else None
                    exp = f"{ui.get('package', '@ultrst-armada/floks')}/{ui.get('export', 'ui')}" if comp else None
                    key = sid.replace("kloks.service.", "")
                    services[key] = {
                        "service_id": sid, "package": pkg_name, "symbols": [facade, name, f"{key}Service"],
                        "export_path": backend.get("export"), "requirement_mode": req_mode,
                        "canonical_component": comp, "canonical_export": exp,
                    }
            except Exception:
                pass
    return services if services else dict(BOOTSTRAP_SERVICES)

def extract_imports(content: str) -> List[tuple]:
    results = []
    clean = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    for line in clean.splitlines():
        trimmed = line.strip()
        if trimmed.startswith('//'): continue
        m = re.search(r"""(?:import|export)\s+(?:type\s+)?(?:([\w$]+)\s*,?\s*)?(?:(?:\*\s+as\s+[\w$]+)|\{([^}]+)\})?\s*from\s*['"]([^'"]+)['"]""", trimmed)
        if m:
            default_spec, named_specs, source = m.group(1), m.group(2), m.group(3)
            specs = set()
            if default_spec: specs.add(default_spec)
            if named_specs:
                for part in named_specs.split(','):
                    c = part.strip()
                    if c:
                        nm = re.search(r"""(?:[\w$]+\s+as\s+)?([\w$]+)""", c)
                        if nm: specs.add(nm.group(1))
            results.append((specs, source))
    return results

def validate_ui_contracts(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    active_services = load_services(root_dir)
    all_files = scan_files(root_dir, extensions=[".ts", ".tsx", ".js", ".jsx"])
    files_scanned = len(all_files)

    imported_services: Set[str] = set()
    used_ui_components: Set[str] = set()
    used_provenance_services: Set[str] = set()

    for file_path in all_files:
        rel_path = str(file_path.relative_to(root_dir))
        content = read_text_safe(file_path)

        if "@floks/ui" in content:
            for idx, line in enumerate(content.splitlines(), start=1):
                if "@floks/ui" in line and not line.strip().startswith("//"):
                    violations.append(Violation(
                        rule_id="banned-stale-floks-alias", severity="error",
                        message="Stale '@floks/ui' import path detected. Must use canonical '@ultrst-armada/floks/ui'.",
                        file_path=rel_path, line=idx, snippet=line.strip(),
                        suggestion="Replace from '@floks/ui' with from '@ultrst-armada/floks/ui'"
                    ))

        # AST import resolution for services and UI components
        file_imports = extract_imports(content)
        for specs, source in file_imports:
            for svc_key, svc_info in active_services.items():
                svc_pkg = svc_info.get("package", "@ultrst-armada/kloks")
                if source.startswith(svc_pkg) or "kloks" in source:
                    symbols = set(svc_info.get("symbols", []))
                    if any(s in specs for s in symbols) or (svc_info.get("export_path") and svc_info["export_path"] in source):
                        imported_services.add(svc_key)
                comp = svc_info.get("canonical_component")
                if comp and comp in specs and ("floks" in source or "@ultrst-armada/floks" in source):
                    used_ui_components.add(comp)

        if "@skipo:service" in content:
            for line in content.splitlines():
                if "@skipo:service" in line and not line.strip().startswith("/*"):
                    parts = line.split("@skipo:service")
                    if len(parts) > 1:
                        used_provenance_services.add(parts[1].strip())

        if ("export const AuthPage" in content or "export function AuthPage" in content) and "@ultrst-armada/floks" not in content:
            violations.append(Violation(
                rule_id="duplicate-canonical-auth-page",
                severity="error",
                message="Local duplicate implementation of canonical FLOKS 'AuthPage' detected.",
                file_path=rel_path,
                suggestion="Import canonical AuthPage from '@ultrst-armada/floks/ui' instead of redefining locally."
            ))
        if ("export const WorkspaceTilesMenu" in content or "export function WorkspaceTilesMenu" in content) and "@ultrst-armada/floks" not in content:
            violations.append(Violation(
                rule_id="duplicate-canonical-workspace-tiles",
                severity="error",
                message="Local duplicate implementation of canonical FLOKS 'WorkspaceTilesMenu' detected.",
                file_path=rel_path,
                suggestion="Import canonical WorkspaceTilesMenu from '@ultrst-armada/floks/ui' instead of redefining locally."
            ))

    for svc_key in imported_services:
        svc_info = active_services[svc_key]
        mode = svc_info["requirement_mode"]
        comp = svc_info["canonical_component"]
        svc_id = svc_info["service_id"]
        is_consumed = (comp in used_ui_components) or (svc_id in used_provenance_services)

        if mode == "required" and not is_consumed:
            violations.append(Violation(
                rule_id="required-service-ui-unused",
                severity="error",
                message=f"Service '{svc_id}' has requirementMode: REQUIRED, but its canonical UI '{comp}' is not consumed.",
                file_path="src/frontend",
                suggestion=f"Import '{comp}' from '{svc_info['canonical_export']}'."
            ))
        elif mode == "optional" and not is_consumed:
            violations.append(Violation(
                rule_id="optional-service-ui-unused",
                severity="warning",
                message=f"Service '{svc_id}' has requirementMode: OPTIONAL, and its UI '{comp}' is unused.",
                file_path="src/frontend",
                suggestion=f"Consider importing '{comp}' from '{svc_info['canonical_export']}'."
            ))

    passed = not any(v.severity == "error" for v in violations)
    return ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=passed,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=round((time.time() - start_time) * 1000, 2)
    )

if __name__ == "__main__":
    args = parse_standard_args("Validate Service UI Contracts & Provenance")
    res = validate_ui_contracts(Path(args.path).resolve())
    print_checklist_report(res)
    sys.exit(0 if res.passed else 1)
