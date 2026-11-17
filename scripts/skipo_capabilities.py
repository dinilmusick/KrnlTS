#!/usr/bin/env python3
"""Deterministic Skipo capability resolver, composer, drift detector and verifier."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from skipo_state_registry import load_registry as load_validated_registry

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "architecture" / "capabilities" / "registry.json"

def load_registry() -> dict[str, Any]:
    """Load the shared capability registry only after state-contract validation."""
    return load_validated_registry(REGISTRY_PATH)

def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
    except Exception:
        return default

def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")

def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def generated_entries(state: dict[str, Any]) -> dict[str, dict[str, Any]]:
    entries = {}
    for item in state.get("generated", []):
        if isinstance(item, str):
            entries[item] = {"path": item, "owner": "skipo", "capability": None, "checksum": None}
        elif isinstance(item, dict) and item.get("path"):
            entries[item["path"]] = dict(item)
    return entries

def write_generated_entries(state: dict[str, Any], entries: dict[str, dict[str, Any]]) -> None:
    state["generated"] = [entries[k] for k in sorted(entries)]

def project_manifest(root: Path) -> dict[str, Any]:
    return read_json(root / ".skipo" / "project.json", {})

def package_json(root: Path) -> dict[str, Any]:
    return read_json(root / "package.json", {})

def canonical_version(value: str) -> tuple[int, ...]:
    match = re.search(r"(\d+(?:\.\d+){0,2})", value or "")
    return tuple(int(x) for x in match.group(1).split(".")) if match else (0,)

def ensure_state(root: Path) -> None:
    state = root / ".skipo"
    state.mkdir(parents=True, exist_ok=True)
    defaults = {
        "dependencies.json": {},
        "capabilities.json": {"schemaVersion": 1, "installed": {}, "generated": []},
        "overrides.json": {"schemaVersion": 1, "capabilities": {}},
        "migration-state.json": {"schemaVersion": 1, "applied": [], "pending": []},
    }
    for name, value in defaults.items():
        path = state / name
        if not path.exists():
            write_json(path, value)

def capability_state(root: Path) -> dict[str, Any]:
    ensure_state(root)
    return read_json(root / ".skipo" / "capabilities.json", {"schemaVersion": 1, "installed": {}, "generated": []})

def write_capability_state(root: Path, state: dict[str, Any]) -> None:
    write_json(root / ".skipo" / "capabilities.json", state)

def dependency_state(root: Path) -> dict[str, Any]:
    ensure_state(root)
    return read_json(root / ".skipo" / "dependencies.json", {})

def project_name(root: Path) -> str:
    pkg = package_json(root)
    return pkg.get("name") or root.name

def ensure_project(root: Path) -> None:
    ensure_state(root)
    path = root / ".skipo" / "project.json"
    data = project_manifest(root)
    if not data:
        data = {"framework": "skipo", "scaffold": "adopted", "skipo_version": "unknown", "generated_by": "skipo"}
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

def scan_text_files(root: Path):
    skip = {".git", "node_modules", "dist", ".next", ".turbo", ".skipo", "scripts"}
    for base in ("src", "app", "pages", "components", "lib", "server"):
        start = root / base
        if not start.exists():
            continue
        for path in start.rglob("*"):
            if not path.is_file() or any(part in skip for part in path.parts):
                continue
            if path.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"}:
                continue
            try:
                yield path, path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue

def canonical_import_present(text: str, package: str) -> bool:
    return package in text

def diagnose(root: Path) -> list[dict[str, Any]]:
    registry_data = load_registry()
    registry = registry_data["capabilities"]
    aliases = registry_data.get("aliases", {})
    files = list(scan_text_files(root))
    findings: list[dict[str, Any]] = []

    for cap_id, spec in registry.items():
        safe_retire = set(spec.get("safeRetire", []))
        for path, text in files:
            rel = path.relative_to(root).as_posix()
            matched = [pattern for pattern in spec.get("duplicatePatterns", []) if re.search(pattern, text, re.I)]
            explicit_safe = rel in safe_retire
            if not matched and not explicit_safe:
                continue

            canonical = any(canonical_import_present(text, p["package"]) for p in spec.get("providers", []))
            if explicit_safe:
                classification = "retire"
            elif canonical:
                classification = "adapt"
            else:
                # A pattern match alone is not proof of a duplicate implementation.
                # Report it as keep so repair never deletes application code merely
                # because it references a canonical symbol.
                classification = "keep"

            findings.append({
                "capability": cap_id,
                "classification": classification,
                "path": rel,
                "patterns": matched,
                "canonical_import_present": canonical,
                "safe_retire": explicit_safe,
            })

    # Surface aliases in machine-readable diagnostics without treating aliases as
    # independent capabilities.
    for alias, target in aliases.items():
        if target in registry:
            continue
        findings.append({
            "capability": alias,
            "classification": "keep",
            "path": "",
            "patterns": [],
            "canonical_import_present": False,
            "safe_retire": False,
            "error": f"Alias target '{target}' is not registered",
        })
    return findings

def normalize_items(items: list[str]) -> list[str]:
    if not items:
        raise ValueError("No capability supplied.")
    if items[0] in {"capability", "service", "ui"}:
        if len(items) != 2:
            raise ValueError(f"{items[0]} requires exactly one capability id.")
        return [items[1]]
    return items

def resolve_capabilities(items: list[str]) -> list[tuple[str, dict[str, Any]]]:
    registry_data = load_registry()
    registry = registry_data["capabilities"]
    aliases = registry_data.get("aliases", {})
    resolved = []
    for item in normalize_items(items):
        canonical = aliases.get(item, item)
        if canonical not in registry:
            raise ValueError(
                f"Unknown capability '{item}'. Available: {', '.join(sorted(registry))}; "
                f"aliases: {', '.join(sorted(aliases))}"
            )
        spec = registry[canonical]
        if spec.get("status") == "deprecated":
            strategy = spec.get("migration", {}).get("strategy", "manual-review")
            raise ValueError(f"Capability '{canonical}' is deprecated; migration strategy: {strategy}")
        resolved.append((canonical, spec))
    # Preserve deterministic order while de-duplicating aliases and repeated args.
    unique = {}
    for cap_id, spec in resolved:
        unique[cap_id] = spec
    return list(unique.items())

def compose(root: Path, items: list[str], apply: bool = True) -> dict[str, Any]:
    ensure_project(root)
    resolved = resolve_capabilities(items)
    pkg_path = root / "package.json"
    pkg = package_json(root)
    if not pkg:
        raise ValueError("Target has no package.json.")

    deps = dict(pkg.get("dependencies", {}))
    state = capability_state(root)
    generated = generated_entries(state)
    installed = dict(state.get("installed", {}))
    actions = []
    conflicts = []
    pending_writes: dict[Path, str] = {}

    for cap_id, spec in resolved:
        for package, version in spec.get("dependencies", {}).items():
            current = deps.get(package)
            if current != version:
                actions.append({
                    "action": "dependency",
                    "capability": cap_id,
                    "package": package,
                    "from": current,
                    "to": version,
                })
                deps[package] = version

        for item in spec.get("generated", []):
            rel = item["path"]
            path = root / rel
            desired = item["content"]
            current = path.read_text(encoding="utf-8") if path.exists() else None
            prior = generated.get(rel)

            if current is None:
                actions.append({"action": "generate", "capability": cap_id, "path": rel})
                pending_writes[path] = desired
            elif current == desired:
                actions.append({"action": "unchanged", "capability": cap_id, "path": rel})
            elif prior and prior.get("owner") == "skipo" and (
                not prior.get("checksum") or prior.get("checksum") == sha256_text(current)
            ):
                actions.append({"action": "refresh-owned", "capability": cap_id, "path": rel})
                pending_writes[path] = desired
            else:
                conflicts.append({
                    "capability": cap_id,
                    "path": rel,
                    "action": "conflict",
                    "message": "Existing application-owned content was not overwritten.",
                })
                continue

            generated[rel] = {
                "path": rel,
                "owner": "skipo",
                "capability": cap_id,
                "checksum": sha256_text(desired),
            }

        installed[cap_id] = {
            "kind": spec["kind"],
            "description": spec["description"],
            "providers": spec["providers"],
        }

    if apply and not conflicts:
        pkg["dependencies"] = deps
        for path, desired in pending_writes.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(desired, encoding="utf-8")
        pkg_path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")
        state["installed"] = installed
        write_generated_entries(state, generated)
        write_capability_state(root, state)
        deps_state = dependency_state(root)
        for package, version in deps.items():
            if package.startswith("@ultrst-armada/") or package == "@dinilmusick/gutts":
                deps_state[package] = version
        write_json(root / ".skipo" / "dependencies.json", deps_state)

    return {
        "ok": not conflicts,
        "operation": "compose",
        "capabilities": [x[0] for x in resolved],
        "actions": actions,
        "conflicts": conflicts,
        "applied": apply,
    }

def remove(root: Path, items: list[str], apply: bool = True) -> dict[str, Any]:
    resolved = resolve_capabilities(items)
    state = capability_state(root)
    generated = generated_entries(state)
    actions = []
    conflicts = []

    for cap_id, spec in resolved:
        for item in spec.get("generated", []):
            rel = item["path"]
            path = root / rel
            if not path.exists():
                generated.pop(rel, None)
                continue
            prior = generated.get(rel)
            current = path.read_text(encoding="utf-8")
            safe_owned = bool(
                prior and prior.get("owner") == "skipo" and (
                    not prior.get("checksum") or prior.get("checksum") == sha256_text(current)
                )
            )
            if safe_owned or current == item["content"]:
                actions.append({"action": "delete-generated", "capability": cap_id, "path": rel})
                if apply:
                    path.unlink()
                generated.pop(rel, None)
            else:
                conflicts.append({
                    "capability": cap_id,
                    "path": rel,
                    "action": "conflict",
                    "message": "Modified generated content was not deleted.",
                })
        state.get("installed", {}).pop(cap_id, None)

    if apply and not conflicts:
        write_generated_entries(state, generated)
        write_capability_state(root, state)

    return {
        "ok": not conflicts,
        "operation": "remove",
        "capabilities": [x[0] for x in resolved],
        "actions": actions,
        "conflicts": conflicts,
        "applied": apply,
    }


def retire_known_duplicates(root: Path, findings: list[dict[str, Any]], apply: bool) -> list[dict[str, Any]]:
    registry = load_registry()["capabilities"]
    actions = []
    for finding in findings:
        if finding["classification"] != "retire":
            continue
        spec = registry[finding["capability"]]
        path = finding["path"]
        if path not in spec.get("safeRetire", []):
            continue
        absolute = root / path
        if not absolute.exists():
            continue
        action = {"action": "retire-duplicate", "capability": finding["capability"], "path": path}
        actions.append(action)
        if apply:
            absolute.unlink()
    return actions

def plan(root: Path) -> dict[str, Any]:
    findings = diagnose(root)
    return {
        "ok": True,
        "operation": "plan",
        "findings": findings,
        "retirement_actions": retire_known_duplicates(root, findings, False),
        "canonical_capabilities": sorted(capability_state(root).get("installed", {}).keys()),
    }

def adopt(root: Path) -> dict[str, Any]:
    ensure_project(root)
    ensure_state(root)
    findings = diagnose(root)
    caps = capability_state(root)
    return {
        "ok": True,
        "operation": "adopt",
        "project": project_name(root),
        "findings": findings,
        "capabilities": caps,
    }

def sync(root: Path, install: bool = False) -> dict[str, Any]:
    state = capability_state(root)
    capabilities = sorted(state.get("installed", {}).keys())
    result = compose(root, capabilities, apply=True) if capabilities else {"ok": True, "operation": "sync", "actions": [], "applied": True}
    result["operation"] = "sync"
    if install:
        result["install"] = install_dependencies(root)
    return result

def install_dependencies(root: Path) -> dict[str, Any]:
    if not (root / "package.json").exists():
        return {"ok": False, "error": "package.json missing"}
    if (root / "pnpm-lock.yaml").exists():
        command = ["pnpm", "install", "--frozen-lockfile=false"]
    elif (root / "yarn.lock").exists():
        command = ["yarn", "install"]
    else:
        command = ["npm", "install"]
    completed = subprocess.run(command, cwd=root)
    return {"ok": completed.returncode == 0, "command": command, "returncode": completed.returncode}

def legacy_migration_paths() -> list[str]:
    migration_file = ROOT / "architecture" / "capabilities" / "migrations.json"
    data = read_json(migration_file, {"migrations": []})
    paths = []
    for migration in data.get("migrations", []):
        if migration.get("id") == "1.1.0-capability-composition":
            paths.extend(migration.get("retirePaths", []))
    return paths

def remove_legacy_paths(root: Path, apply: bool) -> list[dict[str, Any]]:
    actions = []
    for rel in legacy_migration_paths():
        path = root / rel
        if not path.exists():
            continue
        actions.append({"action": "retire-legacy-module-path", "path": rel})
        if apply:
            if path.is_dir():
                import shutil
                shutil.rmtree(path)
            else:
                path.unlink()
    return actions

def update(root: Path, framework_version: str) -> dict[str, Any]:
    """Update dependencies and framework state through the canonical migration engines."""
    ensure_project(root)
    try:
        from skipo_dependency_migrations import plan_dependency_migrations, execute_dependency_migrations
        from skipo_migrations import update_project as update_framework
    except ImportError as exc:
        return {"ok": False, "operation": "update", "errors": [f"Migration engine unavailable: {exc}"]}

    dependency_plan = plan_dependency_migrations(root, framework_version)
    if not dependency_plan.get("ok", False):
        return {
            "ok": False,
            "operation": "update",
            "dependency_migrations": dependency_plan,
            "errors": dependency_plan.get("errors", []),
        }

    dependency_result = execute_dependency_migrations(root, dependency_plan)
    if not dependency_result.get("ok", False):
        return {
            "ok": False,
            "operation": "update",
            "dependency_migrations": dependency_result,
            "errors": dependency_result.get("errors", []),
        }

    framework_result = update_framework(root, framework_version, apply=True)
    if not framework_result.get("ok", False):
        return {
            "ok": False,
            "operation": "update",
            "dependency_migrations": dependency_result,
            "framework_migration": framework_result,
            "errors": framework_result.get("errors", []),
        }

    return {
        "ok": True,
        "operation": "update",
        "from_version": framework_result.get("from_version"),
        "to_version": framework_version,
        "actions": framework_result.get("applied_operations", []),
        "dependency_migrations": dependency_result,
        "framework_migration": framework_result,
        "migration_state": framework_result.get("migration_state", {}),
    }

def repair(root: Path, apply: bool, framework_version: str) -> dict[str, Any]:
    updated = update(root, framework_version) if apply else {
        "ok": True,
        "operation": "update",
        "planned": True,
        "legacy_paths": legacy_migration_paths(),
    }
    findings = diagnose(root)
    retired = retire_known_duplicates(root, findings, apply)
    caps = sorted({f["capability"] for f in findings if f["classification"] in {"adapt", "retire"}})
    composed = compose(root, caps, apply=apply) if caps else {"ok": True, "actions": [], "applied": apply}
    return {
        "ok": True,
        "operation": "repair",
        "findings": findings,
        "retired": retired,
        "composition": composed,
        "update": updated,
        "applied": apply,
    }

def verify(root: Path) -> dict[str, Any]:
    findings = diagnose(root)
    state = capability_state(root)
    errors = []
    registry = load_registry()["capabilities"]

    for cap_id in state.get("installed", {}):
        if cap_id not in registry:
            errors.append(f"Unknown installed capability: {cap_id}")
        elif registry[cap_id].get("status") == "deprecated":
            strategy = registry[cap_id].get("migration", {}).get("strategy", "manual-review")
            errors.append(f"Deprecated installed capability: {cap_id} (migration: {strategy})")

    for rel, entry in generated_entries(state).items():
        path = root / rel
        if not path.exists():
            errors.append(f"Generated capability file is missing: {rel}")
            continue
        expected = entry.get("checksum")
        if expected and sha256_text(path.read_text(encoding="utf-8")) != expected:
            errors.append(f"Generated capability file has drifted: {rel}")

    for finding in findings:
        if finding.get("classification") == "retire":
            cap_id = finding["capability"]
            if finding["path"] not in registry[cap_id].get("safeRetire", []):
                errors.append(f"Unresolved duplicate for {cap_id}: {finding['path']}")

    for rel in legacy_migration_paths():
        if (root / rel).exists():
            errors.append(f"Legacy Skipo module path remains: {rel}")

    return {
        "ok": not errors,
        "operation": "verify",
        "errors": errors,
        "findings": findings,
        "capabilities": sorted(state.get("installed", {}).keys()),
    }
