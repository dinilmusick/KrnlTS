#!/usr/bin/env python3
"""Skipo local KLOKS/FLOKS development-session manager."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".skipo" / "ecosystem.json"
LIB_ROOT = ROOT / ".skipo" / "libraries"
LIBS = {
    "kloks": {"repo": "dinilmusick/Kloks", "package": "@ultrst-armada/kloks", "path": LIB_ROOT / "kloks"},
    "floks": {"repo": "dinilmusick/Floks", "package": "@ultrst-armada/floks", "path": LIB_ROOT / "floks"},
}


def run(args: list[str], cwd: Path = ROOT, check: bool = True) -> str:
    p = subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=False)
    if check and p.returncode:
        raise RuntimeError(p.stderr.strip() or p.stdout.strip() or "command failed")
    return p.stdout.strip()


def app_repo() -> str:
    remote = run(["git", "config", "--get", "remote.origin.url"])
    m = re.search(r"github\.com[:/]([^/]+/[^/.]+)(?:\.git)?$", remote)
    if not m:
        raise RuntimeError("Skipo app must have a GitHub origin.")
    return m.group(1)


def load_state() -> dict[str, Any]:
    return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}


def save_state(state: dict[str, Any]) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def package_data() -> tuple[Path, dict[str, Any]]:
    path = ROOT / "package.json"
    return path, json.loads(path.read_text(encoding="utf-8"))


def environment_id() -> str:
    path = ROOT / ".skipo" / "environment-id"
    return path.read_text(encoding="utf-8").strip() if path.exists() else str(uuid4())


def init_state() -> dict[str, Any]:
    _, pkg = package_data()
    deps = pkg.setdefault("dependencies", {})
    dev_deps = pkg.setdefault("devDependencies", {})
    env_id = environment_id()
    state = {
        "schemaVersion": 2,
        "environmentId": env_id,
        "revisionId": str(uuid4()),
        "revisionStatus": "ACTIVE",
        "baseCommit": run(["git", "rev-parse", "HEAD"]),
        "headCommit": run(["git", "rev-parse", "HEAD"]),
        "revisions": [],
        "appRepository": app_repo(),
        "appBranch": run(["git", "branch", "--show-current"]),
        "librariesRoot": str(LIB_ROOT.relative_to(ROOT)),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "libraries": {
            k: {
                "repository": v["repo"],
                "package": v["package"],
                "originalSpec": deps.get(v["package"]),
                "originalDevSpec": dev_deps.get(v["package"]),
                "localSpec": f"file:{LIB_ROOT.relative_to(ROOT) / k}",
            }
            for k, v in LIBS.items()
        },
    }
    STATE.parent.mkdir(parents=True, exist_ok=True)
    (STATE.parent / "environment-id").write_text(env_id + "\n", encoding="utf-8")
    save_state(state)
    return state


def record_revision(state: dict[str, Any], commit: str, status: str) -> None:
    revisions = state.setdefault("revisions", [])
    previous = state.get("revisionId")
    revision = {"revisionId": str(uuid4()), "environmentId": state["environmentId"],
                "parentRevisionId": previous, "baseCommit": state["baseCommit"],
                "commit": commit, "status": status,
                "recordedAt": datetime.now(timezone.utc).isoformat()}
    revisions.append(revision)
    state["revisionId"] = revision["revisionId"]
    state["headCommit"] = commit
    state["revisionStatus"] = status


def checkpoint_session() -> dict[str, Any]:
    state = load_state()
    if not state:
        raise RuntimeError("No ecosystem session exists; hydrate KLOKS/FLOKS first.")
    state["appBranch"] = run(["git", "branch", "--show-current"])
    commit = push_app(state) or run(["git", "rev-parse", "HEAD"])
    record_revision(state, commit, "INTERRUPTED")
    save_state(state)
    return {"environmentId": state["environmentId"], "revisionId": state["revisionId"],
            "commit": commit, "status": state["revisionStatus"]}


def hydrate_repo(key: str, state: dict[str, Any]) -> None:
    spec = LIBS[key]
    path = spec["path"]
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        run(["git", "clone", f"https://github.com/{spec['repo']}.git", str(path)])
    else:
        if run(["git", "status", "--porcelain"], cwd=path, check=False):
            raise RuntimeError(f"Refusing to hydrate dirty {key} workspace; commit or clean it first.")
        run(["git", "fetch", "origin"], cwd=path)
        run(["git", "checkout", "main"], cwd=path)
        run(["git", "pull", "--ff-only", "origin", "main"], cwd=path)
    session = state.setdefault("sessionId", datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    slug = re.sub(r"[^a-z0-9-]+", "-", state["appRepository"].lower()).strip("-")
    branch = f"skipo/{slug}/{session}"
    existing = run(["git", "rev-parse", "--verify", f"refs/heads/{branch}"], cwd=path, check=False)
    if existing:
        run(["git", "checkout", branch], cwd=path)
    else:
        run(["git", "checkout", "-b", branch, "origin/main"], cwd=path)
    state["libraries"][key]["branch"] = branch


def set_local_dependencies(state: dict[str, Any]) -> None:
    path, pkg = package_data()
    deps = pkg.setdefault("dependencies", {})
    dev_deps = pkg.setdefault("devDependencies", {})
    for key, spec in LIBS.items():
        package_name = spec["package"]
        deps[package_name] = state["libraries"][key]["localSpec"]
        dev_deps.pop(package_name, None)
    path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")
    run(["pnpm", "install", "--no-frozen-lockfile"])


def hydrate(target: str) -> dict[str, Any]:
    state = load_state() or init_state()
    for key in LIBS:
        if target in ("all", key):
            hydrate_repo(key, state)
    set_local_dependencies(state)
    save_state(state)
    return status()


def status() -> dict[str, Any]:
    state = load_state()
    result = {
        "initialized": bool(state),
        "appRepository": state.get("appRepository"),
        "appBranch": run(["git", "branch", "--show-current"], check=False),
        "appDirty": bool(run(["git", "status", "--porcelain"], check=False)),
        "libraries": {},
    }
    for key, spec in LIBS.items():
        if spec["path"].exists():
            result["libraries"][key] = {
                "path": str(spec["path"].relative_to(ROOT)),
                "branch": run(["git", "branch", "--show-current"], cwd=spec["path"], check=False),
                "dirty": bool(run(["git", "status", "--porcelain"], cwd=spec["path"], check=False)),
            }
        else:
            result["libraries"][key] = {"path": str(spec["path"].relative_to(ROOT)), "hydrated": False}
    return result


def push_app(state: dict[str, Any]) -> str | None:
    if not run(["git", "status", "--porcelain"], check=False):
        return None
    branch = run(["git", "branch", "--show-current"])
    if branch in ("", "main", "master"):
        raise RuntimeError("Refusing to push app session changes from main/master.")
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", "chore: persist downstream ecosystem development session"])
    run(["git", "push", "-u", "origin", branch])
    return run(["git", "rev-parse", "HEAD"])


def create_pr(key: str, state: dict[str, Any]) -> dict[str, Any] | None:
    spec, path = LIBS[key], LIBS[key]["path"]
    if not path.exists() or not run(["git", "status", "--porcelain"], cwd=path, check=False):
        return None
    app_repo, app_branch = state.get("appRepository", ""), state.get("appBranch", "")
    app_commit, session_id = state.get("appCommit", ""), state.get("sessionId", "")
    if not re.fullmatch(r"[^/]+/[^/]+", app_repo):
        raise RuntimeError("Cannot create library provenance PR: originating app repository is invalid.")
    if not app_branch or not session_id:
        raise RuntimeError("Cannot create library provenance PR: originating app branch/session is missing.")
    if not re.fullmatch(r"[0-9a-fA-F]{40}", app_commit):
        raise RuntimeError("Cannot create library provenance PR before a valid immutable app commit SHA is recorded.")
    branch = state.get("libraries", {}).get(key, {}).get("branch", "")
    if not branch.startswith("skipo/"):
        raise RuntimeError("Cannot create library provenance PR: library branch is not a Skipo session branch.")
    if state["libraries"][key].get("repository") != spec["repo"]:
        raise RuntimeError("Cannot create library provenance PR: library repository does not match the canonical target.")
    run(["git", "add", "-A"], cwd=path)
    run(["git", "commit", "-m", f"feat: downstream update from {state['appRepository']}"], cwd=path)
    run(["git", "push", "-u", "origin", branch], cwd=path)
    marker = {
        "schemaVersion": 2, "appRepository": state["appRepository"], "appBranch": state["appBranch"],
        "appCommit": state["appCommit"], "sessionId": state["sessionId"], "environmentId": state["environmentId"],
        "revisionId": state["revisionId"], "baseCommit": state["baseCommit"], "revisionStatus": state["revisionStatus"],
        "targetLibrary": key.upper(),
        "targetPackage": spec["package"], "targetRepository": spec["repo"], "libraryBranch": branch,
    }
    body = ("## Skipo downstream library update\n\nProduced by an actively validated Skipo application session.\n\n"
        "<!-- skipo-ecosystem-promotion:v1\n" + json.dumps(marker, separators=(",", ":")) +
        "\n-->\n\nKrusbl uses this marker to identify the originating application, validate the library change, "
        "publish the package, and reconcile the app.\n")
    pr = run(["gh", "pr", "create", "--repo", spec["repo"], "--base", "main", "--head", branch,
        "--title", f"feat: downstream update from {state['appRepository']}", "--body", body], cwd=path)
    return {"library": key, "branch": branch, "pr": pr}


def end_session() -> dict[str, Any]:
    state = load_state()
    if not state:
        raise RuntimeError("No ecosystem session exists; hydrate KLOKS/FLOKS first.")
    state["appBranch"] = run(["git", "branch", "--show-current"])
    state["appCommit"] = push_app(state) or run(["git", "rev-parse", "HEAD"])
    record_revision(state, state["appCommit"], "PROMOTING")
    save_state(state)
    prs = [x for k in LIBS if (x := create_pr(k, state))]
    return {"appCommit": state["appCommit"], "prs": prs}


def cleanup() -> dict[str, Any]:
    state = load_state()
    if run(["git", "status", "--porcelain"], check=False):
        raise RuntimeError("Refusing ecosystem cleanup while the application workspace is dirty.")
    _, pkg = package_data()
    if not state:
        local_specs = [name for name, spec in {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}.items()
            if isinstance(spec, str) and spec.startswith("file:.skipo/libraries/")]
        if local_specs:
            raise RuntimeError("Cannot remove local library clones while package.json still uses file: dependencies: " + ", ".join(local_specs))
        removed = []
        for key, spec in LIBS.items():
            if spec["path"].exists():
                if run(["git", "status", "--porcelain"], cwd=spec["path"], check=False):
                    raise RuntimeError(f"Refusing cleanup of dirty {key} workspace; commit or clean it first.")
                shutil.rmtree(spec["path"])
                removed.append(str(spec["path"].relative_to(ROOT)))
        return {"removed": removed, "reconciled": True}
    for key, spec in LIBS.items():
        if spec["path"].exists() and run(["git", "status", "--porcelain"], cwd=spec["path"], check=False):
            raise RuntimeError(f"Refusing cleanup of dirty {key} workspace; commit or clean it first.")
    path, pkg = package_data()
    deps = pkg.setdefault("dependencies", {})
    dev_deps = pkg.setdefault("devDependencies", {})
    for key, spec in LIBS.items():
        package_name = spec["package"]
        original, original_dev = state["libraries"][key].get("originalSpec"), state["libraries"][key].get("originalDevSpec")
        if original is not None: deps[package_name] = original
        else: deps.pop(package_name, None)
        if original_dev is not None: dev_deps[package_name] = original_dev
        else: dev_deps.pop(package_name, None)
    path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")
    run(["pnpm", "install", "--no-frozen-lockfile"])
    removed = []
    for spec in LIBS.values():
        if spec["path"].exists():
            shutil.rmtree(spec["path"])
            removed.append(str(spec["path"].relative_to(ROOT)))
    STATE.unlink(missing_ok=True)
    return {"removed": removed, "reconciled": False}


def main() -> None:
    p = argparse.ArgumentParser(description="Skipo KLOKS/FLOKS local development cycle")
    s = p.add_subparsers(dest="command", required=True)
    s.add_parser("init")
    h = s.add_parser("hydrate")
    h.add_argument("target", choices=["kloks", "floks", "all"], nargs="?", default="all")
    s.add_parser("status")
    s.add_parser("end-session")
    s.add_parser("checkpoint")
    s.add_parser("cleanup")
    a = p.parse_args()
    if a.command == "init": result = init_state()
    elif a.command == "hydrate": result = hydrate(a.target)
    elif a.command == "status": result = status()
    elif a.command == "end-session": result = end_session()
    elif a.command == "checkpoint": result = checkpoint_session()
    else: result = cleanup()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
