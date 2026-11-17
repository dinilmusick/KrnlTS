"""CLI integration tests for environment maintenance lifecycle."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "scripts" / "skipo_cli.py"


def run_cli(command, target):
    return subprocess.run(
        [sys.executable, str(CLI), command, str(target)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )


def make_project(root, env_text):
    (root / "package.json").write_text(json.dumps({"name": "environment-fixture", "version": "1.0.0"}))
    (root / ".env.example").write_text(env_text)


def test_cli_diagnose_plan_repair_verify_lifecycle(tmp_path):
    make_project(tmp_path, "SYSTEM_DATABASE_URL=postgres://example\n")
    env_file = tmp_path / ".env"
    env_file.write_text("DEPM_GATEWAY_DOMAIN=https://app.example\n")

    diagnose = run_cli("diagnose", tmp_path)
    assert diagnose.returncode == 0, diagnose.stdout + diagnose.stderr
    assert json.loads(diagnose.stdout)["environment"]["findings"]

    plan = run_cli("plan", tmp_path)
    assert plan.returncode == 0, plan.stdout + plan.stderr
    assert json.loads(plan.stdout)["environment"]["actions"][0]["to"] == "APP_URL"

    repair = run_cli("repair", tmp_path)
    assert repair.returncode == 0, repair.stdout + repair.stderr
    assert "APP_URL=https://app.example" in env_file.read_text()

    verify = run_cli("verify", tmp_path)
    assert verify.returncode == 0, verify.stdout + verify.stderr
    assert json.loads(verify.stdout)["environment"]["ok"] is True


def test_cli_repair_blocks_unknown_configuration_without_mutation(tmp_path):
    make_project(tmp_path, "SYSTEM_DATABASE_URL=postgres://example\n")
    env_file = tmp_path / ".env"
    original = "DEPM_GATEWAY_DOMAIN=https://app.example\nUNDECLARED_TOKEN=value\n"
    env_file.write_text(original)

    repair = run_cli("repair", tmp_path)
    assert repair.returncode == 1
    assert env_file.read_text() == original
    assert json.loads(repair.stdout)["applied"] is False
