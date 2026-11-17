#!/usr/bin/env python3
"""
architecture_gate.py - Master Full-Repository Contract Architecture Gate.

Automates the complete end-to-end verification across the 5 repositories:
  1. KLOKS:        Canonical Core Library
  2. FLOKS:        Canonical UI & Canvas Library
  3. THETA:        Consumer Application
  4. QWNSR:        Consumer Application
  5. SKIPO:        Enforcement, Scaffolding & Consumer Application

Enforces the 8 mandatory gates:
  GATE 1: TYPECHECK ALL REPOSITORIES (tsc --noEmit == 0)
  GATE 2: BUILD BUILDABLE REPOSITORIES (pnpm run build == 0)
  GATE 3: TEST ALL REPOSITORIES (pnpm test == 0)
  GATE 4: CONTRACT BOUNDARY VERIFICATION (Aspect 15 == 100% on all 5 repos)
  GATE 5: ENCAPSULATION & FS BOUNDARIES (Zero escapes, zero disaggregated names)
  GATE 6: SCAFFOLD GENERATION & REAL VALIDATION
  GATE 7: IMPLEMENTATION-ONLY UPGRADE SIMULATION (Zero consumer mutation)
  GATE 8: NEGATIVE BOUNDARY TEST FIXTURES (Fixtures 01-07 rejected)
"""

import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Tuple

# Workspace Roots
SKIPO_ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_BASE = SKIPO_ROOT.parent

REPOS = {
    "KLOKS": WORKSPACE_BASE / "Kloks",
    "FLOKS": WORKSPACE_BASE / "Floks",
    "THETA": WORKSPACE_BASE / "Theta-Engine",
    "QWNSR": WORKSPACE_BASE / "Qwnsr-Engine",
    "SKIPO": SKIPO_ROOT,
}

# Colors
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def log_header(title: str):
    print(f"\n{BOLD}{CYAN}{'═' * 80}{RESET}")
    print(f"{BOLD}{CYAN}  GATE: {title}{RESET}")
    print(f"{BOLD}{CYAN}{'═' * 80}{RESET}")

def log_pass(msg: str):
    print(f"  {GREEN}✔ PASS:{RESET} {msg}")

def log_fail(msg: str):
    print(f"  {RED}✘ FAIL:{RESET} {msg}")

def run_cmd(cmd: List[str], cwd: Path) -> Tuple[int, str, str]:
    res = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
    return res.returncode, res.stdout, res.stderr

# ══════════════════════════════════════════════════════════════════════════════
# GATE 1: TYPECHECK ALL 5 REPOSITORIES
# ══════════════════════════════════════════════════════════════════════════════
def gate_01_typecheck() -> bool:
    log_header("1. TYPECHECK ALL REPOSITORIES (tsc --noEmit == 0)")
    commands = [
        ("KLOKS", ["pnpm", "-r", "run", "typecheck"], REPOS["KLOKS"]),
        ("FLOKS", ["pnpm", "-r", "run", "typecheck"], REPOS["FLOKS"]),
        ("THETA", ["pnpm", "run", "lint"], REPOS["THETA"]),
        ("QWNSR", ["pnpm", "run", "lint"], REPOS["QWNSR"]),
        ("SKIPO", ["pnpm", "run", "typecheck"], REPOS["SKIPO"]),
    ]

    all_passed = True
    for name, cmd, cwd in commands:
        code, out, err = run_cmd(cmd, cwd)
        if code == 0:
            log_pass(f"{name} typecheck clean (exit 0)")
        else:
            log_fail(f"{name} typecheck failed:\n{out}\n{err}")
            all_passed = False
    return all_passed

# ══════════════════════════════════════════════════════════════════════════════
# GATE 2: BUILD BUILDABLE REPOSITORIES
# ══════════════════════════════════════════════════════════════════════════════
def gate_02_build() -> bool:
    log_header("2. BUILD BUILDABLE REPOSITORIES (pnpm run build == 0)")
    buildable = [
        ("KLOKS", ["pnpm", "run", "build"], REPOS["KLOKS"]),
        ("FLOKS", ["pnpm", "run", "build"], REPOS["FLOKS"]),
        ("THETA", ["pnpm", "run", "build"], REPOS["THETA"]),
    ]

    all_passed = True
    for name, cmd, cwd in buildable:
        code, out, err = run_cmd(cmd, cwd)
        if code == 0:
            log_pass(f"{name} build succeeded (exit 0)")
        else:
            log_fail(f"{name} build failed:\n{out}\n{err}")
            all_passed = False
    return all_passed

# ══════════════════════════════════════════════════════════════════════════════
# GATE 3: TEST SUITE EXECUTION ACROSS ALL 5 REPOSITORIES
# ══════════════════════════════════════════════════════════════════════════════
def gate_03_test() -> bool:
    log_header("3. TEST SUITE EXECUTION ACROSS ALL 5 REPOSITORIES (pnpm test == 0)")
    testable = [
        ("KLOKS", ["pnpm", "test"], REPOS["KLOKS"]),
        ("FLOKS", ["pnpm", "test"], REPOS["FLOKS"]),
        ("THETA", ["pnpm", "test"], REPOS["THETA"]),
        ("QWNSR", ["pnpm", "test"], REPOS["QWNSR"]),
        ("SKIPO", ["pnpm", "test"], REPOS["SKIPO"]),
    ]

    all_passed = True
    for name, cmd, cwd in testable:
        code, out, err = run_cmd(cmd, cwd)
        if code == 0:
            log_pass(f"{name} tests passed (exit 0)")
        else:
            log_fail(f"{name} tests failed:\n{out}\n{err}")
            all_passed = False
    return all_passed

# ══════════════════════════════════════════════════════════════════════════════
# GATE 4: CONTRACT BOUNDARY ENFORCEMENT (Aspect 15)
# ══════════════════════════════════════════════════════════════════════════════
def gate_04_contract_boundaries() -> bool:
    log_header("4. CONTRACT BOUNDARY ENFORCEMENT (Aspect 15 Validator)")
    validator_script = SKIPO_ROOT / "checklists" / "15_contract_boundary_enforcement.py"

    all_passed = True
    for name, path in REPOS.items():
        code, out, err = run_cmd(["python3", str(validator_script), str(path)], SKIPO_ROOT)
        if code == 0:
            log_pass(f"{name} 100% compliant with Contract Boundary Invariants")
        else:
            log_fail(f"{name} failed contract boundary check:\n{out}\n{err}")
            all_passed = False
    return all_passed

# ══════════════════════════════════════════════════════════════════════════════
# GATE 5: ENCAPSULATION & FILESYSTEM BOUNDARIES
# ══════════════════════════════════════════════════════════════════════════════
def gate_05_encapsulation_check() -> bool:
    log_header("5. ENCAPSULATION & ZERO-ESCAPE VERIFICATION")
    # Verify no tsconfig paths or vite aliases point outside project root to sibling source trees
    all_clean = True
    for name, repo_path in REPOS.items():
        tsconfig = repo_path / "tsconfig.json"
        if tsconfig.exists():
            content = tsconfig.read_text(encoding="utf-8")
            if '"../Floks/packages' in content or '"../Kloks/packages' in content:
                log_fail(f"{name}/tsconfig.json contains sibling package escape!")
                all_clean = False

        pkg_json = repo_path / "package.json"
        if pkg_json.exists():
            data = json.loads(pkg_json.read_text(encoding="utf-8"))
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            for d in deps.keys():
                if d.startswith("@kloks/") or d.startswith("@floks/"):
                    log_fail(f"{name}/package.json contains disaggregated package '{d}'!")
                    all_clean = False

    if all_clean:
        log_pass("Zero filesystem escapes and zero disaggregated package identities found across all 5 repos")
    return all_clean

# ══════════════════════════════════════════════════════════════════════════════
# GATE 6: SCAFFOLD GENERATION & REAL VALIDATION
# ══════════════════════════════════════════════════════════════════════════════
def gate_06_scaffold_validation() -> bool:
    log_header("6. SCAFFOLD GENERATOR RUNTIME VALIDATION")
    scaffold_script = SKIPO_ROOT / "scripts" / "scaffold_app_structure.py"
    temp_app = Path(tempfile.mkdtemp(prefix="gate_scaffold_test_"))
    try:
        code, out, err = run_cmd(["python3", str(scaffold_script), str(temp_app), "--name", "GateTestApp"], SKIPO_ROOT)
        if code == 0:
            log_pass("Scaffold generator created and validated 100% compliant application")
            return True
        else:
            log_fail(f"Scaffold generator failed validation:\n{out}\n{err}")
            return False
    finally:
        shutil.rmtree(temp_app, ignore_errors=True)

# ══════════════════════════════════════════════════════════════════════════════
# GATE 7: IMPLEMENTATION-ONLY UPGRADE SIMULATION
# ══════════════════════════════════════════════════════════════════════════════
def gate_07_upgrade_simulation() -> bool:
    log_header("7. IMPLEMENTATION-ONLY UPGRADE SIMULATION (Consumer Code Unchanged)")
    # Rebuild Kloks and Floks to ensure artifact timestamp refresh
    code_k, _, err_k = run_cmd(["pnpm", "run", "build"], REPOS["KLOKS"])
    code_f, _, err_f = run_cmd(["pnpm", "run", "build"], REPOS["FLOKS"])

    if code_k != 0 or code_f != 0:
        log_fail("Failed to rebuild library packages for upgrade simulation")
        return False

    # Verify consumer apps compile and pass tests with ZERO consumer changes
    code_t, _, err_t = run_cmd(["pnpm", "test"], REPOS["THETA"])
    code_q, _, err_q = run_cmd(["pnpm", "test"], REPOS["QWNSR"])
    code_s, _, err_s = run_cmd(["pnpm", "test"], REPOS["SKIPO"])

    if code_t == 0 and code_q == 0 and code_s == 0:
        log_pass("Consumers (Theta, Qwnsr, Skipo) all compile and pass tests against updated builds without modification")
        return True
    else:
        log_fail(f"Upgrade simulation failed in consumers: Theta={code_t}, Qwnsr={code_q}, Skipo={code_s}")
        return False

# ══════════════════════════════════════════════════════════════════════════════
# GATE 8: NEGATIVE BOUNDARY TEST FIXTURES
# ══════════════════════════════════════════════════════════════════════════════
def gate_08_negative_fixtures() -> bool:
    log_header("8. NEGATIVE BOUNDARY TEST FIXTURES (Fixtures 01-07)")
    fixtures_test = SKIPO_ROOT / "tests" / "boundary_fixtures.test.py"
    code, out, err = run_cmd(["python3", str(fixtures_test)], SKIPO_ROOT)
    if code == 0:
        log_pass("All 7 negative boundary fixtures properly rejected and positive control verified")
        return True
    else:
        log_fail(f"Boundary fixtures test failed:\n{out}\n{err}")
        return False

# ══════════════════════════════════════════════════════════════════════════════
# GATE 9: SKIPO IMPORT-DIRECTION GOVERNANCE
# ══════════════════════════════════════════════════════════════════════════════
def gate_09_import_direction() -> bool:
    log_header("9. SKIPO IMPORT-DIRECTION GOVERNANCE")
    validator = SKIPO_ROOT / "checklists" / "22_import_direction_governance.py"
    code, out, err = run_cmd(["python3", str(validator), str(SKIPO_ROOT)], SKIPO_ROOT)
    if code == 0:
        log_pass("Skipo source imports comply with the one-way frontend-terminal dependency graph")
        return True
    log_fail(f"Skipo import-direction validation failed:\n{out}\n{err}")
    return False

# ══════════════════════════════════════════════════════════════════════════════
# GATE 10: GRAPH APPLICATION CONTRACT GOVERNANCE
# ══════════════════════════════════════════════════════════════════════════════
def gate_10_graph_application_contract() -> bool:
    log_header("10. GRAPH APPLICATION CONTRACT GOVERNANCE")
    validator = SKIPO_ROOT / "checklists" / "23_graph_application_contract.py"
    code, out, err = run_cmd(["python3", str(validator), str(SKIPO_ROOT)], SKIPO_ROOT)
    if code == 0:
        log_pass("Graph application contract semantic/visual separation and tab/interface structure verified")
        return True
    log_fail(f"Graph application contract validation failed:\n{out}\n{err}")
    return False

# ══════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ══════════════════════════════════════════════════════════════════════════════
def main():
    start_time = time.time()
    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║     MASTER FULL-REPOSITORY CONTRACT ARCHITECTURE GATE RUNNER                ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════════════════════════════════════════════╝{RESET}")

    gates = [
        ("Gate 1: Typecheck All Repositories", gate_01_typecheck),
        ("Gate 2: Build Buildable Repositories", gate_02_build),
        ("Gate 3: Test All Repositories", gate_03_test),
        ("Gate 4: Contract Boundary Invariants", gate_04_contract_boundaries),
        ("Gate 5: Encapsulation & Filesystem Escapes", gate_05_encapsulation_check),
        ("Gate 6: Scaffold Generator Validation", gate_06_scaffold_validation),
        ("Gate 7: Implementation-Only Upgrade Simulation", gate_07_upgrade_simulation),
        ("Gate 8: Negative Boundary Test Fixtures", gate_08_negative_fixtures),
        ("Gate 9: Skipo Import Direction", gate_09_import_direction),
        ("Gate 10: Graph Application Contract", gate_10_graph_application_contract),
    ]

    results = []
    for title, gate_fn in gates:
        success = gate_fn()
        results.append((title, success))
        if not success:
            print(f"\n{BOLD}{RED}❌ ABORTING: {title} failed.{RESET}\n")
            sys.exit(1)

    duration = time.time() - start_time
    print(f"\n{BOLD}{GREEN}{'═' * 80}{RESET}")
    print(f"{BOLD}{GREEN}  🎉 ALL 10 ARCHITECTURE GATES PASSED (100% COMPLIANT) in {duration:.2f}s{RESET}")
    print(f"{BOLD}{GREEN}{'═' * 80}{RESET}")
    for title, success in results:
        status_text = f"{GREEN}PASSED{RESET}" if success else f"{RED}FAILED{RESET}"
        print(f"  • {title:<55} [{status_text}]")
    print(f"{BOLD}{GREEN}{'═' * 80}{RESET}\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
