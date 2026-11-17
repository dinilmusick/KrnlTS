#!/usr/bin/env python3
"""Contract-driven, deterministic dependency migrations for Skipo applications."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any
from skipo_dependency_contracts import (
    version, safe_path, discover_contract, validate_contract,
    resolve_path, order_migrations, files_for_pattern,
    detect_affected_state, canonical_replacement_operations,
)
STATE_DEFAULT = {"schemaVersion": 1, "applied": [], "pending": []}
def _package_version(root: Path, name: str, declared: str) -> str:
    manifest = safe_path(root, f"node_modules/{name}/package.json")
    if manifest.is_file():
        return str(json.loads(manifest.read_text(encoding="utf-8")).get("version") or declared)
    return str(declared).lstrip("^~")
def plan_dependency_migrations(root: Path, skipo_version: str = "1.1.0") -> dict[str, Any]:
    dependencies = {}
    pkg = json.loads((root / "package.json").read_text(encoding="utf-8"))
    for section in ("dependencies", "devDependencies", "optionalDependencies"):
        dependencies.update(pkg.get(section, {}))
    previous = json.loads((root / ".skipo/dependencies.json").read_text(encoding="utf-8")) if (root / ".skipo/dependencies.json").is_file() else {}
    selected, errors, paths = [], [], {}
    resolved_previous = previous.get("_resolved", {})
    for package in sorted(dependencies):
        current = _package_version(root, package, dependencies[package])
        old = resolved_previous.get(package) or previous.get(package)
        if isinstance(old, dict):
            old = old.get("version") or old.get("specifier")
        try:
            contract = discover_contract(root, package) if not old or version(old) != version(current) else None
            if not old:
                if not contract:
                    continue
                validate_contract(contract, package, skipo_version)
                paths[package] = {"from": None, "to": current, "specifier": dependencies[package], "migrations": [], "baseline": True}
                continue
            if version(old) == version(current):
                paths[package] = {"from": old, "to": current, "specifier": dependencies[package], "migrations": []}
                continue
            if not contract:
                raise ValueError(f"No migration contract shipped by {package}")
            validate_contract(contract, package, skipo_version)
            chosen = resolve_path(contract, str(old), current)
            paths[package] = {"from": old, "to": current, "specifier": dependencies[package], "migrations": [m["id"] for m in chosen]}
            for item in chosen:
                migration = {"package": package, **item}
                migration["contractId"] = item["id"]
                migration["id"] = f"{package}::{item['id']}"
                migration["dependsOn"] = [dep if "::" in dep else f"{package}::{dep}" for dep in item.get("dependsOn", [])]
                migration["affectedState"] = detect_affected_state(root, item)
                migration["transformations"] = list(item.get("transformations", [])) + canonical_replacement_operations(item)
                handled = {op.get("find") for op in migration["transformations"] + migration.get("repair", []) if op.get("type") == "replace_text"}
                unresolved = sorted({hit["pattern"] for hit in migration["affectedState"]} - handled)
                if unresolved:
                    errors.append(f"{package} {item['id']} has deprecated patterns without deterministic replacements: {', '.join(unresolved)}")
                selected.append(migration)
        except (ValueError, OSError, json.JSONDecodeError) as exc:
            errors.append(str(exc))
    last_by_package = {}
    for item in selected:
        previous_id = last_by_package.get(item["package"])
        if previous_id:
            item["dependsOn"] = sorted(set(item.get("dependsOn", [])) | {previous_id})
        last_by_package[item["package"]] = item["id"]
    state_file = root / ".skipo/migration-state.json"
    applied_ids = set(json.loads(state_file.read_text(encoding="utf-8")).get("dependencyApplied", [])) if state_file.is_file() else set()
    ordered = order_migrations(selected, errors, applied_ids)
    return {"ok": not errors, "operation": "dependency-migration-plan", "paths": paths,
            "migrations": ordered, "errors": sorted(set(errors)), "applied": False}
def apply_operation(root: Path, operation: dict[str, Any], apply: bool) -> dict[str, Any]:
    kind = operation.get("type")
    if kind == "replace_text":
        matches = []
        for pattern in operation.get("paths", []):
            for path in files_for_pattern(root, pattern):
                text = path.read_text(encoding="utf-8")
                if operation["find"] in text or operation["replace"] in text:
                    matches.append((path, text))
        changed = 0
        replacement_present = any(operation["replace"] in p.read_text(encoding="utf-8") for pattern in operation.get("paths", []) for p in files_for_pattern(root, pattern))
        for path, text in matches:
            count = text.count(operation["find"])
            if not count and operation["replace"] in text:
                continue
            if count < operation.get("expectedMatches", 1):
                raise ValueError(f"Expected matches not found for {path.relative_to(root)}")
            changed += count
            if apply:
                path.write_text(text.replace(operation["find"], operation["replace"]), encoding="utf-8")
        if changed < operation.get("expectedMatches", 1) and not replacement_present:
            raise ValueError(f"Expected source pattern not found: {operation['find']}")
        return {"type": kind, "matches": changed, "files": [p.relative_to(root).as_posix() for p, _ in matches]}
    if kind == "set_json":
        path = safe_path(root, operation["path"])
        data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        if not isinstance(data, dict):
            raise ValueError(f"Expected a JSON object at {operation['path']}")
        cursor = data
        parts = operation["key"].split(".")
        for part in parts[:-1]:
            child = cursor.get(part)
            if child is None:
                child = {}
                cursor[part] = child
            if not isinstance(child, dict):
                raise ValueError(f"Expected a JSON object at {operation['path']}:{part}")
            cursor = child
        old, desired = cursor.get(parts[-1]), operation["value"]
        if old not in (operation.get("expectedOld", old), desired):
            raise ValueError(f"Unexpected JSON value at {operation['path']}:{operation['key']}")
        if apply and old != desired:
            cursor[parts[-1]] = desired
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        return {"type": kind, "path": operation["path"], "key": operation["key"], "changed": old != desired}
    raise ValueError(f"Unsupported deterministic migration operation: {kind}")
def verify_operation(root: Path, operation: dict[str, Any]) -> None:
    kind = operation.get("type")
    if kind == "text_absent":
        for pattern in operation.get("paths", []):
            for path in files_for_pattern(root, pattern):
                if operation["text"] in path.read_text(encoding="utf-8"):
                    raise ValueError(f"Deprecated pattern remains: {path.relative_to(root)}")
    elif kind == "text_present":
        if not any(operation["text"] in p.read_text(encoding="utf-8") for pattern in operation.get("paths", []) for p in files_for_pattern(root, pattern)):
            raise ValueError(f"Required canonical pattern missing: {operation['text']}")
    elif kind == "json_equals":
        path = safe_path(root, operation["path"])
        data = json.loads(path.read_text(encoding="utf-8"))
        value = data
        for part in operation["key"].split("."):
            value = value[part]
        if value != operation["value"]:
            raise ValueError(f"Verification failed at {operation['path']}:{operation['key']}")
    else:
        raise ValueError(f"Unsupported migration verification operation: {kind}")
def execute_dependency_migrations(root: Path, plan: dict[str, Any]) -> dict[str, Any]:
    if not plan.get("ok"):
        return {**plan, "applied": False}
    actions, errors = [], []
    state_path = root / ".skipo/migration-state.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.is_file() else dict(STATE_DEFAULT)
    applied = set(state.get("dependencyApplied", []))
    snapshots: dict[Path, bytes | None] = {}
    for migration in plan["migrations"]:
        if migration["id"] in applied:
            continue
        for operation in migration.get("transformations", []) + migration.get("repair", []):
            if operation.get("type") == "replace_text":
                targets = [p for pattern in operation.get("paths", []) for p in files_for_pattern(root, pattern)]
            elif operation.get("type") == "set_json":
                targets = [safe_path(root, operation["path"])]
            else:
                targets = []
            for target in targets:
                snapshots.setdefault(target, target.read_bytes() if target.is_file() else None)
    for migration in plan["migrations"]:
        if migration["id"] in applied:
            continue
        try:
            for operation in migration.get("transformations", []) + migration.get("repair", []):
                actions.append({"migration": migration["id"], **apply_operation(root, operation, True)})
            for operation in migration.get("verification", []):
                verify_operation(root, operation)
            applied.add(migration["id"])
        except (ValueError, OSError, KeyError, json.JSONDecodeError) as exc:
            errors.append(f"{migration['id']}: {exc}")
            break
    if errors:
        for path, content in snapshots.items():
            if content is None:
                if path.exists(): path.unlink()
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
        actions = []
    if not errors:
        state.update({"schemaVersion": max(1, state.get("schemaVersion", 1)), "dependencyApplied": sorted(applied), "pending": []})
        state_path.parent.mkdir(parents=True, exist_ok=True)
        state_path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        dependencies = json.loads((root / ".skipo/dependencies.json").read_text(encoding="utf-8")) if (root / ".skipo/dependencies.json").is_file() else {}
        resolved = dependencies.setdefault("_resolved", {})
        for name, item in plan["paths"].items():
            dependencies[name] = item.get("specifier") or dependencies.get(name) or item["to"]
            resolved[name] = item["to"]
        (root / ".skipo/dependencies.json").write_text(json.dumps(dependencies, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {**plan, "ok": not errors, "errors": errors, "actions": actions, "applied": not errors}
def verify_dependency_migrations(root: Path, skipo_version: str = "1.1.0") -> dict[str, Any]:
    plan = plan_dependency_migrations(root, skipo_version)
    errors = list(plan["errors"])
    state_file = root / ".skipo/migration-state.json"
    applied = set(json.loads(state_file.read_text(encoding="utf-8")).get("dependencyApplied", [])) if state_file.is_file() else set()
    pkg = json.loads((root / "package.json").read_text(encoding="utf-8"))
    names = set(pkg.get("dependencies", {})) | set(pkg.get("devDependencies", {})) | set(pkg.get("optionalDependencies", {}))
    for package in sorted(names):
        try:
            contract = discover_contract(root, package)
            if contract:
                validate_contract(contract, package, skipo_version)
                for migration in contract.get("migrations", []):
                    if f"{package}::{migration['id']}" in applied:
                        for operation in migration.get("verification", []):
                            verify_operation(root, operation)
        except (ValueError, OSError, KeyError, json.JSONDecodeError) as exc:
            errors.append(f"{package}: {exc}")
    return {"ok": not errors, "errors": errors, "paths": plan["paths"]}
