"""Regression tests for the published Skipo maintenance documentation contract."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs" / "SKIPO-MAINTENANCE-CONTRACT.md"
CLI = ROOT / "scripts" / "skipo_cli.py"
CAPABILITIES = ROOT / "scripts" / "skipo_capabilities.py"
REGISTRY = ROOT / "architecture" / "capabilities" / "migrations.json"


def test_maintenance_contract_documents_the_full_ordered_lifecycle():
    text = DOC.read_text(encoding="utf-8")
    lifecycle = ("inspect", "diagnose", "plan", "update", "repair", "sync", "verify")
    positions = [text.index(f"{stage}\n") for stage in lifecycle]
    assert positions == sorted(positions)


def test_documented_cli_commands_are_dispatched_by_the_installed_cli():
    cli = CLI.read_text(encoding="utf-8")
    for command in ("inspect", "diagnose", "plan", "update", "repair", "sync", "verify"):
        assert f'"{command}"' in cli
    assert "def verify_project" in cli
    assert "def update_project" in cli
    assert "def repair_project" in cli


def test_environment_contract_names_are_all_documented():
    text = DOC.read_text(encoding="utf-8")
    for variable in (
        "SYSTEM_DATABASE_URL",
        "SYSTEM_DATABASE_URL_2",
        "SYSTEM_DATABASE_URL_3",
        "APP_URL",
    ):
        assert "`" + variable + "`" in text


def test_current_update_executor_limit_is_explicit_and_matches_registry():
    doc = DOC.read_text(encoding="utf-8")
    code = CAPABILITIES.read_text(encoding="utf-8")
    migration_data = REGISTRY.read_text(encoding="utf-8")
    assert "generic dependency-contract consumer" in doc
    assert "does **not** download or install a newer Skipo npm package" in doc
    assert "skipo_dependency_migrations" in code
    assert "skipo_migrations" in code
    assert '"id": "1.1.0-capability-composition"' in migration_data
    assert '"id": "1.2.0-resumable-framework-upgrade"' in migration_data


def test_verify_and_full_system_check_are_not_conflated():
    doc = DOC.read_text(encoding="utf-8")
    cli = CLI.read_text(encoding="utf-8")
    assert "broader than the capability-state checks" in doc
    assert "full_system_validator.py" in cli
    assert "maintenance_verify(root, VERSION)" in cli
