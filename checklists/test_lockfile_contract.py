#!/usr/bin/env python3
import json
import tempfile
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lockfile_contract import validate_lockfile_contract

def fixture(manifest_spec, lock_spec, manager="pnpm@10.33.0"):
    root = Path(tempfile.mkdtemp())
    (root / "package.json").write_text(json.dumps({
        "name": "fixture",
        "packageManager": manager,
        "dependencies": {"@ultrst-armada/kloks": manifest_spec},
    }) + "\n")
    (root / "pnpm-lock.yaml").write_text(
        "lockfileVersion: '9.0'\nimporters:\n  .:\n"
        "    dependencies:\n"
        "      '@ultrst-armada/kloks':\n"
        f"        specifier: {lock_spec}\n"
        "        version: 1.9.0\n"
    )
    return root

def test_matching_specifier_passes():
    assert validate_lockfile_contract(fixture("^1.9.0", "^1.9.0")).passed

def test_stale_specifier_fails():
    result = validate_lockfile_contract(fixture("^1.9.0", "^1.7.1"))
    assert not result.passed
    assert any(v.rule_id == "lockfile-specifier-mismatch" for v in result.violations)

def test_wrong_package_manager_fails():
    result = validate_lockfile_contract(fixture("^1.9.0", "^1.9.0", "pnpm@9.15.0"))
    assert not result.passed
    assert any(v.rule_id == "noncanonical-package-manager" for v in result.violations)

def test_competing_lockfile_fails():
    root = fixture("^1.9.0", "^1.9.0")
    (root / "package-lock.json").write_text("{}\n")
    result = validate_lockfile_contract(root)
    assert not result.passed
    assert any(v.rule_id == "invalid-lockfile-set" for v in result.violations)

if __name__ == "__main__":
    test_matching_specifier_passes()
    test_stale_specifier_fails()
    test_wrong_package_manager_fails()
    test_competing_lockfile_fails()
    print("lockfile contract tests passed")
