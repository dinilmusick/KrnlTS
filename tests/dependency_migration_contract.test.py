import json
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from skipo_capabilities import update as update_capabilities
from skipo_dependency_migrations import (
    plan_dependency_migrations, execute_dependency_migrations,
    verify_dependency_migrations, resolve_path, order_migrations, safe_path, version,
)
def project(tmp_path, versions, contracts, previous):
    root = tmp_path
    deps = {name: f"^{ver}" for name, ver in versions.items()}
    (root / "package.json").write_text(json.dumps({"dependencies": deps}), encoding="utf-8")
    (root / ".skipo").mkdir()
    (root / ".skipo/dependencies.json").write_text(json.dumps(previous), encoding="utf-8")
    (root / ".skipo/migration-state.json").write_text(json.dumps({"schemaVersion": 1, "applied": [], "pending": []}), encoding="utf-8")
    for name, (ver, contract) in contracts.items():
        folder = root / "node_modules" / name
        folder.mkdir(parents=True)
        (folder / "package.json").write_text(json.dumps({"name": name, "version": ver, "skipo": {"migrationContract": "skipo.migrations.json"}}), encoding="utf-8")
        (folder / "skipo.migrations.json").write_text(json.dumps(contract), encoding="utf-8")
    return root
def contract(package, migrations, compatibility=None):
    return {"schemaVersion": 1, "package": package, "compatibility": compatibility or {}, "migrations": migrations}
def migration(mid, old, new, **extra):
    return {"id": mid, "fromVersion": old, "toVersion": new, **extra}
def test_plan_is_read_only_and_contains_full_ordered_path(tmp_path):
    package = "@ultrst-armada/demo"
    root = project(tmp_path, {package: "2.0.0"}, {package: ("2.0.0", contract(package, [
        migration("demo-1", "1.0.0", "1.5.0"),
        migration("demo-2", "1.5.0", "2.0.0"),
    ]))}, {package: "1.0.0"})
    plan = plan_dependency_migrations(root)
    assert plan["ok"]
    assert [m["contractId"] for m in plan["migrations"]] == ["demo-1", "demo-2"]
    assert json.loads((root / ".skipo/dependencies.json").read_text())[package] == "1.0.0"
def test_multiple_dependency_migrations_are_merged_and_ordered(tmp_path):
    a, b = "@ultrst-armada/a", "@ultrst-armada/b"
    root = project(tmp_path, {a: "2.0.0", b: "3.0.0"}, {
        a: ("2.0.0", contract(a, [migration("upgrade", "1.0.0", "2.0.0", dependsOn=["@ultrst-armada/b::upgrade"])])),
        b: ("3.0.0", contract(b, [migration("upgrade", "2.0.0", "3.0.0")])),
    }, {a: "1.0.0", b: "2.0.0"})
    plan = plan_dependency_migrations(root)
    assert plan["ok"]
    assert [m["contractId"] for m in plan["migrations"]] == ["upgrade", "upgrade"]
    assert [m["id"] for m in plan["migrations"]] == ["@ultrst-armada/b::upgrade", "@ultrst-armada/a::upgrade"]
def test_missing_migration_path_blocks_upgrade(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "3.0.0"}, {name: ("3.0.0", contract(name, [
        migration("demo-2", "2.0.0", "3.0.0")
    ]))}, {name: "1.0.0"})
    plan = plan_dependency_migrations(root)
    assert not plan["ok"]
    assert "Missing migration path" in plan["errors"][0]
def test_invalid_contract_identity_is_rejected(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract("@wrong/name", [
        migration("m1", "1.0.0", "2.0.0")
    ]))}, {name: "1.0.0"})
    assert not plan_dependency_migrations(root)["ok"]
def test_skipo_compatibility_is_enforced(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("m1", "1.0.0", "2.0.0")
    ], {"skipo": ">=2.0.0"}))}, {name: "1.0.0"})
    assert not plan_dependency_migrations(root, "1.1.0")["ok"]
def test_transform_repair_and_verification_execute_once(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("demo-2", "1.0.0", "2.0.0",
            transformations=[{"type": "replace_text", "paths": ["src/**/*.ts"], "find": "OldFacade", "replace": "NewFacade"}],
            repair=[{"type": "set_json", "path": "config.json", "key": "provider.mode", "value": "canonical", "expectedOld": "legacy"}],
            deprecatedPatterns=["OldFacade"], canonicalReplacements=["NewFacade"],
            verification=[{"type": "text_absent", "paths": ["src/**/*.ts"], "text": "OldFacade"},
                          {"type": "text_present", "paths": ["src/**/*.ts"], "text": "NewFacade"},
                          {"type": "json_equals", "path": "config.json", "key": "provider.mode", "value": "canonical"}])
    ]))}, {name: "1.0.0"})
    source = root / "src/feature.ts"
    source.parent.mkdir()
    source.write_text("import { OldFacade } from 'provider';", encoding="utf-8")
    (root / "config.json").write_text(json.dumps({"provider": {"mode": "legacy"}}), encoding="utf-8")
    plan = plan_dependency_migrations(root)
    result = execute_dependency_migrations(root, plan)
    assert result["ok"]
    dependency_state = json.loads((root / ".skipo/dependencies.json").read_text())
    assert dependency_state[name] == "^2.0.0"
    assert dependency_state["_resolved"][name] == "2.0.0"
    assert "NewFacade" in source.read_text()
    assert json.loads((root / "config.json").read_text())["provider"]["mode"] == "canonical"
    assert verify_dependency_migrations(root)["ok"]
    repeated = execute_dependency_migrations(root, plan)
    assert repeated["ok"] and repeated["actions"] == []
def test_baseline_install_does_not_require_historical_contract(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {}, {})
    plan = plan_dependency_migrations(root)
    assert plan["ok"] and name not in plan["paths"]
    assert plan["migrations"] == []
def test_contract_dependency_cycle_is_rejected():
    errors = []
    items = [
        {"id": "a", "dependsOn": ["b"]},
        {"id": "b", "dependsOn": ["a"]},
    ]
    assert order_migrations(items, errors) == []
    assert errors
def test_unsupported_operation_fails_closed(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("m1", "1.0.0", "2.0.0", transformations=[{"type": "run_shell", "command": "true"}])
    ]))}, {name: "1.0.0"})
    result = execute_dependency_migrations(root, plan_dependency_migrations(root))
    assert not result["ok"]
    assert not (root / ".skipo/migration-state.json").read_text().find("m1") >= 0
def test_contract_path_traversal_is_rejected(tmp_path):
    try:
        safe_path(tmp_path, "../outside.json")
    except ValueError as error:
        assert "escapes application root" in str(error)
    else:
        raise AssertionError("path traversal must be rejected")
def test_semantic_versions_normalize_missing_patch_component():
    assert version("1.2") == version("1.2.0")
def test_missing_migration_dependency_is_rejected():
    errors = []
    assert order_migrations([{"id": "a", "dependsOn": ["missing"]}], errors) == [{"id": "a", "dependsOn": ["missing"]}]
    assert any("unavailable migrations" in error for error in errors)
def test_resolved_baseline_takes_precedence_over_declared_range(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("demo-1.5-to-2", "1.5.0", "2.0.0")
    ]))}, {name: "^1.0.0", "_resolved": {name: "1.5.0"}})
    plan = plan_dependency_migrations(root)
    assert plan["ok"]
    assert plan["paths"][name]["from"] == "1.5.0"
    assert plan["paths"][name]["specifier"] == "^2.0.0"
def test_contract_discovery_is_not_limited_to_ultrst_package_names(tmp_path):
    name = "@vendor/example"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("vendor-1-to-2", "1.0.0", "2.0.0")
    ]))}, {name: "1.0.0"})
    plan = plan_dependency_migrations(root)
    assert plan["ok"]
    assert [item["contractId"] for item in plan["migrations"]] == ["vendor-1-to-2"]
def test_framework_update_executes_dependency_contract_before_advancing_version(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("demo-1-to-2", "1.0.0", "2.0.0")
    ]))}, {name: "1.0.0"})
    (root / ".skipo/project.json").write_text(json.dumps({"framework": "skipo", "skipo_version": "1.0.0"}))
    result = update_capabilities(root, "1.1.0")
    assert result["ok"]
    assert result["dependency_migrations"]["applied"]
    assert json.loads((root / ".skipo/project.json").read_text())["skipo_version"] == "1.1.0"
    assert f"{name}::demo-1-to-2" in json.loads((root / ".skipo/migration-state.json").read_text())["dependencyApplied"]
def test_framework_update_does_not_advance_when_migration_path_is_missing(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "3.0.0"}, {name: ("3.0.0", contract(name, [
        migration("demo-2-to-3", "2.0.0", "3.0.0")
    ]))}, {name: "1.0.0"})
    (root / ".skipo/project.json").write_text(json.dumps({"framework": "skipo", "skipo_version": "1.0.0"}))
    result = update_capabilities(root, "1.1.0")
    assert not result["ok"]
    assert json.loads((root / ".skipo/project.json").read_text())["skipo_version"] == "1.0.0"
def test_contract_detects_affected_files_and_applies_canonical_replacement(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("demo-1-to-2", "1.0.0", "2.0.0",
            deprecatedPatterns=[{"text": "OldStorage", "paths": ["src/**/*.ts"]}],
            canonicalReplacements=[{"find": "OldStorage", "replace": "NewStorage", "paths": ["src/**/*.ts"]}])
    ]))}, {name: "1.0.0"})
    source = root / "src/storage.ts"
    source.parent.mkdir()
    source.write_text("export const provider = OldStorage;", encoding="utf-8")
    plan = plan_dependency_migrations(root)
    assert plan["ok"] and plan["migrations"][0]["affectedState"][0]["path"] == "src/storage.ts"
    assert execute_dependency_migrations(root, plan)["ok"]
    assert "NewStorage" in source.read_text()


def test_unresolved_deprecated_patterns_block_dependency_upgrade(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("demo-1-to-2", "1.0.0", "2.0.0", deprecatedPatterns=["OldStorage"])
    ]))}, {name: "1.0.0"})
    source = root / "src/storage.ts"
    source.parent.mkdir()
    source.write_text("export const provider = OldStorage;", encoding="utf-8")
    plan = plan_dependency_migrations(root)
    assert not plan["ok"]
    assert any("without deterministic replacements" in error for error in plan["errors"])


def test_contract_rejects_non_forward_migration_edges(tmp_path):
    name = "@ultrst-armada/demo"
    root = project(tmp_path, {name: "2.0.0"}, {name: ("2.0.0", contract(name, [
        migration("backwards", "2.0.0", "1.0.0")
    ]))}, {name: "1.0.0"})
    assert not plan_dependency_migrations(root)["ok"]
