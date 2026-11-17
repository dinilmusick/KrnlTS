# Full Ecosystem Parity Matrix: PHP/WordPress ↔ TypeScript

This document establishes the official cross-ecosystem parity matrix between the PHP/WordPress frameworks and their upstream TypeScript counterparts.

## Architecture Layers & SemVer Alignment

| Layer | PHP/WordPress Repository | Upstream TypeScript Target | Version | Role & Responsibilities |
|---|---|---|---|---|
| **1** | **GutWP** | `GutTS` | `1.3.2` | Global utility primitives: Arrays, Strings, Numbers, Objects, URLs, Collections, API Registry & FodRuntime, Model Registry, SemanticInput extraction. |
| **2** | **KrnlWP** | `KrnlTS` | `1.0.9` | Backend service kernel: Service contracts, lifecycle, DAG orchestration, Saga rollback compensation, TelemetryController, WorkerExecutionBoundary, CLI (`bin/krnl`). |
| **3** | **FrnlWP** | `FrnlTS` | `0.5.3` | Frontend semantic runtime: SemanticStore, AccessibilityValidator, FrnlFacade, ComponentDefinition, FrontendApi snapshot inspection, themes. |
| **4** | **KloksWP** | `Kloks` | `1.24.0` | Reusable backend services, caches, StateGraph (archetypes, connection rules, wire validation, spatial engine, graph store), AI inference, Aiko gateway bridge, FOD evaluator. |
| **5** | **FloksWP** | `Floks` | `1.13.4` | Concrete Elementor widgets (`Card`, `Badge`, `Input`, `Select`, `Textarea`, `Toggle`, `Button`, `Heading`, `Container`, `Graph`, `Panel`), AI widgets, OmniCanvas (`FodCanvas`, `AikoCanvas`), TokenMapper. |
| **6** | **SkipoWP** | `Skipo` | `0.5.0` | Application composition & scaffolding: BackendFacade capability aggregation, IntegrityValidator (layer laws, line limits), SkipoExecutionEngine 6-layer orchestration, CLI (`bin/skipo`). |

## Layer Laws & Architectural Guarantees

1. **Deterministic Layer Order**: GutWP → KrnlWP → FrnlWP → KloksWP → FloksWP → SkipoWP.
2. **Upward Dependency Prohibition**: Lower layers NEVER depend on higher layers.
3. **Skipo Law #6**: Maximum 200 lines per source file.
4. **Strict Typing**: All files declare `declare(strict_types=1);`.
5. **Continuous Verification**: All changes verified by GitHub Actions CI/CD on remote `main`.
