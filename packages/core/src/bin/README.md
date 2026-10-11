# CLI Tools Directory (`src/bin/`)

## 1. Directory Purpose & Architectural Role
This directory houses executable command-line interface (CLI) binaries for developer tooling, file watching, and automated architectural compliance validation across the Krnl ecosystem.

## 2. Layer Classification
- **Layer**: Developer Tooling & CLI Utilities
- **Target Runtime**: Node.js CLI execution

## 3. File Manifest
| File | Responsibility |
| :--- | :--- |
| `krnlts-validate.ts` | Validates entity composition, 4-layer function purity, and schema declarations across project directories. |
| `krnlts-watch.ts` | File-system watcher triggering live recompilation, schema synchronization, and test validation on file change events. |

## 4. Interactions & Data Flow
- **Input**: Project file tree, source code ASTs.
- **Output**: Terminal validation reports, exit codes for CI/CD pipelines, and recompiled assets.
