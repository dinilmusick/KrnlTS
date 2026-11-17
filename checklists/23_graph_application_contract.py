#!/usr/bin/env python3
"""Aspect 23: graph semantic/visual separation and tab/interface governance."""

from pathlib import Path
import re
import sys
import time

try:
    from .common import ChecklistResult, Violation
except ImportError:
    try:
        from common import ChecklistResult, Violation
    except ImportError:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from common import ChecklistResult, Violation

TS_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
VISUAL_TOKENS = (
    ".svg", ".png", ".jpg", ".jpeg", ".webp", "assetRef", "visualAsset",
    "React", "jsx", "tsx", "<svg", "className", "style="
)


def _rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def _imports(text: str):
    pattern = re.compile(r"""(?:import\s+.*?\s+from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]""")
    return [m.group(1) for m in pattern.finditer(text)]


def _graph_domains(root: Path):
    base = root / "src" / "backend" / "services"
    if not base.is_dir():
        return []
    return list(base.glob("*/graph-definitions/*"))


def _check_graph_domain(root: Path, domain: Path, violations):
    if not domain.is_dir() or domain.name not in {"editable-node-graph", "force-graph"}:
        return

    connection_dir = domain / "connection-types"
    node_dir = domain / "nodes"
    facade_dir = domain / "facades"

    for required in (connection_dir, node_dir, facade_dir):
        if not required.is_dir():
            violations.append(Violation(
                "23.1-missing-graph-directory", "error",
                f"Graph domain '{domain.name}' is missing '{required.name}/'.",
                _rel(root, required),
            ))

    for folder, kind in ((connection_dir, "connection"), (node_dir, "node")):
        if not folder.is_dir():
            continue
        for path in folder.glob("*.ts"):
            if path.name == "index.ts":
                violations.append(Violation(
                    "23.2-one-definition-per-file", "error",
                    f"Definition directory '{_rel(root, folder)}' may not use index.ts as a definition.",
                    _rel(root, path),
                ))
            text = path.read_text(encoding="utf-8", errors="ignore")
            if re.search(r"^\s*(?:export\s+)?(interface|type|class|enum)\s+[A-Za-z_]", text, re.MULTILINE):
                violations.append(Violation(
                    "23.3-semantic-types-outside-libraries", "error",
                    "Application semantic types must be defined in src/libraries.",
                    _rel(root, path),
                ))
            if any(token in text for token in VISUAL_TOKENS):
                violations.append(Violation(
                    "23.4-backend-visual-payload", "error",
                    f"Backend {kind} definitions may not contain frontend visual assets or JSX.",
                    _rel(root, path),
                ))
            if kind == "node" and "facades/connection-types" not in text and "../facades/connection-types" not in text:
                violations.append(Violation(
                    "23.12-node-definition-connection-facade", "error",
                    "Every node definition must consume connection types through the connection-types facade.",
                    _rel(root, path),
                ))
            for specifier in _imports(text):
                if specifier.startswith("../../../frontend") or "/frontend/" in specifier:
                    violations.append(Violation(
                        "23.5-backend-frontend-import", "error",
                        "Backend graph definitions may not import frontend code or visual assets.",
                        _rel(root, path),
                    ))

    for filename in ("connection-types.ts", "nodes.ts", "graph.ts"):
        path = facade_dir / filename
        if not path.is_file():
            violations.append(Violation(
                "23.6-missing-graph-facade", "error",
                f"Missing canonical graph facade '{filename}'.",
                _rel(root, path),
            ))

    node_facade = facade_dir / "nodes.ts"
    graph_facade = facade_dir / "graph.ts"
    if node_facade.is_file():
        text = node_facade.read_text(encoding="utf-8", errors="ignore")
        if "connection-types" not in text:
            violations.append(Violation(
                "23.7-node-facade-direct-imports", "error",
                "Node facade must consume connection types through the connection-types facade.",
                _rel(root, node_facade),
            ))
    if graph_facade.is_file():
        text = graph_facade.read_text(encoding="utf-8", errors="ignore")
        for required in ("connection-types", "nodes"):
            if required not in text:
                violations.append(Violation(
                    "23.8-graph-facade-incomplete", "error",
                    f"Graph facade must consume the '{required}' facade.",
                    _rel(root, graph_facade),
                ))


def _check_tabs(root: Path, violations):
    tabs = root / "src/frontend/pages/main/tabs"
    if not tabs.is_dir():
        return
    for tab in tabs.iterdir():
        if not tab.is_dir() or tab.name.startswith("."):
            continue
        tab_component = tab / f"{tab.name}.tsx"
        if not tab_component.is_file():
            violations.append(Violation(
                "23.9-tab-component-name", "error",
                f"Tab '{tab.name}' must contain '{tab.name}.tsx'.",
                _rel(root, tab),
            ))
            continue
        tab_text = tab_component.read_text(encoding="utf-8", errors="ignore")
        for child in tab.iterdir():
            if not child.is_dir() or child.name.startswith("."):
                continue
            interface_component = child / f"{child.name}.tsx"
            if not interface_component.is_file():
                violations.append(Violation(
                    "23.10-interface-component-name", "error",
                    f"Interface '{child.name}' must contain '{child.name}.tsx'.",
                    _rel(root, child),
                ))
                continue
            if child.name not in tab_text:
                violations.append(Violation(
                    "23.11-tab-does-not-compose-interface", "error",
                    f"Tab '{tab.name}' must compose interface facade '{child.name}'.",
                    _rel(root, tab_component),
                ))


def validate_graph_application_contract(root_dir: Path) -> ChecklistResult:
    start = time.time()
    root = root_dir.resolve()
    violations = []
    files_scanned = 0

    for domain in _graph_domains(root):
        if domain.is_dir() and domain.name in {"editable-node-graph", "force-graph"}:
            _check_graph_domain(root, domain, violations)
            files_scanned += sum(1 for p in domain.rglob("*") if p.is_file())

    _check_tabs(root, violations)
    tabs = root / "src/frontend/pages/main/tabs"
    if tabs.is_dir():
        files_scanned += sum(1 for p in tabs.rglob("*") if p.suffix in TS_EXTENSIONS)

    errors = sum(v.severity == "error" for v in violations)
    return ChecklistResult(
        aspect_id="aspect_23",
        aspect_title="Graph Application Contract",
        passed=errors == 0,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=(time.time() - start) * 1000,
        score=max(0.0, 100.0 - errors * 10.0),
    )


if __name__ == "__main__":
    import sys
    result = validate_graph_application_contract(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("."))
    for violation in result.violations:
        print(f"[{violation.severity.upper()}] {violation.file_path}: {violation.message}")
    raise SystemExit(0 if result.passed else 1)
