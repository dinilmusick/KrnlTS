# Skipo Deterministic Code Generators

This directory contains the **pure Python 3 deterministic code generators** designed to scaffold complete, multi-file directory suites that inherently satisfy all 10 Skipo Architectural Pillars on first generation.

---

## Generator Aspect Index

| Aspect | Generator Script | Scaffolds |
| :--- | :--- | :--- |
| **01: Structure & Governance** | [`01_structure_generator.py`](./01_structure_generator.py) | Full plane directories (`src/frontend`, `src/backend`), anchored `.gitignore`, root `README.md`, and `SKILL.md`. |
| **02: UI Primitives & Tokens** | [`02_ui_component_generator.py`](./02_ui_component_generator.py) | React Component Suite: `[Comp].tsx`, `[Comp].test.tsx`, `types.ts`, `index.ts` (100% theme tokens `var(--skipo-*)`, `@skipo/ui`). |
| **03: Layout Shell Invariants** | [`03_layout_shell_generator.py`](./03_layout_shell_generator.py) | Shell Suite: `AppShell.tsx`, `TopToolbar.tsx` (44px), `BottomStrip.tsx` (30px), `FloatingDetailsPanel.tsx`, `index.ts`. |
| **04: Code Limits & Purity** | [`04_layered_logic_generator.py`](./04_layered_logic_generator.py) | Layered logic suite ($L_0 \to L_3$), ASCII flowchart, section demarcations, companion test, <= 200 lines. |
| **05: Real Data & Anti-Mock** | [`05_entity_quad_generator.py`](./05_entity_quad_generator.py) | Quad-Unit Entity Atom: `schema.ts`, `types.ts`, `store.ts`, `EmptyState.tsx`, `index.ts` (zero mock data). |
| **06: Anti-Stub Real Drivers** | [`06_service_driver_generator.py`](./06_service_driver_generator.py) | Service Driver Suite: authentic SDK driver (`driver.ts`, `driver.test.ts`, `types.ts`, `index.ts`, $\ge 2$ statements). |
| **07: Storage Decoupling** | [`07_backend_storage_generator.py`](./07_backend_storage_generator.py) | Presigned upload/download suite (`presigned.ts`, `presigned.test.ts`, `types.ts`, `index.ts`, zero `/tmp` proxying). |
| **08: API Security & 8-Gate** | [`08_secure_api_route_generator.py`](./08_secure_api_route_generator.py) | 8-Gate Secure Route: `route.ts`, `schema.ts`, `route.test.ts` (rate limiting, validation, auth, security headers). |
| **09: Companion Tests** | [`09_companion_test_generator.py`](./09_companion_test_generator.py) | Real companion `*.test.ts(x)` with operational assertions (bans `expect(true).toBe(true)`). |
| **10: Canonical Node Graph** | [`10_node_graph_generator.py`](./10_node_graph_generator.py) | Complete Node Graph Suite: central `ConnectionRuleStore`, icon-only `SolidifyWidget`, `CompatibleNodePicker`, `CanvasContextMenu`, and canonical UX controls. |
| **Composite: Sub-App Tree** | [`generate.py subapp`](./generate.py) | Full Sub-App Plane Tree integrating all 10 aspects into a turnkey application. |

---

## CLI Usage

### List Available Generators
```bash
python3 generators/generate.py --list
# Or via Node:
node generators/runner.mjs --list
```

### Generate a Complete React Component Suite
```bash
python3 generators/generate.py component src/frontend/components/MetricCard --name MetricCard
```

### Generate a Quad-Unit Entity Atom
```bash
python3 generators/generate.py entity src/backend/entities/Project --name Project
```

### Generate an 8-Gate Secure API Route
```bash
python3 generators/generate.py route src/backend/api/documents --name documents
```

### Generate a Full Compliant Sub-App Plane Tree
```bash
python3 generators/generate.py subapp subapps/Analytics --name Analytics
```

### Deep JSON Configuration / Customization
You can pass custom schemas, props, and functions via `--params` or `--config`:
```bash
python3 generators/generate.py component src/frontend/components/UserGrid --name UserGrid --params '{
  "props": {
    "organizationId": "string",
    "allowExport": "boolean",
    "onSelectUser": "(userId: string) => void"
  }
}'
```
