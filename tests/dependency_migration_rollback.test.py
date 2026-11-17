import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from skipo_dependency_migrations import execute_dependency_migrations


def test_invalid_nested_json_target_fails_closed_and_rolls_back_prior_changes(tmp_path):
    source = tmp_path / "src/example.ts"
    source.parent.mkdir()
    source.write_text("OldFacade", encoding="utf-8")
    config = tmp_path / "config.json"
    config.write_text(json.dumps({"provider": "legacy"}), encoding="utf-8")
    state = tmp_path / ".skipo/migration-state.json"
    state.parent.mkdir()
    state.write_text(json.dumps({"schemaVersion": 1, "applied": [], "pending": []}), encoding="utf-8")
    plan = {
        "ok": True,
        "paths": {},
        "migrations": [{
            "id": "@vendor/example::upgrade",
            "transformations": [
                {"type": "replace_text", "paths": ["src/**/*.ts"], "find": "OldFacade", "replace": "NewFacade"},
                {"type": "set_json", "path": "config.json", "key": "provider.mode", "value": "canonical"},
            ],
            "repair": [],
            "verification": [],
        }],
    }

    result = execute_dependency_migrations(tmp_path, plan)

    assert not result["ok"]
    assert "Expected a JSON object" in result["errors"][0]
    assert source.read_text(encoding="utf-8") == "OldFacade"
    assert json.loads(config.read_text(encoding="utf-8")) == {"provider": "legacy"}
    assert "dependencyApplied" not in json.loads(state.read_text(encoding="utf-8"))
