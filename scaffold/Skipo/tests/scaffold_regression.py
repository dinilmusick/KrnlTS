#!/usr/bin/env python3
"""
scaffold_regression.py - Regression test runner for Skipo scaffolds and contracts.
Validates:
a) No file in scaffolds references generic DATABASE_URL.
b) All external UI imports resolve to approved package exports.
c) LoginGate and WorkspaceGate exist and import canonical FLOKS components.
d) UI contracts enforce REQUIRED vs OPTIONAL rules.
e) Full system validator passes cleanly with exit 0.
"""

import os
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKIPO_ROOT = HERE.parent


class ScaffoldRegressionTest(unittest.TestCase):

    def test_canonical_scaffolds_no_database_url(self):
        """Scaffolds must NEVER reference generic DATABASE_URL."""
        for scaffold_name in ["vite", "nextjs"]:
            scaffold_dir = SKIPO_ROOT / "scaffolds" / scaffold_name
            self.assertTrue(scaffold_dir.exists(), f"Scaffold {scaffold_name} missing")
            for root, _, files in os.walk(scaffold_dir):
                for f in files:
                    if f.endswith((".ts", ".tsx", ".js", ".jsx", ".env", ".example")):
                        fp = Path(root) / f
                        text = fp.read_text(encoding="utf-8", errors="ignore")
                        for i, line in enumerate(text.splitlines(), start=1):
                            if "DATABASE_URL" in line and not line.strip().startswith(("//", "#")):
                                if "obsolete" in line.lower() and "forbidden" in line.lower():
                                    continue
                                clean = re.sub(r"SYSTEM_DATABASE_URL(?:_[123])?", "", line)
                                self.assertNotIn(
                                    "DATABASE_URL",
                                    clean,
                                    f"Forbidden DATABASE_URL at {fp.relative_to(SKIPO_ROOT)}:{i}",
                                )

    def test_frontend_plane_is_pages_and_components_only(self):
        """Scaffolds must keep the frontend root limited to pages/ and components/."""
        for scaffold_name in ["vite", "nextjs"]:
            frontend = SKIPO_ROOT / "scaffolds" / scaffold_name / "src" / "frontend"
            children = sorted(
                entry.name for entry in frontend.iterdir()
                if entry.is_dir() and not entry.name.startswith(".")
            )
            self.assertEqual(children, ["components", "pages"])
            self.assertFalse((SKIPO_ROOT / "scaffolds" / scaffold_name / "src" / "frontend-state").exists())
            self.assertTrue((frontend / "components" / "components.ts").exists())
            page = frontend / "pages" / "home" / "page.tsx"
            self.assertTrue(page.exists())
            self.assertIn("components/components.js", page.read_text(encoding="utf-8"))
            self.assertTrue((frontend / "pages" / "home" / "orchestrations").exists())

    def test_generic_templates_exclude_application_specific_modules(self):
        """Generic Vite/Next templates must not ship application-specific runtimes or routes."""
        for scaffold_name in ["vite", "nextjs"]:
            base = SKIPO_ROOT / "scaffolds" / scaffold_name
            self.assertFalse((base / "src/frontend/pages/main/tabs/aiko").exists())
            self.assertFalse((base / "src/frontend/pages/main/tabs/fod").exists())
            self.assertFalse((base / "src/backend/aikoRuntime.ts").exists())
            self.assertFalse((base / "src/backend/adapters/aikoRoutes.ts").exists())
            self.assertFalse((base / "src/backend/adapters/fodRoutes.ts").exists())
            self.assertNotIn("Aiko", (base / "src/frontend/App.tsx").read_text(encoding="utf-8"))
            self.assertNotIn("FOD", (base / "src/frontend/pages/main/page.tsx").read_text(encoding="utf-8"))
        self.assertFalse((SKIPO_ROOT / "scaffolds/nextjs/app/api/aiko").exists())
        self.assertFalse((SKIPO_ROOT / "scaffolds/nextjs/app/api/fod").exists())

    def test_vite_uses_frontend_plane_browser_entrypoint(self):
        base = SKIPO_ROOT / "scaffolds" / "vite"
        index_html = (base / "index.html").read_text(encoding="utf-8")
        entrypoint = base / "src" / "frontend" / "main.tsx"
        self.assertTrue(entrypoint.is_file(), "Canonical Vite frontend entrypoint missing")
        self.assertIn('/src/frontend/main.tsx', index_html)
        self.assertNotIn('/src/main.tsx', index_html)
        self.assertFalse((base / "src" / "main.tsx").exists(), "Obsolete root src/main.tsx must not remain")

    def test_provider_entries_share_the_fetch_contract_without_node_leakage(self):
        for scaffold_name in ["vite", "nextjs"]:
            base = SKIPO_ROOT / "scaffolds" / scaffold_name
            app_source = (base / "src/app.ts").read_text(encoding="utf-8")
            worker_source = (base / "src/providers/cloudflare.ts").read_text(encoding="utf-8")
            vercel_source = (base / "src/providers/vercel.ts").read_text(encoding="utf-8")
            node_source = (base / "src/providers/node.ts").read_text(encoding="utf-8")
            wrangler = (base / "wrangler.toml").read_text(encoding="utf-8")
            vercel = json.loads((base / "vercel.json").read_text(encoding="utf-8"))

            self.assertIn("UniversalBackend", app_source)
            self.assertIn("fetchStaticAsset", app_source)
            self.assertNotIn("httpsAdapter", app_source)
            self.assertIn("httpsAdapter.js", worker_source)
            self.assertIn("fetchHandler", worker_source)
            self.assertNotIn("node:", worker_source)
            self.assertIn("nodeRequestAdapter", vercel_source)
            self.assertIn("fetchHandler", vercel_source)
            self.assertNotIn("runtime: \"edge\"", vercel_source)
            self.assertIn("httpsAdapter.js", node_source)
            self.assertIn("fetchHandler", node_source)
            self.assertIn('main = "dist/providers/cloudflare/worker.js"', wrangler)
            self.assertIn('not_found_handling = "none"', wrangler)
            self.assertNotIn("nodejs_compat", wrangler)
            self.assertTrue(vercel.get("cleanUrls"))

    def test_gates_import_canonical_floks(self):
        """LoginGate & WorkspaceGate must exist and import @ultrst-armada/floks/ui."""
        for scaffold_name in ["vite", "nextjs"]:
            gates_dir = SKIPO_ROOT / "scaffolds" / scaffold_name / "src" / "frontend" / "components" / "gates"
            login_gate = gates_dir / "LoginGate.tsx"
            ws_gate = gates_dir / "WorkspaceGate.tsx"
            self.assertTrue(login_gate.exists(), f"LoginGate missing in {scaffold_name}")
            self.assertTrue(ws_gate.exists(), f"WorkspaceGate missing in {scaffold_name}")

            login_content = login_gate.read_text(encoding="utf-8")
            self.assertTrue(
                "@ultrst-armada/floks/auth" in login_content or "@ultrst-armada/floks/ui" in login_content,
                f"Expected @ultrst-armada/floks/auth or @ultrst-armada/floks/ui in {scaffold_name} LoginGate"
            )
            self.assertIn("AuthPage", login_content)
            self.assertNotIn("@floks/ui", login_content)

            ws_content = ws_gate.read_text(encoding="utf-8")
            self.assertIn("@ultrst-armada/floks/ui", ws_content)
            self.assertIn("WorkspaceTilesMenu", ws_content)
            self.assertNotIn("@floks/ui", ws_content)

    def test_ui_contract_validator_aspect_13(self):
        """Aspect 13 validator passes on both scaffolds."""
        cmd = [sys.executable, str(SKIPO_ROOT / "checklists" / "13_ui_contract_validator.py")]
        for scaffold_name in ["vite", "nextjs"]:
            res = subprocess.run(
                cmd + [str(SKIPO_ROOT / "scaffolds" / scaffold_name)],
                capture_output=True,
                text=True,
            )
            self.assertEqual(
                res.returncode,
                0,
                f"Aspect 13 failed on {scaffold_name}: {res.stdout}\n{res.stderr}",
            )

    def test_package_export_validator_aspect_14(self):
        """Aspect 14 validator passes on both scaffolds."""
        cmd = [sys.executable, str(SKIPO_ROOT / "checklists" / "14_package_export_validator.py")]
        for scaffold_name in ["vite", "nextjs"]:
            res = subprocess.run(
                cmd + [str(SKIPO_ROOT / "scaffolds" / scaffold_name)],
                capture_output=True,
                text=True,
            )
            self.assertEqual(
                res.returncode,
                0,
                f"Aspect 14 failed on {scaffold_name}: {res.stdout}\n{res.stderr}",
            )

    def test_negative_regression_database_url_rejection(self):
        """Full system validator rejects scaffold if raw DATABASE_URL is introduced."""
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(SKIPO_ROOT / "scaffolds" / "vite", tmp_path / "app")
            bad_file = tmp_path / "app" / "src" / "backend" / "bad.ts"
            bad_file.write_text("export const db = process.env.DATABASE_URL;\n", encoding="utf-8")
            cmd = [
                sys.executable,
                str(SKIPO_ROOT / "checklists" / "07_backend_storage_isolation.py"),
                str(tmp_path / "app"),
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            self.assertNotEqual(res.returncode, 0, "Validator must reject DATABASE_URL")

    def test_negative_regression_banned_floks_import(self):
        """Aspect 13 rejects obsolete @floks/ui import."""
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(SKIPO_ROOT / "scaffolds" / "vite", tmp_path / "app")
            bad_file = tmp_path / "app" / "src" / "frontend" / "bad.tsx"
            bad_file.write_text(
                "import { AuthPage } from '@floks/ui';\nexport const x = AuthPage;\n",
                encoding="utf-8",
            )
            cmd = [
                sys.executable,
                str(SKIPO_ROOT / "checklists" / "13_ui_contract_validator.py"),
                str(tmp_path / "app"),
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            self.assertNotEqual(res.returncode, 0, "Validator must reject obsolete @floks/ui import")


    def test_floks_ui_peer_dependencies_are_declared(self):
        """Scaffolds must install the optional graph peers imported by Floks UI."""
        expected = {
            "@xyflow/react": "^12.11.1",
            "d3-force": "^3.0.0",
        }
        for scaffold_name in ["vite", "nextjs"]:
            manifest_path = SKIPO_ROOT / "scaffolds" / scaffold_name / "package.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            dependencies = manifest.get("dependencies", {})
            for package, version in expected.items():
                self.assertEqual(
                    dependencies.get(package),
                    version,
                    f"{scaffold_name} must declare Floks UI peer {package}@{version}",
                )

        with tempfile.TemporaryDirectory() as tmp:
            generated_root = Path(tmp) / "PortableApp"
            subprocess.run(
                [
                    sys.executable,
                    str(SKIPO_ROOT / "scripts" / "scaffold_app_structure.py"),
                    str(generated_root),
                    "--name",
                    "PortableApp",
                    "--no-delete-on-fail",
                ],
                capture_output=True,
                text=True,
                check=True,
            )
            generated_manifest = json.loads(
                (generated_root / "package.json").read_text(encoding="utf-8")
            )
            for package, version in expected.items():
                self.assertEqual(
                    generated_manifest.get("dependencies", {}).get(package),
                    version,
                    f"Fresh generated apps must declare Floks UI peer {package}@{version}",
                )


if __name__ == "__main__":
    unittest.main()


def test_bullmq_adapter_isolated_from_fetch_and_cloudflare_entrypoints():
    for framework in ("vite", "nextjs"):
        base = ROOT / "scaffolds" / framework
        queue = (base / "src/backend/queue/commandQueue.ts").read_text(encoding="utf-8")
        adapter = (base / "src/libraries/skipo/systems/execution/BullMQAdapter.ts").read_text(encoding="utf-8")
        cloudflare = (base / "src/providers/cloudflare.ts").read_text(encoding="utf-8")
        app = (base / "src/app.ts").read_text(encoding="utf-8")
        https = (base / "src/backend/adapters/httpsAdapter.ts").read_text(encoding="utf-8")
        assert "BullMQAdapter" in queue
        assert "bullmq" in adapter
        assert "BullMQAdapter" not in cloudflare + app + https
        assert "commandQueue" not in cloudflare + app + https

    dispatch = (ROOT / "scaffolds/nextjs/app/api/commands/dispatch/route.ts").read_text(encoding="utf-8")
    assert "runtime = 'nodejs'" in dispatch
