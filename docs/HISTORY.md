# KrnlTS Project History Timeline

## [2026-10-13] - Krnl Alignment: Backend Service Framework for Skipo

### User Intent & Rationale:
- **Goal**: Align all descriptions, package metadata, keywords, CLI help strings, and repository documentation with the fact that Krnl is the Backend Service Framework for Skipo (where services are backend modules).
- **Rationale**: Previous descriptions mentioning full-stack multiplatform frameworks, direct-DOM VanJS reactivity, and visual node IDEs were obsolete and misleading following the refactor to a pure backend service kernel.

### Architectural Decisions & Changes:
- **Description & Metadata Standardization**:
  - Root `package.json` updated to `"Krnl: Backend Service Framework for Skipo — authoring, executing, and validating modular backend services, facades, and workflows"`.
  - Subpackage descriptions updated across `packages/core`, `packages/cli`, `packages/validate`, `packages/eslint-plugin`, and `packages/create-krnl`.
  - Package keywords aligned around backend services, service facades, protocols, and workflows.
- **Documentation Overhaul (`README.md`)**:
  - Replaced obsolete studio/UI instructions with service definition, flow execution, and AST purity validation workflows (`krnl validate`, `krnl dev`, `krnl build`).
  - Purged obsolete references to `@dinilmusick/krnl-ui` and `@dinilmusick/krnl-studio`.
- **CLI Clean-up (`krnl.ts`)**:
  - Updated banner and help menu to reflect `Krnl Backend Service Framework CLI`.

---

## [2026-08-27] - Krnl Studio UI Expansion, Visual State Presets, and Clean Monaco Integration

### User Intent & Rationale:
- **Goal**: Expand Krnl Studio into a complete visual IDE and UI builder with interactive previews, customizable component parameters, visual state presets, schema-validated payload builders, and clean code Monaco editors.
- **Rationale**: Developers need a unified, zero-friction interface to visually compose VanJS UI components, preview actions, configure custom JSON arguments, and inspect live source code without visual distraction from obvious imports.

### Architectural Decisions & Changes:
- **Canonical Component Specifications (`CANONICAL_COMPONENT_SPECS`)**:
  - Standardized visual parameters (colors, borders, transforms, opacity, shadows) across `KrnlButton`, `KrnlTextInput`, `KrnlDropdown`, `KrnlBadge`, `KrnlTile`, and `Container`.
- **Visual State Presets Architecture**:
  - Differentiated runtime reactive *Asset State Data* from visual *State Presets* (`default`, `hover`, `loading`, `success`, `error`, `disabled`, and user-defined custom presets).
  - Integrated action lifecycle state transitions and dynamic asset state data expression derivation.
- **Monaco Editor Suite**:
  - Embedded real-time Monaco Editor instances for Component Code Snippets and Custom JSON Payloads.
  - Implemented automatic framework import filtering (`@dinilmusick/krnl-core`, `@dinilmusick/krnl-ui`, `vanjs-core`, atom schemas) with an interactive Clean View toggle and safe disk save reassembly.
- **AST Purity & Validation**:
  - Full compatibility with 4-layer function purity, magnetic discovery, and zero-mock backend integration.

### Invariants & Constraints Maintained:
- Preserved 4-layer unidirectional flow ($L_0 \to L_1 \to L_2 \to L_3$).
- Strictly event-driven architecture with zero polling/onTick loops.
- All files compliant with multi-tier line limits and atomic sizing.
- Clean TypeScript ESM/CJS build with 0 compilation errors.
