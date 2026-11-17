#!/usr/bin/env python3
"""
skipo_builder.py - Skipo Application Builder, Package Discovery, Installer & Code Composer.
Adheres strictly to the SKIPO BUILDER / PACKAGE COMPOSITION SYSTEM specification:
- Discover: Lists available Kloks services, Floks components, and orchestrators.
- Inspect: Inspects machine-readable manifest metadata.
- Install: Installs Kloks services in 'backend' or 'fullstack' mode with semantic code composition.
- Compose: Operates on stable AST/semantic targets (never raw line numbers).
- Target: Resolves semantic insertion points and verifies idempotency / duplicate prevention.
- Transactional: Rolls back changes if syntax, types, or architectural checks fail.
- Agent & CLI Modes: Supports human-readable CLI, --dry-run, and --json for AI agents.
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import argparse
import json
import os
import re
import subprocess
import sys

from target_resolver import SemanticTargetResolver, TargetSpec, ResolvedTarget
from generate_graph_assets import generate as generate_graph_assets

HERE = Path(__file__).resolve().parent
SKIPO_ROOT = HERE.parent


def _resolve_installed_package_root(package_name: str, env_var: str) -> Path:
    """Resolve a published dependency; sibling repository clones are not required.

    The environment override is useful for isolated integration tests and deliberate
    development overrides. Normal consumer installs resolve from node_modules.
    """
    override = os.environ.get(env_var)
    if override:
        return Path(override).expanduser().resolve()

    probe = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            (
                "import { fileURLToPath } from 'node:url';"
                f"console.log(fileURLToPath(import.meta.resolve('{package_name}')))"
            ),
        ],
        cwd=str(SKIPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if probe.returncode != 0 or not probe.stdout.strip():
        raise RuntimeError(
            f"Cannot resolve installed package {package_name!r}. "
            f"Install the dependency or set {env_var} explicitly. "
            f"Resolver details: {probe.stderr.strip()}"
        )

    entry = Path(probe.stdout.strip().splitlines()[-1]).resolve()
    for candidate in (entry.parent, *entry.parents):
        if (candidate / "package.json").is_file():
            return candidate
    raise RuntimeError(
        f"Resolved {package_name!r} to {entry}, but could not locate its package root."
    )


KLOKS_ROOT = _resolve_installed_package_root("@ultrst-armada/kloks", "SKIPO_KLOKS_ROOT")
FLOKS_ROOT = _resolve_installed_package_root("@ultrst-armada/floks", "SKIPO_FLOKS_ROOT")
KRNL_ROOT = _resolve_installed_package_root("@ultrst-armada/krnl", "SKIPO_KRNL_ROOT")

# ══════════════════════════════════════════════════════════════════════════════
# 1. CATALOG & MANIFEST DISCOVERY ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class PackageCatalog:
    """Discovers and caches machine-readable service and UI component manifests."""

    def __init__(self, kloks_path: Path = KLOKS_ROOT, floks_path: Path = FLOKS_ROOT):
        self.kloks_path = kloks_path
        self.floks_path = floks_path

    def load_services(self) -> Dict[str, Dict[str, Any]]:
        services: Dict[str, Dict[str, Any]] = {}
        for mpath in self.kloks_path.glob("packages/*/kloks.manifest.json"):
            try:
                data = json.loads(mpath.read_text(encoding="utf-8"))
                for s in data.get("services", []):
                    s_id = s.get("id")
                    if s_id:
                        services[s_id] = s
            except Exception:
                continue
        return services

    def load_orchestrations(self) -> Dict[str, Dict[str, Any]]:
        orchestrations: Dict[str, Dict[str, Any]] = {}
        for mpath in self.kloks_path.glob("packages/*/kloks.manifest.json"):
            try:
                data = json.loads(mpath.read_text(encoding="utf-8"))
                for o in data.get("orchestrations", []):
                    o_id = o.get("id")
                    if o_id:
                        orchestrations[o_id] = o
            except Exception:
                continue
        return orchestrations

    def load_components(self) -> Dict[str, Dict[str, Any]]:
        components: Dict[str, Dict[str, Any]] = {}
        for mpath in self.floks_path.glob("packages/*/floks.manifest.json"):
            try:
                data = json.loads(mpath.read_text(encoding="utf-8"))
                for c in data.get("components", []):
                    c_id = c.get("id")
                    if c_id:
                        c["package"] = data.get("package", "@ultrst-armada/floks/ui")
                        components[c_id] = c
            except Exception:
                continue
        return components

# ══════════════════════════════════════════════════════════════════════════════
# 2. CODE COMPOSER & TRANSACTION ENGINE
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class CodeOperation:
    type: str # add-import | add-service | add-orchestrator | insert-jsx | modify-config
    file: str
    target: Optional[Dict[str, Any]]
    payload: Dict[str, Any]

class CodeComposer:
    """Applies atomic composition operations to target files without line numbers."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.resolver = SemanticTargetResolver(project_root)

    def detect_backend_facade(self) -> Tuple[str, str]:
        backend_dir = self.project_root / "src" / "backend"
        if backend_dir.is_dir():
            for f in backend_dir.glob("*Backend.ts"):
                return f"src/backend/{f.name}", f.stem
        return "src/backend/SkipoBackend.ts", "SkipoBackend"

    def compose_service_backend(self, service: Dict[str, Any]) -> List[CodeOperation]:
        facade_file, facade_name = self.detect_backend_facade()
        backend_info = service.get("backend", {})
        pkg = backend_info.get("package", "@ultrst-armada/kloks/backend")
        subpath = backend_info.get("subpath")
        facade_export = backend_info.get("export") or backend_info.get("facade", "ServiceFacade")
        import_path = f"{pkg}/{subpath}" if subpath else pkg
        key = service["id"].replace("-", "")

        ops: List[CodeOperation] = []

        # 1. Add import
        ops.append(CodeOperation(
            type="add-import",
            file=facade_file,
            target={"file": facade_file, "section": "imports"},
            payload={"import": facade_export, "from": import_path}
        ))

        # 2. Add service property
        ops.append(CodeOperation(
            type="add-service",
            file=facade_file,
            target={"file": facade_file, "symbol": facade_name, "property": "services", "key": key},
            payload={"key": key, "value": facade_export}
        ))

        return ops

    def compose_service_frontend(self, service: Dict[str, Any]) -> List[CodeOperation]:
        frontend = service.get("defaultFrontend")
        if not frontend:
            return []

        component = frontend.get("component") if isinstance(frontend, dict) else frontend
        if not component:
            return []
        package = (frontend.get("package") if isinstance(frontend, dict) else None) or "@ultrst-armada/floks/ui"
        export_name = (frontend.get("export") if isinstance(frontend, dict) else None) or component

        app_file = "src/frontend/App.tsx"
        ops: List[CodeOperation] = [
            CodeOperation(
                type="add-import",
                file="src/frontend/components/components.ts",
                target={"file": "src/frontend/components/components.ts", "section": "imports"},
                payload={"import": export_name, "from": package}
            ),
            CodeOperation(
                type="insert-jsx",
                file=app_file,
                target={"file": app_file, "symbol": "App", "section": "main-content"},
                payload={"jsx": f"<{export_name} />\n"}
            )
        ]
        return ops

    def apply_operations(self, operations: List[CodeOperation], dry_run: bool = False) -> Tuple[bool, List[str]]:
        logs: List[str] = []
        files_to_modify: Dict[Path, str] = {}
        snapshots: Dict[Path, str] = {}

        for op in operations:
            target_path = (self.project_root / op.file).resolve()
            if not target_path.exists():
                return False, [f"Target file missing: {op.file}"]

            if target_path not in files_to_modify:
                content = target_path.read_text(encoding="utf-8")
                files_to_modify[target_path] = content
                snapshots[target_path] = content

            content = files_to_modify[target_path]

            if op.type == "add-import":
                imp = op.payload["import"]
                src = op.payload["from"]
                # Detect existing import
                if f"from '{src}'" in content or f'from "{src}"' in content:
                    if imp in content:
                        logs.append(f"Import '{imp}' from '{src}' already exists in {op.file}")
                        continue
                    # Append inside existing import block
                    pattern = rf"(import\s*\{{[^}}]*)\}}\s*from\s*['\"]{re.escape(src)}['\"]"
                    m = re.search(pattern, content)
                    if m:
                        content = content[:m.end(1)] + f", {imp} " + content[m.end(1):]
                        files_to_modify[target_path] = content
                        logs.append(f"Appended import '{imp}' to existing '{src}' in {op.file}")
                        continue

                # Add new top-level import
                import_stmt = f"import {{ {imp} }} from '{src}';\n"
                content = import_stmt + content
                files_to_modify[target_path] = content
                logs.append(f"Added import '{imp}' from '{src}' to {op.file}")

            elif op.type == "add-service":
                k = op.payload["key"]
                v = op.payload["value"]
                # Check if key already in services: { ... }
                resolved = self.resolver.resolve(op.target or {"file": op.file, "property": "services", "key": k})
                if not resolved.found:
                    return False, [f"Could not locate 'services' property in {op.file}"]
                if resolved.reason == "Property already contains key":
                    logs.append(f"Service key '{k}' already registered in {op.file}")
                    continue

                # Insert right before close brace
                idx = resolved.insertion_point
                entry = f"  {k}: {v},\n"
                content = content[:idx] + entry + content[idx:]
                files_to_modify[target_path] = content
                logs.append(f"Registered service '{k}: {v}' in {op.file}")

            elif op.type == "add-orchestrator":
                k = op.payload["key"]
                v = op.payload["value"]
                resolved = self.resolver.resolve(op.target or {"file": op.file, "property": "orchestrations", "key": k})
                if not resolved.found:
                    return False, [f"Could not locate 'orchestrations' property in {op.file}"]
                if resolved.reason == "Property already contains key":
                    logs.append(f"Orchestrator key '{k}' already registered in {op.file}")
                    continue

                idx = resolved.insertion_point
                entry = f"  {k}: {v},\n"
                content = content[:idx] + entry + content[idx:]
                files_to_modify[target_path] = content
                logs.append(f"Registered orchestrator '{k}: {v}' in {op.file}")

            elif op.type == "insert-jsx":
                jsx = op.payload["jsx"]
                if jsx.strip() in content:
                    logs.append(f"JSX '{jsx.strip()}' already present in {op.file}")
                    continue

                resolved = self.resolver.resolve(op.target or {"file": op.file, "symbol": "App", "section": "main-content"})
                if not resolved.found:
                    return False, [f"Could not locate main-content JSX target in {op.file}"]

                idx = resolved.insertion_point
                indent = "        "
                content = content[:idx] + f"\n{indent}{jsx.strip()}\n" + content[idx:]
                files_to_modify[target_path] = content
                logs.append(f"Injected JSX '{jsx.strip()}' into {op.file}")

        if not dry_run:
            for path, new_code in files_to_modify.items():
                path.write_text(new_code, encoding="utf-8")

        return True, logs

# ══════════════════════════════════════════════════════════════════════════════
# 3. BUILDER FACADE & TRANSACTIONAL PIPELINE
# ══════════════════════════════════════════════════════════════════════════════

class SkipoBuilder:
    """Master Builder API implementing Discover -> Resolve -> Install -> Target -> Compose -> Validate."""

    def __init__(self, project_root: Path = SKIPO_ROOT):
        self.project_root = project_root
        self.catalog = PackageCatalog()
        self.composer = CodeComposer(project_root)

    def list_services(self) -> List[Dict[str, Any]]:
        return list(self.catalog.load_services().values())

    def list_components(self) -> List[Dict[str, Any]]:
        return list(self.catalog.load_components().values())

    def list_orchestrations(self) -> List[Dict[str, Any]]:
        return list(self.catalog.load_orchestrations().values())

    def inspect_service(self, service_id: str) -> Optional[Dict[str, Any]]:
        return self.catalog.load_services().get(service_id)

    def inspect_component(self, component_id: str) -> Optional[Dict[str, Any]]:
        return self.catalog.load_components().get(component_id)

    def validate_linked_dependencies(self) -> Dict[str, Any]:
        """Validate bidirectional KLOKS↔FLOKS service/component coupling."""
        services = self.catalog.load_services()
        components = self.catalog.load_components()
        orchestrations = self.catalog.load_orchestrations()

        component_facade = self.project_root / "src" / "frontend" / "components" / "components.ts"
        backend_files = list((self.project_root / "src" / "backend").glob("*.ts"))
        component_source = component_facade.read_text(encoding="utf-8") if component_facade.exists() else ""
        backend_source = "\n".join(p.read_text(encoding="utf-8") for p in backend_files if p.is_file())

        errors: List[str] = []
        warnings: List[str] = []

        def exported_symbols(source: str) -> set[str]:
            symbols: set[str] = set()
            for match in re.finditer(r"\bexport\s*\{([^}]*)\}", source):
                for item in match.group(1).split(","):
                    name = item.strip().split(" as ")[-1].strip()
                    if re.fullmatch(r"[A-Za-z_$][\w$]*", name):
                        symbols.add(name)
            for pattern in (
                r"\bexport\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)",
            ):
                symbols.update(re.findall(pattern, source))
            return symbols

        def registered_service_exports(source: str) -> set[str]:
            registered: set[str] = set()
            for match in re.finditer(r"\bservices(?:\s*:\s*[^=]+)?\s*(?:=|\:)\s*\{([\s\S]*?)\}\s*(?:,|\n|;)", source):
                registered.update(re.findall(r":\s*([A-Za-z_$][\w$]*)(?:\s+as\s+[\s\S]*?)?\s*(?=,|}|$)", match.group(1)))
            return registered

        def registered_orchestration_exports(source: str) -> set[str]:
            registered: set[str] = set()
            for match in re.finditer(r"\b(?:serviceOrchestrations|orchestrations)\s*=\s*\{([\s\S]*?)\}\s*;", source):
                for line in match.group(1).splitlines():
                    if ":" in line:
                        registered.update(re.findall(r"\b([A-Za-z_$][\w$]*)\b", line.split(":", 1)[1]))
            return registered

        component_exports = exported_symbols(component_source)
        registered_services = registered_service_exports(backend_source)
        registered_orchestrations = registered_orchestration_exports(backend_source)

        def service_present(service_id: str) -> bool:
            # Floks auth requirements are fulfilled by canonical Luth sessions,
            # not by importing Kloks' legacy server-auth facade.
            if service_id == "auth":
                has_luth_adapter = (
                    "LuthAuthServiceFacade" in registered_services
                    and re.search(
                        r"import[\s\S]*?LuthAuthServiceFacade[\s\S]*?from\s*['\"]\./LuthAuthServiceFacade\.js['\"]",
                        backend_source,
                    ) is not None
                )
                if not has_luth_adapter:
                    errors.append("Required auth service must be provided by the canonical LuthAuthServiceFacade.")
                return has_luth_adapter

            service = services.get(service_id)
            if not service:
                errors.append(f"Unknown required service '{service_id}'.")
                return False
            backend_info = service.get("backend", {})
            facade = backend_info.get("facade") or backend_info.get("export")
            if not facade:
                errors.append(f"Service '{service_id}' has no backend facade/export declaration.")
                return False
            imported = bool(re.search(r"\bimport\s*\{[^}]*\b" + re.escape(facade) + r"\b[^}]*\}\s*from\s*['\"]", backend_source))
            return imported and facade in registered_services

        def orchestration_present(orch_id: str) -> bool:
            orch = orchestrations.get(orch_id)
            if not orch:
                errors.append(f"Unknown required orchestration '{orch_id}'.")
                return False
            export_name = orch.get("export")
            if not export_name:
                errors.append(f"Orchestration '{orch_id}' has no export declaration.")
                return False
            imported = bool(re.search(r"\bimport\s*\{[^}]*\b" + re.escape(export_name) + r"\b[^}]*\}\s*from\s*['\"]", backend_source))
            return imported and export_name in registered_orchestrations

        for component in components.values():
            component_id = component.get("id")
            if not component_id:
                continue
            if component_id in component_exports:
                for service_id in component.get("requiredServices", []):
                    if not service_present(service_id):
                        errors.append(f"Component '{component_id}' requires service '{service_id}', but it is not installed in the app backend.")
                for orch_id in component.get("requiredOrchestrations", []):
                    if not orchestration_present(orch_id):
                        errors.append(f"Component '{component_id}' requires orchestration '{orch_id}', but it is not installed in the app backend.")
            # Unused library components are optional. Validate dependencies only for
            # components the application actually exports, plus required default frontends below.
        for service in services.values():
            frontend = service.get("defaultFrontend")
            if frontend:
                component_id = frontend.get("component") if isinstance(frontend, dict) else frontend
                if component_id and component_id not in components:
                    errors.append(f"Service '{service.get('id')}' declares unknown default frontend '{component_id}'.")
                elif component_id and not re.search(r"\b" + re.escape(component_id) + r"\b", component_source):
                    relationship = frontend.get("relationship", "recommended") if isinstance(frontend, dict) else "recommended"
                    message = (
                        f"Service '{service.get('id')}' requires FLOKS component '{component_id}', "
                        "but it is not exported by the app component facade."
                        if relationship == "required"
                        else f"Service '{service.get('id')}' recommends FLOKS component '{component_id}', but it is not exported by the app component facade."
                    )
                    if relationship == "required":
                        errors.append(message)
                    else:
                        warnings.append(message)

        for orch in orchestrations.values():
            frontend = orch.get("defaultFrontend")
            if frontend:
                component_id = frontend.get("component") if isinstance(frontend, dict) else frontend
                if component_id and component_id not in components:
                    errors.append(f"Orchestration '{orch.get('id')}' declares unknown default frontend '{component_id}'.")

        return {"valid": not errors, "errors": sorted(set(errors)), "warnings": sorted(set(warnings))}
 
    def install_service(self, service_id: str, mode: str = "backend", dry_run: bool = False) -> Dict[str, Any]:
        services = self.catalog.load_services()
        if service_id not in services:
            return {
                "status": "error",
                "message": f"Service '{service_id}' not found in catalog.",
                "available": list(services.keys())
            }

        service = services[service_id]
        if mode not in service.get("modes", ["backend"]):
            return {
                "status": "error",
                "message": f"Service '{service_id}' does not support mode '{mode}'. Available modes: {service.get('modes')}"
            }

        operations: List[CodeOperation] = []
        operations.extend(self.composer.compose_service_backend(service))

        if mode == "fullstack":
            operations.extend(self.composer.compose_service_frontend(service))

        # Snapshot for rollback safety
        before_state = {str(p): p.read_text(encoding="utf-8") for p in self.project_root.glob("src/**/*.*")}

        success, logs = self.composer.apply_operations(operations, dry_run=dry_run)
        if not success:
            return {"status": "error", "message": "Failed to apply composition operations", "logs": logs}

        validation_passed = True
        val_errors: List[str] = []

        if not dry_run:
            # Run typescript check
            res = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(self.project_root), capture_output=True, text=True)
            if res.returncode != 0:
                validation_passed = False
                val_errors.append(f"TypeScript validation failed:\n{res.stdout or res.stderr}")

            # Run aspect validator
            res_val = subprocess.run(["python3", "checklists/full_system_validator.py", "."], cwd=str(self.project_root), capture_output=True, text=True)
            if res_val.returncode != 0:
                validation_passed = False
                val_errors.append(f"Architectural governance validation failed:\n{res_val.stdout or res_val.stderr}")

            if not validation_passed:
                # Rollback!
                for p_str, content in before_state.items():
                    Path(p_str).write_text(content, encoding="utf-8")
                return {
                    "status": "rollback",
                    "message": "Validation failed after composition. All changes were rolled back.",
                    "errors": val_errors,
                    "operations": [asdict(op) for op in operations]
                }

        return {
            "status": "success",
            "service": service_id,
            "mode": mode,
            "dryRun": dry_run,
            "packages": [service.get("backend", {}).get("package")] + ([service.get("defaultFrontend", {}).get("package", "@ultrst-armada/floks/ui")] if mode == "fullstack" and service.get("defaultFrontend") else []),
            "operations": [asdict(op) for op in operations],
            "logs": logs
        }

    def add_orchestration(self, orch_id: str, dry_run: bool = False) -> Dict[str, Any]:
        orchestrations = self.catalog.load_orchestrations()
        if orch_id not in orchestrations:
            return {
                "status": "error",
                "message": f"Orchestrator '{orch_id}' not found in catalog.",
                "available": list(orchestrations.keys())
            }

        orch = orchestrations[orch_id]
        facade_file, facade_name = self.composer.detect_backend_facade()
        pkg = orch.get("package", "@ultrst-armada/kloks/orchestrations")
        export_name = orch.get("export")
        key = orch_id.replace("-", "")

        operations = [
            CodeOperation(
                type="add-import",
                file=facade_file,
                target={"file": facade_file, "section": "imports"},
                payload={"import": export_name, "from": pkg}
            ),
            CodeOperation(
                type="add-orchestrator",
                file=facade_file,
                target={"file": facade_file, "symbol": facade_name, "property": "orchestrations", "key": key},
                payload={"key": key, "value": export_name}
            )
        ]

        success, logs = self.composer.apply_operations(operations, dry_run=dry_run)
        return {
            "status": "success" if success else "error",
            "orchestration": orch_id,
            "dryRun": dry_run,
            "operations": [asdict(op) for op in operations],
            "logs": logs
        }

# ══════════════════════════════════════════════════════════════════════════════
# 4. CLI INTERFACE (skipo & assistant)
# ══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Skipo Builder — Package Discovery, Installer & Code Composer")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # list
    list_p = subparsers.add_parser("list", help="List available packages, services, components or orchestrations")
    list_p.add_argument("item", choices=["services", "components", "orchestrations", "all"], help="Item type to list")
    list_p.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # inspect
    insp_p = subparsers.add_parser("inspect", help="Inspect metadata manifest for a service or component")
    insp_p.add_argument("item_type", choices=["service", "component", "orchestration"], help="Target type")
    insp_p.add_argument("id", help="Item ID")
    insp_p.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # install
    inst_p = subparsers.add_parser("install", help="Install and compose a service or UI component")
    inst_p.add_argument("item_type", choices=["service", "component"], help="Target type")
    inst_p.add_argument("id", help="Service or component ID")
    inst_p.add_argument("--mode", choices=["backend", "fullstack"], default="backend", help="Installation mode")
    inst_p.add_argument("--dry-run", action="store_true", help="Dry run without mutating source")
    inst_p.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # add
    add_p = subparsers.add_parser("add", help="Add an orchestrator to BackendFacade")
    add_p.add_argument("item_type", choices=["orchestration"], help="Item type")
    add_p.add_argument("id", help="Orchestration ID")
    add_p.add_argument("--dry-run", action="store_true", help="Dry run without mutating source")
    add_p.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # graph frontend asset generation
    graph_p = subparsers.add_parser("generate-graph-assets", help="Generate frontend graph assets from a backend functional graph manifest")
    graph_p.add_argument("manifest", type=Path)
    graph_p.add_argument("root", type=Path)
    graph_p.add_argument("--tab", required=True)
    graph_p.add_argument("--interface", required=True)

    # linked dependency validation
    link_p = subparsers.add_parser("validate-links", help="Validate linked KLOKS services/orchestrations and FLOKS components")
    link_p.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    # target inspect
    tgt_p = subparsers.add_parser("target", help="Inspect semantic code targets")
    tgt_p.add_argument("action", choices=["inspect"], help="Target action")
    tgt_p.add_argument("--file", default="src/backend/SkipoBackend.ts", help="File to inspect")
    tgt_p.add_argument("--property", default="services", help="Property to inspect")
    tgt_p.add_argument("--json", action="store_true", help="Output machine-readable JSON")

    args = parser.parse_args()
    builder = SkipoBuilder()

    if args.command == "list":
        if args.item == "services":
            data = builder.list_services()
            if args.json:
                print(json.dumps(data, indent=2))
            else:
                print("\n📦 AVAILABLE KLOKS SERVICES:")
                for s in data:
                    print(f"  • {s['id']:<18} v{s['version']} [{', '.join(s.get('modes', []))}]  -> {s['backend']['package']}")
                    if s.get("ui"):
                        print(f"    UI Components: {', '.join(s['ui'].get('components', []))}")
                    print(f"    {s.get('description', '')}\n")
        elif args.item == "components":
            data = builder.list_components()
            if args.json:
                print(json.dumps(data, indent=2))
            else:
                print("\n🎨 AVAILABLE FLOKS UI COMPONENTS:")
                for c in data:
                    print(f"  • {c['id']:<24} [{c.get('package')}]  targets: {', '.join(c.get('targetTypes', []))}")
                print()
        elif args.item == "orchestrations":
            data = builder.list_orchestrations()
            if args.json:
                print(json.dumps(data, indent=2))
            else:
                print("\n⚙️ AVAILABLE KLOKS ORCHESTRATORS:")
                for o in data:
                    print(f"  • {o['id']:<24} v{o['version']} [{o.get('package')}] -> export: {o.get('export')}")
                print()

    elif args.command == "inspect":
        if args.item_type == "service":
            res = builder.inspect_service(args.id)
        elif args.item_type == "component":
            res = builder.inspect_component(args.id)
        else:
            res = builder.catalog.load_orchestrations().get(args.id)

        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(json.dumps(res, indent=2) if res else f"Item '{args.id}' not found.")

    elif args.command == "install":
        if args.item_type == "service":
            res = builder.install_service(args.id, mode=args.mode, dry_run=args.dry_run)
            if args.json:
                print(json.dumps(res, indent=2))
            else:
                print(f"\nStatus: {res['status'].upper()}")
                for log in res.get("logs", []):
                    print(f"  ➜ {log}")
                if res.get("errors"):
                    print("\nErrors:")
                    for err in res["errors"]:
                        print(f"  ✖ {err}")
                print()

    elif args.command == "add" and args.item_type == "orchestration":
        res = builder.add_orchestration(args.id, dry_run=args.dry_run)
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"\nStatus: {res['status'].upper()}")
            for log in res.get("logs", []):
                print(f"  ➜ {log}")
            print()

    elif args.command == "generate-graph-assets":
        for path in generate_graph_assets(args.manifest.resolve(), args.root.resolve(), args.tab, args.interface):
            print(path)

    elif args.command == "validate-links":
        res = builder.validate_linked_dependencies()
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print("VALID" if res["valid"] else "INVALID")
            for warning in res.get("warnings", []):
                print(f"⚠ {warning}")
            for error in res.get("errors", []):
                print(f"✖ {error}")

    elif args.command == "target":
        resolver = SemanticTargetResolver(SKIPO_ROOT)
        resolved = resolver.resolve({"file": args.file, "property": args.property})
        if args.json:
            print(json.dumps(resolved.to_dict(), indent=2))
        else:
            print(f"Found: {resolved.found} | File: {resolved.file_path} | Insertion Point: {resolved.insertion_point}")

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
