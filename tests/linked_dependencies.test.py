import json
import tempfile
from pathlib import Path
import sys
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from skipo_builder import CodeComposer, CodeOperation, PackageCatalog, SkipoBuilder


def write_manifest(root: Path, package: str, filename: str, payload: dict) -> None:
    path = root / package / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def make_builder(root: Path) -> SkipoBuilder:
    builder = SkipoBuilder.__new__(SkipoBuilder)
    builder.project_root = root / "Skipo"
    builder.catalog = PackageCatalog(root / "Kloks", root / "Floks")
    return builder


def test_component_required_service_blocks_missing_backend():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "services": [{"id": "node-graph", "backend": {"facade": "NodeGraphEngineServiceFacade"}}]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{"id": "FrnlEditableNodeGraph", "requiredServices": ["node-graph"]}]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { FrnlEditableNodeGraph } from '@floks/canvas';", encoding="utf-8"
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text("export const AppBackend = {};", encoding="utf-8")

        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]
        assert any("node-graph" in error for error in result["errors"])


def test_service_default_frontend_missing_is_warning_not_error():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "services": [{
                "id": "node-graph",
                "modes": ["backend", "fullstack"],
                "backend": {"facade": "NodeGraphEngineServiceFacade"},
                "defaultFrontend": {"component": "FrnlEditableNodeGraph"},
            }]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{"id": "FrnlEditableNodeGraph"}]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { Other } from '@floks/ui';", encoding="utf-8"
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "NodeGraphEngineServiceFacade", encoding="utf-8"
        )

        result = make_builder(root).validate_linked_dependencies()
        assert result["valid"]
        assert any("recommends FLOKS component" in warning for warning in result["warnings"])

def test_component_with_required_service_passes_when_backend_facade_is_registered():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "services": [{
                "id": "node-graph",
                "backend": {"facade": "NodeGraphEngineServiceFacade"},
            }]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{
                "id": "FrnlEditableNodeGraph",
                "requiredServices": ["node-graph"],
            }]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { FrnlEditableNodeGraph } from '@floks/canvas';",
            encoding="utf-8",
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "import { NodeGraphEngineServiceFacade } from '@kloks/state-graph';\n"
            "export const AppBackend = { services: { nodeGraph: NodeGraphEngineServiceFacade } };",
            encoding="utf-8",
        )

        result = make_builder(root).validate_linked_dependencies()
        assert result["valid"], result["errors"]


def test_component_required_orchestration_blocks_missing_backend_registration():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "orchestrations": [{
                "id": "workspace-startup",
                "export": "WorkspaceStartupOrchestration",
            }]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{
                "id": "WorkspacePanel",
                "requiredOrchestrations": ["workspace-startup"],
            }]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { WorkspacePanel } from '@floks/ui';",
            encoding="utf-8",
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "export const AppBackend = { orchestrations: {} };",
            encoding="utf-8",
        )

        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]
        assert any("workspace-startup" in error for error in result["errors"])


def test_component_unknown_required_service_is_reported():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{
                "id": "UnknownServicePanel",
                "requiredServices": ["missing-service"],
            }]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { UnknownServicePanel } from '@floks/ui';",
            encoding="utf-8",
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "export const AppBackend = { services: {} };",
            encoding="utf-8",
        )

        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]
        assert any("Unknown required service 'missing-service'" in error for error in result["errors"])

def test_required_frontend_is_an_error():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {"services": [{"id": "node-graph", "defaultFrontend": {"component": "GraphPanel", "relationship": "required"}}]})
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {"components": [{"id": "GraphPanel"}]})
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text("export { Other } from '@floks/ui';", encoding="utf-8")
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text("export const AppBackend = {};", encoding="utf-8")
        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]
        assert any("requires FLOKS component 'GraphPanel'" in error for error in result["errors"])


def test_near_matching_component_identifier_does_not_count_as_export():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "services": [{
                "id": "node-graph",
                "backend": {"facade": "NodeGraphEngineServiceFacade"},
                "defaultFrontend": {"component": "GraphPanel", "relationship": "required"},
            }]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{"id": "GraphPanel", "requiredServices": ["node-graph"]}]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { GraphPanelExtra } from '@floks/ui';", encoding="utf-8"
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "import { NodeGraphEngineServiceFacade } from '@kloks/state-graph';\n"
            "export const AppBackend = { services: { nodeGraph: NodeGraphEngineServiceFacade } };",
            encoding="utf-8",
        )
        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]
        assert any("GraphPanel" in error and "not exported" in error for error in result["errors"])


def test_comment_does_not_count_as_registered_service():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "services": [{"id": "node-graph", "backend": {"facade": "NodeGraphEngineServiceFacade"}}]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{"id": "FrnlEditableNodeGraph", "requiredServices": ["node-graph"]}]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { FrnlEditableNodeGraph } from '@floks/canvas';", encoding="utf-8"
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "import { NodeGraphEngineServiceFacade } from '@kloks/state-graph';\n"
            "// NodeGraphEngineServiceFacade\n"
            "export const AppBackend = { services: {} };", encoding="utf-8"
        )
        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]
        assert any("node-graph" in error for error in result["errors"])


def test_registered_service_export_is_required_not_just_imported():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "services": [{"id": "node-graph", "backend": {"facade": "NodeGraphEngineServiceFacade"}}]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{"id": "FrnlEditableNodeGraph", "requiredServices": ["node-graph"]}]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { FrnlEditableNodeGraph } from '@floks/canvas';", encoding="utf-8"
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "import { NodeGraphEngineServiceFacade } from '@kloks/state-graph';\n"
            "export const AppBackend = { services: { other: OtherFacade } };", encoding="utf-8"
        )
        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]


def test_required_orchestration_near_match_does_not_count_as_registered():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "orchestrations": [{"id": "workspace-startup", "export": "WorkspaceStartupOrchestration"}]
        })
        write_manifest(root / "Floks", "packages/canvas", "floks.manifest.json", {
            "components": [{"id": "WorkspacePanel", "requiredOrchestrations": ["workspace-startup"]}]
        })
        components = root / "Skipo/src/frontend/components"
        components.mkdir(parents=True)
        (components / "components.ts").write_text(
            "export { WorkspacePanel } from '@floks/ui';", encoding="utf-8"
        )
        backend = root / "Skipo/src/backend"
        backend.mkdir(parents=True)
        (backend / "AppBackend.ts").write_text(
            "import { WorkspaceStartupOrchestrationExtra } from '@kloks/orchestrations';\n"
            "export const AppBackend = { orchestrations: { startup: WorkspaceStartupOrchestrationExtra } };",
            encoding="utf-8"
        )
        result = make_builder(root).validate_linked_dependencies()
        assert not result["valid"]



def test_frontend_composition_preserves_jsx_line_breaks():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        app = root / "src/frontend/App.tsx"
        app.parent.mkdir(parents=True)
        app.write_text("export function App() {\n  return (\n    <main />\n  );\n}\n", encoding="utf-8")
        composer = CodeComposer(root)

        class Resolved:
            found = True
            insertion_point = app.read_text(encoding="utf-8").index("    <main />")

        composer.resolver.resolve = lambda _target: Resolved()
        operation = CodeOperation(
            type="insert-jsx",
            file="src/frontend/App.tsx",
            target={"file": "src/frontend/App.tsx", "symbol": "App", "section": "main-content"},
            payload={"jsx": "<FrnlEditableNodeGraph />\n"},
        )
        ok, _ = composer.apply_operations([operation], dry_run=False)
        assert ok
        content = app.read_text(encoding="utf-8")
        assert "<FrnlEditableNodeGraph />\n    <main />" in content

def test_fullstack_package_summary_uses_declared_frontend_package():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_manifest(root / "Kloks", "packages/node", "kloks.manifest.json", {
            "services": [{
                "id": "node-graph",
                "modes": ["backend", "fullstack"],
                "backend": {"package": "@kloks/state-graph", "facade": "NodeGraphEngineServiceFacade"},
                "defaultFrontend": {
                    "component": "FrnlEditableNodeGraph",
                    "package": "@ultrst-armada/floks/canvas-ui",
                    "relationship": "recommended",
                },
            }]
        })
        builder = make_builder(root)
        builder.composer = SimpleNamespace(
            compose_service_backend=lambda _service: [],
            compose_service_frontend=lambda _service: [],
            apply_operations=lambda _operations, dry_run=False: (True, []),
        )
        result = builder.install_service("node-graph", mode="fullstack", dry_run=True)
        assert result["status"] == "success"
        assert result["packages"] == ["@kloks/state-graph", "@ultrst-armada/floks/canvas-ui"]
