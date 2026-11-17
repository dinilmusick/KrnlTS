from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_generic_scaffold_does_not_contain_separate_guest_subsystem(tmp_path):
    target = tmp_path / "GuestDemo"
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "scaffold_app_structure.py"), str(target), "--name", "GuestDemo"],
        cwd=ROOT, capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert not (target / "src/guest").exists()
    assert not (target / "src/backend/guest").exists()
    assert not (target / "src/frontend/components/gates/GuestAccessGate.tsx").exists()


def test_next_and_vite_scaffolds_expose_guest_entry_without_separate_ui_assets():
    next_login = (ROOT / "scaffolds/nextjs/app/login/page.tsx").read_text(encoding="utf-8")
    vite_gate = (ROOT / "scaffolds/vite/src/frontend/components/gates/LoginGate.tsx").read_text(encoding="utf-8")
    assert "onContinueAsGuest" in next_login
    assert "onContinueAsGuest" in vite_gate
    assert "GuestAccessGate" not in next_login
    assert "GuestAccessGate" not in vite_gate
    assert "AuthServiceFacade" not in next_login
    assert "AuthServiceFacade" not in vite_gate
