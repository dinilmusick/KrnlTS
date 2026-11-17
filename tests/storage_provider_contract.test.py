from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def test_workspace_storage_declares_canonical_providers():
    workspace = (ROOT / "architecture/workspace-architectures/SKILL.md").read_text()
    app_contract = (ROOT / "architecture/app-architecture/SKILL.md").read_text()
    storage = (ROOT / "backend/workspace-storage/SKILL.md").read_text()

    for document in (workspace, app_contract, storage):
        assert "S3-compatible" in document
        assert "Google Drive" in document

    assert "Amazon S3 is not a selectable Skipo workspace provider" not in workspace
    assert "provider-specific SDKs and credentials" in workspace

def test_workspace_creation_dialog_is_owned_by_floks_for_all_skipo_scaffolds():
    for scaffold_name in ("nextjs", "vite"):
        root = ROOT / "scaffolds" / scaffold_name
        gate = (root / "src/frontend/components/gates/WorkspaceGate.tsx").read_text()
        package = __import__("json").loads((root / "package.json").read_text())

        assert "@ultrst-armada/floks/ui" in gate
        assert "WorkspaceTilesMenu" in gate
        assert "storageOptions" in gate
        assert "onManageStorage={onManageStorage}" in gate
        assert re.fullmatch(r"\^2\.\d+\.\d+", package["dependencies"]["@ultrst-armada/floks"])

    generator = (ROOT / "scripts/scaffold_app_structure.py").read_text()
    root_package = __import__("json").loads((ROOT / "package.json").read_text())
    assert "WorkspaceTilesMenu" in generator
    assert "WorkspaceGate.tsx" in generator
    assert "onManageStorage" in generator
    assert '"@ultrst-armada/floks": "^2.0.0"' in generator
    assert re.fullmatch(r"\^2\.\d+\.\d+", root_package["dependencies"]["@ultrst-armada/floks"])


def test_google_drive_uses_kloks_adapter_in_every_canonical_scaffold():
    for scaffold_name in ("nextjs", "vite"):
        root = ROOT / "scaffolds" / scaffold_name
        backend = (root / "src/backend/AppBackend.ts").read_text()
        adapter = (root / "src/backend/storage/googleDriveWorkspaceStorage.ts").read_text()
        storage_types = (root / "src/libraries/types/storage.ts").read_text()
        env_example = (root / ".env.example").read_text()

        assert "storageProviders" in backend
        assert "googleDrive: { create: createGoogleDriveWorkspaceStorage }" in backend
        assert "GoogleDriveWorkspaceService" in adapter
        assert "exchangeGoogleDriveAuthorizationCode" in adapter
        assert "googleAccessTokenExpiresAt" in storage_types
        assert "GOOGLE_DRIVE_CLIENT_SECRET" not in backend
        assert "process.env" not in adapter
        assert "GoogleDriveEnvironment" in adapter

    generator = (ROOT / "scripts/scaffold_app_structure.py").read_text()
    assert "createGoogleDriveWorkspaceStorage" in generator
    assert "GoogleDriveWorkspaceService" in generator
    assert "GoogleDriveEnvironment" in generator
    assert "process.env.GOOGLE_DRIVE_CLIENT_ID" not in generator


def test_generic_scaffold_keeps_google_drive_adapter_opt_in_and_portable(tmp_path):
    import subprocess
    import sys

    target = tmp_path / "PortableApp"
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "scaffold_app_structure.py"), str(target), "--name", "PortableApp"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    adapter = (target / "src/backend/storage/googleDriveWorkspaceStorage.ts").read_text(encoding="utf-8")
    backend = (target / "src/backend/PortableAppBackend.ts").read_text(encoding="utf-8")
    assert "GoogleDriveWorkspaceService" in adapter
    assert "GoogleDriveEnvironment" in adapter
    assert "process.env" not in adapter
    assert "createGoogleDriveWorkspaceStorage" not in backend
    assert "storageProviders" not in backend
