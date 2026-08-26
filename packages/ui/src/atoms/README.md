# Frontend Atoms Catalog (`src/krnl/frontend/atoms/`)

## 1. Directory Purpose & Architectural Role
Self-contained, atomic React UI components that render entity states, execution controls, topology graphs, and activity streams.

## 2. Component Manifest
| Atom File | Responsibility |
| :--- | :--- |
| `KrnlButton.tsx` | Standard action button consuming `--krnl-accent` and `--krnl-radius`. |
| `KrnlCard.tsx` | Surface card container consuming `--krnl-bg-surface` and `--krnl-border`. |
| `KrnlForceGraph.tsx` | D3-based force-directed graph visualizer mapping entities and functionality relationships. |
| `KrnlDockToolbar.tsx` | Docked navigation tray and toolbar controls. |
| `KrnlLogStream.tsx` | Real-time streaming log console subscribing to telemetry and event streams. |

## 3. Styling Invariant
- **Zero Hardcoded CSS**: All atoms consume variables defined in `src/krnl/frontend/index.css`.
