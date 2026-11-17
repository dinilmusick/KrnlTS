import json
import tempfile
import unittest
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec
import sys

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
spec = spec_from_file_location("skipo_frontend_structure", ROOT / "19_skipo_frontend_structure.py")
mod = module_from_spec(spec)
spec.loader.exec_module(mod)


class SkipoFrontendStructureTests(unittest.TestCase):
    required = [
        "src/frontend/pages/auth/page.tsx",
        "src/frontend/pages/menus/workspaces/page.tsx",
        "src/frontend/pages/main/page.tsx",
        "src/frontend/pages/settings/page.tsx",
        "src/frontend/pages/settings/tabs/themes/page.tsx",
        "src/frontend/pages/settings/tabs/accounts/page.tsx",
    ]

    def make_fixture(self):
        root = Path(tempfile.mkdtemp())
        for rel in self.required:
            path = root / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            if "main/page" in rel:
                path.write_text("immersive mode")
            elif "accounts/page" in rel:
                path.write_text("Account connections")
            else:
                path.write_text("")
        (root / "src/frontend/pages/main/tabs").mkdir(parents=True, exist_ok=True)
        (root / "package.json").write_text(json.dumps({"skipo": {"deploy": "fetch"}}))
        return root

    def test_complete_provider_neutral_structure_passes(self):
        result = mod.validate_skipo_frontend_structure(self.make_fixture())
        self.assertTrue(result.passed)

    def test_missing_settings_accounts_fails(self):
        root = self.make_fixture()
        (root / "src/frontend/pages/settings/tabs/accounts/page.tsx").unlink()
        result = mod.validate_skipo_frontend_structure(root)
        self.assertFalse(result.passed)
        self.assertTrue(any(v.rule_id == "missing-skipo-page" for v in result.violations))

    def test_noncanonical_page_root_fails(self):
        root = self.make_fixture()
        (root / "src/frontend/pages/legacy").mkdir()
        result = mod.validate_skipo_frontend_structure(root)
        self.assertFalse(result.passed)
        self.assertTrue(any(v.rule_id == "invalid-skipo-page-root" for v in result.violations))

    def test_application_specific_tabs_are_rejected(self):
        root = self.make_fixture()
        tabs = root / "src/frontend/pages/main/tabs"
        for name in ("fo" + "d", "ai" + "ko"):
            (tabs / name).mkdir()
        result = mod.validate_skipo_frontend_structure(root)
        self.assertFalse(result.passed)
        self.assertTrue(any(v.rule_id == "forbidden-application-tab" for v in result.violations))


if __name__ == "__main__":
    unittest.main()


def test_vite_frontend_entrypoint_is_canonical():
    root = SkipoFrontendStructureTests().make_fixture()
    (root / "vite.config.ts").write_text("export default {};")
    (root / "src/frontend/main.tsx").write_text("createRoot(root).render(<App />);")
    (root / "index.html").write_text(
        '<div id="root"></div><script type="module" src="/src/frontend/main.tsx"></script>'
    )
    result = mod.validate_skipo_frontend_structure(root)
    assert result.passed


def test_vite_frontend_entrypoint_rejects_obsolete_root_src_main():
    root = SkipoFrontendStructureTests().make_fixture()
    (root / "vite.config.ts").write_text("export default {};")
    (root / "src/main.tsx").parent.mkdir(parents=True, exist_ok=True)
    (root / "src/main.tsx").write_text("createRoot(root).render(<App />);")
    (root / "index.html").write_text(
        '<div id="root"></div><script type="module" src="/src/main.tsx"></script>'
    )
    result = mod.validate_skipo_frontend_structure(root)
    rule_ids = {v.rule_id for v in result.violations}
    assert "missing-skipo-vite-frontend-entrypoint" in rule_ids
    assert "noncanonical-skipo-vite-entry-reference" in rule_ids


def test_app_architecture_validator_enforces_vite_frontend_entrypoint():
    validator_path = ROOT / "10_app_architecture_spec_validator.py"
    validator_spec = spec_from_file_location("app_architecture_spec_validator", validator_path)
    validator = module_from_spec(validator_spec)
    validator_spec.loader.exec_module(validator)

    root = SkipoFrontendStructureTests().make_fixture()
    (root / "vite.config.ts").write_text("export default {};")
    (root / "src/frontend/main.tsx").write_text("createRoot(root).render(<App />);")
    (root / "index.html").write_text(
        '<div id="root"></div><script type="module" src="/src/main.tsx"></script>'
    )
    result = validator.validate_app_architecture_spec(root)
    assert any(v.rule_id == "vite-frontend-entrypoint-noncanonical" for v in result.violations)


def test_bundled_vite_scaffold_uses_canonical_frontend_entrypoint():
    scaffold = ROOT.parent / "scaffolds" / "vite"
    html = (scaffold / "index.html").read_text(encoding="utf-8")
    assert (scaffold / "src/frontend/main.tsx").is_file()
    assert '/src/frontend/main.tsx' in html
    assert '/src/main.tsx' not in html
    assert not (scaffold / "src/main.tsx").exists()


def test_app_architecture_validator_accepts_canonical_vite_frontend_entrypoint():
    validator_path = ROOT / "10_app_architecture_spec_validator.py"
    validator_spec = spec_from_file_location("app_architecture_spec_validator_positive", validator_path)
    validator = module_from_spec(validator_spec)
    validator_spec.loader.exec_module(validator)

    root = SkipoFrontendStructureTests().make_fixture()
    (root / "vite.config.ts").write_text("export default {};")
    (root / "src/frontend/main.tsx").write_text("createRoot(root).render(<App />);")
    (root / "index.html").write_text(
        '<div id="root"></div><script type="module" src="/src/frontend/main.tsx"></script>'
    )
    result = validator.validate_app_architecture_spec(root)
    rule_ids = {v.rule_id for v in result.violations}
    assert "vite-frontend-entrypoint-noncanonical" not in rule_ids
    assert "missing-vite-frontend-entrypoint" not in rule_ids
