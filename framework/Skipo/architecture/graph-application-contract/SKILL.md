---
name: skipo-graph-application-contract
description: Canonical contract for application-specific editable node graphs and force graphs.
---

# SKIPO GRAPH APPLICATION CONTRACT

Application graph semantics are backend-owned; application visual assets are frontend-owned.

## 1. Canonical planes

src/libraries/                         app concepts, semantic types, pure definitions
src/backend/services/<graph-service>/
  graph-definitions/
    editable-node-graph/
      connection-types/
      nodes/
      facades/
        connection-types.ts
        nodes.ts
        graph.ts
    force-graph/
      connection-types/
      nodes/
      facades/
        connection-types.ts
        nodes.ts
        graph.ts

src/frontend/pages/main/tabs/<TabName>/
  <TabName>.tsx
  <InterfaceName>/
    <InterfaceName>.tsx

Editable-node-graph and force-graph are semantic graph-definition domains. They may consume generic KLOKS graph services/types but never define or import frontend visual assets.

## 2. Functional definitions

Each connection type is one file. Each node definition is one file.

ConnectionType is a complete semantic wire contract:
- input handle definition
- output handle definition
- wire definition

NodeDefinition is a complete semantic node contract:
- node body functional definition
- input handles
- output handles
- functional buttons/actions

Definitions may describe strings, pot sizes, 3D vectors, mana, audio, MIDI, and other domain data. They must not contain SVGs, image URLs, CSS, React components, JSX, visual asset references, or frontend imports.

Application-specific semantic types belong in src/libraries. Graph-definition files consume those types. Generic graph primitives/services come from KLOKS.

## 3. Facades

Each graph domain exposes:
- facades/connection-types.ts: complete connection-type registry
- facades/nodes.ts: complete node-definition registry
- facades/graph.ts: complete application graph-definition facade

Node definitions import connection types through the connection-types facade rather than scattered direct imports.

The graph facade consumes the node and connection facades. Consumers do not assemble graph definitions by importing individual definition files.

## 4. Visual separation

Frontend graph interfaces consume KLOKS graph services, FLOKS graph components, application-specific visual assets, and generated bindings derived from the functional graph contract.

Visual assets may include SVGs, icons, images, node body renderers, handle renderers, wire renderers, signal meters, mana meters, or other domain-specific visualization.

A backend graph definition must never import a visual asset.

## 5. Main-tab/interface contract

Every directory directly under src/frontend/pages/main/tabs/ is a tab.

For each tab <TabName>:
- directory name is <TabName>
- <TabName>/<TabName>.tsx exists
- each interface/window is a child directory
- each interface directory <InterfaceName> contains <InterfaceName>.tsx
- the tab component owns arrangement, layout, dividers, and split orientation
- interface components own their own implementation
- the tab composes interface facades instead of implementing an interface inline

A tab may contain a node graph, IDE, inspector, or multiple windows.

## 6. Generated frontend graph assets

Skipo provides scripts/generate_graph_assets.py to generate frontend graph-interface scaffolding from a machine-readable functional graph manifest exported by the backend definition layer.

Generated output lives inside the selected tab/interface directory and never inside backend graph-definition directories.

## 7. Enforcement

The blocking graph validator enforces backend semantic ownership, library-owned app types, visual separation, one-file-per-definition, required facades, facade-based imports, tab/interface naming, and generated-output boundaries.
