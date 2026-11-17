import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run(*args):
    return subprocess.run([sys.executable, str(ROOT / "scripts/skipo_cli.py"), *args], capture_output=True, text=True)

def test_add_auth_workspace_and_ui_aliases_is_deterministic():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "package.json").write_text(json.dumps({"name":"demo","dependencies":{}}))
        first = run("add", "auth-page", str(root))
        assert first.returncode == 0, first.stdout + first.stderr
        first_state = json.loads((root / ".skipo/capabilities.json").read_text())
        assert set(first_state["installed"]) == {"auth"}
        assert (root / "src/libraries/skipo/auth.ts").is_file()
        second = run("add", "ui", "workspace-tiles", str(root))
        assert second.returncode == 0, second.stdout + second.stderr
        state = json.loads((root / ".skipo/capabilities.json").read_text())
        assert set(state["installed"]) == {"auth","workspace"}
        assert (root / "src/libraries/skipo/workspace.ts").is_file()
        third = run("add", "service", "midi", str(root))
        assert third.returncode == 0, third.stdout + third.stderr
        state2 = json.loads((root / ".skipo/capabilities.json").read_text())
        assert set(state2["installed"]) == {"auth","workspace","midi"}
        repeat = run("add", "workspace", str(root))
        assert repeat.returncode == 0, repeat.stdout + repeat.stderr
        assert json.loads((root / ".skipo/capabilities.json").read_text()) == state2

def test_diagnose_and_repair_only_retire_registry_safe_duplicates():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "package.json").write_text(json.dumps({"name":"demo","dependencies":{}}))
        (root / ".env.example").write_text("SYSTEM_DATABASE_URL=postgres://example\n")
        safe = root / "src/frontend/components/WorkspaceCreateDialog.tsx"
        safe.parent.mkdir(parents=True)
        safe.write_text("export function WorkspaceCreateDialog(){ return null }")
        ordinary = root / "src/frontend/pages/home/page.tsx"
        ordinary.parent.mkdir(parents=True)
        ordinary.write_text("import { WorkspaceTilesMenu } from '@ultrst-armada/floks/ui'; export function Home(){ return null }")
        diagnosed = run("diagnose", str(root))
        assert diagnosed.returncode == 0, diagnosed.stdout + diagnosed.stderr
        payload = json.loads(diagnosed.stdout)
        retire = [f for f in payload["capabilities"] if f["classification"] == "retire"]
        assert any(f["path"].endswith("WorkspaceCreateDialog.tsx") for f in retire)
        assert not any(f["path"].endswith("home/page.tsx") and f["classification"] == "retire" for f in payload["capabilities"])
        repaired = run("repair", str(root))
        assert repaired.returncode == 0, repaired.stdout + repaired.stderr
        assert not safe.exists()
        verify = run("verify", str(root))
        assert verify.returncode == 0, verify.stdout + verify.stderr

def test_update_removes_legacy_framework_paths():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "package.json").write_text(json.dumps({"name":"legacy","dependencies":{}}))
        (root / ".skipo").mkdir()
        (root / ".skipo/project.json").write_text(json.dumps({"framework":"skipo","skipo_version":"1.0.0"}))
        legacy = root / "src/module-runtime"
        legacy.mkdir(parents=True)
        (legacy / "ModuleHost.ts").write_text("legacy")
        updated = run("update", str(root))
        assert updated.returncode == 0, updated.stdout + updated.stderr
        assert not legacy.exists()
        state = json.loads((root / ".skipo/migration-state.json").read_text())
        assert "1.1.0-capability-composition" in state["applied"]

def test_adopt_does_not_overwrite_existing_project_manifest():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "package.json").write_text(json.dumps({"name":"demo","dependencies":{}}))
        original = {"framework":"skipo","skipo_version":"0.9.0","custom":True}
        (root / ".skipo").mkdir()
        (root / ".skipo/project.json").write_text(json.dumps(original))
        result = run("adopt", str(root))
        assert result.returncode == 0
        assert json.loads((root / ".skipo/project.json").read_text()) == original

def test_add_does_not_overwrite_modified_generated_files_or_partially_apply():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "package.json").write_text(json.dumps({"name":"demo","dependencies":{}}))
        seed = run("add", "auth", str(root))
        assert seed.returncode == 0, seed.stdout + seed.stderr
        generated = root / "src/libraries/skipo/auth.ts"
        original = generated.read_text()
        generated.write_text("application-owned change")
        before_pkg = json.loads((root / "package.json").read_text())
        result = run("add", "auth", "workspace", str(root))
        assert result.returncode != 0
        assert generated.read_text() == "application-owned change"
        assert json.loads((root / "package.json").read_text()) == before_pkg
        verified = run("verify", str(root))
        assert verified.returncode != 0
        assert "Generated capability file has drifted" in verified.stdout
