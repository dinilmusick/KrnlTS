#!/usr/bin/env python3
"""Skipo framework CLI: deterministic create, adopt, inspect, diagnose, plan, add, remove, sync, update, repair, verify and test."""
from __future__ import annotations
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCAFFOLDS = ROOT / "scaffolds"
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]

sys.path.insert(0, str(ROOT / "scripts"))
from skipo_capabilities import (
    adopt as capability_adopt,
    diagnose as capability_diagnose,
    plan as capability_plan,
    compose as capability_compose,
    remove as capability_remove,
    sync as capability_sync,
    update as capability_update,
    repair as capability_repair,
    verify as capability_verify,
    capability_state,
    install_dependencies,
)
from skipo_maintenance import (
    inspect as maintenance_inspect,
    build_plan as maintenance_plan,
    execute_plan as execute_maintenance_plan,
    verify as maintenance_verify,
)
from skipo_environment_contract import (
    diagnose as environment_diagnose,
    plan as environment_plan,
    repair as environment_repair,
    verify as environment_verify,
)
from skipo_capabilities import retire_known_duplicates

def run(cmd: list[str], cwd: Path) -> int:
    return subprocess.run(cmd, cwd=str(cwd)).returncode

def manifest(root: Path) -> dict[str, Any]:
    p = root / ".skipo" / "project.json"
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}

def is_project(root: Path) -> bool:
    return (root / ".skipo" / "project.json").exists() or (root / "package.json").exists()

def create_project(name: str, target: Path, framework: str, force: bool) -> int:
    source = SCAFFOLDS / framework
    if not source.is_dir():
        print(json.dumps({"ok": False, "error": f"Unknown scaffold: {framework}"})); return 2
    if target.exists() and any(target.iterdir()) and not force:
        print(json.dumps({"ok": False, "error": f"Target is not empty: {target}"})); return 2
    target.mkdir(parents=True, exist_ok=True)
    for item in source.iterdir():
        if item.name in {".git", ".skipo"}:
            continue
        dest = target / item.name
        if dest.exists() and force:
            shutil.rmtree(dest) if dest.is_dir() else dest.unlink()
        shutil.copytree(item, dest) if item.is_dir() else shutil.copy2(item, dest)
    for p in target.rglob("*"):
        if p.is_file() and p.suffix in {".json",".md",".ts",".tsx",".js",".mjs",".toml",".yml",".yaml"}:
            try:
                text = p.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            p.write_text(text.replace("MyApp", name).replace("my-app", name.lower().replace(" ", "-")), encoding="utf-8")
    d = target / ".skipo"
    d.mkdir(exist_ok=True)
    (d / "project.json").write_text(
        json.dumps({"framework":"skipo","scaffold":framework,"skipo_version":VERSION,"generated_by":"skipo"}, indent=2)+"\n",
        encoding="utf-8",
    )
    capability_adopt(target)
    print(json.dumps({"ok":True,"operation":"create","name":name,"framework":framework,"target":str(target),"skipo_version":VERSION}))
    return 0

def inspect_project(root: Path) -> int:
    data = manifest(root)
    observed = maintenance_inspect(root) if is_project(root) else {}
    state = observed.get("capability_state", {})
    payload = {"project": str(root), "skipo_project": bool(data), **data,
               "capabilities": state, "maintenance_observation": observed}
    print(json.dumps(payload, indent=2))
    return 0

def check_project(root: Path) -> int:
    if not is_project(root):
        print(json.dumps({"ok":False,"error":"Not a recognized Skipo project."})); return 2
    result = subprocess.run(
        [sys.executable,str(ROOT/"checklists/full_system_validator.py"),str(root),"--json"],
        cwd=str(ROOT), capture_output=True, text=True
    )
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        payload={"overall_passed":result.returncode==0,"stdout":result.stdout,"stderr":result.stderr}
    payload["skipo_cli_version"]=VERSION
    print(json.dumps(payload, indent=2))
    return result.returncode

def diagnose_project(root: Path) -> int:
    if not (root / ".skipo" / "project.json").exists():
        capabilities = capability_diagnose(root)
        environment = environment_diagnose(root)
        payload = {"ok": environment.get("ok", True), "operation": "diagnose",
                   "capabilities": capabilities, "environment": environment}
        print(json.dumps(payload, indent=2))
        return 0 if payload["ok"] else 1
    try:
        planned = maintenance_plan(root, VERSION)
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok": False, "operation": "diagnose", "errors": [str(exc)]}, indent=2))
        return 2
    payload = {"ok": planned.get("ok", False), "operation": "diagnose",
               "state": planned.get("state"), "findings": planned.get("findings", []),
               "proposed_actions": planned.get("actions", []),
               "dependency_migrations": planned.get("dependency_migrations", {}),
               "framework_upgrade": planned.get("framework_upgrade", {}),
               "environment": planned.get("environment", {}),
               "errors": planned.get("errors", [])}
    print(json.dumps(payload, indent=2))
    return 0 if payload["ok"] else 1

def plan_project(root: Path) -> int:
    if not (root / ".skipo" / "project.json").exists():
        payload = {"ok": True, "operation": "plan",
                   "capabilities": capability_plan(root),
                   "environment": environment_plan(root)}
        payload["ok"] = payload["environment"].get("ok", True) and payload["capabilities"].get("ok", True)
        print(json.dumps(payload, indent=2))
        return 0 if payload["ok"] else 1
    try:
        payload = maintenance_plan(root, VERSION)
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok": False, "operation": "plan", "errors": [str(exc)]}, indent=2))
        return 2
    print(json.dumps(payload, indent=2))
    return 0 if payload.get("ok", False) else 1

def parse_items(items: list[str]) -> tuple[list[str], Path]:
    if items and Path(items[-1]).exists() and len(items) > 1:
        return items[:-1], Path(items[-1]).resolve()
    return items, Path(".").resolve()

def compose_project(items: list[str], target: Path, apply: bool) -> int:
    try:
        payload = capability_compose(target, items, apply=apply)
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok":False,"error":str(exc)}, indent=2)); return 2
    print(json.dumps(payload, indent=2))
    return 0 if payload.get("ok", False) else 1

def remove_project(items: list[str], target: Path, apply: bool) -> int:
    try:
        payload = capability_remove(target, items, apply=apply)
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok":False,"error":str(exc)}, indent=2)); return 2
    print(json.dumps(payload, indent=2))
    return 0 if payload.get("ok", False) else 1

def adopt_project(root: Path) -> int:
    try:
        payload = capability_adopt(root)
    except OSError as exc:
        print(json.dumps({"ok":False,"error":str(exc)}, indent=2)); return 2
    print(json.dumps(payload, indent=2))
    return 0

def sync_project(root: Path, install: bool) -> int:
    try:
        payload = capability_sync(root, install=install)
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok":False,"error":str(exc)}, indent=2)); return 2
    print(json.dumps(payload, indent=2))
    return 0 if payload.get("ok", False) else 1

def update_project(root: Path) -> int:
    try:
        plan = maintenance_plan(root, VERSION)
        payload = execute_maintenance_plan(root, plan, VERSION) if plan.get("ok") else {
            "ok": False, "operation": "update", "applied": False,
            "errors": plan.get("errors", []), "plan": plan,
        }
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        return 2
    print(json.dumps(payload, indent=2))
    return 0 if payload.get("ok", False) else 1

def repair_project(root: Path, apply: bool) -> int:
    if not (root / ".skipo" / "project.json").exists():
        try:
            planned = environment_plan(root)
            if not planned.get("ok", False):
                payload = {"ok": False, "operation": "repair", "applied": False,
                           "environment": planned}
            elif apply:
                environment_result = environment_repair(root, apply=True)
                findings = capability_diagnose(root)
                retired = retire_known_duplicates(root, findings, apply=True)
                caps = sorted({f["capability"] for f in findings if f.get("classification") in {"adapt", "retire"}})
                composition = capability_compose(root, caps, apply=True) if caps else {"ok": True, "actions": [], "applied": True}
                capability_result = {"ok": composition.get("ok", False), "findings": findings,
                                     "retired": retired, "composition": composition, "applied": True}
                manifest_path = root / ".skipo" / "project.json"
                if manifest_path.exists():
                    manifest_path.unlink()
                payload = {
                    "ok": environment_result.get("ok", False) and capability_result.get("ok", False),
                    "operation": "repair",
                    "applied": True,
                    "environment": environment_result,
                    "capabilities": capability_result,
                }
            else:
                payload = {"ok": True, "operation": "repair", "planned": True,
                           "environment": planned}
        except (ValueError, OSError) as exc:
            print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
            return 2
        print(json.dumps(payload, indent=2))
        return 0 if payload.get("ok", False) else 1
    try:
        planned = maintenance_plan(root, VERSION)
        if not planned.get("ok"):
            payload = {"ok": False, "operation": "repair", "applied": False,
                       "errors": planned.get("errors", []), "plan": planned}
        elif apply:
            payload = execute_maintenance_plan(root, planned, VERSION)
        else:
            payload = {"ok": True, "operation": "repair", "planned": True, "plan": planned}
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        return 2
    print(json.dumps(payload, indent=2))
    return 0 if payload.get("ok", False) else 1

def verify_project(root: Path) -> int:
    try:
        if not (root / ".skipo" / "project.json").exists():
            environment_result = environment_verify(root)
            capability_result = capability_verify(root)
            payload = {
                "ok": environment_result.get("ok", False) and capability_result.get("ok", False),
                "operation": "verify",
                "environment": environment_result,
                "capabilities": capability_result,
            }
        else:
            payload = maintenance_verify(root, VERSION)
    except (ValueError, OSError) as exc:
        print(json.dumps({"ok": False, "operation": "verify", "errors": [str(exc)]}, indent=2))
        return 2
    print(json.dumps(payload, indent=2))
    return 0 if payload.get("ok", False) else 1

def test_project(root: Path) -> int:
    if not is_project(root):
        return 2
    pkg=root/"package.json"
    if not pkg.exists():
        return 2
    scripts=json.loads(pkg.read_text(encoding="utf-8")).get("scripts",{})
    runner = "pnpm" if (root / "pnpm-lock.yaml").exists() else ("yarn" if (root / "yarn.lock").exists() else "npm")
    commands=[]
    for name in ("typecheck","lint","test","build"):
        command = scripts.get(name)
        if command and "skipo_cli.py test" not in command and "skipo test" not in command:
            commands.append([runner,"run",name])
    for cmd in commands:
        if run(cmd,root):
            return 1
    if verify_project(root):
        return 1
    return 0

def main() -> int:
    parser=argparse.ArgumentParser(prog="skipo",description="Skipo deterministic application builder and composition framework.")
    sub=parser.add_subparsers(dest="command",required=True)
    p=sub.add_parser("create")
    p.add_argument("name"); p.add_argument("target",nargs="?",default=None)
    p.add_argument("--framework",choices=["nextjs","vite"],default="vite"); p.add_argument("--force",action="store_true")

    for cmd in ["inspect","check","diagnose","plan","adopt","sync","update","repair","fix","verify","test"]:
        q=sub.add_parser(cmd); q.add_argument("target",nargs="?",default=".")
    q=sub.choices["sync"]; q.add_argument("--install",action="store_true")
    q=sub.choices["repair"]; q.add_argument("--plan",action="store_true")

    for cmd in ["add","remove"]:
        q=sub.add_parser(cmd)
        q.add_argument("items",nargs="+")
        q.add_argument("--plan",action="store_true")

    a=parser.parse_args()
    if a.command=="create":
        return create_project(a.name,Path(a.target or a.name).resolve(),a.framework,a.force)
    if a.command in {"inspect","check"}:
        return {"inspect":inspect_project,"check":check_project}[a.command](Path(a.target).resolve())
    if a.command=="diagnose":
        return diagnose_project(Path(a.target).resolve())
    if a.command=="plan":
        return plan_project(Path(a.target).resolve())
    if a.command=="adopt":
        return adopt_project(Path(a.target).resolve())
    if a.command=="sync":
        return sync_project(Path(a.target).resolve(), a.install)
    if a.command=="update":
        return update_project(Path(a.target).resolve())
    if a.command=="verify":
        return verify_project(Path(a.target).resolve())
    if a.command=="test":
        return test_project(Path(a.target).resolve())
    if a.command in {"repair", "fix"}:
        return repair_project(Path(a.target).resolve(), apply=not a.plan)
    items, target = parse_items(a.items)
    if not items:
        print(json.dumps({"ok":False,"error":"No capability supplied."})); return 2
    return compose_project(items,target,apply=not a.plan) if a.command=="add" else remove_project(items,target,apply=not a.plan)

if __name__=="__main__":
    raise SystemExit(main())
