#!/usr/bin/env python3
"""Canonical, fail-closed Skipo environment contract and migration engine."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "architecture" / "environment" / "contract.json"
ENV_NAME = re.compile(r"^[A-Z][A-Z0-9_]*$")
ENV_ASSIGN = re.compile(r"^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$")
SHELL_EXPORT_ASSIGN = re.compile(r"^\s*(?:export\s+|env\s+)([A-Z][A-Z0-9_]*)\s*=\s*(.*)$")
KEY_ASSIGN = re.compile(r"""^\s*["']?([A-Z][A-Z0-9_]*)["']?\s*[:=]\s*(.*?)(?:,\s*)?$""")
REF_PATTERNS = (
    re.compile(r"""\bprocess\.env\.([A-Z][A-Z0-9_]*)"""),
    re.compile(r"""\bimport\.meta\.env\.([A-Z][A-Z0-9_]*)"""),
    re.compile(r"""\bos\.environ(?:\.get)?\(\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""\bos\.environ\s*\[\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\]"""),
    re.compile(r"""\bos\.getenv\(\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""\bgetenv\(\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""\$\{\{\s*(?:secrets|vars|env)\.([A-Z][A-Z0-9_]*)\s*\}\}"""),
)
ENV_FILE = re.compile(r"(^|/)\.env(?:[.-].*)?$", re.I)
IGNORE_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build",
               ".next", ".turbo", "coverage", ".cache", ".pytest_cache"}
TEXT_DOCS = {".md", ".mdx", ".txt"}
DECLARATION_SUFFIXES = {".toml", ".json", ".jsonc", ".yaml", ".yml", ".ini", ".cfg", ".properties"}


def load_contract() -> dict[str, Any]:
    data = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1:
        raise ValueError("Unsupported Skipo environment contract schema.")
    canonical = set(data.get("canonical", {}).get("required", [])) | set(data.get("canonical", {}).get("optional", []))
    if not canonical or any(not ENV_NAME.fullmatch(x) for x in canonical):
        raise ValueError("Invalid canonical environment variable declaration.")
    if set(data.get("deprecated_aliases", {})) & canonical:
        raise ValueError("A deprecated alias cannot also be canonical.")
    for alias, spec in data.get("deprecated_aliases", {}).items():
        if not ENV_NAME.fullmatch(alias) or spec.get("target") not in canonical:
            raise ValueError(f"Invalid environment alias declaration: {alias}")
    for name, spec in data.get("obsolete_framework_variables", {}).items():
        if not ENV_NAME.fullmatch(name) or spec.get("target") not in canonical | {None}:
            raise ValueError(f"Invalid obsolete environment declaration: {name}")
    for name in data.get("product_specific", {}):
        if not ENV_NAME.fullmatch(name):
            raise ValueError(f"Invalid product-specific environment declaration: {name}")
    for item in data.get("product_specific_patterns", []):
        re.compile(item["pattern"])
    return data


def classify(name: str, contract: dict[str, Any] | None = None) -> str:
    contract = contract or load_contract()
    canonical = set(contract["canonical"]["required"]) | set(contract["canonical"]["optional"])
    if name in canonical:
        return "canonical"
    if name in contract.get("deprecated_aliases", {}):
        return "known_deprecated_alias"
    if name in contract.get("obsolete_framework_variables", {}):
        return "known_obsolete_framework_variable"
    if name in contract.get("product_specific", {}):
        return "explicitly_supported_product_specific"
    for item in contract.get("product_specific_patterns", []):
        if re.fullmatch(item["pattern"], name):
            return "explicitly_supported_product_specific"
    return "undeclared_framework_configuration"


def _is_env_file(path: Path) -> bool:
    return bool(ENV_FILE.search(path.as_posix()))


def _is_relevant(path: Path, root: Path, extensions: set[str]) -> bool:
    rel = path.relative_to(root)
    if any(part in IGNORE_DIRS for part in rel.parts[:-1]):
        return False
    if path.is_symlink() or not path.is_file():
        return False
    if rel.as_posix() == "architecture/environment/contract.json":
        return False
    if _is_env_file(path):
        return True
    if path.suffix.lower() not in extensions:
        return False
    if path.suffix.lower() in TEXT_DOCS:
        return any(part in {"docs", "documentation", ".github"} for part in rel.parts) or path.name.lower() in {"readme.md", "agents.md"}
    return True


def iter_configuration_files(root: Path):
    contract = load_contract()
    extensions = set(contract["scan"]["extensions"])
    for path in sorted(root.rglob("*")):
        if _is_relevant(path, root, extensions):
            yield path


def _candidate_names(path: Path, source: str):
    in_doc_fence = False
    yaml_env_indent = None
    toml_env_section = False
    json_env_depth = None
    suffix = path.suffix.lower()
    is_shell = suffix in {".sh", ".bash", ".zsh"}
    is_yaml = suffix in {".yaml", ".yml"}
    is_toml = suffix == ".toml"
    is_json = suffix in {".json", ".jsonc"}
    is_doc = suffix in TEXT_DOCS
    is_test_source = "tests" in path.parts and "fixtures" not in path.parts

    for line_no, line in enumerate(source.splitlines(), 1):
        stripped = line.strip()
        indent = len(line) - len(line.lstrip())
        if is_doc and stripped.startswith(chr(96) * 3):
            in_doc_fence = not in_doc_fence
            continue
        if not stripped or stripped.startswith(("#", "//", "*")):
            continue

        if _is_env_file(path) or (is_doc and in_doc_fence):
            match = ENV_ASSIGN.match(line)
            if match:
                yield match.group(1), line_no, "declaration", match.group(2).strip()
        elif is_shell:
            match = SHELL_EXPORT_ASSIGN.match(line)
            if match:
                yield match.group(1), line_no, "declaration", match.group(2).strip()
        elif is_yaml:
            if re.match(r"^\s*(?:env|environment|vars)\s*:", line):
                yaml_env_indent = indent
            elif yaml_env_indent is not None:
                if indent <= yaml_env_indent:
                    yaml_env_indent = None
                else:
                    match = KEY_ASSIGN.match(line)
                    if match:
                        yield match.group(1), line_no, "declaration", match.group(2).strip()
        elif is_toml:
            section = re.match(r"^\s*\[([^\]]+)\]\s*(?:#.*)?$", line)
            if section:
                section_name = section.group(1).strip().lower()
                toml_env_section = section_name in {"env", "environment", "vars"} or section_name.startswith(("env.", "environment.", "vars."))
            elif toml_env_section:
                match = KEY_ASSIGN.match(line)
                if match:
                    yield match.group(1), line_no, "declaration", match.group(2).strip()
        elif is_json:
            if json_env_depth is None and re.search(r'"(?:env|environment|vars)"\s*:\s*\{', line):
                json_env_depth = line.count("{") - line.count("}")
                match = KEY_ASSIGN.match(line)
                if match and match.group(1) in {"ENV", "ENVIRONMENT", "VARS"}:
                    match = None
            elif json_env_depth is not None:
                match = KEY_ASSIGN.match(line)
                if match:
                    yield match.group(1), line_no, "declaration", match.group(2).strip()
                json_env_depth += line.count("{") - line.count("}")
                if json_env_depth <= 0:
                    json_env_depth = None

        # Environment references in source and CI expressions are checked
        # independently from declarations. Test implementation strings are
        # intentionally excluded; concrete config fixtures remain in scope.
        if not is_test_source:
            for pattern in REF_PATTERNS:
                for found in pattern.finditer(line):
                    yield found.group(1), line_no, "reference", None

def diagnose(root: Path) -> dict[str, Any]:
    root = root.resolve()
    contract = load_contract()
    findings = []
    declared = set()
    scanned = 0
    for path in iter_configuration_files(root):
        scanned += 1
        try:
            source = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        rel = path.relative_to(root).as_posix()
        for name, line, occurrence, _value in _candidate_names(path, source):
            if occurrence == "declaration":
                declared.add(name)
            classification = classify(name, contract)
            if classification in {"canonical", "explicitly_supported_product_specific"}:
                continue
            spec = contract.get("deprecated_aliases", {}).get(name) or contract.get("obsolete_framework_variables", {}).get(name, {})
            findings.append({"variable": name, "classification": classification, "target": spec.get("target"),
                             "path": rel, "line": line, "occurrence": occurrence, "reason": spec.get("reason")})
    for required in contract["canonical"]["required"]:
        if required not in declared:
            findings.append({"variable": required, "classification": "missing_required", "target": None,
                             "path": ".env.example", "line": None, "occurrence": "required_declaration",
                             "reason": "Required canonical environment variable is not declared in any scanned configuration surface."})
    unique = {(x["variable"], x["path"], x["line"], x["occurrence"]): x for x in findings}
    findings = [unique[k] for k in sorted(unique)]
    blockers = {"undeclared_framework_configuration", "missing_required"}
    return {"ok": not any(x["classification"] in blockers for x in findings),
            "operation": "diagnose", "files_scanned": scanned, "findings": findings}


def plan(root: Path) -> dict[str, Any]:
    root = root.resolve()
    diagnostic = diagnose(root)
    actions, conflicts = [], []
    blocked = [x for x in diagnostic["findings"] if x["classification"] in
               {"undeclared_framework_configuration", "missing_required"}]
    by_path: dict[str, list[dict[str, Any]]] = {}
    for finding in diagnostic["findings"]:
        if finding["classification"] in {"undeclared_framework_configuration", "missing_required"}:
            continue
        by_path.setdefault(finding["path"], []).append(finding)
    for rel, findings in sorted(by_path.items()):
        path = root / rel
        source = path.read_text(encoding="utf-8")
        aliases = {x["variable"]: x["target"] for x in findings}
        for alias, target in sorted(aliases.items()):
            if not target:
                conflicts.append({"path": rel, "variable": alias,
                                  "reason": "Obsolete variable has no declared canonical replacement; manual review required."})
                continue
            declarations = [
                (name, value.strip().strip('"').strip("'"))
                for name, _line, occurrence, value in _candidate_names(path, source)
                if occurrence == "declaration"
            ]
            alias_values = [value for name, value in declarations if name == alias]
            target_values = [value for name, value in declarations if name == target]
            if alias_values and target_values:
                conflicts.append({"path": rel, "variable": alias, "target": target,
                                  "reason": "Both deprecated alias and canonical target are declared; duplicate/conflicting values require manual reconciliation."})
                continue
            if len(set(alias_values)) > 1:
                conflicts.append({"path": rel, "variable": alias, "target": target,
                                  "reason": "Alias has multiple conflicting values; automatic migration is unsafe."})
                continue
            actions.append({"action": "rename-variable", "path": rel, "from": alias, "to": target})
    return {"ok": not conflicts and not blocked, "operation": "plan", "actions": actions,
            "conflicts": conflicts, "blocked_findings": blocked, "findings": diagnostic["findings"]}


def repair(root: Path, apply: bool = True) -> dict[str, Any]:
    planned = plan(root)
    if not planned["ok"]:
        return {"ok": False, "operation": "repair", "applied": False, "actions": [],
                "conflicts": planned["conflicts"], "blocked_findings": planned["blocked_findings"]}
    actions = planned["actions"]
    if not apply:
        return {"ok": True, "operation": "repair", "applied": False, "actions": actions, "conflicts": []}
    by_path: dict[str, dict[str, str]] = {}
    for action in actions:
        by_path.setdefault(action["path"], {})[action["from"]] = action["to"]
    for rel, aliases in sorted(by_path.items()):
        path = Path(root) / rel
        original = path.read_text(encoding="utf-8")
        updated = original
        for alias, target in sorted(aliases.items()):
            updated = re.sub(rf"\b{re.escape(alias)}\b", target, updated)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
    verification = verify(root)
    return {"ok": verification["ok"], "operation": "repair", "applied": True,
            "actions": actions, "conflicts": [], "verification": verification}


def verify(root: Path) -> dict[str, Any]:
    diagnostic = diagnose(root)
    errors = []
    for finding in diagnostic["findings"]:
        cls = finding["classification"]
        if cls == "undeclared_framework_configuration":
            errors.append(f"Undeclared environment variable {finding['variable']} at {finding['path']}:{finding['line']}")
        elif cls == "missing_required":
            errors.append(f"Required environment variable {finding['variable']} is not declared.")
        else:
            errors.append(f"Unmigrated {cls} {finding['variable']} at {finding['path']}:{finding['line']}")
    return {"ok": not errors, "operation": "verify", "errors": errors,
            "findings": diagnostic["findings"], "files_scanned": diagnostic["files_scanned"]}


def synchronize(root: Path) -> dict[str, Any]:
    return repair(root, apply=True)
