import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from skipo_environment_contract import diagnose, repair, verify


def test_canonical_environment_passes(tmp_path):
    (tmp_path / ".env.example").write_text(
        "SYSTEM_DATABASE_URL=postgres://example\nAPP_URL=https://example.test\n"
        "SYSTEM_DATABASE_URL_2=\nSYSTEM_DATABASE_URL_3=\n"
    )
    result = verify(tmp_path)
    assert result["ok"], result["errors"]


def test_undeclared_environment_is_blocking_and_not_deleted(tmp_path):
    path = tmp_path / ".env.example"
    path.write_text("SYSTEM_DATABASE_URL=postgres://example\nUNKNOWN_SERVICE_TOKEN=value\n")
    before = path.read_text()
    result = repair(tmp_path, apply=True)
    assert not result["ok"]
    assert not result["applied"]
    assert path.read_text() == before
    assert any(x["classification"] == "undeclared_framework_configuration" for x in diagnose(tmp_path)["findings"])


def test_depm_alias_is_migrated_to_app_url(tmp_path):
    path = tmp_path / ".env.example"
    path.write_text("SYSTEM_DATABASE_URL=postgres://example\nDEPM_GATEWAY_DOMAIN=https://example.test\n")
    result = repair(tmp_path, apply=True)
    assert result["ok"], result
    assert "APP_URL=https://example.test" in path.read_text()
    assert "DEPM_GATEWAY_DOMAIN" not in path.read_text()


def test_alias_and_canonical_conflict_fails_closed(tmp_path):
    path = tmp_path / ".env"
    path.write_text("SYSTEM_DATABASE_URL=postgres://example\nDEPM_GATEWAY_DOMAIN=https://old.test\nAPP_URL=https://new.test\n")
    before = path.read_text()
    result = repair(tmp_path, apply=True)
    assert not result["ok"]
    assert path.read_text() == before
