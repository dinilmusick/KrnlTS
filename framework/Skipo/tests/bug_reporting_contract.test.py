import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.scaffold_app_structure import scaffold_structure


class BugReportingContractTests(unittest.TestCase):
    def test_canonical_and_scaffolded_bug_reporting_contract(self):
        root = Path(tempfile.mkdtemp(prefix="skipo-bug-contract-"))
        try:
            scaffold_structure(root, "ExampleApp")
            chat = (root / "src/frontend/components/aiko/AikoDirectChat.tsx").read_text(encoding="utf-8")
            backend = (root / "src/backend/ExampleAppBackend.ts").read_text(encoding="utf-8")

            # 1. UI mounts bug report action and handles reporting
            self.assertIn("Report bug", chat)
            self.assertIn("reportBug", chat)
            self.assertIn("applicationType: 'skipo'", chat)
            self.assertIn("correlationId", chat)
            self.assertIn("diagnostics", chat)

            # 2. Backend exposes bugReportService with session override
            self.assertIn("bugReportService", backend)
            self.assertIn("bugReport: bugReportService", backend)
            self.assertIn("reporterId: authId", backend)
            self.assertIn("rt.reportBug = (report: any) => bugReportService.report(report)", backend)

            # 3. Check line limits <= 200 lines (Law L9)
            self.assertLessEqual(len(chat.splitlines()), 200)
            self.assertLessEqual(len(backend.splitlines()), 200)
        finally:
            import shutil
            shutil.rmtree(root, ignore_errors=True)

    def test_scaffolds_vite_and_nextjs_contracts(self):
        vite_chat = (ROOT / "scaffolds/vite/src/frontend/components/aiko/AikoDirectChat.tsx").read_text(encoding="utf-8")
        next_chat = (ROOT / "scaffolds/nextjs/src/frontend/components/aiko/AikoDirectChat.tsx").read_text(encoding="utf-8")
        vite_backend = (ROOT / "scaffolds/vite/src/backend/AppBackend.ts").read_text(encoding="utf-8")
        next_backend = (ROOT / "scaffolds/nextjs/src/backend/AppBackend.ts").read_text(encoding="utf-8")

        for c in (vite_chat, next_chat):
            self.assertIn("Report bug", c)
            self.assertIn("reportBug", c)
            self.assertIn("correlationId", c)
            self.assertLessEqual(len(c.splitlines()), 200)

        for b in (vite_backend, next_backend):
            self.assertIn("bugReportService", b)
            self.assertIn("reporterId: authId", b)
            self.assertLessEqual(len(b.splitlines()), 200)


if __name__ == "__main__":
    unittest.main()
