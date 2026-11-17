import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import skipo_capabilities
from skipo_state_registry import (
    canonical_state_json, resolve_application_state, validate_registry_contract,
)


def test_registry_resolves_canonical_framework_and_provider_ownership():
    state = resolve_application_state()
    assert state["framework"]["name"] == "skipo"
    assert state["state"]["ownership"]["backendServices"] == "@ultrst-armada/kloks"
    assert state["state"]["ownership"]["uiCapabilities"] == "@ultrst-armada/floks"
    assert state["capabilities"]["auth"]["status"] == "canonical"


def test_registry_version_is_explicit_and_unknown_versions_fail():
    state = resolve_application_state("2.0.0")
    assert state["registryVersion"] == "2.0.0"
    try:
        resolve_application_state("99.0.0")
    except ValueError as exc:
        assert "Unsupported Skipo registry version" in str(exc)
    else:
        raise AssertionError("Unknown registry version was accepted.")


def test_canonical_output_is_deterministic_across_key_order():
    first = canonical_state_json()
    second = canonical_state_json()
    assert first == second
    payload = json.loads(first)
    assert list(payload["capabilities"]) == sorted(payload["capabilities"])
    assert list(payload["aliases"]) == sorted(payload["aliases"])


def test_invalid_and_unknown_capability_state_is_rejected():
    registry = json.loads((ROOT / "architecture/capabilities/registry.json").read_text())
    registry["capabilities"]["unknown"] = {"kind": "service"}
    errors = validate_registry_contract(registry)
    assert any("unknown is missing status" in error for error in errors)
    registry["schemaVersion"] = 999
    assert any("Unsupported canonical registry schemaVersion" in error
               for error in validate_registry_contract(registry))

def test_deprecated_capability_is_rejected_with_its_migration_strategy(monkeypatch):
    registry = json.loads((ROOT / "architecture/capabilities/registry.json").read_text())
    registry["capabilities"]["auth"]["status"] = "deprecated"
    registry["capabilities"]["auth"]["migration"]["strategy"] = "migrate-auth-provider"
    monkeypatch.setattr(skipo_capabilities, "load_registry", lambda: registry)
    try:
        skipo_capabilities.resolve_capabilities(["auth"])
    except ValueError as exc:
        assert "migrate-auth-provider" in str(exc)
    else:
        raise AssertionError("Deprecated capability was accepted for composition.")
