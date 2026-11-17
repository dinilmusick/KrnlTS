#!/usr/bin/env python3
"""
18_scoped_library_governance.py - Scoped Application Library Governance & Promotion Detector for Skipo.
Enforces:
- Every custom library asset in src/libraries/<concept>_concepts/ must carry the application name in its identifier.
- Purely generic functions without application-context types are tagged as PROMOTABLE to GutTS.
- Concept directory pattern: <name>_concepts/ with <name>_concepts.ts facade.
"""

from pathlib import Path
import json
import re
import sys
import time
from typing import List, Dict, Any, Set

try:
    from .common import ChecklistResult, Violation, print_checklist_report, parse_standard_args
except ImportError:
    from common import ChecklistResult, Violation, print_checklist_report, parse_standard_args

ASPECT_ID = "aspect_18_scoped_library_governance"
ASPECT_TITLE = "Scoped Application Library Governance & Promotion Detection"

PRIMITIVE_TYPES = {
    'string', 'number', 'boolean', 'symbol', 'bigint', 'void', 'undefined', 'null', 'never', 'unknown', 'any', 'object',
    'Record', 'Array', 'ReadonlyArray', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Date', 'RegExp', 'Error',
    'Uint8Array', 'Buffer', 'Iterable', 'AsyncIterable', 'T', 'K', 'V', 'U'
}

def detect_app_name(root_dir: Path) -> str:
    pkg_file = root_dir / "package.json"
    if pkg_file.exists():
        try:
            data = json.loads(pkg_file.read_text(encoding="utf-8"))
            name = data.get("name", "")
            if name:
                cleaned = re.sub(r"^@[^/]+/", "", name)
                parts = re.split(r"[-_]", cleaned)
                return "".join(p.capitalize() for p in parts if p)
        except Exception:
            pass
    lib_dir = root_dir / "src" / "libraries"
    if lib_dir.exists():
        for f in lib_dir.glob("*Concepts.ts"):
            stem = f.stem
            if stem.endswith("Concepts"):
                return stem[:-8]
    return "Skipo"

def is_contextual_type(type_str: str, app_name: str, local_types: Set[str]) -> bool:
    if not type_str:
        return False
    tokens = re.findall(r"[A-Za-z0-9_]+", type_str)
    for tok in tokens:
        if tok in PRIMITIVE_TYPES:
            continue
        if tok in local_types:
            return True
        if app_name.lower() in tok.lower():
            return True
        if re.match(r"^[A-Z][a-zA-Z0-9]+$", tok):
            return True
    return False

def validate_scoped_libraries(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations: List[Violation] = []
    files_scanned = 0

    src_lib = root_dir / "src" / "libraries"
    if not src_lib.exists():
        return ChecklistResult(
            aspect_id=ASPECT_ID,
            aspect_title=ASPECT_TITLE,
            passed=True,
            violations=[],
            files_scanned=0,
            duration_ms=(time.time() - start_time) * 1000,
            score=100.0
        )

    app_name = detect_app_name(root_dir)
    promotable_assets: List[Dict[str, Any]] = []

    for cdir in [d for d in src_lib.iterdir() if d.is_dir() and not d.name.startswith(".")]:
        if cdir.name == "skipo":
            continue

        for fpath in cdir.glob("**/*.ts"):
            if fpath.name.endswith(".d.ts") or ".test." in fpath.name or ".spec." in fpath.name:
                continue

            files_scanned += 1
            content = fpath.read_text(encoding="utf-8", errors="ignore")
            rel_str = str(fpath.relative_to(root_dir))

            local_types = set(re.findall(r"(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)", content))

            # Inspect functions
            fn_matches = re.finditer(r"(?:export\s+)?function\s+([A-Za-z0-9_]+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?", content)
            for m in fn_matches:
                fn_name = m.group(1)
                params_str = m.group(2) or ""
                return_type_str = m.group(3) or ""
                combined_types = f"{params_str} {return_type_str}"

                is_contextual = is_contextual_type(combined_types, app_name, local_types)
                has_app_name = app_name.lower() in fn_name.lower()

                if is_contextual:
                    if not has_app_name:
                        if f"{app_name.lower()}" in content.lower():
                            continue
                        violations.append(Violation(
                            rule_id="app-library-asset-naming",
                            severity="error",
                            message=f"Application library function '{fn_name}' in '{app_name}' violates scoped library naming convention. Custom library asset identifiers must contain the owning application name ('{app_name}').",
                            file_path=rel_str,
                            suggestion=f"Rename '{fn_name}' to '{app_name.lower()}{fn_name[0].upper()}{fn_name[1:]}' or remove contextual types to qualify as a generic promotable utility."
                        ))
                else:
                    promotable_assets.append({
                        "name": fn_name,
                        "kind": "function",
                        "filePath": rel_str,
                        "scope": "application",
                        "scopeName": app_name,
                        "target": "GutTS"
                    })

            # Inspect interfaces
            iface_matches = re.finditer(r"(?:export\s+)?interface\s+([A-Za-z0-9_]+)\s*(?:<[^>]*>)?\s*\{([^}]*)\}", content)
            for m in iface_matches:
                iface_name = m.group(1)
                body = m.group(2) or ""
                if body.strip() and app_name.lower() not in iface_name.lower():
                    if f"{app_name}{iface_name}" in content or f"type {iface_name} = {app_name}" in content:
                        continue
                    violations.append(Violation(
                        rule_id="app-library-asset-naming",
                        severity="error",
                        message=f"Application library interface '{iface_name}' in '{app_name}' violates scoped library naming convention. Custom library asset identifiers must contain the owning application name ('{app_name}').",
                        file_path=rel_str,
                        suggestion=f"Rename '{iface_name}' to '{app_name}{iface_name}'."
                    ))

            # Inspect classes
            class_matches = re.finditer(r"(?:export\s+)?class\s+([A-Za-z0-9_]+)", content)
            for m in class_matches:
                cls_name = m.group(1)
                if app_name.lower() not in cls_name.lower():
                    violations.append(Violation(
                        rule_id="app-library-asset-naming",
                        severity="error",
                        message=f"Application library class '{cls_name}' in '{app_name}' violates scoped library naming convention. Custom library asset identifiers must contain the owning application name ('{app_name}').",
                        file_path=rel_str,
                        suggestion=f"Rename '{cls_name}' to '{app_name}{cls_name}'."
                    ))

    errors = sum(1 for v in violations if v.severity == "error")
    score = max(0.0, 100.0 - (errors * 25.0))
    res = ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=errors == 0,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=(time.time() - start_time) * 1000,
        score=score
    )
    res.promotable_assets = promotable_assets
    return res

def main():
    target = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    res = validate_scoped_libraries(target)
    for v in res.violations:
        print(f"[{v.severity.upper()}] {v.rule_id} in {v.file_path}: {v.message}")
    if res.promotable_assets:
        print(f"Found {len(res.promotable_assets)} promotable asset(s):")
        for a in res.promotable_assets:
            print(f"  ✦ {a['name']} ({a['kind']}) -> {a['target']}")
    if res.passed and len(res.violations) == 0:
        print(f"Aspect 18 PASSED for {target}")
    sys.exit(0 if res.passed else 1)

if __name__ == "__main__":
    main()
