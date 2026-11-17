from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]


def test_root_declares_p_queue_without_bullmq():
    package = json.loads((ROOT / "package.json").read_text())
    assert package["dependencies"]["p-queue"] == "^10.0.0"
    assert "bullmq" not in package.get("dependencies", {})
    assert "bullmq" not in package.get("pnpm", {}).get("overrides", {})


def test_scaffolds_use_p_queue_and_remove_bullmq():
    for scaffold in ("vite", "nextjs"):
        root = ROOT / "scaffolds" / scaffold
        package = json.loads((root / "package.json").read_text())
        assert package["dependencies"]["p-queue"] == "^10.0.0"
        assert "bullmq" not in package.get("dependencies", {})

        adapter = root / "src/libraries/skipo/systems/execution/PQueueAdapter.ts"
        command_queue = root / "src/backend/queue/commandQueue.ts"
        assert adapter.is_file()
        assert "from \"p-queue\"" in adapter.read_text()
        assert "PQueueAdapter" in command_queue.read_text()
        assert not (adapter.parent / "BullMQAdapter.ts").exists()


def test_lockfile_and_formal_contract_are_bullmq_free():
    lockfile = (ROOT / "pnpm-lock.yaml").read_text().lower()
    spec = (ROOT / "architecture/state-execution-spec/SKILL.md").read_text().lower()
    assert "bullmq" not in lockfile
    assert "p-queue" in spec
    assert "bullmq" not in spec
    assert "process-local" in spec
