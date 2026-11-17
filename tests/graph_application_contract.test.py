#!/usr/bin/env python3
import shutil
import tempfile
import unittest
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("aspect_23", ROOT / "checklists" / "23_graph_application_contract.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
validate = MODULE.validate_graph_application_contract


class GraphApplicationContractTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix="skipo_graph_contract_"))
        base = self.root / "src"
        for rel in (
            "frontend/pages/main/tabs/Garden",
            "frontend/pages/main/tabs/Garden/GardenGraph",
            "backend/services/GardenGraph/graph-definitions/editable-node-graph/connection-types",
            "backend/services/GardenGraph/graph-definitions/editable-node-graph/nodes",
            "backend/services/GardenGraph/graph-definitions/editable-node-graph/facades",
            "libraries",
        ):
            (base / rel).mkdir(parents=True, exist_ok=True)

        (base / "frontend/pages/main/tabs/Garden/Garden.tsx").write_text(
            "import { GardenGraph } from './GardenGraph/GardenGraph'; export const Garden=()=>GardenGraph;"
        )
        (base / "frontend/pages/main/tabs/Garden/GardenGraph/GardenGraph.tsx").write_text(
            "export const GardenGraph = () => null;"
        )

        domain = base / "backend/services/GardenGraph/graph-definitions/editable-node-graph"
        (domain / "connection-types/string.ts").write_text(
            "import type { GardenString } from '../../../../../../libraries/GardenConcepts'; export const gardenString = {};"
        )
        (domain / "nodes/flower-pot.ts").write_text(
            "import { gardenString } from '../facades/connection-types'; export const flowerPot = { inputs: [gardenString] };"
        )
        (domain / "facades/connection-types.ts").write_text(
            "export { gardenString } from '../connection-types/string';"
        )
        (domain / "facades/nodes.ts").write_text(
            "import { gardenString } from './connection-types'; export { flowerPot } from '../nodes/flower-pot';"
        )
        (domain / "facades/graph.ts").write_text(
            "import { gardenString } from './connection-types'; import { flowerPot } from './nodes'; export const gardenGraph = { gardenString, flowerPot };"
        )

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def test_valid_graph_and_tab_contract(self):
        result = validate(self.root)
        self.assertTrue(result.passed, [v.message for v in result.violations])

    def test_backend_graph_visual_payload_is_rejected(self):
        path = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph/nodes/flower-pot.ts"
        path.write_text("export const flowerPot = { assetRef: '/pot.svg' };")
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.4-backend-visual-payload", {v.rule_id for v in result.violations})

    def test_semantic_type_must_live_in_libraries(self):
        path = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph/nodes/flower-pot.ts"
        path.write_text("export interface FlowerPot { size: number }; export const flowerPot = {};")
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.3-semantic-types-outside-libraries", {v.rule_id for v in result.violations})

    def test_tab_interface_contract_is_blocking(self):
        path = self.root / "src/frontend/pages/main/tabs/Garden/GardenGraph/GardenGraph.tsx"
        path.unlink()
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.10-interface-component-name", {v.rule_id for v in result.violations})

    def test_backend_graph_definition_react_is_rejected(self):
        path = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph/nodes/flower-pot.ts"
        path.write_text("import React from 'react';\nimport { gardenString } from '../facades/connection-types';\nexport const flowerPot = { inputs: [gardenString] };")
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.4-backend-visual-payload", {v.rule_id for v in result.violations})

    def test_backend_graph_definition_frontend_import_is_rejected(self):
        path = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph/nodes/flower-pot.ts"
        path.write_text("import { Garden } from '../../../../../../frontend/pages/main/tabs/Garden/Garden';\nexport const flowerPot = {};")
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.5-backend-frontend-import", {v.rule_id for v in result.violations})

    def test_node_definition_bypasses_connection_facade_is_rejected(self):
        path = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph/nodes/flower-pot.ts"
        path.write_text("import { gardenString } from '../connection-types/string';\nexport const flowerPot = { inputs: [gardenString] };")
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.12-node-definition-connection-facade", {v.rule_id for v in result.violations})

    def test_graph_facade_omits_nodes_facade_is_rejected(self):
        path = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph/facades/graph.ts"
        path.write_text("import { gardenString } from './connection-types';\nexport const gardenGraph = { gardenString };")
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.8-graph-facade-incomplete", {v.rule_id for v in result.violations})

    def test_graph_facade_omits_connection_types_facade_is_rejected(self):
        path = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph/facades/graph.ts"
        path.write_text("import { flowerPot } from './nodes';\nexport const gardenGraph = { flowerPot };")
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.8-graph-facade-incomplete", {v.rule_id for v in result.violations})

    def test_missing_tab_component_is_rejected(self):
        path = self.root / "src/frontend/pages/main/tabs/Garden/Garden.tsx"
        path.unlink()
        result = validate(self.root)
        self.assertFalse(result.passed)
        self.assertIn("23.9-tab-component-name", {v.rule_id for v in result.violations})

    def test_force_graph_domain_is_verified(self):
        fg = self.root / "src/backend/services/GardenGraph/graph-definitions/force-graph"
        for sub in ("connection-types", "nodes", "facades"):
            (fg / sub).mkdir(parents=True, exist_ok=True)
        (fg / "connection-types/link.ts").write_text("export const link = {};")
        (fg / "nodes/particle.ts").write_text("import { link } from '../facades/connection-types'; export const particle = {};")
        (fg / "facades/connection-types.ts").write_text("export { link } from '../connection-types/link';")
        (fg / "facades/nodes.ts").write_text("import { link } from './connection-types'; export { particle } from '../nodes/particle';")
        (fg / "facades/graph.ts").write_text("import { link } from './connection-types'; import { particle } from './nodes'; export const fg = { link, particle };")
        result = validate(self.root)
        self.assertTrue(result.passed, [v.message for v in result.violations])

    def test_positive_garden_semantic_graph_with_connections(self):
        (self.root / "src/libraries/GardenConcepts.ts").write_text(
            "export interface GardenString { value: string; }\n"
            "export interface PotSize { diameter: number; depth: number; }\n"
            "export interface Vector3 { x: number; y: number; z: number; }\n"
            "export interface Mana { level: number; max: number; }\n"
        )
        domain = self.root / "src/backend/services/GardenGraph/graph-definitions/editable-node-graph"
        (domain / "connection-types/water.ts").write_text(
            "import type { Mana, PotSize } from '../../../../../../libraries/GardenConcepts';\n"
            "export const waterConnection = { type: 'water', capacity: 100 };\n"
        )
        (domain / "nodes/water-source.ts").write_text(
            "import { waterConnection } from '../facades/connection-types';\n"
            "export const waterSource = { id: 'water-source', outputs: [waterConnection] };\n"
        )
        (domain / "nodes/flower-pot.ts").write_text(
            "import { waterConnection } from '../facades/connection-types';\n"
            "export const flowerPot = { id: 'flower-pot', inputs: [waterConnection] };\n"
        )
        (domain / "facades/connection-types.ts").write_text(
            "export { waterConnection } from '../connection-types/water';\n"
        )
        (domain / "facades/nodes.ts").write_text(
            "import { waterConnection } from './connection-types';\n"
            "export { waterSource } from '../nodes/water-source';\n"
            "export { flowerPot } from '../nodes/flower-pot';\n"
        )
        (domain / "facades/graph.ts").write_text(
            "import { waterConnection } from './connection-types';\n"
            "import { waterSource, flowerPot } from './nodes';\n"
            "export const gardenGraph = { waterConnection, waterSource, flowerPot };\n"
        )
        result = validate(self.root)
        self.assertTrue(result.passed, [v.message for v in result.violations])


if __name__ == "__main__":
    unittest.main()
