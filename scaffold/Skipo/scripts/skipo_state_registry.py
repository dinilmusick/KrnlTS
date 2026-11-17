"""Versioned canonical application-state resolution for the capability composer."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "architecture" / "capabilities" / "registry.json"
REQUIRED_STATE_SECTIONS = (
    "framework", "dependencies", "ownership", "canonicalServices",
    "canonicalUiCapabilities", "auth", "workspaces", "configuration",
    "commands", "environment", "migrations", "deprecated", "repairRules",
    "constraints", "verification",
)


def load_registry(path: Path = REGISTRY_PATH) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    errors = validate_registry_contract(data)
    if errors:
        raise ValueError("; ".join(errors))
    return data


def validate_registry_contract(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if data.get("schemaVersion") != 2:
        errors.append("Unsupported canonical registry schemaVersion.")
    version = data.get("registryVersion")
    if not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version):
        errors.append("registryVersion must be an exact semantic version.")
    supported = data.get("supportedVersions", [])
    if not isinstance(supported, list) or version not in supported:
        errors.append("Current registryVersion must be listed in supportedVersions.")
    state = data.get("applicationState")
    if not isinstance(state, dict):
        errors.append("applicationState must be an object.")
        return errors
    for section in REQUIRED_STATE_SECTIONS:
        if section not in state:
            errors.append(f"Missing applicationState section: {section}")
    if not isinstance(state.get("deprecated"), list):
        errors.append("applicationState.deprecated must be a list.")
    capabilities = data.get("capabilities")
    if not isinstance(capabilities, dict) or not capabilities:
        errors.append("At least one canonical capability is required.")
    else:
        for capability_id, spec in sorted(capabilities.items()):
            if not isinstance(spec, dict):
                errors.append(f"Capability {capability_id} must be an object.")
                continue
            for field in ("status", "ownership", "migration", "repair", "verification"):
                if field not in spec:
                    errors.append(f"Capability {capability_id} is missing {field}.")
            if spec.get("status") not in {"canonical", "deprecated"}:
                errors.append(f"Capability {capability_id} has invalid status.")
    return errors


def resolve_application_state(version: str | None = None,
                              path: Path = REGISTRY_PATH) -> dict[str, Any]:
    registry = load_registry(path)
    requested = version or registry["registryVersion"]
    if requested not in registry["supportedVersions"]:
        raise ValueError(f"Unsupported Skipo registry version: {requested}")
    if requested != registry["registryVersion"]:
        raise ValueError(f"Registry version {requested} has no retained snapshot.")
    return {
        "registryVersion": registry["registryVersion"],
        "schemaVersion": registry["schemaVersion"],
        "framework": registry["applicationState"]["framework"],
        "state": registry["applicationState"],
        "capabilities": {
            key: registry["capabilities"][key]
            for key in sorted(registry["capabilities"])
        },
        "aliases": {key: registry.get("aliases", {})[key]
                    for key in sorted(registry.get("aliases", {}))},
    }


def canonical_state_json(version: str | None = None,
                         path: Path = REGISTRY_PATH) -> str:
    """Return byte-stable JSON independent of source key insertion order."""
    return json.dumps(resolve_application_state(version, path),
                      sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def registry_errors(path: Path = REGISTRY_PATH) -> list[str]:
    try:
        return validate_registry_contract(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"Unable to read canonical registry: {exc}"]
