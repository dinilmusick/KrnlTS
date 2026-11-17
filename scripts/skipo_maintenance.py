"""Deterministic, state-aware maintenance orchestration for Skipo applications.

Planning is read-only. Execution consumes the exact plan, applies only declared
operations, then independently re-inspects the resulting application.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any, Callable

from skipo_state_registry import load_registry
from skipo_capabilities import (
    capability_state, generated_entries, sha256_text, compose, diagnose as diagnose_capabilities,
)

from skipo_dependency_migrations import plan_dependency_migrations, execute_dependency_migrations
from skipo_migrations import plan_upgrade, update_project as update_framework
from skipo_environment_contract import plan as plan_environment, repair as repair_environment
from skipo_verification import verify_canonical_state

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_PATH = ROOT / "architecture" / "capabilities" / "migrations.json"


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def version_tuple(value: str | None) -> tuple[int, ...]:
    match = re.search(r"(\d+(?:\.\d+){0,2})", value or "")
    return tuple(int(part) for part in match.group(1).split(".")) if match else (0,)


def _command_version(command: list[str]) -> str | None:
    if not shutil.which(command[0]):
        return None
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        return result.stdout.strip().splitlines()[0] if result.returncode == 0 and result.stdout.strip() else None
    except OSError:
        return None


def inspect(root: Path, environment: dict[str, str | None] | None = None,
            git_status: str | None = None) -> dict[str, Any]:
    """Observe target state without creating or modifying any files."""
    root = root.resolve()
    pkg_path = root / "package.json"
    manifest_path = root / ".skipo" / "project.json"
    package_error = None
    try:
        package = read_json(pkg_path, {})
        project = read_json(manifest_path, {})
        if not isinstance(package, dict) or not isinstance(project, dict):
            raise ValueError("package.json and .skipo/project.json must contain JSON objects")
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        package, project, package_error = {}, {}, str(exc)

    if environment is None:
        environment = {
            "node": _command_version(["node", "--version"]),
            "pnpm": _command_version(["pnpm", "--version"]),
            "npm": _command_version(["npm", "--version"]),
            "yarn": _command_version(["yarn", "--version"]),
        }
    if git_status is None:
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"], cwd=root,
                capture_output=True, text=True, check=False,
            )
            git_status = result.stdout if result.returncode == 0 else ""
        except OSError:
            git_status = ""

    state_dir = root / ".skipo"
    generated_drift = []
    cap_file = state_dir / "capabilities.json"
    cap_state = read_json(cap_file, {"schemaVersion": 1, "installed": {}, "generated": []})
    for rel, entry in generated_entries(cap_state).items():
        file_path = (root / rel).resolve()
        if root not in file_path.parents:
            generated_drift.append({"path": rel, "reason": "path-escapes-project"})
            continue
        if not file_path.is_file():
            generated_drift.append({"path": rel, "reason": "missing"})
        elif entry.get("checksum") and sha256_text(file_path.read_text(encoding="utf-8")) != entry["checksum"]:
            generated_drift.append({"path": rel, "reason": "checksum-mismatch"})

    return {
        "root": str(root),
        "package": package,
        "project": project,
        "package_error": package_error,
        "git_dirty": bool(git_status.strip()),
        "git_status": sorted(line for line in git_status.splitlines() if line.strip()),
        "lockfile": next((name for name in ("pnpm-lock.yaml", "yarn.lock", "package-lock.json") if (root / name).exists()), None),
        "capability_state": cap_state,
        "generated_drift": sorted(generated_drift, key=lambda item: item["path"]),
        "environment": dict(sorted(environment.items())),
    }


def _environment_errors(state: dict[str, Any], contract: dict[str, Any]) -> list[str]:
    required = contract.get("environment", {})
    actual = state["environment"]
    errors = []
    node_required = required.get("node")
    node_actual = actual.get("node")
    if node_required and (not node_actual or version_tuple(node_actual) < version_tuple(node_required)):
        errors.append(f"Node {node_required} is required; detected {node_actual or 'unavailable'}.")
    manager_spec = required.get("packageManager", "")
    manager, _, manager_version = manager_spec.partition("@")
    manager_actual = actual.get(manager)
    if manager and (not manager_actual or (manager_version and version_tuple(manager_actual) < version_tuple(manager_version))):
        errors.append(f"{manager_spec} is required; detected {manager_actual or 'unavailable'}.")
    return errors


def build_plan(root: Path, framework_version: str,
               environment: dict[str, str | None] | None = None,
               git_status: str | None = None) -> dict[str, Any]:
    """Produce a stable, mutation-free plan from observed and canonical state."""
    canonical = load_registry()["applicationState"]
    state = inspect(root, environment=environment, git_status=git_status)
    actions: list[dict[str, Any]] = []
    contract = canonical
    if state["lockfile"] == "package-lock.json":
        contract = {**canonical, "environment": {
            **canonical["environment"], "packageManager": "npm", "lockfile": "package-lock.json",
        }}
    errors = list(_environment_errors(state, contract))
    if state["package_error"]:
        errors.append(state["package_error"])
    if not state["package"]:
        errors.append("Target package.json is missing or invalid.")

    project = state["project"]
    previous_framework = project.get("skipo_version", "0.0.0")
    if version_tuple(previous_framework) < version_tuple(framework_version):
        actions.append({"phase": "update", "action": "framework", "from": previous_framework, "to": framework_version})

    package = state["package"]
    required_manager = contract.get("environment", {}).get("packageManager")
    declared_manager = package.get("packageManager")
    if required_manager == "npm" and declared_manager and not declared_manager.startswith("npm@"):
        errors.append("package-lock.json conflicts with the declared package manager.")
    if required_manager and required_manager != "npm" and declared_manager != required_manager:
        actions.append({"phase": "update", "action": "package-manager",
                        "from": package.get("packageManager"), "to": required_manager})
    current_dependencies = dict(package.get("dependencies", {}))
    canonical_dependencies = canonical.get("dependencies", {})
    for name, desired in sorted(canonical_dependencies.items()):
        current = current_dependencies.get(name)
        if current != desired:
            actions.append({"phase": "update", "action": "dependency", "package": name, "from": current, "to": desired})

    migrations = read_json(MIGRATIONS_PATH, {"migrations": []}).get("migrations", [])
    migration_state = read_json(root / canonical["migrations"]["stateFile"], {"applied": [], "pending": []})
    applied = set(migration_state.get("applied", []))
    pending_migrations = []
    for migration in sorted(migrations, key=lambda item: (version_tuple(item.get("version")), item.get("id", ""))):
        migration_id = migration.get("id")
        migration_version = migration.get("version", "0.0.0")
        if version_tuple(migration_version) <= version_tuple(framework_version):
            paths = sorted(path for path in migration.get("retirePaths", []) if (Path(state["root"]) / path).exists())
            if migration_id not in applied or paths:
                action = {"phase": "update", "action": "migration", "id": migration_id, "version": migration_version, "retire_paths": paths}
                actions.append(action)
                if migration_id not in applied:
                    pending_migrations.append(migration_id)

    if not state["capability_state"].get("installed") and not (root / ".skipo" / "capabilities.json").exists():
        actions.append({"phase": "repair", "action": "initialize-capability-state"})
    findings = sorted(
        diagnose_capabilities(root),
        key=lambda finding: (finding.get("capability", ""), finding.get("path", ""),
                             finding.get("classification", "")),
    )
    for finding in findings:
        if finding.get("classification") == "retire":
            actions.append({"phase": "repair", "action": "retire-safe-duplicate",
                            "capability": finding["capability"], "path": finding["path"]})
    for drift in state["generated_drift"]:
        actions.append({"phase": "repair", "action": "restore-generated-file", **drift})

    dependency_state_path = root / canonical["configuration"]["dependencyState"]
    dependency_state = read_json(dependency_state_path, {})
    dependency_state_drift = {
        name: version for name, version in canonical_dependencies.items()
        if dependency_state.get(name) != version
    }
    if dependency_state_drift:
        actions.append({"phase": "sync", "action": "reconcile-dependency-state",
                        "dependencies": dependency_state_drift})

    dependency_plan = plan_dependency_migrations(root, framework_version)
    framework_upgrade_plan = plan_upgrade(root, framework_version)
    environment_plan = plan_environment(root)
    if not dependency_plan.get("ok", False):
        errors.extend(dependency_plan.get("errors", []))
    if not framework_upgrade_plan.get("ok", False):
        errors.extend(framework_upgrade_plan.get("errors", []))
    if not environment_plan.get("ok", False):
        errors.extend(environment_plan.get("errors", []))

    expected_lockfile = contract.get("environment", {}).get("lockfile", "package-lock.json")
    present_lockfiles = [name for name in ("pnpm-lock.yaml", "yarn.lock", "package-lock.json") if (root / name).exists()]
    unexpected_lockfiles = sorted(name for name in present_lockfiles if name != expected_lockfile)
    if unexpected_lockfiles:
        errors.append("Conflicting lockfiles must be resolved manually: " + ", ".join(unexpected_lockfiles))
    if not (root / expected_lockfile).exists() or any(action["action"] == "dependency" for action in actions):
        actions.append({"phase": "sync", "action": "reconcile-lockfile", "lockfile": expected_lockfile})

    # Git dirtiness is a hard stop: the observed plan remains available, but update
    # will not mix framework-owned mutations with uncommitted application work.
    if state["git_dirty"]:
        errors.append("Working tree is dirty; commit or stash application changes before running skipo update.")

    ordered = sorted(actions, key=lambda item: (
        {"update": 0, "repair": 1, "sync": 2}.get(item["phase"], 9),
        item["action"], item.get("package", ""), item.get("id", ""), item.get("path", ""),
    ))
    return {
        "ok": not errors,
        "operation": "maintenance-plan",
        "schema_version": 1,
        "framework_version": framework_version,
        "state": state,
        "actions": ordered,
        "errors": sorted(errors),
        "pending_migrations": sorted(pending_migrations),
        "findings": findings,
        "dependency_migrations": dependency_plan,
        "framework_upgrade": framework_upgrade_plan,
        "environment": environment_plan,
    }


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _run_lockfile_sync(root: Path, package: dict[str, Any]) -> dict[str, Any]:
    manager = package.get("packageManager", "").split("@", 1)[0]
    if not manager:
        manager = "pnpm" if (root / "pnpm-lock.yaml").exists() else ("yarn" if (root / "yarn.lock").exists() else "npm")
    commands = {
        "pnpm": ["pnpm", "install", "--lockfile-only", "--ignore-scripts"],
        "npm": ["npm", "install", "--package-lock-only", "--ignore-scripts"],
        "yarn": ["yarn", "install", "--mode=update-lockfile"],
    }
    command = commands.get(manager)
    if not command or not shutil.which(manager):
        return {"ok": False, "error": f"Required package manager '{manager}' is unavailable."}
    result = subprocess.run(command, cwd=root, capture_output=True, text=True, check=False)
    return {"ok": result.returncode == 0, "command": command, "returncode": result.returncode,
            "stdout": result.stdout[-4000:], "stderr": result.stderr[-4000:]}


def execute_plan(root: Path, plan: dict[str, Any], framework_version: str,
                 lockfile_sync: Callable[[Path, dict[str, Any]], dict[str, Any]] | None = None) -> dict[str, Any]:
    """Apply the precomputed plan, then verify by independently re-reading disk."""
    if not plan.get("ok"):
        return {"ok": False, "operation": "update", "applied": False, "errors": plan.get("errors", [])}
    if plan.get("framework_version") != framework_version:
        return {"ok": False, "operation": "update", "applied": False, "errors": ["Plan framework version does not match executor."]}

    root = root.resolve()
    state = plan["state"]
    # Reject stale plans rather than applying against state that changed after planning.
    current = inspect(root, environment=state["environment"])
    for key in ("package", "project", "capability_state", "generated_drift", "lockfile", "git_status"):
        if current.get(key) != state.get(key):
            return {"ok": False, "operation": "update", "applied": False,
                    "errors": [f"Plan precondition changed after planning: {key}. Re-run skipo plan."]}
    package = dict(state["package"])
    project = dict(state["project"])
    actions = plan["actions"]

    dependency_plan = plan.get("dependency_migrations", {})
    if dependency_plan.get("migrations"):
        dependency_result = execute_dependency_migrations(root, dependency_plan)
        if not dependency_result.get("ok", False):
            return {"ok": False, "operation": "update", "applied": False,
                    "errors": dependency_result.get("errors", []),
                    "dependency_migrations": dependency_result, "actions": actions}
        package = read_json(root / "package.json", package)
    else:
        dependency_result = {"ok": True, "applied": [], "actions": []}

    framework_upgrade = plan.get("framework_upgrade", {})
    if framework_upgrade.get("unapplied_migrations") or framework_upgrade.get("current_state", {}).get("framework_version") != framework_version:
        try:
            framework_result = update_framework(root, framework_version, apply=True)
        except (OSError, ValueError) as exc:
            return {"ok": False, "operation": "update", "applied": False,
                    "errors": [str(exc)], "actions": actions}
        if not framework_result.get("ok", False):
            return {"ok": False, "operation": "update", "applied": False,
                    "errors": framework_result.get("errors", []),
                    "framework_migration": framework_result, "actions": actions}
        package = read_json(root / "package.json", package)
        project = read_json(root / ".skipo" / "project.json", project)

    migration_state_path = root / ".skipo" / "migration-state.json"
    migration_state = read_json(migration_state_path, {"schemaVersion": 1, "applied": [], "pending": []})
    completed = []

    for action in actions:
        if action["action"] == "dependency":
            package.setdefault("dependencies", {})[action["package"]] = action["to"]
        elif action["action"] == "framework":
            project.update({"framework": "skipo", "skipo_version": framework_version,
                            "updated_by": "skipo", "migration_policy": "deterministic-idempotent"})
        elif action["action"] == "package-manager":
            package["packageManager"] = action["to"]
        elif action["action"] == "retire-safe-duplicate":
            registry = load_registry()["capabilities"]
            spec = registry.get(action["capability"], {})
            rel = action["path"]
            path = (root / rel).resolve()
            if rel not in spec.get("safeRetire", []) or root not in path.parents:
                return {"ok": False, "operation": "update", "applied": False,
                        "errors": [f"Refusing unapproved retirement path: {rel}"]}
            if path.is_file():
                path.unlink()
        elif action["action"] == "migration":
            continue
        elif action["action"] == "migration-legacy":
            for rel in action["retire_paths"]:
                path = (root / rel).resolve()
                if root not in path.parents:
                    return {"ok": False, "operation": "update", "applied": False,
                            "errors": [f"Migration path escapes project root: {rel}"]}
                if path.is_dir():
                    shutil.rmtree(path)
                elif path.is_file():
                    path.unlink()
            if action["id"] not in migration_state.setdefault("applied", []):
                migration_state["applied"].append(action["id"])
            completed.append(action["id"])

    # Commit manifest/state only after the full plan has been validated.
    if any(action["action"] in {"dependency", "framework", "package-manager", "migration"} for action in actions):
        (root / "package.json").write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
        if project:
            _write_json(root / ".skipo" / "project.json", project)
        migration_state["pending"] = []
        _write_json(migration_state_path, migration_state)

    if any(action["action"] == "initialize-capability-state" for action in actions):
        capability_state(root)
    installed = sorted(read_json(root / ".skipo" / "capabilities.json", {}).get("installed", {}))
    if installed:
        repaired = compose(root, installed, apply=True)
        if not repaired.get("ok"):
            return {"ok": False, "operation": "update", "applied": True,
                    "errors": repaired.get("conflicts", ["Capability repair failed."]), "actions": actions}

    sync_actions = [action for action in actions if action["action"] == "reconcile-dependency-state"]
    if sync_actions:
        dependency_state_path = root / load_registry()["applicationState"]["configuration"]["dependencyState"]
        dependency_state = read_json(dependency_state_path, {})
        dependency_state.update(load_registry()["applicationState"]["dependencies"])
        _write_json(dependency_state_path, dependency_state)

    sync_result = {"ok": True, "skipped": True}
    lockfile_action = next((action for action in actions if action["action"] == "reconcile-lockfile"), None)
    if lockfile_action:
        sync_result = (lockfile_sync or _run_lockfile_sync)(root, package)
        if not sync_result.get("ok"):
            return {"ok": False, "operation": "update", "applied": True,
                    "errors": ["Lockfile reconciliation failed."], "sync": sync_result, "actions": actions}
        if not (root / lockfile_action["lockfile"]).is_file():
            return {"ok": False, "operation": "update", "applied": True,
                    "errors": [f"Canonical lockfile missing: {lockfile_action['lockfile']}."],
                    "sync": sync_result, "actions": actions}

    environment_plan = plan.get("environment", {})
    environment_result = {"ok": True, "skipped": True}
    if environment_plan.get("actions"):
        environment_result = repair_environment(root, apply=True)
        if not environment_result.get("ok", False):
            return {"ok": False, "operation": "update", "applied": True,
                    "errors": environment_result.get("errors", ["Environment repair failed."]),
                    "environment": environment_result, "actions": actions}
    verification = verify(root, framework_version)
    return {
        "ok": verification["ok"], "operation": "update", "applied": True,
        "actions": actions, "completed_migrations": sorted(completed),
        "dependency_migrations": dependency_result,
        "framework_migration": locals().get("framework_result", {"ok": True, "skipped": True}),
        "environment": environment_result,
        "sync": sync_result, "verification": verification,
        "errors": verification["errors"],
    }


def verify(root: Path, framework_version: str) -> dict[str, Any]:
    """Independent canonical-state verification; never mutates the target."""
    root = root.resolve()
    result = verify_canonical_state(root, framework_version)
    result["framework_version"] = framework_version
    return result

