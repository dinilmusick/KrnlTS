#!/usr/bin/env python3
"""Generate canonical frontend graph-interface scaffolding from a functional graph manifest."""

from pathlib import Path
import argparse
import json
import re


def _safe_name(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9]+", " ", value).strip()
    return "".join(part[:1].upper() + part[1:] for part in value.split()) or "Graph"


def generate(manifest_path: Path, root: Path, tab: str, interface: str) -> list[Path]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict) or not isinstance(manifest.get("graph"), dict):
        raise ValueError("Functional graph manifest must contain a graph object.")

    graph = manifest["graph"]
    name = _safe_name(interface)
    tab_name = _safe_name(tab)
    if name != interface or tab_name != tab:
        raise ValueError("tab and interface must use canonical PascalCase names.")

    target = root / "src/frontend/pages/main/tabs" / tab / interface
    target.mkdir(parents=True, exist_ok=True)

    interface_file = target / f"{interface}.tsx"
    interface_file.write_text(
        "import type { GraphEdge, GraphNode, NodeDefinition } from '@ultrst-armada/kloks/state-graph';\n"
        "import { FrnlEditableNodeGraph } from '@ultrst-armada/floks/canvas-ui';\n\n"
        f"export interface {interface}Props {{\n"
        "  nodes: GraphNode[];\n"
        "  edges: GraphEdge[];\n"
        "  availableNodeTypes?: NodeDefinition[];\n"
        "}\n\n"
        f"export function {interface}({{ nodes, edges, availableNodeTypes }}: {interface}Props) {{\n"
        "  return <FrnlEditableNodeGraph nodes={nodes} edges={edges} availableNodeTypes={availableNodeTypes} />;\n"
        f"}}\n",
        encoding="utf-8",
    )

    tab_dir = target.parent
    tab_file = tab_dir / f"{tab}.tsx"
    if not tab_file.exists():
        tab_file.write_text(
            f"import {{ {interface} }} from './{interface}/{interface}';\n\n"
            f"export function {tab}() {{\n"
            f"  return <{interface} />;\n"
            f"}}\n",
            encoding="utf-8",
        )

    metadata = target / "graph-assets.manifest.json"
    metadata.write_text(
        json.dumps(
            {
                "source": str(manifest_path.as_posix()),
                "graphId": graph.get("id"),
                "graphName": graph.get("name"),
                "connectionTypes": [item.get("id") for item in graph.get("connectionTypes", [])],
                "nodes": [item.get("id") for item in graph.get("nodes", [])],
                "generatedBy": "skipo.generate_graph_assets",
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    return [interface_file, tab_file, metadata]


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a Skipo frontend graph interface from a functional graph manifest.")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("root", type=Path)
    parser.add_argument("--tab", required=True)
    parser.add_argument("--interface", required=True)
    args = parser.parse_args()
    for path in generate(args.manifest.resolve(), args.root.resolve(), args.tab, args.interface):
        print(path)


if __name__ == "__main__":
    main()
