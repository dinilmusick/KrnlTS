#!/usr/bin/env python3
"""
assistant.py - Master AI Coding Agent Assistant & Dynamic Execution Router for Skipo.
Pure Python 3 standard library ONLY - zero pip dependencies.
Runs natively in Google AI Studio Code Execution, Project IDX, macOS, Linux, and Windows.

Single central command interface for AI coding agents to:
- Generate complete directory trees and multi-file code suites (generators/)
- Restructure, format, and auto-remediate existing codebases (mutators/)
- Validate compliance against the 10 Architectural Pillars (checklists/)
- Adapt commands to diverse development environments (Next.js, Vite, Electron, Monorepos)
- Provide structured post-execution guidance and direct agents to specific Skipo skills
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import argparse
import importlib.util
import json
import os
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent

# ══════════════════════════════════════════════════════════════════════════════
# ANSI COLOR CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════
USE_COLOR = sys.stdout.isatty() and (os.name != 'nt' or 'TERM' in os.environ)

def _c(code: str, text: str) -> str:
    return f"{code}{text}\033[0m" if USE_COLOR else text

def red(text: str) -> str: return _c("\033[91m", text)
def green(text: str) -> str: return _c("\033[92m", text)
def yellow(text: str) -> str: return _c("\033[93m", text)
def blue(text: str) -> str: return _c("\033[94m", text)
def magenta(text: str) -> str: return _c("\033[95m", text)
def cyan(text: str) -> str: return _c("\033[96m", text)
def bold(text: str) -> str: return _c("\033[1m", text)
def dim(text: str) -> str: return _c("\033[2m", text)

# ══════════════════════════════════════════════════════════════════════════════
# SKILL MAPPING DIRECTORY
# ══════════════════════════════════════════════════════════════════════════════
SKILL_MAP = {
    "structure":    ("Plane Isolation & Architecture", HERE / "architecture/SKILL.md", "Enforces plane segregation (src/frontend vs src/backend, packages/*) and anti-monolith structure."),
    "ui":           ("UI Component Styling & Design Tokens", HERE / "ui/styling/SKILL.md", "Mandates @skipo/ui base primitives and 100% theme tokens (var(--skipo-*)). Zero raw HTML."),
    "layout":       ("Layout Shell, TopToolbar & Dock", HERE / "ui/dock-toolbar/SKILL.md", "Invariants for TopToolbar (strictly 44px), BottomStrip (strictly 30px), and FloatingDetailsPanel."),
    "nodegraph":    ("Canonical Node Graph & Rules Governance", HERE / "ui/react-flow/SKILL.md", "Authoritative ConnectionRuleStore, icon-only SolidifyWidget, handle-drag CompatibleNodePicker, and canonical controls."),
    "code-limits":  ("Code Limits, 1 Component & Line Purity", HERE / "architecture/code-limits/SKILL.md", "Enforces <= 200 lines/file, one component/file, pure App.tsx, and ASCII flowchart docblocks."),
    "layers":       ("Hierarchical Function Layers (L0-L3)", HERE / "architecture/function-layers/SKILL.md", "Hierarchical layering rules preventing circular dependencies and side-effect leakage."),
    "entity":       ("Quad-Unit Entity Atom & Real Data", HERE / "architecture/entity-functionality/SKILL.md", "4-unit entity structure (schema, types, store, EmptyState) with zero placeholder/mock arrays."),
    "anti-stub":    ("Anti-Stub & Genuine Driver Implementation", HERE / "features/SKILL.md", "Strict ban on empty/TODO function bodies, minimum 2 statements, and real SDK connectivity."),
    "storage":      ("Workspace Storage & Decoupled Presigned Transfers", HERE / "backend/workspace-storage/SKILL.md", "Direct presigned B2/S3 transfers, credential field protection, zero ephemeral /tmp proxying."),
    "auth":         ("Control Plane Multi-Session Auth & Tokens", HERE / "backend/control-plane/SKILL.md", "Multi-session isolation, refresh token rotation, progressive trust tiers (T0-T4)."),
    "api":          ("API Security Governance & 8-Gate Pipeline", HERE / "api/SKILL.md", "Canonical 8-gate request lifecycle (rate limiting, auth, validation, security headers, anti-polling)."),
    "app-arch":     ("APP_ARCHITECTURE_SPEC Canonical Architecture", HERE / "architecture/app-architecture-spec/SKILL.md", "Canonical 40-section specification: runtime model, backend facade, plug-and-play service suites, and import boundaries."),
    "multi-target": ("MULTI_TARGET_BUILD_SPEC & Protocol Adapters", HERE / "architecture/multi-target-build-spec/SKILL.md", "One Fetch application, one build command, and generated Cloudflare, Vercel, and Node provider packages."),
    "purity":       ("File Purity Classification & Import DAG", HERE / "architecture/code-limits/SKILL.md", "Enforces P0-P3 purity grades, naming suffixes (_Pure, _Impure, _Orchestrator, _Facade), and acyclic import DAG."),
    "libraries":    ("Skipo Isolation & Library Hydration", HERE / "architecture/SKILL.md", "Enforces Law L20: zero direct Skipo imports; base assets hydrated into src/libraries/skipo via sync-libraries."),
    "state-exec":   ("State & Execution Architecture (Zustand + BullMQ)", HERE / "architecture/state-execution-spec/SKILL.md", "Enforces SKIPO_STATE (Zustand) with explicit lifecycles, and SKIPO_EXECUTION (BullMQ) with worker-only backend facade boundary."),
    "service-ui":   ("Service UI Contracts & Provenance", HERE / "ui/styling/SKILL.md", "Enforces Service -> UI -> Page -> Section -> Component hierarchy, provenance comments, and canonical FLOKS bindings."),
}

# ══════════════════════════════════════════════════════════════════════════════
# ENVIRONMENT DETECTION & ADAPTATION
# ══════════════════════════════════════════════════════════════════════════════
def detect_environment(root: Path) -> Dict[str, Any]:
    """Detect workspace environment settings, package manager, and framework."""
    env = "standard"
    pkg_mgr = "npm"
    framework = "standalone"

    if (root / "pnpm-lock.yaml").exists() or (root / "pnpm-workspace.yaml").exists():
        pkg_mgr = "pnpm"
    elif (root / "yarn.lock").exists():
        pkg_mgr = "yarn"

    if (root / "next.config.js").exists() or (root / "next.config.mjs").exists() or (root / ".next").exists():
        env = "nextjs"
        framework = "Next.js App Router"
    elif (root / "vite.config.ts").exists() or (root / "vite.config.js").exists():
        env = "vite"
        framework = "Vite React SPA"
    elif (root / "electron.vite.config.ts").exists():
        env = "electron"
        framework = "Electron Desktop"
    elif (root / "pnpm-workspace.yaml").exists():
        env = "monorepo"
        framework = "Skipo Monorepo Workspace"

    return {
        "env": env,
        "pkg_mgr": pkg_mgr,
        "framework": framework,
        "root": str(root)
    }

# ══════════════════════════════════════════════════════════════════════════════
# ADVISOR & QUERY DISPATCHER
# ══════════════════════════════════════════════════════════════════════════════
def advise_agent(query: str, root: Path) -> None:
    """Analyze query/intent, suggest commands, and link to relevant skills."""
    q = query.lower()
    print("\n" + bold("=" * 84))
    print(f"  {bold('SKIPO AGENT ASSISTANT: STRATEGIC ADVISORY')}")
    print(bold("=" * 84))
    print(f"  Query / Intent: {cyan(query)}")
    print(dim("-" * 84))

    matched_skills = []
    recommended_commands = []

    if any(k in q for k in ["component", "ui", "button", "badge", "card", "token", "color", "hex"]):
        matched_skills.append(SKILL_MAP["ui"])
        recommended_commands.append("python3 assistant.py generate component src/frontend/components/[Name] --name [Name]")
        recommended_commands.append("python3 assistant.py mutate tokens [TargetDir]")

    if any(k in q for k in ["structure", "plane", "monolith", "flat", "folder", "organize"]):
        matched_skills.append(SKILL_MAP["structure"])
        recommended_commands.append("python3 assistant.py mutate planes [TargetDir]")
        recommended_commands.append("python3 assistant.py generate structure [TargetDir]")

    if any(k in q for k in ["shell", "toolbar", "bottom", "dock", "panel", "details", "layout"]):
        matched_skills.append(SKILL_MAP["layout"])
        recommended_commands.append("python3 assistant.py generate shell src/frontend/shell")

    if any(k in q for k in ["graph", "nodegraph", "node-graph", "node", "wire", "handle", "picker", "solidify", "canvas"]):
        matched_skills.append(SKILL_MAP["nodegraph"])
        recommended_commands.append("python3 assistant.py generate nodegraph src/frontend/components/[Name] --name [Name]")

    if any(k in q for k in ["entity", "quad", "model", "schema", "store", "database", "empty", "mock"]):
        matched_skills.append(SKILL_MAP["entity"])
        recommended_commands.append("python3 assistant.py generate entity src/backend/entities/[Name] --name [Name]")

    if any(k in q for k in ["driver", "service", "sdk", "stub", "todo", "s3", "sqlite"]):
        matched_skills.append(SKILL_MAP["anti-stub"])
        recommended_commands.append("python3 assistant.py generate driver src/backend/drivers/[Name] --name [Name]")

    if any(k in q for k in ["storage", "presigned", "upload", "download", "b2", "bucket"]):
        matched_skills.append(SKILL_MAP["storage"])
        recommended_commands.append("python3 assistant.py generate storage src/backend/storage")

    if any(k in q for k in ["api", "route", "security", "gate", "rate-limit", "auth", "token"]):
        matched_skills.append(SKILL_MAP["api"])
        recommended_commands.append("python3 assistant.py generate route src/backend/api/[route] --name [route]")

    if any(k in q for k in ["multi-target", "target", "adapter", "worker", "cloudflare", "build:api", "fullstack"]):
        matched_skills.append(SKILL_MAP["multi-target"])
        recommended_commands.append("python3 assistant.py generate adapter src/backend/adapters --name httpsAdapter")
        recommended_commands.append("npm run build:all")

    if any(k in q for k in ["subapp", "app", "project", "scaffold", "new"]):
        matched_skills.append(SKILL_MAP["structure"])
        recommended_commands.append("python3 assistant.py generate subapp subapps/[AppName] --name [AppName]")

    if any(k in q for k in ["purity", "pure", "impure", "facade", "orchestrator", "dag", "import grade", "p0", "p1", "p2", "p3"]):
        matched_skills.append(SKILL_MAP["purity"])
        recommended_commands.append("python3 assistant.py audit [TargetDir]")

    if any(k in q for k in ["state", "execution", "zustand", "bullmq", "lifecycle", "command", "queue"]):
        matched_skills.append(SKILL_MAP["state-exec"])
        recommended_commands.append("python3 assistant.py validate . --aspect aspect_13")
        recommended_commands.append("python3 assistant.py generate state-exec src/frontend-state --name [Name]")

    if any(k in q for k in ["service-ui", "ui-contract", "contract-ui", "floks", "auth.ui", "storage.ui", "provenance"]):
        matched_skills.append(SKILL_MAP["service-ui"])
        recommended_commands.append("python3 assistant.py generate service-ui src/frontend/sections --name [ServiceName]")


    if not matched_skills:
        matched_skills.append(SKILL_MAP["structure"])
        recommended_commands.append("python3 assistant.py status")
        recommended_commands.append("python3 assistant.py validate")

    print(bold("  💡 RECOMMENDED COMMANDS TO EXECUTE:"))
    for cmd in recommended_commands:
        print(f"    ➜ {green(cmd)}")

    print(f"\n{bold('  📖 RELEVANT ARCHITECTURAL SKILLS TO READ:')}")
    for title, path, summary in matched_skills:
        link = f"file://{path}"
        print(f"    👉 [{bold(title)}]({link})")
        print(f"       {dim(summary)}")

    print(bold("=" * 84) + "\n")

# ══════════════════════════════════════════════════════════════════════════════
# SUB-PROCESS EXECUTION & GUIDANCE ENGINE
# ══════════════════════════════════════════════════════════════════════════════
def run_command(cmd: List[str], cwd: Path) -> int:
    """Run command with live output streaming and return exit code."""
    proc = subprocess.Popen(cmd, cwd=str(cwd))
    return proc.wait()

def handle_generate(args: argparse.Namespace) -> None:
    t = (args.type or "").lower()

    # Check for dedicated aggressive scaffolding scripts
    if t == "service" and args.name:
        cmd = ["python3", str(HERE / "scripts/create_service.py"), args.name]
        if args.target: cmd.extend(["--target", args.target])
        exit_code = run_command(cmd, HERE)
        sys.exit(exit_code)
    elif t in ("app-structure", "scaffold"):
        cmd = ["python3", str(HERE / "scripts/scaffold_app_structure.py")]
        if args.target: cmd.append(args.target)
        if args.name: cmd.extend(["--name", args.name])
        exit_code = run_command(cmd, HERE)
        sys.exit(exit_code)
    elif t == "orchestration" and args.name:
        cmd = ["python3", str(HERE / "scripts/create_orchestration.py"), args.name]
        if args.target: cmd.extend(["--target", args.target])
        exit_code = run_command(cmd, HERE)
        sys.exit(exit_code)
    elif t == "route" and args.name:
        cmd = ["python3", str(HERE / "scripts/create_secure_route.py"), args.name]
        if args.target: cmd.extend(["--target", args.target])
        exit_code = run_command(cmd, HERE)
        sys.exit(exit_code)

    gen_script = HERE / "generators/generate.py"
    cmd = ["python3", str(gen_script)]
    if args.type:
        cmd.append(args.type)
    if args.target:
        cmd.append(args.target)
    if args.name:
        cmd.extend(["--name", args.name])
    if args.list:
        cmd.append("--list")
    if args.dry_run:
        cmd.append("--dry-run")
    if args.force:
        cmd.append("--force")
    if args.json:
        cmd.append("--json")
    if args.params:
        cmd.extend(["--params", args.params])
    if args.config:
        cmd.extend(["--config", args.config])
    if args.env:
        cmd.extend(["--env", args.env])

    exit_code = run_command(cmd, HERE)

    if exit_code == 0 and not args.list and not args.json:
        print(bold("\n" + "=" * 84))
        print(f"  {green('✨ GENERATION SUCCEEDED')} - Next Agent Directives:")
        print(dim("-" * 84))
        print("  1. Review generated files and inject bespoke application domain logic.")
        print("  2. Verify all modifications adhere to 100% theme tokens and <=200 line limits.")
        print(f"  3. Run {green('python3 assistant.py validate')} to gate compliance.")
        
        # Point to skill based on type
        if "comp" in t or "ui" in t:
            print(f"  📖 Read Skill: [{bold('UI Styling')}](file://{SKILL_MAP['ui'][1]})")
        elif "shell" in t:
            print(f"  📖 Read Skill: [{bold('Layout Shell Invariants')}](file://{SKILL_MAP['layout'][1]})")
        elif "entity" in t:
            print(f"  📖 Read Skill: [{bold('Entity Functionality')}](file://{SKILL_MAP['entity'][1]})")
        elif "route" in t:
            print(f"  📖 Read Skill: [{bold('API Security Governance')}](file://{SKILL_MAP['api'][1]})")
        print(bold("=" * 84) + "\n")

    sys.exit(exit_code)

def handle_mutate(args: argparse.Namespace) -> None:
    if (args.action or "").lower() == "naming":
        cmd = ["python3", str(HERE / "scripts/enforce_naming_conventions.py")]
        if args.target: cmd.append(args.target)
        cmd.append("--fix")
        exit_code = run_command(cmd, HERE)
        sys.exit(exit_code)

    mut_script = HERE / "mutators/mutate.py"
    cmd = ["python3", str(mut_script)]
    if args.action:
        cmd.append(args.action)
    if args.target:
        cmd.append(args.target)
    if args.list:
        cmd.append("--list")
    if args.dry_run:
        cmd.append("--dry-run")
    if args.backup:
        cmd.append("--backup")
    if args.json:
        cmd.append("--json")
    if args.verbose:
        cmd.append("--verbose")

    exit_code = run_command(cmd, HERE)

    if exit_code == 0 and not args.list and not args.json:
        print(bold("\n" + "=" * 84))
        print(f"  {green('✨ MUTATIONS APPLIED')} - Next Agent Directives:")
        print(dim("-" * 84))
        print("  1. Inspect modified files and verify relative import resolutions.")
        print(f"  2. Run {green('python3 assistant.py validate')} to verify architectural pass.")
        print(bold("=" * 84) + "\n")

    sys.exit(exit_code)

def handle_sync_libraries(args: argparse.Namespace) -> None:
    print(red("  [DEPRECATED] Source copying into src/libraries/skipo is forbidden."))
    print("  Import reusable backend packages from '@kloks/*' and UI packages from '@floks/*' via package.json.")
    sys.exit(0)

def handle_validate(args: argparse.Namespace) -> None:
    val_script = HERE / "checklists/full_system_validator.py"
    cmd = ["python3", str(val_script)]
    target = args.target or "."
    cmd.append(target)

    if args.aspect:
        cmd.extend(["--aspect", args.aspect])
    if args.json:
        cmd.append("--json")
    if args.verbose:
        cmd.append("--verbose")

    exit_code = run_command(cmd, HERE)

    if exit_code != 0 and not args.json:
        print(bold("\n" + "=" * 84))
        print(f"  {red('🚨 VALIDATION FAILURES DETECTED')} - Automated Remediation Options:")
        print(dim("-" * 84))
        print(f"  ➜ Flat src/ monolith:       {green('python3 assistant.py mutate planes ' + target)}")
        print(f"  ➜ Hardcoded hex colors:      {green('python3 assistant.py mutate tokens ' + target)}")
        print(f"  ➜ Missing section banners:   {green('python3 assistant.py mutate sections ' + target)}")
        print(f"  ➜ Files exceeding 200 lines: {green('python3 assistant.py mutate split ' + target)}")
        print(f"  ➜ Auto-remediate all:        {green('python3 assistant.py mutate all ' + target)}")
        print(bold("=" * 84) + "\n")

    sys.exit(exit_code)

def handle_audit(args: argparse.Namespace) -> None:
    cmd = ["python3", str(HERE / "code-purity-audit.py"), args.target or "."]
    if args.json: cmd.append("--json")
    if args.violations_only: cmd.append("--violations-only")
    if args.inspect: cmd.extend(["--inspect", args.inspect])
    exit_code = run_command(cmd, HERE)
    if exit_code != 0 and not args.json:
        print(bold("\n" + "=" * 84))
        print(f"  {red('🚨 PURITY AUDIT FAILURES')} - Grade or DAG violations detected:")
        print(dim("-" * 84))
        print(f"  ➜ Naming suffixes: _Pure, _Impure, _Orchestrator, _Facade")
        print(f"  ➜ Import DAG order: P3 → P2 → P1 → P0 (no cycles)")
        print(f"  📖 Read: [{bold('File Purity')}](file://{SKILL_MAP['purity'][1]})")
        print(bold("=" * 84) + "\n")
    sys.exit(exit_code)

def handle_edit(args: argparse.Namespace) -> None:
    """Route all declarative cloud-agent edits through the journaled writer."""
    cmd = ["python3", str(HERE / "scripts/apply_operations.py"), args.operations]
    if args.target:
        cmd.extend(["--target", args.target])
    if args.dry_run:
        cmd.append("--dry-run")
    if args.json:
        cmd.append("--json")
    sys.exit(run_command(cmd, HERE))

def handle_cleanup(args: argparse.Namespace) -> None:
    cmd = ["python3", str(HERE / "scripts/routine_cleanup_engine.py"), args.target or "."]
    if args.threshold != 0.80:
        cmd.extend(["--threshold", str(args.threshold)])
    if args.scan_unused:
        cmd.append("--scan-unused")
    if args.scan_similar:
        cmd.append("--scan-similar")
    if args.json:
        cmd.append("--json")
def handle_contract(args: argparse.Namespace) -> None:
    action = args.action or "check"
    target = Path(args.target or ".").resolve()

    if action == "check":
        cmd = ["python3", str(HERE / "checklists/15_contract_boundary_enforcement.py"), str(target)]
        sys.exit(run_command(cmd, HERE))
    elif action == "snapshot":
        # Create or update .skipo/contracts/ in target
        contracts_dir = target / ".skipo" / "contracts"
        contracts_dir.mkdir(parents=True, exist_ok=True)
        libraries = [
            ("Kloks", HERE.parent / "Kloks/.kloks/contract-snapshot.json", "kloks.json"),
            ("Floks", HERE.parent / "Floks/.floks/contract-snapshot.json", "floks.json"),
        ]
        written = 0
        for name, snap_path, dest_name in libraries:
            if snap_path.exists():
                dest = contracts_dir / dest_name
                dest.write_text(snap_path.read_text(encoding="utf-8"), encoding="utf-8"),
                print(green(f"✔ {name} contract snapshot written to {dest}"))
                written += 1
            else:
                print(yellow(f"⚠ {name} snapshot not found at {snap_path}"))
        sys.exit(0 if written > 0 else 1)
    elif action == "diff":
        contracts_dir = target / ".skipo" / "contracts"
        libraries = [
            ("Kloks", HERE.parent / "Kloks/.kloks/contract-snapshot.json", "kloks.json"),
            ("Floks", HERE.parent / "Floks/.floks/contract-snapshot.json", "floks.json"),
        ]
        any_breaking = False
        any_diff_run = False
        for name, snap_path, dest_name in libraries:
            installed_snap_path = contracts_dir / dest_name
            if not installed_snap_path.exists():
                continue
            if not snap_path.exists():
                print(yellow(f"⚠ No latest {name} snapshot found at {snap_path}"))
                continue
            any_diff_run = True
            prev = json.loads(installed_snap_path.read_text(encoding="utf-8"))
            curr = json.loads(snap_path.read_text(encoding="utf-8"))
            prev_syms = set(prev.get("publicSymbols", []))
            curr_syms = set(curr.get("publicSymbols", []))
            removed = list(prev_syms - curr_syms)
            added = list(curr_syms - prev_syms)
            print(bold(f"Contract diff for {name}:"))
            if removed:
                print(red(f"  ✘ BREAKING CHANGES ({len(removed)} removed symbols): MAJOR upgrade required."))
                any_breaking = True
            elif added:
                print(yellow(f"  ⚠ ADDITIVE CHANGES ({len(added)} added symbols): MINOR upgrade required."))
            else:
                print(green("  ✔ Contract surfaces are identical. PATCH compatible."))
        if not any_diff_run:
            print(red(f"✘ No installed contract snapshots found in {contracts_dir}"))
            sys.exit(1)
        sys.exit(1 if any_breaking else 0)
    elif action == "verify":
        cmd = ["python3", str(HERE / "checklists/15_contract_boundary_enforcement.py"), str(target)]
        sys.exit(run_command(cmd, HERE))

def handle_status(root: Path) -> None:
    info = detect_environment(root)
    state_file = root / ".skipo/agent-state.json"
    turns = 0
    if state_file.exists():
        try:
            turns = json.loads(state_file.read_text(encoding="utf-8")).get("turns", 0)
        except Exception:
            pass

    print("\n" + bold("=" * 84))
    print(f"  {bold('SKIPO RUNTIME ENVIRONMENT & GOVERNANCE STATUS')}")
    print(bold("=" * 84))
    print(f"  Framework Target:     {cyan(info['framework'])}")
    print(f"  Package Manager:      {green(info['pkg_mgr'])}")
    print(f"  Environment Profile:  {yellow(info['env'])}")
    print(f"  Turn Counter Cadence: {bold(str(turns))} turns since last audit")
    print(dim("-" * 84))
    print("  Available Subsystems:")
    print(f"    ✔ Generators: {cyan('python3 assistant.py generate --list')}")
    print(f"    ✔ Mutators:   {cyan('python3 assistant.py mutate --list')}")
    print(f"    ✔ Validators: {cyan('python3 assistant.py validate')}")
    print(bold("=" * 84) + "\n")

# ══════════════════════════════════════════════════════════════════════════════
# MAIN CLI DISPATCHER
# ══════════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description="Skipo Master AI Agent Assistant & Router")
    subparsers = parser.add_subparsers(dest="subcommand", help="Assistant subcommand to execute")

    # generate
    gen_p = subparsers.add_parser("generate", help="Scaffold complete multi-file directory suites")
    gen_p.add_argument("type", nargs="?", default="", help="Aspect type (component, entity, shell, driver, route, subapp)")
    gen_p.add_argument("target", nargs="?", default="", help="Target output directory")
    gen_p.add_argument("--name", "-n", type=str, default="", help="Artifact name")
    gen_p.add_argument("--list", "-l", action="store_true", help="List available generators")
    gen_p.add_argument("--dry-run", action="store_true", help="Dry run without writing files")
    gen_p.add_argument("--force", "-f", action="store_true", help="Overwrite existing files")
    gen_p.add_argument("--json", action="store_true", help="Output JSON summary")
    gen_p.add_argument("--params", "-p", type=str, default="", help="Custom JSON parameters")
    gen_p.add_argument("--config", "-c", type=str, default="", help="JSON configuration file")
    gen_p.add_argument("--env", type=str, default="standard", help="Target environment (nextjs, vite, electron, monorepo)")

    # mutate
    mut_p = subparsers.add_parser("mutate", help="Restructure and auto-remediate existing codebases")
    mut_p.add_argument("action", nargs="?", default="", help="Mutator action (planes, sections, tokens, split, all)")
    mut_p.add_argument("target", nargs="?", default=".", help="Target file or directory")
    mut_p.add_argument("--list", "-l", action="store_true", help="List available mutators")
    mut_p.add_argument("--dry-run", action="store_true", help="Preview mutations")
    mut_p.add_argument("--backup", "-b", action="store_true", help="Create backups before mutating")
    mut_p.add_argument("--json", action="store_true", help="Output JSON summary")
    mut_p.add_argument("--verbose", "-v", action="store_true", help="Show full diffs")

    # list (builder discovery)
    list_p = subparsers.add_parser("list", help="Discover available Kloks services, Floks components, or orchestrations")
    list_p.add_argument("item", choices=["services", "components", "orchestrations", "all"], help="Item type to list")
    list_p.add_argument("--json", action="store_true", help="Machine-readable JSON output")

    # install (builder composition)
    inst_p = subparsers.add_parser("install", help="Install and compose a package into backend or fullstack")
    inst_p.add_argument("item_type", choices=["service", "component"], help="Target type")
    inst_p.add_argument("id", help="Service or component ID")
    inst_p.add_argument("--mode", choices=["backend", "fullstack"], default="backend", help="Installation mode")
    inst_p.add_argument("--dry-run", action="store_true", help="Preview composition changes without writing")
    inst_p.add_argument("--json", action="store_true", help="Machine-readable JSON output")

    # add (builder orchestration)
    add_p = subparsers.add_parser("add", help="Add an orchestrator to BackendFacade")
    add_p.add_argument("item_type", choices=["orchestration"], help="Item type")
    add_p.add_argument("id", help="Orchestration ID")
    add_p.add_argument("--dry-run", action="store_true", help="Preview composition changes without writing")
    add_p.add_argument("--json", action="store_true", help="Machine-readable JSON output")

    # validate
    val_p = subparsers.add_parser("validate", help="Validate compliance against 12 Architectural Pillars")
    val_p.add_argument("target", nargs="?", default=".", help="Target directory to scan")
    val_p.add_argument("--aspect", "-a", type=str, default=None, help="Run specific aspect checklist")
    val_p.add_argument("--json", action="store_true", help="Output JSON summary")
    val_p.add_argument("--verbose", "-v", action="store_true", help="Show verbose violations")

    # advise
    adv_p = subparsers.add_parser("advise", help="Get intelligent guidance and skill directives for a task")
    adv_p.add_argument("query", nargs="*", default=["help"], help="Task prompt, query, or error message")

    # status
    subparsers.add_parser("status", help="Display environment, turn counter, and health")

    # audit
    aud_p = subparsers.add_parser("audit", help="Run purity classification audit on target")
    aud_p.add_argument("target", nargs="?", default=".", help="Target directory to audit")
    aud_p.add_argument("--json", action="store_true", help="Machine-readable JSON output")
    aud_p.add_argument("--violations-only", action="store_true", help="Show only violations")
    aud_p.add_argument("--inspect", type=str, default=None, help="Deep-inspect a single file's purity grade")

    # edit: the only generic file writer exposed to cloud coding agents
    edit_p = subparsers.add_parser("edit", help="Apply journaled declarative create/update/move/delete operations")
    edit_p.add_argument("operations", help="Path to an operation JSON document")
    edit_p.add_argument("--target", default=".", help="Target repository root")
    edit_p.add_argument("--dry-run", action="store_true", help="Validate operations without writing")
    edit_p.add_argument("--json", action="store_true", help="Emit a strict JSON action result")

    # sync-libraries
    sync_p = subparsers.add_parser("sync-libraries", help="Synchronize Skipo base assets into src/libraries/skipo")
    sync_p.add_argument("target", nargs="?", default="", help="Target project root directory")
    sync_p.add_argument("--dry-run", action="store_true", help="Preview sync operations without writing")
    sync_p.add_argument("--auto-fix", action="store_true", help="Automatically rewrite direct Skipo imports to @/libraries/skipo")
    # cleanup: routine codebase cleanup and asset similarity scanner
    clean_p = subparsers.add_parser("cleanup", help="Run routine dead code & asset similarity cleanup scan")
    clean_p.add_argument("target", nargs="?", default=".", help="Target directory to audit")
    clean_p.add_argument("--threshold", "-t", type=float, default=0.80, help="Similarity threshold (0.0 to 1.0, default: 0.80)")
    clean_p.add_argument("--scan-unused", action="store_true", help="Scan only for unused/orphaned files & exports")
    clean_p.add_argument("--scan-similar", action="store_true", help="Scan only for similar/redundant candidate code clones")
    clean_p.add_argument("--json", action="store_true", help="Machine-readable JSON output")

    # contract: boundary enforcement, snapshot, diff and upgrade verify
    cntr_p = subparsers.add_parser("contract", help="Contract boundary enforcement, snapshotting, and diffing")
    cntr_p.add_argument("action", nargs="?", default="check", choices=["snapshot", "diff", "check", "verify"], help="Contract action")
    cntr_p.add_argument("target", nargs="?", default=".", help="Target directory to scan or configure")

    args = parser.parse_args()

    if not args.subcommand or args.subcommand == "status":
        handle_status(HERE)
    elif args.subcommand == "list":
        cmd = ["python3", str(HERE / "scripts/skipo_builder.py"), "list", args.item]
        if args.json: cmd.append("--json")
        sys.exit(run_command(cmd, HERE))
    elif args.subcommand == "install":
        cmd = ["python3", str(HERE / "scripts/skipo_builder.py"), "install", args.item_type, args.id, "--mode", args.mode]
        if args.dry_run: cmd.append("--dry-run")
        if args.json: cmd.append("--json")
        sys.exit(run_command(cmd, HERE))
    elif args.subcommand == "add":
        cmd = ["python3", str(HERE / "scripts/skipo_builder.py"), "add", args.item_type, args.id]
        if args.dry_run: cmd.append("--dry-run")
        if args.json: cmd.append("--json")
        sys.exit(run_command(cmd, HERE))
    elif args.subcommand == "sync-libraries":
        handle_sync_libraries(args)
    elif args.subcommand == "generate":
        handle_generate(args)
    elif args.subcommand == "mutate":
        handle_mutate(args)
    elif args.subcommand == "validate":
        handle_validate(args)
    elif args.subcommand == "advise":
        query_str = " ".join(args.query) if isinstance(args.query, list) else str(args.query)
        advise_agent(query_str, HERE)
    elif args.subcommand == "audit":
        handle_audit(args)
    elif args.subcommand == "edit":
        handle_edit(args)
    elif args.subcommand == "cleanup":
        handle_cleanup(args)
    elif args.subcommand == "contract":
        handle_contract(args)


if __name__ == "__main__":
    main()
