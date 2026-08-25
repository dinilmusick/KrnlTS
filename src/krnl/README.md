# KrnlTS Core Engine (`src/krnl/`)

## 1. Directory Purpose & Architectural Role
`src/krnl/` is the root namespace for the `@dinilmusick/krnlts` library runtime. It encapsulates the core composition engine, universal backend abstractions, in-process frontend generator, tool libraries, and self-documenting specifications.

## 2. Subdirectory Topology
| Subdirectory | Description & Layer |
| :--- | :--- |
| [`core/`](./core/README.md) | The Gross Architecture core: `Entity`, `krnlLocalFunctionality`, `krnlEmitter`, sub-app worker hosts, and protocol adapters. |
| [`backend/`](./backend/README.md) | Universal Backend Architecture: Control Plane, decoupled Data & Storage Providers, and Functionality Table CRUD engine. |
| [`frontend/`](./frontend/README.md) | In-process frontend bundler, UI atom catalog, and central style authority design tokens. |
| [`tools/`](./tools/README.md) | Deterministic mathematical concepts, AST source analyzers, `KrnlFS`, `KrnlHTTP`, and pure utilities ($L_0/L_1$). |
| [`docs/`](./docs/guide.md) | Architectural guides, protocol references, and changelogs. |
| [`tests/`](./tests/README.md) | Test suites and validation harnesses. |

## 3. Data Flow & Interactivity
- `tools/` ($L_0/L_1$) $\to$ consumed by `backend/` ($L_2$) and `core/` ($L_3$).
- `backend/` ($L_2$) $\to$ auto-injected into `core/` functionalities via `context.table`.
- `core/` ($L_3$) $\to$ exposed to external consumers through protocol adapters (REST, WS, MCP, ACP) or frontend UI atoms (`frontend/`).
