#!/usr/bin/env python3
"""
generators/generate.py - Master Dispatcher & Composite Sub-App Generator for Skipo.
Pure Python 3 standard library ONLY - zero pip dependencies.
Runs natively in Google AI Studio Code Execution, Project IDX, macOS, Linux, and Windows.

Orchestrates:
- Aspect 01: Structure & Plane Governance (01_structure_generator.py)
- Aspect 02: UI Component Suites & Tokens (02_ui_component_generator.py)
- Aspect 04: Layered Functions & Purity (04_layered_logic_generator.py)
- Aspect 05: Quad-Unit Entity Atoms (05_entity_quad_generator.py)
- Aspect 06: Authentic Service Drivers (06_service_driver_generator.py)
- Aspect 07: Backend Storage Decoupling (07_backend_storage_generator.py)
- Aspect 08: 8-Gate Secure API Routes (08_secure_api_route_generator.py)
- Aspect 09: Companion Test Integrity (09_companion_test_generator.py)
- Composite: Full Sub-App Plane Tree Generator ('subapp')
"""

from pathlib import Path
import argparse
import importlib.util
import json
import os
import sys
import time
from typing import Dict, Any, List

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from scripts.scaffold_app_structure import scaffold_structure

def _load_module(rel_name: str, py_name: str):
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location(rel_name, here / py_name)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

try:
    from .common import (
        GeneratorResult, GeneratedFile, bold, cyan, green, red, yellow, dim,
        print_generator_report, parse_generator_args
    )
except ImportError:
    from common import (
        GeneratorResult, GeneratedFile, bold, cyan, green, red, yellow, dim,
        print_generator_report, parse_generator_args
    )

mod_01 = _load_module("mod_01", "01_structure_generator.py")
mod_02 = _load_module("mod_02", "02_ui_component_generator.py")
mod_04 = _load_module("mod_04", "04_layered_logic_generator.py")
mod_05 = _load_module("mod_05", "05_entity_quad_generator.py")
mod_06 = _load_module("mod_06", "06_service_driver_generator.py")
mod_07 = _load_module("mod_07", "07_backend_storage_generator.py")
mod_08 = _load_module("mod_08", "08_secure_api_route_generator.py")
mod_09 = _load_module("mod_09", "09_companion_test_generator.py")
mod_10 = _load_module("mod_10", "10_node_graph_generator.py")
mod_11 = _load_module("mod_11", "11_app_architecture_generator.py")
mod_12 = _load_module("mod_12", "12_multi_target_build_generator.py")
mod_13 = _load_module("mod_13", "13_service_ui_generator.py")
mod_14 = _load_module("mod_14", "14_concept_library_generator.py")

GENERATOR_REGISTRY = {
    "structure": (mod_01.generate_structure, "Aspect 01: Plane Structure & Scaffolding"),
    "01": (mod_01.generate_structure, "Aspect 01: Plane Structure & Scaffolding"),
    "component": (mod_02.generate_component_suite, "Aspect 02: UI Component Suite & Tokens"),
    "ui": (mod_02.generate_component_suite, "Aspect 02: UI Component Suite & Tokens"),
    "02": (mod_02.generate_component_suite, "Aspect 02: UI Component Suite & Tokens"),
    "logic": (mod_04.generate_layered_suite, "Aspect 04: Layered Functions & Purity"),
    "layered": (mod_04.generate_layered_suite, "Aspect 04: Layered Functions & Purity"),
    "04": (mod_04.generate_layered_suite, "Aspect 04: Layered Functions & Purity"),
    "entity": (mod_05.generate_entity_quad, "Aspect 05: Quad-Unit Entity Atom & Real Data"),
    "quad": (mod_05.generate_entity_quad, "Aspect 05: Quad-Unit Entity Atom & Real Data"),
    "05": (mod_05.generate_entity_quad, "Aspect 05: Quad-Unit Entity Atom & Real Data"),
    "driver": (mod_06.generate_service_driver, "Aspect 06: Authentic Service Driver (Anti-Stub)"),
    "service": (mod_11.generate_app_architecture, "Aspect 11: Plug-and-Play Service Suite"),
    "06": (mod_06.generate_service_driver, "Aspect 06: Authentic Service Driver (Anti-Stub)"),
    "storage": (mod_07.generate_backend_storage, "Aspect 07: Backend Storage Decoupling"),
    "07": (mod_07.generate_backend_storage, "Aspect 07: Backend Storage Decoupling"),
    "route": (mod_08.generate_secure_route, "Aspect 08: 8-Gate Secure API Route"),
    "api": (mod_08.generate_secure_route, "Aspect 08: 8-Gate Secure API Route"),
    "08": (mod_08.generate_secure_route, "Aspect 08: 8-Gate Secure API Route"),
    "test": (mod_09.generate_companion_test, "Aspect 09: Companion Test Suite (Anti-Stub)"),
    "09": (mod_09.generate_companion_test, "Aspect 09: Companion Test Suite (Anti-Stub)"),
    "nodegraph": (mod_10.generate_node_graph_suite, "Aspect 10: Canonical Node Graph Suite & Rules"),
    "graph": (mod_10.generate_node_graph_suite, "Aspect 10: Canonical Node Graph Suite & Rules"),
    "node-graph": (mod_10.generate_node_graph_suite, "Aspect 10: Canonical Node Graph Suite & Rules"),
    "10": (mod_10.generate_node_graph_suite, "Aspect 10: Canonical Node Graph Suite & Rules"),
    "app": (mod_11.generate_app_architecture, "Aspect 11: APP_ARCHITECTURE_SPEC Canonical Suite"),
    "app-arch": (mod_11.generate_app_architecture, "Aspect 11: APP_ARCHITECTURE_SPEC Canonical Suite"),
    "11": (mod_11.generate_app_architecture, "Aspect 11: APP_ARCHITECTURE_SPEC Canonical Suite"),
    "adapter": (mod_12.generate_multi_target_suite, "Aspect 12: MULTI_TARGET_BUILD_SPEC & Protocol Adapters"),
    "multi-target": (mod_12.generate_multi_target_suite, "Aspect 12: MULTI_TARGET_BUILD_SPEC & Protocol Adapters"),
    "12": (mod_12.generate_multi_target_suite, "Aspect 12: MULTI_TARGET_BUILD_SPEC & Protocol Adapters"),
    "service-ui": (mod_13.generate_service_ui_suite, "Aspect 13: Deterministic Service UI Composition & Provenance"),
    "13": (mod_13.generate_service_ui_suite, "Aspect 13: Deterministic Service UI Composition & Provenance"),
    "library": (mod_14.generate_concept_library, "Aspect 14: App-Level Concept Library Generator"),
    "concept-library": (mod_14.generate_concept_library, "Aspect 14: App-Level Concept Library Generator"),
    "14": (mod_14.generate_concept_library, "Aspect 14: App-Level Concept Library Generator"),
}

def generate_full_subapp(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    """Composite orchestrator: Generates an entire compliant Sub-App Plane Tree."""
    start_time = time.time()
    app_name = params.get("name") or target_dir.name or "SubApp"
    all_files: List[GeneratedFile] = []
    all_messages: List[str] = []

    # The composite app generator MUST start from the canonical Skipo scaffold.
    # This keeps the canonical application structure consistent across generated applications.
    if not params.get("dry_run", False):
        created = scaffold_structure(target_dir, app_name)
        all_files.extend(
            GeneratedFile(
                relative_path=str(path.relative_to(target_dir)),
                content=path.read_text(encoding="utf-8") if path.is_file() else "",
                description="Canonical Skipo application scaffold asset",
            )
            for path in created
            if path.is_file()
        )
        all_messages.append("Canonical Skipo application scaffold applied before composite generation.")
    else:
        all_messages.append("Dry-run: canonical Skipo application scaffold would be applied before composite generation.")

    # 1. Structure (Aspect 01)
    res_struct = mod_01.generate_structure(target_dir, {**params, "name": app_name})
    all_files.extend(res_struct.files)
    all_messages.extend(res_struct.messages)

    # 2. Subapp manifest (subapp.json)
    manifest = {
        "name": app_name.lower(),
        "version": "1.0.0",
        "description": f"{app_name} self-contained sub-app",
        "entry": "src/frontend/pages/home/page.tsx",
        "planes": {
            "frontend": "src/frontend",
            "backend": "src/backend"
        }
    }
    manifest_file = GeneratedFile(
        relative_path="subapp.json",
        content=json.dumps(manifest, indent=2),
        description="Sub-app descriptor contract"
    )
    all_files.append(manifest_file)
    if not params.get("dry_run", False):
        (target_dir / "subapp.json").write_text(manifest_file.content, encoding="utf-8")

    # 3. Canonical page/component tree is generated by Aspect 01 and the page generator.
    # 4. Primary UI Component Suite (Aspect 02)
    comp_name = "MainWidget"
    comp_dir = target_dir / "src/frontend/components" / comp_name
    res_comp = mod_02.generate_component_suite(comp_dir, {**params, "name": comp_name})
    for f in res_comp.files:
        f.relative_path = f"src/frontend/components/{comp_name}/{f.relative_path}"
    all_files.extend(res_comp.files)
    all_messages.extend(res_comp.messages)

    # 5. Quad-Unit Entity Atom (Aspect 05)
    entity_name = "Project"
    entity_dir = target_dir / "src/backend/entities" / entity_name
    res_entity = mod_05.generate_entity_quad(entity_dir, {**params, "name": entity_name})
    for f in res_entity.files:
        f.relative_path = f"src/backend/entities/{entity_name}/{f.relative_path}"
    all_files.extend(res_entity.files)
    all_messages.extend(res_entity.messages)

    # 6. Authentic Storage Driver (Aspect 06)
    driver_name = "StorageDriver"
    driver_dir = target_dir / "src/backend/drivers" / driver_name
    res_driver = mod_06.generate_service_driver(driver_dir, {**params, "name": driver_name})
    for f in res_driver.files:
        f.relative_path = f"src/backend/drivers/{driver_name}/{f.relative_path}"
    all_files.extend(res_driver.files)
    all_messages.extend(res_driver.messages)

    # 7. 8-Gate Secure API Route (Aspect 08)
    route_name = "health"
    route_dir = target_dir / "src/backend/api" / route_name
    res_route = mod_08.generate_secure_route(route_dir, {**params, "name": route_name})
    for f in res_route.files:
        f.relative_path = f"src/backend/api/{route_name}/{f.relative_path}"
    all_files.extend(res_route.files)
    all_messages.extend(res_route.messages)

    # 8. Node Graph Suite (Aspect 10)
    graph_name = f"{app_name}Graph"
    graph_dir = target_dir / "src/frontend/components" / graph_name
    res_graph = mod_10.generate_node_graph_suite(graph_dir, {**params, "name": graph_name})
    for f in res_graph.files:
        f.relative_path = f"src/frontend/components/{graph_name}/{f.relative_path}"
    all_files.extend(res_graph.files)
    all_messages.extend(res_graph.messages)

    duration = (time.time() - start_time) * 1000
    return GeneratorResult(
        generator_id="subapp",
        generator_title=f"Full Sub-App Plane Tree ({app_name})",
        success=True,
        target_directory=str(target_dir),
        files=all_files,
        messages=all_messages,
        duration_ms=duration
    )

def print_catalog():
    print("\n" + bold("=" * 80))
    print(f"  {bold('SKIPO DETERMINISTIC CODE GENERATORS CATALOG')}")
    print(bold("=" * 80))
    print(f"  {'Target Aspect / Type':<26} {'Script File':<32} {'Description'}")
    print(dim("-" * 80))
    
    entries = [
        ("structure (01)", "01_structure_generator.py", "Decoupled planes, .gitignore, README.md"),
        ("component / ui (02)", "02_ui_component_generator.py", "Pure React component suite with @skipo/ui"),
                ("logic / layered (04)", "04_layered_logic_generator.py", "L0-L3 layered functions, ASCII flowchart"),
        ("entity / quad (05)", "05_entity_quad_generator.py", "Quad-Unit Entity Atom: schema, store, EmptyState"),
        ("driver / service (06)", "06_service_driver_generator.py", "Authentic SDK driver with anti-stub guarantees"),
        ("storage (07)", "07_backend_storage_generator.py", "Presigned transfers, zero /tmp proxying"),
        ("route / api (08)", "08_secure_api_route_generator.py", "8-Gate secure API route, rate limit, auth"),
        ("test (09)", "09_companion_test_generator.py", "Companion test suite with real assertions"),
        ("nodegraph / graph (10)", "10_node_graph_generator.py", "Canonical Node Graph Suite & Rules"),
        ("subapp (composite)", "generate.py subapp", "Full Sub-App Plane Tree with all 10 aspects")
    ]

    for key, script, desc in entries:
        print(f"  {cyan(key):<35} {script:<32} {desc}")
    print(bold("=" * 80) + "\n")

def main():
    parser = argparse.ArgumentParser(description="Skipo Master Generator Dispatcher")
    parser.add_argument("aspect", nargs="?", default="", help="Aspect ID or generator name (e.g. component, subapp, entity)")
    parser.add_argument("target_path", nargs="?", default="", help="Target output path")
    parser.add_argument("--name", "-n", type=str, default="", help="Artifact name")
    parser.add_argument("--list", "-l", action="store_true", help="List all available generators")
    parser.add_argument("--dry-run", action="store_true", help="Dry run without writing files")
    parser.add_argument("--force", "-f", action="store_true", help="Overwrite existing files")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--params", "-p", type=str, default="", help="JSON parameter string")
    parser.add_argument("--config", "-c", type=str, default="", help="JSON configuration file")
    parser.add_argument("--env", type=str, default="standard", help="Environment target")

    args, unknown = parser.parse_known_args()

    if args.list or not args.aspect:
        print_catalog()
        sys.exit(0)

    aspect_key = args.aspect.lower()
    target_path = Path(args.target_path or ".").resolve()

    params = {
        "target_path": str(target_path),
        "name": args.name,
        "dry_run": args.dry_run,
        "force": args.force,
        "json": args.json,
        "env": args.env,
        "custom": {}
    }

    if args.params:
        try:
            params["custom"].update(json.loads(args.params))
        except Exception:
            pass

    if args.config:
        try:
            params["custom"].update(json.loads(Path(args.config).read_text(encoding="utf-8")))
        except Exception:
            pass

    if aspect_key == "subapp":
        result = generate_full_subapp(target_path, params)
    elif aspect_key in GENERATOR_REGISTRY:
        generator_fn, title = GENERATOR_REGISTRY[aspect_key]
        result = generator_fn(target_path, params)
    else:
        print(red(f"Unknown generator: '{args.aspect}'. Run with '--list' to inspect available generators."), file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_generator_report(result)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
