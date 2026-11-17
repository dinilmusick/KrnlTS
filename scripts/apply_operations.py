#!/usr/bin/env python3
"""Apply declarative repository edits with action journaling.

This is the cloud-agent safe write primitive. Operations are JSON objects with a
create, update, move, or delete kind and paths relative to the target root.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List
import argparse
import json
import shutil
import sys

from action_runtime import ActionResult, changed_paths, emit, snapshot, write_journal


def safe_path(root: Path, value: str) -> Path:
    path = (root / value).resolve()
    if path != root and root not in path.parents:
        raise ValueError(f"Path escapes target root: {value}")
    return path


def apply(root: Path, operations: List[Dict[str, Any]], dry_run: bool) -> List[str]:
    descriptions: List[str] = []
    for operation in operations:
        kind = operation.get("kind")
        source = safe_path(root, operation["path"])
        if kind in {"create", "update"}:
            if kind == "create" and source.exists():
                raise ValueError(f"Refusing to overwrite existing file: {operation['path']}")
            descriptions.append(f"{kind} {operation['path']}")
            if not dry_run:
                source.parent.mkdir(parents=True, exist_ok=True)
                source.write_text(operation["content"], encoding="utf-8")
        elif kind == "move":
            target = safe_path(root, operation["target"])
            if not source.exists() or target.exists():
                raise ValueError(f"Unsafe move: {operation['path']} -> {operation['target']}")
            descriptions.append(f"move {operation['path']} -> {operation['target']}")
            if not dry_run:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(source), str(target))
        elif kind == "delete":
            if not source.is_file():
                raise ValueError(f"Delete requires an existing file: {operation['path']}")
            descriptions.append(f"delete {operation['path']}")
            if not dry_run:
                source.unlink()
        else:
            raise ValueError(f"Unsupported operation kind: {kind}")
    return descriptions


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply declarative Skipo edits")
    parser.add_argument("operations", help="JSON file containing an operations array")
    parser.add_argument("--target", default=".")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    root = Path(args.target).resolve()
    before = snapshot(root)
    try:
        data = json.loads(Path(args.operations).read_text(encoding="utf-8"))
        operations = data["operations"] if isinstance(data, dict) else data
        descriptions = apply(root, operations, args.dry_run)
        after = snapshot(root)
        changed = changed_paths(before, after)
        result = ActionResult("edit.apply", "planned" if args.dry_run else "verified", 0,
            f"Applied {len(descriptions)} declared edit operations.", changed,
            [{"name": "path-safety", "status": "passed"}], [], "assistant verify --scope changed")
        if not args.dry_run:
            write_journal(root, result, before, after)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        result = ActionResult("edit.apply", "failed", 1, str(error), [], [], [], "Correct the operation manifest and retry.")
    emit(result, args.json)
    sys.exit(result.exit_code)


if __name__ == "__main__":
    main()
