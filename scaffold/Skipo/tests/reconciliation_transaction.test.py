import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import skipo_capabilities
import skipo_reconciliation


def make_project(root, *, installed=None, dependencies=None, generated=None, version="1.1.0"):
    (root / "package.json").write_text(
        json.dumps({"name": "demo", "dependencies": dependencies or {}}, indent=2) + "\n"
    )
    state = root / ".skipo"
    state.mkdir()
    (state / "project.json").write_text(
        json.dumps({"framework": "skipo", "skipo_version": version}, indent=2) + "\n"
    )
    (state / "capabilities.json").write_text(json.dumps({
        "schemaVersion": 1, "installed": installed or {}, "generated": generated or []
    }, indent=2) + "\n")
    (state / "overrides.json").write_text(json.dumps({"schemaVersion": 1, "capabilities": {}}, indent=2) + "\n")
    (state / "dependencies.json").write_text("{}\n")
    (state / "migration-state.json").write_text(
        json.dumps({"schemaVersion": 1, "applied": [], "pending": [], "dependencyApplied": []}, indent=2) + "\n"
    )


def files_snapshot(root):
    return {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


def test_clean_project_repair_is_a_byte_for_byte_noop():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(root)
        before = files_snapshot(root)
        result = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert result["ok"], result
        assert result["actions"] == []
        assert files_snapshot(root) == before


def test_known_dirty_project_is_repaired_and_verified():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(root, installed={"workspace": {"kind": "capability"}})
        obsolete = root / "src/frontend/components/WorkspaceCreateDialog.tsx"
        obsolete.parent.mkdir(parents=True)
        obsolete.write_text("export function WorkspaceCreateDialog(){ return null }")
        result = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert result["ok"], result
        assert not obsolete.exists()
        assert (root / "src/libraries/skipo/workspace.ts").read_text() == (
            "export { WorkspaceTilesMenu } from '@ultrst-armada/floks/ui';\n"
            "export { WorkspaceServiceFacade, WorkspaceBackendFacade } from '@ultrst-armada/kloks/backend';\n"
        )
        package = json.loads((root / "package.json").read_text())
        assert package["dependencies"]["@ultrst-armada/floks"] == "^2.0.0"
        assert package["dependencies"]["@ultrst-armada/kloks"] == "^2.0.4"
        assert skipo_capabilities.verify(root)["ok"]


def test_repair_is_idempotent():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(root, installed={"workspace": {"kind": "capability"}})
        first = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert first["ok"], first
        snapshot = files_snapshot(root)
        second = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert second["ok"], second
        assert second["actions"] == []
        assert files_snapshot(root) == snapshot


def test_ambiguous_generated_content_fails_closed_without_partial_writes():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(
            root, installed={"workspace": {"kind": "capability"}},
            dependencies={"@ultrst-armada/floks": "^1.0.0"}
        )
        target = root / "src/libraries/skipo/workspace.ts"
        target.parent.mkdir(parents=True)
        target.write_text("application-owned implementation")
        before = files_snapshot(root)
        result = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert not result["ok"]
        assert result["applied"] is False
        assert result["conflicts"]
        assert files_snapshot(root) == before


def test_only_explicit_safe_retire_paths_are_removed():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(root)
        safe = root / "src/frontend/components/WorkspaceCreateDialog.tsx"
        safe.parent.mkdir(parents=True)
        safe.write_text("export function WorkspaceCreateDialog(){ return null }")
        app = root / "src/frontend/pages/home/page.tsx"
        app.parent.mkdir(parents=True)
        app.write_text("export function Home(){ return <WorkspaceTilesMenu /> }")
        result = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert result["ok"], result
        assert not safe.exists()
        assert app.exists()


def test_symlink_retirement_target_fails_closed():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(root)
        target = root / "outside.tsx"
        target.write_text("keep")
        link = root / "src/frontend/components/WorkspaceCreateDialog.tsx"
        link.parent.mkdir(parents=True)
        link.symlink_to(target)
        before = files_snapshot(root)
        result = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert not result["ok"]
        assert result["applied"] is False
        assert target.read_text() == "keep"
        assert files_snapshot(root) == before


def test_post_repair_verification_failure_is_returned_as_failure():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(root, installed={"workspace": {"kind": "capability"}})
        original = skipo_reconciliation.capabilities.verify
        skipo_reconciliation.capabilities.verify = lambda _root: {
            "ok": False, "errors": ["simulated verification failure"]
        }
        try:
            result = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        finally:
            skipo_reconciliation.capabilities.verify = original
        assert not result["ok"]
        assert result["verification"]["errors"] == ["simulated verification failure"]


def test_unresolved_dependency_migration_blocks_all_repair_mutations():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        make_project(root, installed={"workspace": {"kind": "capability"}})
        (root / "package.json").write_text(json.dumps({
            "name": "demo", "dependencies": {"@ultrst-armada/kloks": "99.0.0"}
        }, indent=2) + "\n")
        before = files_snapshot(root)
        result = skipo_reconciliation.reconcile(root, apply=True, framework_version="1.1.0")
        assert not result["ok"]
        assert result["applied"] is False
        assert result["conflicts"]
        assert files_snapshot(root) == before
