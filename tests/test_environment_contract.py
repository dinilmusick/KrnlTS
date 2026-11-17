"""Regression tests for the canonical Skipo environment contract."""
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
import skipo_environment_contract as env


class EnvironmentContractTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / ".env.example").write_text("SYSTEM_DATABASE_URL=postgres://example\n", encoding="utf-8")

    def tearDown(self):
        self.temp.cleanup()

    def write(self, rel, content):
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def test_canonical_and_declared_platform_variables_are_allowed(self):
        self.write(".env.local", "SYSTEM_DATABASE_URL=postgres://local\nAPP_URL=https://app.example\nNODE_ENV=development\n")
        result = env.verify(self.root)
        self.assertTrue(result["ok"], result["errors"])

    def test_deprecated_alias_is_planned_and_migrated(self):
        path = self.write(".env.production", "SYSTEM_DATABASE_URL=postgres://db\nDEPM_GATEWAY_DOMAIN=https://app.example\n")
        planned = env.plan(self.root)
        self.assertTrue(planned["ok"], planned["conflicts"])
        self.assertEqual(planned["actions"][0]["to"], "APP_URL")
        repaired = env.repair(self.root, apply=True)
        self.assertTrue(repaired["ok"], repaired)
        self.assertIn("APP_URL=https://app.example", path.read_text(encoding="utf-8"))
        self.assertNotIn("DEPM_GATEWAY_DOMAIN", path.read_text(encoding="utf-8"))

    def test_alias_references_in_source_are_migrated(self):
        path = self.write("src/config.ts", "export const origin = process.env.DEPM_GATEWAY_DOMAIN;\n")
        result = env.repair(self.root, apply=True)
        self.assertTrue(result["ok"], result)
        self.assertIn("process.env.APP_URL", path.read_text(encoding="utf-8"))

    def test_unknown_variable_fails_closed_without_mutation(self):
        path = self.write(".env", "SYSTEM_DATABASE_URL=postgres://db\nUNDECLARED_PRIVATE_KEY=value\n")
        before = path.read_text(encoding="utf-8")
        result = env.repair(self.root, apply=True)
        self.assertFalse(result["ok"])
        self.assertFalse(result["applied"])
        self.assertEqual(path.read_text(encoding="utf-8"), before)

    def test_missing_required_variable_blocks_plan(self):
        (self.root / ".env.example").write_text("APP_URL=https://app.example\n", encoding="utf-8")
        result = env.plan(self.root)
        self.assertFalse(result["ok"])
        self.assertIn("missing_required", [x["classification"] for x in result["blocked_findings"]])

    def test_conflicting_alias_and_canonical_values_are_not_overwritten(self):
        path = self.write(".env", "SYSTEM_DATABASE_URL=postgres://db\nDEPM_GATEWAY_DOMAIN=https://old.example\nAPP_URL=https://new.example\n")
        before = path.read_text(encoding="utf-8")
        result = env.repair(self.root, apply=True)
        self.assertFalse(result["ok"])
        self.assertEqual(path.read_text(encoding="utf-8"), before)
        self.assertTrue(result["conflicts"])

    def test_yaml_environment_alias_and_canonical_conflict_blocks_repair(self):
        path = self.write(
            ".github/workflows/deploy.yml",
            "env:\n"
            "  SYSTEM_DATABASE_URL: postgres://db\n"
            "  DEPM_GATEWAY_DOMAIN: https://old.example\n"
            "  APP_URL: https://new.example\n",
        )
        before = path.read_text(encoding="utf-8")
        planned = env.plan(self.root)
        self.assertFalse(planned["ok"])
        self.assertTrue(any(item["variable"] == "DEPM_GATEWAY_DOMAIN" for item in planned["conflicts"]))
        repaired = env.repair(self.root, apply=True)
        self.assertFalse(repaired["ok"])
        self.assertEqual(path.read_text(encoding="utf-8"), before)

    def test_scans_scaffolds_ci_and_environment_references(self):
        self.write("scaffolds/vite/.env.example", "SYSTEM_DATABASE_URL=postgres://db\nDEPM_GATEWAY_DOMAIN=https://app.example\n")
        self.write(".github/workflows/deploy.yml", "env:\n  SYSTEM_DATABASE_URL: " + chr(36) + "{{ secrets.SYSTEM_DATABASE_URL }}\n")
        result = env.diagnose(self.root)
        paths = {x["path"] for x in result["findings"]}
        self.assertIn("scaffolds/vite/.env.example", paths)

    def test_only_environment_blocks_are_treated_as_config_declarations(self):
        self.write(".skipo/contracts/kloks.json", '{"KLOKS_CANONICAL_CONTRACT": true}')
        self.write(".github/workflows/deploy.yml", "jobs:\n  deploy:\n    env:\n      UNKNOWN_DEPLOY_FLAG: enabled\n")
        findings = env.diagnose(self.root)["findings"]
        variables = {item["variable"] for item in findings}
        self.assertIn("UNKNOWN_DEPLOY_FLAG", variables)
        self.assertNotIn("KLOKS_CANONICAL_CONTRACT", variables)

    def test_shell_local_variables_are_not_environment_declarations(self):
        self.write("scripts/sample.sh", "LOCAL_PATH=/tmp/work\nexport UNDECLARED_SECRET=value\n")
        findings = env.diagnose(self.root)["findings"]
        variables = {item["variable"] for item in findings}
        self.assertIn("UNDECLARED_SECRET", variables)
        self.assertNotIn("LOCAL_PATH", variables)

    def test_explicit_product_specific_classification_is_preserved(self):
        self.assertEqual(env.classify("NODE_ENV"), "explicitly_supported_product_specific")
        self.assertEqual(env.classify("GITHUB_ACTIONS"), "explicitly_supported_product_specific")
        self.assertEqual(env.classify("UNLISTED_PRODUCT_SETTING"), "undeclared_framework_configuration")

    def test_repair_is_idempotent(self):
        path = self.write(".env", "SYSTEM_DATABASE_URL=postgres://db\nDEPM_GATEWAY_DOMAIN=https://app.example\n")
        first = env.repair(self.root, apply=True)
        second = env.repair(self.root, apply=True)
        self.assertTrue(first["ok"], first)
        self.assertTrue(second["ok"], second)
        self.assertEqual(second["actions"], [])
        self.assertEqual(path.read_text(encoding="utf-8").count("APP_URL="), 1)


if __name__ == "__main__":
    unittest.main()
