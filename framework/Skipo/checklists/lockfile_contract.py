#!/usr/bin/env python3
"""Reusable package-manager and pnpm-lock.yaml consistency validator."""
from pathlib import Path
import json
import re
import time
from typing import Dict, List

try:
    from .common import Violation, ChecklistResult, print_checklist_report, parse_standard_args, read_text_safe
except ImportError:
    from common import Violation, ChecklistResult, print_checklist_report, parse_standard_args, read_text_safe

ASPECT_ID = "aspect_21_lockfile_contract"
ASPECT_TITLE = "Package Manager & Lockfile Contract"
CANONICAL_PACKAGE_MANAGER = "pnpm@10.33.0"
LOCKFILES = ("pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lock", "bun.lockb")

def _manifest_specs(package_json: Dict) -> Dict[str, str]:
    result: Dict[str, str] = {}
    for section in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
        values = package_json.get(section, {})
        if isinstance(values, dict):
            result.update({str(k): str(v) for k, v in values.items()})
    return result

def _root_importer(lock_text: str) -> str:
    match = re.search(r"(?ms)^  \.:\s*\n(?P<body>.*?)(?=^  [^ \n]|^\S|\Z)", lock_text)
    return match.group("body") if match else ""

def _lock_specs(lock_text: str) -> Dict[str, str]:
    body = _root_importer(lock_text)
    result: Dict[str, str] = {}
    section = ""
    lines = body.splitlines()
    for index, raw in enumerate(lines):
        header = re.match(r"^    (dependencies|devDependencies|optionalDependencies|peerDependencies):\s*$", raw)
        if header:
            section = header.group(1)
            continue
        if not section:
            continue
        dependency = re.match(r"^      ('[^']+'|\"[^\"]+\"|[^:\s][^:]*):\s*$", raw)
        if not dependency:
            if re.match(r"^    [A-Za-z]", raw):
                section = ""
            continue
        name = dependency.group(1).strip("'\"")
        for child in lines[index + 1:index + 4]:
            value = re.match(r"^        specifier:\s*(.+?)\s*$", child)
            if value:
                result[name] = value.group(1).strip("'\"")
                break
    return result

def validate_lockfile_contract(root_dir: Path) -> ChecklistResult:
    started = time.time()
    violations: List[Violation] = []
    package_file = root_dir / "package.json"
    files_scanned = 0
    if not package_file.exists():
        violations.append(Violation("missing-package-json", "error", "package.json is required.", "package.json"))
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, False, violations, 1, (time.time() - started) * 1000, 0.0)

    files_scanned += 1
    try:
        package = json.loads(read_text_safe(package_file))
    except Exception as exc:
        violations.append(Violation("invalid-package-json", "error", f"package.json is invalid: {exc}", "package.json"))
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, False, violations, files_scanned, (time.time() - started) * 1000, 0.0)

    if package.get("packageManager") != CANONICAL_PACKAGE_MANAGER:
        violations.append(Violation(
            "noncanonical-package-manager", "error",
            f"package.json must declare {CANONICAL_PACKAGE_MANAGER}; found {package.get('packageManager')!r}.",
            "package.json", "Set packageManager to the ecosystem canonical pnpm version."
        ))

    present = [name for name in LOCKFILES if (root_dir / name).exists()]
    if present != ["pnpm-lock.yaml"]:
        violations.append(Violation(
            "invalid-lockfile-set", "error",
            "Exactly one lockfile is allowed and it must be pnpm-lock.yaml; found " + ", ".join(present or ["none"]) + ".",
            present[0] if present else "pnpm-lock.yaml",
            "Remove competing lockfiles and regenerate pnpm-lock.yaml."
        ))

    lock_file = root_dir / "pnpm-lock.yaml"
    if not lock_file.exists():
        violations.append(Violation("missing-pnpm-lockfile", "error", "pnpm-lock.yaml is required.", "pnpm-lock.yaml"))
    else:
        files_scanned += 1
        lock_text = read_text_safe(lock_file)
        if "importers:" not in lock_text or not _root_importer(lock_text):
            violations.append(Violation("missing-root-importer", "error", "pnpm-lock.yaml has no root importer.", "pnpm-lock.yaml"))
        else:
            manifest = _manifest_specs(package)
            locked = _lock_specs(lock_text)
            for name, expected in sorted(manifest.items()):
                actual = locked.get(name)
                if actual != expected:
                    violations.append(Violation(
                        "lockfile-specifier-mismatch", "error",
                        f"{name} is {expected!r} in package.json but {actual!r} in pnpm-lock.yaml.",
                        "package.json", "Run pnpm install and commit the regenerated pnpm-lock.yaml."
                    ))
            for name in sorted(set(locked) - set(manifest)):
                violations.append(Violation(
                    "lockfile-orphan-specifier", "error",
                    f"{name} exists in the root importer but is not declared by package.json.",
                    "pnpm-lock.yaml", "Regenerate the lockfile from package.json."
                ))

    errors = [v for v in violations if v.severity == "error"]
    return ChecklistResult(
        ASPECT_ID, ASPECT_TITLE, not errors, violations, files_scanned,
        (time.time() - started) * 1000, max(0.0, 100.0 - len(errors) * 15.0)
    )

def main():
    args = parse_standard_args("Aspect 21: Package Manager & Lockfile Contract")
    result = validate_lockfile_contract(Path(args.path).resolve())
    if args.json:
        import json as json_module
        print(json_module.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)
    raise SystemExit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
