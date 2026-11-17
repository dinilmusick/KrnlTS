#!/usr/bin/env python3
"""Aspect 14: Package Export Boundary & Sub-Path Validator
Spec: ECOSYSTEM-TIGHTENING-PLAN §14, KRUSBL-PLAN-PATCH §7, §13 (< 200 lines)."""

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

ASPECT_ID = "aspect_14_package_export"
ASPECT_TITLE = "Package Export Boundary & Sub-Path Governance"

# Optional bootstrap fallback only if package metadata cannot be located on disk
BOOTSTRAP_FALLBACK_EXPORTS: Dict[str, Set[str]] = {
    "@ultrst-armada/floks": {"ui", "canvas-ui", "contracts"},
    "@ultrst-armada/kloks": {
        "services", "contracts", "backend", "client", "audio-midi", "functions",
        "orchestrations", "state-graph", "krnl-ai-services",
        "semantic-runtime", "development", "ai-provider", "ai-inference",
        "ai-models", "ai-routing", "ai-keys", "ai-tools", "shared",
        "auth", "fod", "aiko", "wasm-runtime"
    },
    "@ultrst-armada/krnl": set(),
}

def load_package_exports(root_dir: Path) -> Dict[str, Set[str]]:
    approved: Dict[str, Set[str]] = {}
    skipo_root = Path(__file__).resolve().parent.parent
    search_dirs = [
        root_dir / "node_modules/@ultrst-armada",
        root_dir / "node_modules",
        skipo_root / "node_modules/@ultrst-armada",
        skipo_root / "node_modules",
        skipo_root.parent,
    ]
    for base in search_dirs:
        if not base.exists():
            continue
        for pkg_json_path in list(base.glob("*/package.json")) + list(base.glob("@*/*/package.json")):
            try:
                data = json.loads(pkg_json_path.read_text())
                pkg_name = data.get("name", "")
                if pkg_name:
                    raw_exports = data.get("exports", {})
                    if isinstance(raw_exports, dict):
                        if pkg_name not in approved:
                            approved[pkg_name] = set()
                        for subpath in raw_exports.keys():
                            clean = subpath.replace("./", "").replace(".", "").strip()
                            if clean:
                                approved[pkg_name].add(clean.split("/")[0])
            except Exception:
                pass
    for pkg_name, default_subpaths in BOOTSTRAP_FALLBACK_EXPORTS.items():
        if pkg_name not in approved or not approved[pkg_name]:
            approved[pkg_name] = set(default_subpaths)
    return approved

def validate_package_exports(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    approved_exports = load_package_exports(root_dir)
    all_files = scan_files(root_dir, extensions=[".ts", ".tsx", ".js", ".jsx"])
    files_scanned = len(all_files)

    deep_import_pattern = re.compile(r"""from\s+['"](@[a-zA-Z0-9_\-]+/[^/'"]+)/([^'"]+)['"]""")

    for file_path in all_files:
        rel_path = str(file_path.relative_to(root_dir))
        content = read_text_safe(file_path)

        for line_num, line in enumerate(content.splitlines(), start=1):
            if line.strip().startswith("//"):
                continue

            matches = deep_import_pattern.findall(line)
            for pkg_name, subpath in matches:
                if subpath.startswith("src") or subpath.startswith("packages") or subpath.startswith("dist"):
                    violations.append(Violation(
                        rule_id="banned-private-deep-package-import",
                        severity="error",
                        message=f"Deep private package import '{pkg_name}/{subpath}' is strictly forbidden. Must import through declared public exports.",
                        file_path=rel_path,
                        line=line_num,
                        snippet=line.strip(),
                        suggestion=f"Use declared public export path instead (e.g. '{pkg_name}/ui')"
                    ))
                    continue

                if pkg_name in approved_exports:
                    valid_subpaths = approved_exports[pkg_name]
                    primary_subpath = subpath.split("/")[0]
                    if valid_subpaths and primary_subpath not in valid_subpaths:
                        violations.append(Violation(
                            rule_id="unregistered-package-export-subpath",
                            severity="error",
                            message=f"Subpath '{subpath}' is not an approved public export of package '{pkg_name}'.",
                            file_path=rel_path,
                            line=line_num,
                            snippet=line.strip(),
                            suggestion=f"Approved exports for {pkg_name} are: {', '.join(sorted(valid_subpaths))}"
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
    args = parse_standard_args("Validate Package Export Boundaries")
    res = validate_package_exports(Path(args.path).resolve())
    print_checklist_report(res)
    sys.exit(0 if res.passed else 1)
