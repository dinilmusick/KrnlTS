#!/usr/bin/env python3
"""Aspect 24: deterministic Skipo capability composition governance."""
from __future__ import annotations
import json
import re
import sys
import time
from pathlib import Path
try:
    from .common import ChecklistResult, Violation
except ImportError:
    from common import ChecklistResult, Violation

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from skipo_state_registry import registry_errors

def validate(root: Path) -> ChecklistResult:
    started = time.time()
    violations = []
    scanned = 0
    state = root / ".skipo"
    registry = Path(__file__).resolve().parents[1] / "architecture/capabilities/registry.json"

    def add(rule, message, path, suggestion=None):
        violations.append(Violation(rule, "error", message, path.relative_to(root).as_posix() if path.exists() else str(path), suggestion=suggestion))

    if not registry.is_file():
        add("24.registry", "Capability registry is missing.", registry, "Restore architecture/capabilities/registry.json.")
        return ChecklistResult("aspect_24", "Skipo Capability Composition", False, violations, 0, (time.time()-started)*1000, 0)

    data = json.loads(registry.read_text(encoding="utf-8"))
    for error in registry_errors(registry):
        add("24.state-registry", error, registry, "Repair the canonical versioned applicationState contract.")

    project = state / "project.json"
    if project.is_file():
        manifest = json.loads(project.read_text(encoding="utf-8"))
        if manifest.get("framework") != "skipo":
            add("24.project", "Skipo project manifest must declare framework=skipo.", project)

    capabilities = state / "capabilities.json"
    if capabilities.is_file():
        installed = json.loads(capabilities.read_text(encoding="utf-8")).get("installed", {})
        for cap_id in installed:
            if cap_id not in data.get("capabilities", {}):
                add("24.unknown-capability", f"Unknown installed capability '{cap_id}'.", capabilities)

    for base in ("src", "app", "pages", "components"):
        start = root / base
        if not start.exists(): continue
        for path in start.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".ts",".tsx",".js",".jsx",".mjs",".cjs"}:
                continue
            scanned += 1
            text = path.read_text(encoding="utf-8", errors="replace")
            if "/module-ui/" in text or "ModuleUIHost" in text or "ModuleBackendAdapter" in text or "skipo.module.json" in text:
                add("24.no-modules", "Legacy module architecture remains in application code.", path, "Use a Skipo capability and canonical Floks/Kloks provider.")
    return ChecklistResult("aspect_24", "Skipo Capability Composition", not violations, violations, scanned, (time.time()-started)*1000, max(0.0,100-len(violations)*10))

if __name__ == "__main__":
    result=validate(Path(sys.argv[1]) if len(sys.argv)>1 else Path("."))
    for v in result.violations: print(v.message)
    raise SystemExit(0 if result.passed else 1)
