#!/usr/bin/env python3
"""
full_system_validator.py - Master Full-System Architectural Compliance Pipeline for Skipo & KrnlTS.
Pure Python 3 standard library ONLY - zero pip dependencies.
Runs natively in Google AI Studio Code Execution, Project IDX, macOS, Linux, and Windows.

Orchestrates:
- Aspect 01: Project Architecture & Structural Governance
- Aspect 02: UI Component Primitives & Theme Token Semantics
- Aspect 03: Layout Shell & User Experience Invariants
- Aspect 04: Code Limits, Purity & Documentation Standards
- Aspect 05: Real Data & Anti-Placeholder Invariant (Zero-Mock)
- Aspect 06: Anti-Stub & Genuine Implementation Integrity (CRITICAL)
- Aspect 07: Universal Backend & Storage Decoupling
- Aspect 08: API Security, Resource Governance & Anti-Polling
- Aspect 09: Test Coverage Integrity & Anti-Test-Stub
"""

from pathlib import Path
import argparse
import json
import os
import sys
import time
from typing import List, Dict, Any

import importlib.util

def _load_aspect_module(rel_name: str, py_name: str):
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location(rel_name, here / py_name)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

try:
    from .common import ChecklistResult, Violation, bold, cyan, green, red, yellow, dim
except ImportError:
    from common import ChecklistResult, Violation, bold, cyan, green, red, yellow, dim

mod_01 = _load_aspect_module("mod_01", "01_structure_governance.py")
mod_02 = _load_aspect_module("mod_02", "02_ui_primitives_themes.py")
mod_03 = _load_aspect_module("mod_03", "03_layout_shell_invariants.py")
mod_04 = _load_aspect_module("mod_04", "04_code_limits_purity.py")
mod_05 = _load_aspect_module("mod_05", "05_real_data_anti_mock.py")
mod_06 = _load_aspect_module("mod_06", "06_anti_stub_asset_depth.py")
mod_07 = _load_aspect_module("mod_07", "07_backend_storage_isolation.py")
mod_08 = _load_aspect_module("mod_08", "08_api_security_governance.py")
mod_09 = _load_aspect_module("mod_09", "09_test_coverage_integrity.py")
mod_10 = _load_aspect_module("mod_10", "10_app_architecture_spec_validator.py")
mod_11 = _load_aspect_module("mod_11", "11_multi_target_build_spec_validator.py")
mod_12 = _load_aspect_module("mod_12", "12_serverless_deployment_limits.py")
mod_13 = _load_aspect_module("mod_13", "13_state_execution_governance.py")
mod_14 = _load_aspect_module("mod_14", "14_node_graph_spatial_governance.py")
mod_15 = _load_aspect_module("mod_15", "15_contract_boundary_enforcement.py")
mod_16 = _load_aspect_module("mod_16", "13_ui_contract_validator.py")
mod_17 = _load_aspect_module("mod_17", "14_package_export_validator.py")
mod_18 = _load_aspect_module("mod_18", "18_scoped_library_governance.py")
mod_19 = _load_aspect_module("mod_19", "19_skipo_frontend_structure.py")
mod_20 = _load_aspect_module("mod_20", "20_skipo_documentation_contract.py")
mod_21 = _load_aspect_module("mod_21", "lockfile_contract.py")
mod_22 = _load_aspect_module("mod_22", "22_import_direction_governance.py")
mod_23 = _load_aspect_module("mod_23", "23_graph_application_contract.py")
mod_24 = _load_aspect_module("mod_24", "24_capability_architecture.py")
mod_25 = _load_aspect_module("mod_25", "25_skipo_ui_style_pipeline.py")
mod_26 = _load_aspect_module("mod_26", "26_skipo_runtime_environment_governance.py")

ASPECT_RUNNERS = [
    ("aspect_01", "Structure & Governance", mod_01.validate_structure),
    ("aspect_02", "UI Primitives & Themes", mod_02.validate_ui_and_themes),
    ("aspect_03", "Layout Shell Invariants", mod_03.validate_layout_shell),
    ("aspect_04", "Code Limits & Purity", mod_04.validate_code_limits_and_purity),
    ("aspect_05", "Real Data & Anti-Mock", mod_05.validate_real_data),
    ("aspect_06", "Anti-Stub & Asset Depth", mod_06.validate_anti_stub),
    ("aspect_07", "Backend Storage Decoupling", mod_07.validate_backend_storage),
    ("aspect_08", "API Security & Governance", mod_08.validate_api_security),
    ("aspect_09", "Test Coverage Integrity", mod_09.validate_test_integrity),
    ("aspect_10", "App Architecture Spec", mod_10.validate_app_architecture_spec),
    ("aspect_11", "Multi-Target Build Spec", mod_11.validate_multi_target_build_spec),
    ("aspect_12", "Serverless Deployment Size Limits", mod_12.validate_serverless_code_size),
    ("aspect_13", "State & Execution Architecture", mod_13.validate_state_execution),
    ("aspect_14", "Node Graph Spatial Governance", mod_14.validate_node_graph_governance),
    ("aspect_15", "Contract Boundary Enforcement", mod_15.validate_contract_boundaries),
    ("aspect_16", "Service UI Contracts & Provenance", mod_16.validate_ui_contracts),
    ("aspect_17", "Package Export Boundaries", mod_17.validate_package_exports),
    ("aspect_18", "Scoped Application Library Governance", mod_18.validate_scoped_libraries),
    ("aspect_19", "Skipo Frontend Structure", mod_19.validate_skipo_frontend_structure),
    ("aspect_20", "Skipo Documentation Contract", mod_20.validate_documentation_contract),
    ("aspect_21", "Package Manager & Lockfile Contract", mod_21.validate_lockfile_contract),
    ("aspect_22", "Skipo Import Direction Governance", mod_22.validate_import_direction),
    ("aspect_23", "Graph Application Contract", mod_23.validate_graph_application_contract),
    ("aspect_24", "Skipo Capability Composition", mod_24.validate),
    ("aspect_25", "Skipo UI Style Pipeline", mod_25.validate),
    ("aspect_26", "Skipo Runtime Environment Governance", mod_26.validate)
]

def detect_validation_profile(root_dir: Path, requested: str) -> str:
    if requested != "auto":
        return requested
    return "harness" if (root_dir / "skipo.harness.json").exists() else "application"


def run_full_system_validation(root_dir: Path, target_aspect: str = None, profile: str = "auto") -> Dict[str, Any]:
    start_time = time.time()
    results: List[ChecklistResult] = []

    active_profile = detect_validation_profile(root_dir, profile)
    runners = [] if active_profile == "harness" else ASPECT_RUNNERS
    for aspect_id, aspect_title, runner_fn in runners:
        if target_aspect and target_aspect.lower() not in aspect_id and target_aspect.lower() not in aspect_title.lower():
            continue
        res = runner_fn(root_dir)
        results.append(res)

    total_duration_ms = (time.time() - start_time) * 1000
    total_errors = sum(r.error_count for r in results)
    total_warnings = sum(r.warning_count for r in results)
    total_files = max((r.files_scanned for r in results), default=0)
    avg_score = (sum(r.score for r in results) / len(results)) if results else 100.0
    overall_passed = total_errors == 0

    return {
        "overall_passed": overall_passed,
        "overall_score": round(avg_score, 1),
        "total_errors": total_errors,
        "total_warnings": total_warnings,
        "max_files_scanned": total_files,
        "duration_ms": round(total_duration_ms, 2),
        "profile": active_profile,
        "aspects": [r.to_dict() for r in results]
    }

def print_executive_scorecard(summary: Dict[str, Any]) -> None:
    print("\n" + bold("=" * 84))
    print(f"  {bold('SKIPO & KRNLTS FULL-SYSTEM ARCHITECTURAL COMPLIANCE SCORECARD')} [{summary['profile']}]")
    print(bold("=" * 84))

    for aspect in summary["aspects"]:
        passed = aspect["passed"]
        status_badge = green("✔ PASSED") if passed else red("✖ FAILED")
        title = aspect["aspect_title"]
        score = aspect["score"]
        errs = aspect["error_count"]
        warns = aspect["warning_count"]
        
        score_color = green if score >= 90 else (yellow if score >= 70 else red)
        score_str = score_color(f"{score:5.1f}%")
        
        err_str = red(f"{errs} err") if errs > 0 else dim("0 err")
        warn_str = yellow(f"{warns} warn") if warns > 0 else dim("0 warn")

        print(f"  {title:<36} {status_badge}  [{score_str}]  ({err_str}, {warn_str})")

    print(dim("-" * 84))
    overall_status = green(bold("PASSED (100% COMPLIANT)")) if summary["overall_passed"] else red(bold("FAILED (BLOCKING VIOLATIONS DETECTED)"))
    score_color = green if summary["overall_score"] >= 90 else (yellow if summary["overall_score"] >= 70 else red)
    score_val = summary["overall_score"]
    score_formatted = score_color(f"{score_val:.1f}%")
    tot_errs = summary["total_errors"]
    tot_warns = summary["total_warnings"]
    dur = summary["duration_ms"]
    
    print(f"  OVERALL RESULT: {overall_status}")
    print(f"  System Score: {score_formatted} | Total Errors: {tot_errs} | Total Warnings: {tot_warns} | Duration: {dur:.1f}ms")
    print(bold("=" * 84) + "\n")

    if not summary["overall_passed"]:
        print(red(bold("🚨 AGENT MANDATE: You MUST resolve all reported errors before declaring this task complete.")))
        print(cyan("   Run with '--verbose' to inspect specific file paths and code snippets, or run individual aspects:\n"))
        for aspect in summary["aspects"]:
            if not aspect["passed"]:
                print(f"   python3 checklists/{aspect['aspect_id'].replace('aspect_', '')}.py .")
        print()

def main():
    parser = argparse.ArgumentParser(description="Skipo & KrnlTS Master Full-System Compliance Validator")
    parser.add_argument("path", nargs="?", default=".", help="Target directory to scan (default: current directory)")
    parser.add_argument("--aspect", "-a", type=str, default=None, help="Run only a specific aspect by ID or keyword")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--verbose", "-v", action="store_true", help="Print detailed violations")
    parser.add_argument("--profile", choices=["auto", "application", "harness"], default="auto",
                        help="Harness skips generated-application deployment checks; applications always enforce both targets")
    args = parser.parse_args()

    root_path = Path(args.path).resolve()
    summary = run_full_system_validation(root_path, target_aspect=args.aspect, profile=args.profile)

    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print_executive_scorecard(summary)
        if args.verbose:
            for aspect in summary["aspects"]:
                if aspect["violations"]:
                    print(bold(cyan(f"--- Violations in {aspect['aspect_title']} ---")))
                    for v in aspect["violations"]:
                        icon = red("✖") if v["severity"] == "error" else yellow("⚠")
                        loc = f":{v['line']}" if "line" in v else ""
                        print(f"  {icon} {v['file_path']}{loc} [{v['rule_id']}]: {v['message']}")
                        if "suggestion" in v:
                            print(f"     {dim('Fix:')} {v['suggestion']}")
                    print()

    sys.exit(0 if summary["overall_passed"] else 1)

if __name__ == "__main__":
    main()
