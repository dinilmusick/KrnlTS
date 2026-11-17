#!/usr/bin/env python3
"""Deterministic, fail-closed repair transaction for Skipo applications."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import skipo_capabilities as capabilities


def _path(root: Path, relative: str) -> Path:
    candidate = Path(relative)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise ValueError(f"Unsafe repair path: {relative}")
    resolved = (root / candidate).resolve(strict=False)
    if resolved != root and root not in resolved.parents:
        raise ValueError(f"Repair path escapes project root: {relative}")
    return root / candidate


def _contains_symlink(root: Path, relative: str) -> bool:
    current = root
    for part in Path(relative).parts:
        current = current / part
        if current.is_symlink():
            return True
    return False

def _rule(detection: str, remediation: str, verification: str) -> dict[str, str]:
    return {"detection": detection, "remediation": remediation, "verification": verification}


def reconcile(root: Path, apply: bool, framework_version: str) -> dict[str, Any]:
    root = root.resolve()
    if not (root / "package.json").is_file():
        return {"ok": False, "operation": "repair", "applied": False, "actions": [],
                "conflicts": [{"message": "Target has no package.json."}]}

    registry = capabilities.load_registry()["capabilities"]
    findings = capabilities.diagnose(root)
    state = capabilities.read_json(root / ".skipo/capabilities.json",
                                   {"schemaVersion": 1, "installed": {}, "generated": []})
    installed = dict(state.get("installed", {}))
    generated = capabilities.generated_entries(state)
    package = capabilities.package_json(root)
    dependencies = dict(package.get("dependencies", {}))
    dependency_owners = capabilities.read_json(root / ".skipo/dependencies.json", {})
    dependency_plan = capabilities.plan_dependency_migrations(root, framework_version)

    actions: list[dict[str, Any]] = []
    conflicts: list[dict[str, Any]] = []
    capability_ids = set(installed)
    capability_ids.update(
        item["capability"] for item in findings
        if item.get("classification") in {"adapt", "retire"} and item.get("capability") in registry
    )

    for item in findings:
        cap_id = item.get("capability")
        if item.get("classification") == "retire":
            if cap_id not in registry or item.get("path") not in registry[cap_id].get("safeRetire", []):
                conflicts.append({"path": item.get("path"), "message": "Retirement is not explicitly registry-approved."})
                continue
            target = _path(root, item["path"])
            if _contains_symlink(root, item["path"]) or (target.exists() and not target.is_file()):
                conflicts.append({"path": item["path"], "message": "Only explicitly classified regular files may be retired."})
            elif target.exists():
                actions.append({
                    "action": "retire-explicit-duplicate", "capability": cap_id, "path": item["path"],
                    "rule": _rule(
                        f"{item['path']} is listed in {cap_id}.safeRetire.",
                        "Remove only this exact regular file.",
                        "The exact classified file no longer exists.",
                    ),
                })
        elif item.get("classification") == "adapt":
            # Canonical generated files naturally contain their own provider symbols;
            # they are not application duplicates and must not keep repair perpetually dirty.
            canonical_paths = {
                entry["path"] for entry in registry.get(cap_id, {}).get("generated", [])
            }
            if item.get("path") in canonical_paths:
                continue

    if not dependency_plan.get("ok"):
        conflicts.extend({"type": "dependency-migration", "message": error}
                         for error in dependency_plan.get("errors", []))

    for cap_id in sorted(capability_ids):
        if cap_id not in registry:
            conflicts.append({"capability": cap_id, "message": "Installed capability is not in the canonical registry."})
            continue
        spec = registry[cap_id]
        for name, desired in sorted(spec.get("dependencies", {}).items()):
            current = dependencies.get(name)
            if current != desired:
                owned = dependency_owners.get(name)
                if current is not None and owned not in {current, desired}:
                    conflicts.append({
                        "capability": cap_id, "package": name,
                        "message": "Dependency differs from canonical range and is not recorded as Skipo-owned.",
                    })
                    continue
                actions.append({
                    "action": "synchronize-canonical-dependency", "capability": cap_id,
                    "package": name, "from": current, "to": desired,
                    "rule": _rule(
                        f"Capability {cap_id} declares {name}@{desired}; installed manifest value is {current!r}.",
                        "Update only the dependency declared by the canonical capability registry.",
                        f"package.json and .skipo/dependencies.json record {name}@{desired}.",
                    ),
                })
                dependencies[name] = desired

        for item in spec.get("generated", []):
            relative = item["path"]
            target = _path(root, relative)
            if _contains_symlink(root, relative):
                conflicts.append({"capability": cap_id, "path": relative, "message": "Canonical target traverses a symlink."})
                continue
            desired = item["content"]
            current = target.read_text(encoding="utf-8") if target.is_file() else None
            previous = generated.get(relative)
            if current == desired:
                generated[relative] = {
                    "path": relative, "owner": "skipo", "capability": cap_id,
                    "checksum": capabilities.sha256_text(desired),
                }
                continue
            if current is None:
                operation = "generate-canonical-component"
            elif previous and previous.get("owner") == "skipo" and previous.get("checksum") == capabilities.sha256_text(current):
                operation = "refresh-owned-canonical-component"
            else:
                conflicts.append({
                    "capability": cap_id, "path": relative,
                    "message": "Canonical path contains unowned or modified application content; refusing to overwrite.",
                })
                continue
            actions.append({
                "action": operation, "capability": cap_id, "path": relative,
                "rule": _rule(
                    f"Canonical registry content for {relative} is missing or differs from its last owned checksum.",
                    "Write the exact registry-defined content without synthesizing application code.",
                    "File bytes match registry content and the Skipo ownership checksum.",
                ),
            })
            generated[relative] = {
                "path": relative, "owner": "skipo", "capability": cap_id,
                "checksum": capabilities.sha256_text(desired),
            }

    # Legacy paths are only removable when named by the versioned migration catalogue.
    for relative in capabilities.legacy_migration_paths():
        target = _path(root, relative)
        if _contains_symlink(root, relative):
            conflicts.append({"path": relative, "message": "Legacy migration target traverses a symlink."})
            continue
        if target.exists():
            actions.append({
                "action": "retire-versioned-legacy-path", "path": relative,
                "rule": _rule(
                    f"{relative} is listed by the registered framework migration.",
                    "Apply the registered framework migration's exact retirement operation.",
                    "The migration path is absent and the migration is recorded as applied.",
                ),
            })

    if conflicts:
        return {
            "ok": False, "operation": "repair", "findings": findings,
            "actions": actions, "conflicts": conflicts, "applied": False,
            "verification": {"ok": False, "errors": ["Preflight failed; no changes were applied."]},
        }

    if not apply:
        return {
            "ok": True, "operation": "repair", "findings": findings,
            "actions": actions, "conflicts": [], "applied": False,
            "dependency_migrations": dependency_plan,
            "verification": {"ok": None, "planned": True},
        }

    manifest = capabilities.read_json(root / ".skipo/project.json", {})
    previous_version = manifest.get("skipo_version", "unknown")
    dependency_paths = dependency_plan.get("paths", {})
    dependency_work = any(item.get("baseline") or item.get("migrations") for item in dependency_paths.values())
    legacy_work = any(_path(root, relative).exists() for relative in capabilities.legacy_migration_paths())
    needs_update = (
        not (root / ".skipo/project.json").is_file()
        or capabilities.canonical_version(previous_version) < capabilities.canonical_version(framework_version)
        or dependency_work or legacy_work
    )

    # Update executes the registered dependency/framework migrations only after
    # every capability, ownership, and retirement precondition has passed.
    update_result = capabilities.update(root, framework_version) if needs_update else {
        "ok": True, "operation": "update", "from_version": previous_version,
        "to_version": framework_version, "actions": [], "noop": True,
    }
    if not update_result.get("ok"):
        return {
            "ok": False, "operation": "repair", "findings": findings,
            "actions": actions, "conflicts": [], "applied": False,
            "update": update_result,
            "verification": {"ok": False, "errors": [update_result.get("error", "Framework update failed.")]},
        }

    retired = []
    for item in findings:
        if item.get("classification") != "retire":
            continue
        relative = item["path"]
        if relative not in registry[item["capability"]].get("safeRetire", []):
            continue
        target = _path(root, relative)
        if target.exists() and not _contains_symlink(root, relative):
            target.unlink()
            retired.append(relative)

    compose_needed = any(
        action.get("action") in {
            "synchronize-canonical-dependency", "generate-canonical-component",
            "refresh-owned-canonical-component",
        } for action in actions
    )
    composed = capabilities.compose(root, sorted(capability_ids), apply=True) if capability_ids and compose_needed else {
        "ok": True, "actions": [], "applied": False
    }
    if not composed.get("ok"):
        return {
            "ok": False, "operation": "repair", "findings": findings,
            "actions": actions, "conflicts": composed.get("conflicts", []),
            "applied": True, "update": update_result, "composition": composed,
            "verification": {"ok": False, "errors": ["Canonical composition failed after preflight."]},
        }

    verification = capabilities.verify(root)
    return {
        "ok": bool(verification.get("ok")), "operation": "repair",
        "findings": findings, "actions": actions, "retired": retired,
        "conflicts": [], "applied": True, "update": update_result,
        "composition": composed, "dependency_migrations": dependency_plan,
        "verification": verification,
    }
