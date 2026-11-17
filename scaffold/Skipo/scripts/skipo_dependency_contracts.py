#!/usr/bin/env python3
"""Validation, semver and ordering primitives for dependency migration contracts."""
from __future__ import annotations
import json
import re
from collections import deque
from pathlib import Path
from typing import Any
SCHEMA_VERSION = 1
def version(value: str) -> tuple[int, ...]:
    match = re.search(r"(\d+(?:\.\d+){0,2})", str(value or ""))
    parts = [int(part) for part in match.group(1).split(".")] if match else [0]
    return tuple((parts + [0, 0, 0])[:3])
def safe_path(root: Path, relative: str) -> Path:
    candidate = (root / relative).resolve()
    if candidate != root.resolve() and root.resolve() not in candidate.parents:
        raise ValueError(f"Migration path escapes application root: {relative}")
    return candidate
def package_name_path(name: str) -> str:
    return name.replace("@", "").replace("/", "__")
def discover_contract(root: Path, package: str) -> dict[str, Any] | None:
    pkg_dir = safe_path(root, f"node_modules/{package}")
    manifest_path = pkg_dir / "package.json"
    metadata = {}
    if manifest_path.is_file():
        metadata = json.loads(manifest_path.read_text(encoding="utf-8"))
    declaration = metadata.get("skipo", {})
    if not isinstance(declaration, dict):
        raise ValueError(f"Invalid Skipo package metadata for {package}")
    relative = declaration.get("migrationContract") or declaration.get("migrations")
    candidates = [pkg_dir / relative] if isinstance(relative, str) else []
    candidates.extend([pkg_dir / "skipo.migrations.json",
        safe_path(root, f".skipo/contracts/{package_name_path(package)}.migrations.json")])
    for path in candidates:
        resolved = path.resolve()
        if isinstance(relative, str) and path == candidates[0] and resolved != pkg_dir.resolve() and pkg_dir.resolve() not in resolved.parents:
            raise ValueError(f"Migration contract path escapes package: {relative}")
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
    return None
def satisfies(actual: str, requirement: str) -> bool:
    actual_v = version(actual)
    for clause in requirement.split(","):
        clause = clause.strip()
        operator = next((op for op in (">=", "<=", ">", "<", "^", "~") if clause.startswith(op)), "==")
        expected = version(clause[len(operator):] if operator != "==" else clause)
        if operator == ">=" and actual_v < expected: return False
        if operator == "<=" and actual_v > expected: return False
        if operator == ">" and actual_v <= expected: return False
        if operator == "<" and actual_v >= expected: return False
        if operator == "==" and actual_v != expected: return False
        if operator == "^" and (actual_v < expected or (expected[0] > 0 and actual_v[0] != expected[0]) or (expected[0] == 0 and expected[1] > 0 and actual_v[:2] != expected[:2]) or (expected[:2] == (0, 0) and actual_v[:2] != (0, 0))): return False
        if operator == "~" and (actual_v < expected or actual_v[:2] != expected[:2]): return False
    return True
def validate_operations(migration: dict[str, Any]) -> None:
    handlers = {
        "replace_text": {"find", "replace", "paths"}, "set_json": {"path", "key", "value"},
        "text_absent": {"text", "paths"}, "text_present": {"text", "paths"},
        "json_equals": {"path", "key", "value"},
    }
    for group in ("transformations", "repair", "verification"):
        operations = migration.get(group, [])
        if not isinstance(operations, list):
            raise ValueError(f"Invalid {group} operations in {migration['id']}")
        for operation in operations:
            if not isinstance(operation, dict):
                raise ValueError(f"Invalid {group} operation in {migration['id']}")
            kind = operation.get("type")
            required = handlers.get(kind)
            if required is None or not required.issubset(operation):
                raise ValueError(f"Unsupported or incomplete {group} operation in {migration['id']}: {kind}")
            paths = operation.get("paths", []) if "paths" in operation else [operation["path"]]
            for path in paths:
                if not isinstance(path, str) or Path(path).is_absolute() or ".." in Path(path).parts:
                    raise ValueError(f"Unsafe migration operation path: {path}")
            if kind == "replace_text" and operation["find"] == operation["replace"]:
                raise ValueError(f"No-op text replacement in {migration['id']}")

def validate_contract(contract: dict[str, Any], package: str, skipo_version: str = "1.1.0") -> None:
    if not isinstance(contract, dict):
        raise ValueError(f"Migration contract for {package} must be an object")
    if contract.get("schemaVersion") != SCHEMA_VERSION or contract.get("package") != package:
        raise ValueError(f"Invalid migration contract identity/schema for {package}")
    if not isinstance(contract.get("migrations"), list):
        raise ValueError(f"Migration contract for {package} must contain a migrations array")
    compatibility = contract.get("compatibility", {})
    if not isinstance(compatibility, dict):
        raise ValueError(f"Invalid compatibility requirements for {package}")
    requirement = compatibility.get("skipo") or compatibility.get("requiresSkipo")
    if requirement and not satisfies(skipo_version, requirement):
        raise ValueError(f"{package} migration contract requires Skipo {requirement}")
    seen = set()
    for item in contract.get("migrations", []):
        if not isinstance(item, dict):
            raise ValueError(f"Invalid migration entry in {package}")
        required = ("id", "fromVersion", "toVersion")
        if any(not item.get(key) for key in required) or item["id"] in seen:
            raise ValueError(f"Invalid or duplicate migration in {package}")
        seen.add(item["id"])
        validate_operations(item)
        if not isinstance(item.get("dependsOn", []), list) or any(not isinstance(dep, str) for dep in item.get("dependsOn", [])):
            raise ValueError(f"Invalid migration dependencies in {item['id']}")
        deprecated_specs(item)
        canonical_replacement_operations(item)
        if version(item["toVersion"]) <= version(item["fromVersion"]):
            raise ValueError(f"Migration {item['id']} must advance the dependency version")
        if item.get("requiresSkipo") and not satisfies(skipo_version, item["requiresSkipo"]):
            raise ValueError(f"Migration {item['id']} requires Skipo {item['requiresSkipo']}")

def resolve_path(contract: dict[str, Any], start: str, target: str) -> list[dict[str, Any]]:
    migrations = contract.get("migrations", [])
    queue = deque([(start, [])])
    best = {start}
    while queue:
        current, path = queue.popleft()
        if version(current) == version(target):
            return path
        edges = sorted((m for m in migrations if version(m["fromVersion"]) == version(current)),
                       key=lambda m: (version(m["toVersion"]), m["id"]))
        for edge in edges:
            nxt = edge["toVersion"]
            if version(nxt) not in best and version(nxt) <= version(target):
                best.add(version(nxt))
                queue.append((nxt, path + [edge]))
    raise ValueError(f"Missing migration path {contract['package']} {start} -> {target}")

def order_migrations(items: list[dict[str, Any]], errors: list[str], applied: set[str] | None = None) -> list[dict[str, Any]]:
    by_id = {item["id"]: item for item in items}
    completed = applied or set()
    incoming = {}
    for key, item in by_id.items():
        missing = set(item.get("dependsOn", [])) - by_id.keys() - completed
        if missing:
            errors.append(f"Migration {key} depends on unavailable migrations: {', '.join(sorted(missing))}")
        incoming[key] = set(item.get("dependsOn", [])) & by_id.keys()
    ready = sorted(key for key, deps in incoming.items() if not deps)
    ordered = []
    while ready:
        key = ready.pop(0)
        ordered.append(by_id[key])
        for other in sorted(incoming):
            if key in incoming[other]:
                incoming[other].remove(key)
                if not incoming[other] and other not in {x["id"] for x in ordered} and other not in ready:
                    ready.append(other)
        ready.sort()
    if len(ordered) != len(items):
        errors.append("Dependency migration ordering contains a cycle or missing dependency.")
        return []
    return ordered

def files_for_pattern(root: Path, pattern: str) -> list[Path]:
    safe_path(root, pattern)
    return [p for p in sorted(root.glob(pattern)) if p.is_file() and not p.is_symlink()]


DEFAULT_SOURCE_PATHS = ["src/**/*", "app/**/*", "components/**/*", "server/**/*", "lib/**/*"]

def deprecated_specs(migration: dict[str, Any]) -> list[dict[str, Any]]:
    specs = []
    for item in migration.get("deprecatedPatterns", []):
        spec = {"text": item, "paths": DEFAULT_SOURCE_PATHS} if isinstance(item, str) else item
        if not isinstance(spec, dict) or not isinstance(spec.get("text"), str) or not spec.get("text"):
            raise ValueError(f"Invalid deprecated pattern in {migration['id']}")
        paths = spec.get("paths", DEFAULT_SOURCE_PATHS)
        if not isinstance(paths, list) or not paths:
            raise ValueError(f"Invalid deprecated pattern paths in {migration['id']}")
        for path in paths:
            if not isinstance(path, str) or Path(path).is_absolute() or ".." in Path(path).parts:
                raise ValueError(f"Unsafe deprecated pattern path: {path}")
        specs.append({"text": spec["text"], "paths": paths})
    return specs

def canonical_replacement_operations(migration: dict[str, Any]) -> list[dict[str, Any]]:
    operations = []
    for item in migration.get("canonicalReplacements", []):
        if isinstance(item, str):
            continue
        if not isinstance(item, dict):
            raise ValueError(f"Invalid canonical replacement in {migration['id']}")
        find, replace = item.get("find"), item.get("replace")
        if not isinstance(find, str) or not find or not isinstance(replace, str) or not replace or find == replace:
            raise ValueError(f"Invalid canonical replacement in {migration['id']}")
        paths = item.get("paths", DEFAULT_SOURCE_PATHS)
        if not isinstance(paths, list) or not paths or any(not isinstance(path, str) or Path(path).is_absolute() or ".." in Path(path).parts for path in paths):
            raise ValueError(f"Unsafe canonical replacement path in {migration['id']}")
        operations.append({"type": "replace_text", "paths": paths,
                           "find": find, "replace": replace, "expectedMatches": 0})
    return operations

def detect_affected_state(root: Path, migration: dict[str, Any]) -> list[dict[str, Any]]:
    findings = []
    for spec in deprecated_specs(migration):
        for pattern in spec["paths"]:
            for path in files_for_pattern(root, pattern):
                count = path.read_text(encoding="utf-8").count(spec["text"])
                if count:
                    findings.append({"path": path.relative_to(root).as_posix(), "pattern": spec["text"], "matches": count})
    return sorted(findings, key=lambda item: (item["path"], item["pattern"]))
