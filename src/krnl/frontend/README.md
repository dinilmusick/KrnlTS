# Frontend Generation & UI Subsystem (`src/krnl/frontend/`)

## 1. Directory Purpose & Architectural Role
Provides in-process React bundling, automatic UI manifest generation, central style authority CSS tokens, and reusable atomic UI visualizers for Krnl systems.

## 2. File Manifest
| File / Directory | Responsibility |
| :--- | :--- |
| [`atoms/`](./atoms/README.md) | Catalog of atomic React UI components (cards, badges, modals, graph visualizers). |
| `index.css` | Central style authority defining all `--krnl-*` CSS design tokens and base themes. |
| `K_LIB_Krnl_Frontend_Builder.ts` | In-process esbuild bundler producing compiled browser bundles on-the-fly. |
| `K_LIB_Krnl_Frontend_Generator.ts` | Discovers functionality `uiSpec` declarations and generates complete React application scaffolding. |

## 3. Data Flow
- Served automatically via `krnlSystemUnifiedHttpAdapter` under `/frontend` and `/frontend/bundle.js`.
- Interacts with backend functionalities exclusively via `/frontend/api/{functionalityId}` and `/ws`.
