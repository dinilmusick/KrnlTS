from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("skipo_auth_contract", ROOT / "checklists" / "21_skipo_authentication_contract.py")
AUTH_CONTRACT = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(AUTH_CONTRACT)
scan_source_tree = AUTH_CONTRACT.scan_source_tree


def test_generic_scaffold_generates_canonical_floks_kloks_auth(tmp_path):
    target = tmp_path / "CanonicalDemo"
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "scaffold_app_structure.py"), str(target), "--name", "CanonicalDemo"],
        cwd=ROOT, capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr

    auth_page = target / "src/frontend/pages/auth/page.tsx"
    adapter = target / "src/frontend/pages/auth/LuthAuthPage.tsx"
    guard = target / "src/backend/auth/luthSession.ts"
    fetcher = target / "src/frontend/pages/auth/luthFetch.ts"
    backend = target / "src/backend/CanonicalDemoBackend.ts"
    manifest = json.loads((target / "package.json").read_text(encoding="utf-8"))

    assert auth_page.is_file() and adapter.is_file() and guard.is_file() and fetcher.is_file()
    assert "@ultrst-armada/floks/auth" in adapter.read_text(encoding="utf-8")
    assert "LuthAuthPage as FloksLuthAuthPage" in adapter.read_text(encoding="utf-8")
    assert "@ultrst-armada/kloks/auth" in fetcher.read_text(encoding="utf-8")
    assert "LuthAuthPage" in auth_page.read_text(encoding="utf-8")
    assert "requireLuthSession" in guard.read_text(encoding="utf-8")
    assert "getAuthHeaders" in fetcher.read_text(encoding="utf-8")
    assert "canonicaldemo" in fetcher.read_text(encoding="utf-8")
    assert "LuthAuthServiceFacade" in backend.read_text(encoding="utf-8")
    assert not re.search(r"\bAuthServiceFacade\b", backend.read_text(encoding="utf-8"))
    assert manifest["dependencies"]["@ultrst-armada/krnl"] == "^1.0.25"
    assert manifest["dependencies"]["@dinilmusick/gutts"] == AUTH_CONTRACT.PACKAGE_BASELINE["@dinilmusick/gutts"]
    assert scan_source_tree(target) == []


def test_negative_scaffold_with_password_hashing_is_rejected(tmp_path):
    source = tmp_path / "src/auth/login.ts"
    source.parent.mkdir(parents=True)
    source.write_text("import bcrypt from 'bcryptjs';\nconst hash = await bcrypt.hash(password, 12);\n")
    assert any("bcrypt" in item for item in scan_source_tree(tmp_path))


def test_negative_scaffold_with_local_password_verification_is_rejected(tmp_path):
    source = tmp_path / "app/api/auth/route.ts"
    source.parent.mkdir(parents=True)
    source.write_text("export async function POST() { return verifyPassword(input.password, row.passwordHash); }\n")
    violations = scan_source_tree(tmp_path)
    assert any("password verification" in item or "credential hash" in item for item in violations)


def test_negative_scaffold_with_local_session_issuance_is_rejected(tmp_path):
    source = tmp_path / "src/auth/session.ts"
    source.parent.mkdir(parents=True)
    source.write_text("export const issue = (user) => jwt.sign({ sub: user.id }, secret);\n")
    assert any("JWT issuance" in item for item in scan_source_tree(tmp_path))


def test_negative_scaffold_with_direct_better_auth_database_is_rejected(tmp_path):
    source = tmp_path / "src/auth/server.ts"
    source.parent.mkdir(parents=True)
    source.write_text("import { betterAuth } from 'better-auth';\nexport const auth = betterAuth({ database: adapter });\n")
    assert any("Better Auth" in item for item in scan_source_tree(tmp_path))


def test_negative_scaffold_with_legacy_kloks_auth_facade_is_rejected(tmp_path):
    source = tmp_path / "src/backend/AppBackend.ts"
    source.parent.mkdir(parents=True)
    source.write_text("import { AuthServiceFacade } from '@ultrst-armada/kloks/backend';\nexport const services = { auth: AuthServiceFacade };\n")
    assert any("AuthServiceFacade" in item for item in scan_source_tree(tmp_path))


def test_negative_scaffold_with_local_credential_storage_is_rejected(tmp_path):
    source = tmp_path / "src/auth/credentials.ts"
    source.parent.mkdir(parents=True)
    source.write_text("localStorage.setItem('app-password', password);\n")
    assert any("credential persistence" in item for item in scan_source_tree(tmp_path))


def test_nextjs_scaffold_uses_luth_adapter_and_has_no_local_auth_endpoints():
    login = (ROOT / "scaffolds/nextjs/app/login/page.tsx").read_text(encoding="utf-8")
    backend = (ROOT / "scaffolds/nextjs/src/backend/AppBackend.ts").read_text(encoding="utf-8")
    assert "src/frontend/pages/auth/LuthAuthPage" in login
    assert "LuthAuthPage as FloksLuthAuthPage" in (ROOT / "scaffolds/nextjs/src/frontend/pages/auth/LuthAuthPage.tsx").read_text(encoding="utf-8")
    assert "LuthAuthPage as FloksLuthAuthPage" in (ROOT / "scaffolds/nextjs/src/frontend/pages/auth/LuthAuthPage.tsx").read_text(encoding="utf-8")
    assert not re.search(r"\bAuthServiceFacade\b", backend)
    assert not (ROOT / "scaffolds/nextjs/app/api/auth/login/route.ts").exists()
    assert not (ROOT / "scaffolds/nextjs/app/api/auth/register/route.ts").exists()
    assert "DEFAULT_LUTH_URL" in (ROOT / "scaffolds/nextjs/src/backend/auth/luthSession.ts").read_text(encoding="utf-8")


def test_vite_scaffold_uses_luth_for_backend_identity_and_session_validation():
    backend = (ROOT / "scaffolds/vite/src/backend/AppBackend.ts").read_text(encoding="utf-8")
    guard = (ROOT / "scaffolds/vite/src/backend/auth/luthSession.ts").read_text(encoding="utf-8")
    assert not re.search(r"\bAuthServiceFacade\b", backend)
    assert "DEFAULT_LUTH_URL" in guard
    assert "session.session?.id" in guard
    assert "proxyLuthAuthRequest" in guard


def test_nextjs_middleware_verifies_luth_and_overwrites_untrusted_identity_headers():
    middleware = (ROOT / "scaffolds/nextjs/middleware.ts").read_text(encoding="utf-8")
    assert "getLuthSession" in middleware
    assert "x-user-id" in middleware
    assert "x-user-role" in middleware
    assert "NextResponse.next({ request: { headers: forwarded } })" in middleware


def test_negative_scaffold_with_direct_auth_database_reads_is_rejected(tmp_path):
    source = tmp_path / "src/auth/repository.ts"
    source.parent.mkdir(parents=True)
    source.write_text("const result = await db.query('SELECT * FROM users WHERE id = ?', [id]);\n")
    assert any("authentication database reads" in item for item in scan_source_tree(tmp_path))


def test_negative_scaffold_with_local_auth_schema_is_rejected(tmp_path):
    source = tmp_path / "src/auth/schema.ts"
    source.parent.mkdir(parents=True)
    source.write_text("export const credentials = pgTable('credentials', { passwordHash: text() });\n")
    violations = scan_source_tree(tmp_path)
    assert any("authentication ORM table" in item or "credential hash" in item for item in violations)



def test_published_package_baseline_is_aligned_across_root_scaffolds_and_lockfile():
    manifests = (
        ROOT / "package.json",
        ROOT / "scaffolds/nextjs/package.json",
        ROOT / "scaffolds/vite/package.json",
    )

    for name, expected in AUTH_CONTRACT.PACKAGE_BASELINE.items():
        for manifest_path in manifests:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            actual = manifest["dependencies"].get(name)
            assert AUTH_CONTRACT.package_spec_satisfies_minimum(actual, expected), f"{manifest_path}: {name}"

        lockfile = (ROOT / "pnpm-lock.yaml").read_text(encoding="utf-8")
        root_importer = lockfile.split("packages:", 1)[0]
        locked = re.search(
            rf"(?m)^      '{re.escape(name)}':\n        specifier: ([^\n]+)\n        version: ([^\n]+)",
            root_importer,
        )
        assert locked, f"pnpm-lock.yaml is missing the root importer for {name}"
        assert AUTH_CONTRACT.package_spec_satisfies_minimum(locked.group(1), expected), f"{name} lockfile specifier is below the supported baseline"
        assert AUTH_CONTRACT.resolved_version_satisfies_minimum(locked.group(2).split("(", 1)[0], expected), f"{name} lockfile resolution is below the supported baseline"
