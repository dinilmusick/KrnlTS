#!/usr/bin/env python3
"""Versioned, resumable Skipo framework migration lifecycle.

This module executes the existing architecture/capabilities/migrations.json
catalogue. It is not a second migration registry or framework.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE_PATH = ROOT / "architecture" / "capabilities" / "migrations.json"
STATE_SCHEMA_VERSION = 2
_VERSION_RE = re.compile(r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:\+[0-9A-Za-z.-]+)?$")


class MigrationStateError(ValueError):
    """The installed framework or migration ledger cannot be upgraded safely."""


def parse_version(value: Any, label: str) -> tuple[int, int, int]:
    if not isinstance(value, str) or not _VERSION_RE.fullmatch(value):
        raise MigrationStateError(f"Invalid {label} semantic version: {value!r}")
    return tuple(int(part) for part in value.split("+", 1)[0].split("."))  # type: ignore[return-value]


def atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(value, indent=2, sort_keys=True) + "\n"
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    except Exception:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def _read_json(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except (OSError, json.JSONDecodeError) as exc:
        raise MigrationStateError(f"Cannot read {label}: {exc}") from exc
    if not isinstance(value, dict):
        raise MigrationStateError(f"{label} must contain a JSON object.")
    return value


def load_catalogue() -> list[dict[str, Any]]:
    data = _read_json(CATALOGUE_PATH, "Skipo migration catalogue")
    if type(data.get("schemaVersion")) is not int or data.get("schemaVersion") != 1 or not isinstance(data.get("migrations"), list):
        raise MigrationStateError("Unsupported or malformed Skipo migration catalogue.")
    migrations: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in data["migrations"]:
        if not isinstance(raw, dict):
            raise MigrationStateError("Migration catalogue entries must be objects.")
        migration_id = raw.get("id")
        version = raw.get("version")
        if not isinstance(migration_id, str) or not migration_id.strip():
            raise MigrationStateError("Every migration must have a non-empty id.")
        if migration_id in seen:
            raise MigrationStateError(f"Duplicate migration id: {migration_id}")
        seen.add(migration_id)
        version_key = parse_version(version, f"migration {migration_id}")
        retire_paths = raw.get("retirePaths", [])
        if not isinstance(retire_paths, list) or any(not isinstance(path, str) for path in retire_paths):
            raise MigrationStateError(f"Migration {migration_id} has invalid retirePaths.")
        if len(retire_paths) != len(set(retire_paths)):
            raise MigrationStateError(f"Migration {migration_id} contains duplicate retirePaths.")
        for relative in retire_paths:
            candidate = Path(relative)
            if candidate.is_absolute() or not relative or ".." in candidate.parts or candidate.parts[0] in {".", ".skipo", ".git"}:
                raise MigrationStateError(f"Migration {migration_id} contains unsafe path: {relative!r}")
        verification = raw.get("verification", [])
        if not isinstance(verification, list) or any(not isinstance(item, str) for item in verification):
            raise MigrationStateError(f"Migration {migration_id} has invalid verification requirements.")
        migrations.append({**raw, "_version_key": version_key})
    return sorted(migrations, key=lambda item: (item["_version_key"], item["id"]))


def _state_path(root: Path) -> Path:
    return root / ".skipo" / "migration-state.json"


def _normalize_state(raw: dict[str, Any], catalogue: list[dict[str, Any]]) -> dict[str, Any]:
    known = {item["id"] for item in catalogue}
    schema = raw.get("schemaVersion", 1)
    if type(schema) is not int or schema not in (1, STATE_SCHEMA_VERSION):
        raise MigrationStateError(f"Unsupported migration state schema: {schema!r}")

    applied = raw.get("applied", [])
    pending = raw.get("pending", [])
    if not isinstance(applied, list) or any(not isinstance(item, str) for item in applied):
        raise MigrationStateError("Migration state 'applied' must be a list of migration ids.")
    if not isinstance(pending, list) or any(not isinstance(item, str) for item in pending):
        raise MigrationStateError("Migration state 'pending' must be a list of migration ids.")
    if len(applied) != len(set(applied)) or len(pending) != len(set(pending)):
        raise MigrationStateError("Migration state contains duplicate migration ids.")
    if set(applied) & set(pending):
        raise MigrationStateError("Migration state marks the same migration as both applied and pending.")
    unknown = (set(applied) | set(pending)) - known
    if unknown:
        raise MigrationStateError(f"Migration state references unknown migrations: {', '.join(sorted(unknown))}")

    raw_records = raw.get("migrations", {}) if schema == STATE_SCHEMA_VERSION else {}
    if not isinstance(raw_records, dict):
        raise MigrationStateError("Migration state 'migrations' must be an object.")
    unknown_records = set(raw_records) - known
    if unknown_records:
        raise MigrationStateError(f"Migration state contains unknown records: {', '.join(sorted(unknown_records))}")

    records: dict[str, dict[str, Any]] = {}
    for migration in catalogue:
        migration_id = migration["id"]
        record = raw_records.get(migration_id, {})
        if not isinstance(record, dict):
            raise MigrationStateError(f"Migration record {migration_id} must be an object.")
        status = record.get("status")
        if migration_id in applied:
            if status not in (None, "applied"):
                raise MigrationStateError(f"Migration {migration_id} is both applied and marked {status!r}.")
            status = "applied"
        elif migration_id in pending:
            if status not in (None, "pending", "applying"):
                raise MigrationStateError(f"Pending migration {migration_id} has incompatible status {status!r}.")
            status = status or "pending"
        elif status is None:
            status = "pending"
        elif status not in ("pending", "applying", "applied"):
            raise MigrationStateError(f"Unknown status for migration {migration_id}: {status!r}")
        completed = record.get("completedOperations", [])
        if schema == 1 and migration_id in applied:
            # Schema v1 only marked a migration applied after all catalogued paths were retired.
            completed = list(migration.get("retirePaths", []))
        if not isinstance(completed, list) or any(not isinstance(item, str) for item in completed):
            raise MigrationStateError(f"Migration {migration_id} has invalid completedOperations.")
        allowed_operations = set(migration.get("retirePaths", []))
        if not set(completed).issubset(allowed_operations):
            raise MigrationStateError(f"Migration {migration_id} records unknown completed operations.")
        if status == "applied" and set(completed) != allowed_operations:
            raise MigrationStateError(f"Applied migration {migration_id} has incomplete operation evidence.")
        records[migration_id] = {"status": status, "completedOperations": sorted(set(completed))}

    ordered_applied = [item["id"] for item in catalogue if records[item["id"]]["status"] == "applied"]
    ordered_pending = [item["id"] for item in catalogue if records[item["id"]]["status"] != "applied"]
    return {
        "schemaVersion": STATE_SCHEMA_VERSION,
        "applied": ordered_applied,
        "pending": ordered_pending,
        "migrations": records,
    }


def _manifest(root: Path) -> tuple[Path, dict[str, Any]]:
    path = root / ".skipo" / "project.json"
    data = _read_json(path, "Skipo project manifest")
    if not data or data.get("framework") != "skipo":
        raise MigrationStateError("Target is not an adopted Skipo project with a valid project manifest.")
    return path, data


def _load_target_state(root: Path, catalogue: list[dict[str, Any]]) -> tuple[dict[str, Any], Path, dict[str, Any], dict[str, Any]]:
    manifest_path, manifest = _manifest(root)
    current = parse_version(manifest.get("skipo_version"), "installed Skipo")
    state_path = _state_path(root)
    raw_state = _read_json(state_path, "migration state")
    state = _normalize_state(raw_state, catalogue)
    return state, manifest_path, manifest, {"current": current, "state_path": state_path}


def _migration_plan(current: tuple[int, int, int], target: tuple[int, int, int], state: dict[str, Any], catalogue: list[dict[str, Any]]) -> dict[str, Any]:
    if target < current:
        raise MigrationStateError("Skipo downgrade is not supported.")
    required = []
    repairs = []
    verification = []
    for migration in catalogue:
        migration_id = migration["id"]
        version = migration["_version_key"]
        status = state["migrations"][migration_id]["status"]
        if version <= current and status != "applied":
            raise MigrationStateError(
                f"Incompatible migration history: {migration_id} ({migration['version']}) "
                f"is not recorded as applied although the installed version is {'.'.join(map(str, current))}."
            )
        if version > target and status == "applied":
            raise MigrationStateError(f"Migration {migration_id} is applied beyond the requested target version.")
        # An applied migration newer than the manifest version is a recoverable
        # crash window: the ledger was committed before the manifest version.
        # update_project will safely finalize the manifest after rechecking state.
        if current < version <= target:
            required.append(migration)
            verification.extend({"migration": migration_id, "requirement": item} for item in migration.get("verification", []))
            if status != "applied":
                completed = set(state["migrations"][migration_id]["completedOperations"])
                repairs.extend(
                    {"migration": migration_id, "operation": "retire-path", "path": relative}
                    for relative in migration.get("retirePaths", [])
                    if relative not in completed
                )
    applied = [item["id"] for item in catalogue if state["migrations"][item["id"]]["status"] == "applied"]
    unapplied = [item["id"] for item in required if state["migrations"][item["id"]]["status"] != "applied"]
    return {
        "required_migrations": [item["id"] for item in required],
        "already_applied_migrations": applied,
        "unapplied_migrations": unapplied,
        "incompatible_states": [],
        "required_repair_operations": repairs,
        "required_verification": verification,
    }


def plan_upgrade(root: Path, target_version: str) -> dict[str, Any]:
    target = parse_version(target_version, "target Skipo")
    catalogue = load_catalogue()
    state, _, manifest, info = _load_target_state(root, catalogue)
    current = info["current"]
    plan = _migration_plan(current, target, state, catalogue)
    target_applied = [item["id"] for item in catalogue if item["_version_key"] <= target]
    target_pending = [item["id"] for item in catalogue if item["_version_key"] > target]
    return {
        "ok": True,
        "operation": "update",
        "planned": True,
        "current_version": manifest["skipo_version"],
        "target_version": target_version,
        "current_state": {
            "framework_version": manifest["skipo_version"],
            "applied_migrations": state["applied"],
            "pending_migrations": state["pending"],
            "interrupted_migrations": [
                migration_id for migration_id, record in state["migrations"].items()
                if record["status"] == "applying"
            ],
        },
        "target_state": {
            "framework_version": target_version,
            "applied_migrations": target_applied,
            "pending_migrations": target_pending,
            "migration_state_schema": STATE_SCHEMA_VERSION,
        },
        **plan,
        "migration_state": state,
    }


def _remove_catalogued_path(root: Path, relative: str) -> None:
    root_real = root.resolve()
    target = root / relative
    parent_real = target.parent.resolve()
    if not parent_real.is_relative_to(root_real):
        raise MigrationStateError(f"Migration path escapes the project root: {relative}")
    if target.is_symlink():
        target.unlink()
    elif target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()


def initialize_migration_state(root: Path, framework_version: str) -> dict[str, Any]:
    """Stamp a newly generated current-version scaffold with its catalogue baseline."""
    target = parse_version(framework_version, "target Skipo")
    catalogue = load_catalogue()
    applied = [item for item in catalogue if item["_version_key"] <= target]
    state = {
        "schemaVersion": STATE_SCHEMA_VERSION,
        "applied": [item["id"] for item in applied],
        "pending": [],
        "migrations": {
            item["id"]: {"status": "applied", "completedOperations": sorted(item.get("retirePaths", []))}
            for item in applied
        },
    }
    atomic_write_json(_state_path(root), state)
    return state


def update_project(root: Path, target_version: str, apply: bool = True) -> dict[str, Any]:
    target = parse_version(target_version, "target Skipo")
    catalogue = load_catalogue()
    state, manifest_path, manifest, info = _load_target_state(root, catalogue)
    current = info["current"]
    plan = _migration_plan(current, target, state, catalogue)
    target_applied = [item["id"] for item in catalogue if item["_version_key"] <= target]
    target_pending = [item["id"] for item in catalogue if item["_version_key"] > target]
    result = {
        "ok": True,
        "operation": "update",
        "current_version": manifest["skipo_version"],
        "target_version": target_version,
        "current_state": {
            "framework_version": manifest["skipo_version"],
            "applied_migrations": state["applied"],
            "pending_migrations": state["pending"],
            "interrupted_migrations": [
                migration_id for migration_id, record in state["migrations"].items()
                if record["status"] == "applying"
            ],
        },
        "target_state": {
            "framework_version": target_version,
            "applied_migrations": target_applied,
            "pending_migrations": target_pending,
            "migration_state_schema": STATE_SCHEMA_VERSION,
        },
        **plan,
        "applied_operations": [],
        "resumed_migrations": [
            item["id"] for item in catalogue
            if state["migrations"][item["id"]]["status"] == "applying"
            and item["id"] in plan["required_migrations"]
        ],
    }
    if not apply:
        result["planned"] = True
        result["migration_state"] = state
        return result

    state_path: Path = info["state_path"]
    raw_state = _read_json(state_path, "migration state")
    if current == target and not plan["unapplied_migrations"] and raw_state.get("schemaVersion") == STATE_SCHEMA_VERSION:
        result["from_version"] = ".".join(map(str, current))
        result["to_version"] = target_version
        result["migration_state"] = state
        result["verification"] = verify_migration_state(root)
        result["ok"] = result["verification"]["ok"]
        result["already_current"] = True
        return result
    pending = list(plan["unapplied_migrations"])
    state["pending"] = pending
    atomic_write_json(state_path, state)

    for migration in catalogue:
        migration_id = migration["id"]
        if migration_id not in plan["required_migrations"] or state["migrations"][migration_id]["status"] == "applied":
            continue
        record = state["migrations"][migration_id]
        record["status"] = "applying"
        atomic_write_json(state_path, state)
        completed = set(record["completedOperations"])
        for relative in migration.get("retirePaths", []):
            if relative not in completed:
                _remove_catalogued_path(root, relative)
                completed.add(relative)
                record["completedOperations"] = sorted(completed)
                atomic_write_json(state_path, state)
                result["applied_operations"].append({"migration": migration_id, "operation": "retire-path", "path": relative})
        record["status"] = "applied"
        record["completedOperations"] = sorted(set(migration.get("retirePaths", [])))
        state["applied"] = [item["id"] for item in catalogue if state["migrations"][item["id"]]["status"] == "applied"]
        state["pending"] = [item["id"] for item in catalogue if state["migrations"][item["id"]]["status"] != "applied"]
        atomic_write_json(state_path, state)

    state["applied"] = [item["id"] for item in catalogue if state["migrations"][item["id"]]["status"] == "applied"]
    state["pending"] = []
    atomic_write_json(state_path, state)
    manifest.update({
        "framework": "skipo",
        "skipo_version": target_version,
        "updated_by": "skipo",
        "migration_policy": "deterministic",
    })
    atomic_write_json(manifest_path, manifest)
    result["from_version"] = ".".join(map(str, current))
    result["to_version"] = target_version
    result["migration_state"] = state
    result["verification"] = verify_migration_state(root)
    result["ok"] = result["verification"]["ok"]
    return result


def verify_migration_state(root: Path) -> dict[str, Any]:
    errors: list[str] = []
    try:
        catalogue = load_catalogue()
        state, _, manifest, info = _load_target_state(root, catalogue)
        current = info["current"]
        for migration in catalogue:
            migration_id = migration["id"]
            status = state["migrations"][migration_id]["status"]
            if migration["_version_key"] <= current and status != "applied":
                errors.append(f"Migration not applied for installed framework version: {migration_id}")
            if status == "applied" and migration["_version_key"] > current:
                errors.append(f"Migration {migration_id} is applied but the framework version was not advanced.")
            if status == "applied":
                for relative in migration.get("retirePaths", []):
                    if (root / relative).exists() or (root / relative).is_symlink():
                        errors.append(f"Migration {migration_id} left retired path in place: {relative}")
        return {
            "ok": not errors,
            "errors": errors,
            "framework_version": manifest["skipo_version"],
            "migration_state": state,
        }
    except (MigrationStateError, OSError) as exc:
        return {"ok": False, "errors": [str(exc)], "migration_state": None}
