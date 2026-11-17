import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from skipo_verification import verify_canonical_state, verification_fingerprint
from skipo_capabilities import repair

def project(root):
    (root/".skipo").mkdir()
    (root/"package.json").write_text(json.dumps({"name":"demo","dependencies":{}}))
    (root/".skipo/project.json").write_text(json.dumps({"framework":"skipo","skipo_version":"1.1.0"}))
    (root/".skipo/capabilities.json").write_text(json.dumps({"installed":{},"generated":[]}))
    (root/".skipo/dependencies.json").write_text("{}")
    (root/".skipo/migration-state.json").write_text(json.dumps({"applied":["1.1.0-capability-composition"],"pending":[]}))

def test_clean_is_deterministic_and_read_only(tmp_path):
    project(tmp_path)
    before={p.relative_to(tmp_path).as_posix():p.read_bytes() for p in tmp_path.rglob("*") if p.is_file()}
    a=verify_canonical_state(tmp_path,"1.1.0"); b=verify_canonical_state(tmp_path,"1.1.0")
    after={p.relative_to(tmp_path).as_posix():p.read_bytes() for p in tmp_path.rglob("*") if p.is_file()}
    assert a==b and a["status"]=="clean" and a["ok"] and before==after

def test_missing_manifest_is_invalid(tmp_path):
    (tmp_path/"package.json").write_text('{"name":"demo","dependencies":{}}')
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="invalid"
    assert "SKIPO_MANIFEST_MISSING" in {d["code"] for d in result["diagnostics"]}

def test_pending_migration_is_unresolved(tmp_path):
    project(tmp_path)
    (tmp_path/".skipo/migration-state.json").write_text(json.dumps({"applied":[],"pending":["manual-review"]}))
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="unresolved"
    assert "SKIPO_MIGRATION_PENDING" in {d["code"] for d in result["diagnostics"]}

def test_checksum_drift_is_repairable(tmp_path):
    project(tmp_path); path=tmp_path/"src/generated.ts"; path.parent.mkdir(); path.write_text("drift")
    (tmp_path/".skipo/capabilities.json").write_text(json.dumps({"installed":{},"generated":[{"path":"src/generated.ts","owner":"skipo","checksum":"0"*64}]}))
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="repairable"
    assert "SKIPO_CHECKSUM_MISMATCH" in {d["code"] for d in result["diagnostics"]}

def test_forbidden_environment_variable_is_unsafe(tmp_path, monkeypatch):
    project(tmp_path); monkeypatch.setenv("SKIPO_DISABLE_CANONICAL_STATE_ENFORCEMENT","1")
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="unsafe/ambiguous"
    assert "SKIPO_FORBIDDEN_ENVIRONMENT_VARIABLE" in {d["code"] for d in result["diagnostics"]}

def test_provider_ownership_mismatch_is_unsafe(tmp_path):
    project(tmp_path)
    (tmp_path/".skipo/capabilities.json").write_text(json.dumps({"installed":{"auth":{"providers":[{"package":"local"}]}},"generated":[]}))
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="unsafe/ambiguous"
    assert "SKIPO_PROVIDER_OWNERSHIP_MISMATCH" in {d["code"] for d in result["diagnostics"]}

def test_malformed_state_is_invalid(tmp_path):
    project(tmp_path); (tmp_path/".skipo/capabilities.json").write_text("{")
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="invalid"
    assert "SKIPO_STATE_INVALID" in {d["code"] for d in result["diagnostics"]}

def test_framework_repository_verifies_without_application_adoption_state():
    result=verify_canonical_state(ROOT)
    assert result["status"] in {"clean","repaired"}
    assert result["ok"] is True

def test_canonical_dependency_mismatch_is_repairable(tmp_path):
    project(tmp_path)
    from skipo_state_registry import load_registry
    auth=load_registry()["capabilities"]["auth"]
    (tmp_path/"package.json").write_text(json.dumps({"name":"demo","dependencies":{}}))
    (tmp_path/".skipo/capabilities.json").write_text(json.dumps({
        "installed":{"auth":{"providers":auth["providers"]}},
        "generated":[],
    }))
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="repairable"
    assert "SKIPO_CANONICAL_DEPENDENCY_MISMATCH" in {d["code"] for d in result["diagnostics"]}

def test_matching_repair_receipt_is_reported_as_repaired(tmp_path):
    project(tmp_path)
    (tmp_path/".skipo/verification-state.json").write_text(json.dumps({
        "lastRepair":"verified",
        "fingerprint":verification_fingerprint(tmp_path),
    }))
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="repaired"
    assert result["ok"] is True

def test_stale_repair_receipt_does_not_mark_later_state_as_repaired(tmp_path):
    project(tmp_path)
    receipt={"lastRepair":"verified","fingerprint":verification_fingerprint(tmp_path)}
    (tmp_path/".skipo/verification-state.json").write_text(json.dumps(receipt))
    package=json.loads((tmp_path/"package.json").read_text())
    package["description"]="changed after repair"
    (tmp_path/"package.json").write_text(json.dumps(package))
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="clean"
    assert result["ok"] is True

def test_legacy_migration_paths_remain_unresolved_even_when_marked_applied(tmp_path):
    project(tmp_path)
    legacy=tmp_path/"src/module-contract"
    legacy.mkdir(parents=True)
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="unresolved"
    assert "SKIPO_LEGACY_MIGRATION_PATH_REMAINS" in {d["code"] for d in result["diagnostics"]}

def test_malformed_migration_state_is_invalid_without_crashing(tmp_path):
    project(tmp_path)
    (tmp_path/".skipo/migration-state.json").write_text(json.dumps({"applied":[],"pending":[{"bad":"id"}]}))
    result=verify_canonical_state(tmp_path,"1.1.0")
    assert result["status"]=="invalid"
    assert "SKIPO_MIGRATION_STATE_INVALID" in {d["code"] for d in result["diagnostics"]}

def test_repair_fails_when_post_repair_verification_is_unresolved(tmp_path):
    project(tmp_path)
    legacy=tmp_path/"src/module-contract"
    legacy.mkdir(parents=True)
    result=repair(tmp_path,True,"1.1.0")
    assert result["ok"] is False
    assert result["verification"]["status"]=="unresolved"
    assert not (tmp_path/".skipo/verification-state.json").exists()
