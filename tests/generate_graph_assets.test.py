#!/usr/bin/env python3
import json
import shutil
import tempfile
import unittest
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("graph_assets", ROOT / "scripts" / "generate_graph_assets.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class GraphAssetGeneratorTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix="skipo_graph_assets_"))
        self.manifest = self.root / "graph.json"
        self.manifest.write_text(json.dumps({
            "graph": {
                "id": "garden.graph",
                "name": "Garden Graph",
                "connectionTypes": [{"id": "water"}],
                "nodes": [{"id": "flower-pot"}]
            }
        }), encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def test_generation_uses_canonical_tab_and_interface_paths(self):
        files = MODULE.generate(self.manifest, self.root, "Garden", "GardenGraph")
        target = self.root / "src/frontend/pages/main/tabs/Garden/GardenGraph"
        self.assertIn(target / "GardenGraph.tsx", files)
        self.assertTrue((target / "GardenGraph.tsx").is_file())
        self.assertTrue((target / "graph-assets.manifest.json").is_file())
        text = (target / "GardenGraph.tsx").read_text(encoding="utf-8")
        self.assertIn("nodes: GraphNode[]", text)
        self.assertIn("edges: GraphEdge[]", text)
        self.assertNotIn("assetRef", text)

    def test_noncanonical_names_are_rejected(self):
        with self.assertRaises(ValueError):
            MODULE.generate(self.manifest, self.root, "garden", "GardenGraph")


if __name__ == "__main__":
    unittest.main()
