#!/usr/bin/env python3
"""Portable action protocol for cloud coding agents.

The protocol keeps stdout parseable in JSON mode and writes an append-only action
journal inside the repository, so it survives browser-hosted and ephemeral VMs.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Iterable, List
import json
import os
import time
import uuid


SCHEMA_VERSION = 1


@dataclass
class ActionResult:
    action: str
    status: str
    exit_code: int
    summary: str
    changed_files: List[str]
    checks: List[Dict[str, Any]]
    warnings: List[str]
    next_action: str
    action_id: str = ""
    schema_version: int = SCHEMA_VERSION

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["schemaVersion"] = data.pop("schema_version")
        data["exitCode"] = data.pop("exit_code")
        data["changedFiles"] = data.pop("changed_files")
        data["nextAction"] = data.pop("next_action")
        data["actionId"] = data.pop("action_id")
        return data


def fingerprint(path: Path) -> str:
    if not path.exists() or not path.is_file():
        return ""
    return sha256(path.read_bytes()).hexdigest()


def snapshot(root: Path, ignored: Iterable[str] = ()) -> Dict[str, str]:
    ignored_parts = set(ignored) | {".git", "node_modules", "dist", ".next", ".turbo"}
    state: Dict[str, str] = {}
    for current, dirs, files in os.walk(root):
        dirs[:] = [item for item in dirs if item not in ignored_parts and not item.startswith(".")]
        for filename in files:
            path = Path(current) / filename
            try:
                state[str(path.relative_to(root))] = fingerprint(path)
            except OSError:
                continue
    return state


def changed_paths(before: Dict[str, str], after: Dict[str, str]) -> List[str]:
    return sorted(path for path in set(before) | set(after) if before.get(path) != after.get(path))


def write_journal(root: Path, result: ActionResult, before: Dict[str, str], after: Dict[str, str]) -> Path:
    result.action_id = result.action_id or f"{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
    journal_dir = root / ".skipo" / "actions"
    journal_dir.mkdir(parents=True, exist_ok=True)
    payload = result.to_dict()
    payload["createdAt"] = int(time.time())
    payload["before"] = {path: before.get(path, "") for path in result.changed_files}
    payload["after"] = {path: after.get(path, "") for path in result.changed_files}
    journal_path = journal_dir / f"{result.action_id}.json"
    journal_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return journal_path


def emit(result: ActionResult, as_json: bool) -> None:
    if as_json:
        print(json.dumps(result.to_dict(), sort_keys=True))
        return
    print(f"[{result.status.upper()}] {result.action}: {result.summary}")
    for check in result.checks:
        print(f"  check {check['name']}: {check['status']}")
    for warning in result.warnings:
        print(f"  warning: {warning}")
    print(f"  next: {result.next_action}")
