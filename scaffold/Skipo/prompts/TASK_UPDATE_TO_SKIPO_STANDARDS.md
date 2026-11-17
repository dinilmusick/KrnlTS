# TASK: UPDATE_CODEBASE_TO_SKIPO_STANDARDS_PROTOCOL
$$\mathcal{A}_{\text{refactored}} = \text{AlignToStandards}(\mathcal{A}_{\text{target}}, \text{Standards}(\text{Skipo/})) \quad \text{s.t.} \quad \forall \text{Law}_i \in \text{Skipo/standalone/SKILL.md}: \mathcal{A}_{\text{refactored}} \models \text{Law}_i \wedge \Delta(\text{BusinessLogic}) = 0$$

> **⚡ FIRST-RUN / ONBOARDING ONLY** — Use this prompt exactly **once** when a codebase is first being brought into Skipo compliance. For ongoing iterative enforcement (spamming the agent), use the focused domain prompts instead:
>
> | Domain | Spam Prompt |
> |:-------|:-----------|
> | Codebase structure, planes, file limits | `TASK_CODEBASE_STRUCTURE_ENFORCEMENT.md` |
> | UI components, tokens, layout shell | `TASK_UI_COMPONENT_FRONTEND.md` |
> | Backend storage | `TASK_BACKEND_STORAGE.md` |
> | API security & session auth | `TASK_SECURITY_AND_SESSION_INFRASTRUCTURE.md` |
> | Burst / polling protection | `TASK_USAGE_THROTTLING_AND_BURST_PROTECTION.md` |
> | Real data, tests, build targets | `TASK_DATA_TESTS_AND_BUILD.md` |
> | Node graph controls & layout | `TASK_NODE_GRAPH_IMPLEMENTATION.md` |
>
> This prompt runs all 7 phases in sequence and is intentionally broad. Domain prompts are more surgical and safe to repeat.

CRITICAL INVARIANT: Preserve all genuine business logic and capabilities ($\Delta\text{Logic} = 0$). Modernize and align architecture, UI primitives, theme tokens, layout shell, and test coverage to the newly copied `Skipo/` standards.

### INVIOLABLE LAW: ZERO-TRACE LEGACY SYSTEM PURGE ($\mathbf{L_{21}}$)
Any legacy system, legacy pattern, or duplicate subsystem found in the target codebase that competes with Skipo systems (e.g. ad-hoc theming, manual color pickers, custom tabs, tooltip popovers, custom inputs/buttons, local SQLite/JSON credential caches, mock data generators, legacy state managers) **MUST BE COMPLETELY AND UNCONDITIONALLY PURGED WITH ZERO TRACE LEFT BEHIND**. 
- Delete orphaned legacy files, obsolete types, and dead configs.
- Never leave commented-out legacy code or deprecated duplicate abstractions.
- Ensure the app relies 100% and solely on Skipo canonical mechanisms.

---


## 0. INGESTION, LIBRARY HYDRATION & ISOLATION PROTOCOL (MANDATORY FIRST STEP)

When this prompt is activated, a fresh `Skipo/` folder has been copied or updated inside the root of the workspace repository. You MUST NOT refactor blindly or import from `Skipo/` directly. Execute this ingestion protocol:

1. **Hydrate Base Assets into `src/libraries/skipo/` (Law L20)**:
   ```bash
   python3 Skipo/scripts/sync_to_libraries.py . --auto-fix
   ```
   - Synchronizes base UI primitives, backend drivers, storage adapters, and tokens from `Skipo/packages/` into `src/libraries/skipo/`.
   - Re-exports them cleanly through `src/libraries/index.ts`.
   - **STRICT PROHIBITION**: Application code inside `src/` MUST NEVER import directly from the root `Skipo/` directory (`import ... from "@/Skipo/..."` or `from "../../Skipo/..."`). Always import from `@/libraries/skipo` or `@/libraries`.
2. **Read Canonical Standards**:
   - Read `Skipo/standalone/SKILL.md` (The 12 Core Architectural Laws).
   - Read `Skipo/standalone/component-authoring/SKILL.md` (Component inheritance blueprints).
   - Inspect `src/libraries/skipo/ui` and `src/libraries/skipo/backend` to understand available synchronized exports and types.
3. **Perform Codebase Scan & Deviation Tally**:
   Scan the target application codebase (`src/`, `components/`, `pages/`, `app/`) and identify:
   - Direct imports from root `Skipo/` that must be migrated to `@/libraries/skipo`.
   - Bespoke raw HTML controls (`<button>`, `<input>`, `<select>`, `<textarea>`, clickable `<div>`s).
   - Nested tabs or multi-tiered tab rows within panels, drawers, or views.
   - Floating text bubbles, floating tooltips, balloon popups, or hover popovers.
   - Hardcoded hex/rgb color values bypassing `--skipo-*` theme variables.
   - Custom details panels not using `FloatingDetailsPanel` (missing 8-way resize, pinning, or persistent geometry).
   - Prohibited placeholder tokens (`"placeholder"`, `"lorem ipsum"`, mock telemetry, fake listings).
   - Files exceeding 200 lines or containing multiple component declarations.
   - Feature components missing companion `*.test.ts(x)` test suites.

---

## 1. THE 12 INVIOLABLE REFACTORING LAWS

Your refactoring MUST bring every file in the codebase into 100% compliance with these 12 Laws:

### Law 1: Component Inheritance & Zero-Custom-UI Mandate
- **BANNED**: Raw HTML `<button>`, `<input>`, `<select>`, `<textarea>`, unstyled `<div>` buttons, or ad-hoc custom UI button/tab abstractions.
- **MANDATORY**: Replace with `@skipo/ui` primitives:
  - `BaseButton`, `IconOnlyButton`
  - `BaseInput`, `CredentialField`, `BaseTextarea`, `BaseSelect`
  - `BaseCard`, `BaseBadge`, `BaseToggle`
  - Wrap views in `@skipo/ui` containers (`PageContainer`, `SectionContainer`, `SidebarContainer`, `SplitContainer`, `DrawerContainer`, `ModalContainer`, `AppShell`).

### Law 2: Single TopToolbar & Anti-Nested-Tabs Law
- The application MUST feature a single, unified `TopToolbar` (height: 44px) at the top of the viewport.
- Contains the application name/branding on the left and all primary application tabs in a single flat list.
- **Strict Invariant**: Zero nested tabs of any kind. All primary view navigation is flat at the top toolbar level. Creating secondary, nested, or inner tab bars inside panels, drawers, or views is strictly FORBIDDEN.

### Law 3: Dedicated Thin BottomStrip & Zero-Floating-Text Law
- Floating text bubbles, floating tooltips, and balloon popups are completely PROHIBITED.
- The app MUST include a thin `BottomStrip` (height: 30px) anchored at the bottom of the shell:
  - **Center**: Translucent, reactive inspection text describing any currently hovered or focused element (buttons, tabs, inputs, actions). Text smoothly fades in and out with CSS transitions.
  - **Bottom-Left**: App operational status lights (`StatusLight`) and controls like auto-save (`AutoSaveToggle`).
  - **Bottom-Right**: Active in-flight API call indicator (`ApiCallIndicator`) and system notifications (`SystemMessageDisplay`).
- The entire central viewport remains uncluttered and dedicated exclusively to the app UI.

### Law 4: Strict Icon-Only Action Buttons & Zero Explanatory Clutter
- Interactive action buttons, toolbars, and dock items MUST contain only monochromatic SVG glyphs without static text labels.
- Action names and utilities are revealed exclusively in the center of the bottom strip on hover/focus.
- Never clutter screens with tutorials, marketing paragraphs, or long descriptive copy.

### Law 5: External Credential Link Law
- Wherever an input field requests credentials from an external service (OpenAI, Anthropic, Google AI Studio, Backblaze B2, Cloudflare R2, AWS S3, Supabase, Neon, GitHub, etc.), it MUST use `CredentialField` and include a direct link button navigating directly to the web portal where the user can retrieve those credentials.

### Law 6: Portable Theme Pack Architecture
- All theming must cascaded via `<SkipoThemeProvider>` wrapping the root shell.
- All styles must consume standardized `--skipo-*` CSS variables:
  - Backgrounds: `--skipo-bg`, `--skipo-surface`, `--skipo-matte-bg`, `--skipo-matte-bg-hover`, `--skipo-matte-blur`
  - Text: `--skipo-text`, `--skipo-text-muted`, `--skipo-text-inverse`
  - Accents: `--skipo-accent`, `--skipo-accent-fg`, `--skipo-accent-glow`
  - Borders: `--skipo-border-color`, `--skipo-border`, `--skipo-border-input`, `--skipo-radius`, `--skipo-radius-sm`, `--skipo-radius-lg`
  - 2.5D Shadows: `--skipo-shadow`, `--skipo-shadow-hover`, `--skipo-shadow-btn`, `--skipo-shadow-btn-hover`, `--skipo-shadow-btn-active`
  - Status: `--skipo-success`, `--skipo-warning`, `--skipo-danger`, `--skipo-info`
  - Shell: `--skipo-top-toolbar-height` (44px), `--skipo-bottom-strip-height` (30px)
- **Forbidden**: Hardcoded hex/rgb color values or ad-hoc style classes bypassing `--skipo-*` tokens.

### Law 7: Universal Backend Separation
$$\text{Control Plane (User Auth / Config)} \cap \text{Data Plane (Workspace Storage)} = \emptyset$$
- Use `@skipo/backend/auth` for accounts, roles, and sessions.
- Use `@skipo/backend/storage` for workspace files and objects.

### Law 8: Compile-Time & Routine Structural Purity
1. Max 200 lines per file (hard limit for frontend and backend).
2. One component per file.
3. Top-level file purity (`App.tsx` / `index.tsx` contains only imports + single root composition).
4. Long, self-documenting naming conventions (zero cryptic abbreviations).

### Law 9: Details Panel Invariant (Draggable, 8-Way Resizable, Pinnable, Persistent)
- All element inspection (e.g. nodes in NodeGraph, entities, canvas elements, records) MUST use `FloatingDetailsPanel`.
- Must be resizable from all 4 corners (`nw`, `ne`, `se`, `sw`) and 4 edges (`n`, `s`, `e`, `w`).
- Must be draggable and placeable anywhere on the UI via its header.
- Must feature a Pin toggle button (`IconOnlyButton` with pin SVG).
  - When unpinned: focusing or selecting another element updates the details panel to that newly focused element.
  - When pinned: the panel remains locked to the pinned element even when other elements are focused.
- Geometry persistence: The position `(x, y)` and dimensions `(width, height)` of the details panel are shared and remembered across elements via `usePanelGeometry`. Opening a details panel for Node 2 after resizing/moving Node 1 opens it in the exact same position and size.

### Law 10: Anchored Output in `.gitignore`
$$\text{.gitignore pattern} \equiv /\text{dist/ } (\text{anchored}) \quad \text{NOT} \quad \text{dist/ } (\text{unanchored})$$
- Verify and enforce that root `.gitignore` anchors build outputs (`/dist/`, `/.next/`, `/out/`).
- Never allow unanchored `dist/`, which silently strips pre-bundled sub-package assets in monorepos.

### Law 11: Absolute Zero-Placeholder & Real-Data Invariant
The AI agent is STRICTLY FORBIDDEN from generating or leaving placeholder entries of any kind:
- **BANNED**: Fake computational outputs, stubbed metrics, synthetic charts, hardcoded dummy arrays (`[{ id: 1, name: 'Item 1' }]`), mock user lists, fake product cards.
- **BANNED TOKENS**: `"placeholder"`, `"lorem ipsum"`, `"mock"`, `"dummy"`, `"test user"`, `"sample item"`.
- **MANDATORY**:
  - Connect to real backend endpoints, real database tables, or real hardware telemetry.
  - When data is absent or unconfigured, render an explicit `@skipo/ui` `<EmptyState>` with a configuration/retry action, or an informative error alert (`CopyableErrorAlert`).
  - NEVER synthesize fake data to simulate completeness.

### Law 12: Mandatory End-to-End Verification & Debugging Gate
The AI agent MUST NEVER declare a refactor "complete" without running and debugging automated verification:
$$\text{Refactor Status} = \text{DONE} \iff \text{All Features Have Tests} \wedge \text{All Tests Pass (exit 0)} \wedge \text{Zero AST Violations}$$
1. `pnpm typecheck`: 0 TypeScript compilation errors across all packages.
2. `pnpm test`: Execute all Vitest test suites. Any failure must be debugged immediately.
3. `npx skipo-validate`: Run AST validation gate (`no-placeholder-data`, `feature-test-coverage`, `theme-token-semantics`, `ui-invariants`).
4. Output test and validation logs to the user as verifiable evidence of operational readiness.

---

## 2. STEP-BY-STEP EXECUTION PLAYBOOK

Follow this exact phase sequence to perform the refactor:

```
[Phase 1: Dependencies & Configuration]
  ├── Update package.json to point to the latest @skipo/* packages from Skipo/packages
  ├── Update root and package tsconfig.json to match Skipo tsconfig standards
  └── Ensure .gitignore has anchored output (/dist/, /.next/)

[Phase 2: Root Shell & Theming Layer]
  ├── Wrap root app in <SkipoThemeProvider>
  ├── Refactor layout shell to use TopToolbar (flat tabs, zero nested tabs)
  ├── Mount BottomStrip (30px) with BottomStripContext provider
  └── Delete all floating tooltips / balloon popovers and route hover copy to BottomStripContext

[Phase 3: Component Primitives Migration]
  ├── Replace all raw <button> with BaseButton or IconOnlyButton
  ├── Replace all raw <input> with BaseInput or CredentialField
  ├── Replace all bespoke cards/dialogs with BaseCard / ConfirmDialog / ModalContainer
  └── Replace all entity inspectors with FloatingDetailsPanel (8-way resize + pinning + geometry)

[Phase 4: Design Token Purity Audit]
  ├── Scan for hardcoded hex/rgb color codes in CSS/TSX
  ├── Replace every color code with corresponding var(--skipo-*) token
  └── Verify both dark and light mode rendering

[Phase 5: Zero-Placeholder & Real Data Sanitation]
  ├── Search for "placeholder", "lorem ipsum", "mock", "dummy"
  ├── Replace mock listings with real API queries or <EmptyState>
  └── Replace fake telemetry charts with real stream subscriptions or <EmptyState>

[Phase 6: Structural Purity & Decomposition]
  ├── Scan all files for > 200 lines
  ├── Decompose large components into sub-components, hooks, and types
  └── Ensure top-level files (App.tsx) contain only imports and root composition

[Phase 7: Test Coverage & Verification Gate]
  ├── Author companion *.test.ts(x) for any feature module lacking tests
  ├── Run pnpm typecheck (must pass with 0 errors)
  ├── Run pnpm test (all tests must pass)
  └── Run npx skipo-validate (must pass gate with exit code 0)
```

---

## 3. PROMPT USAGE

When dispatching an AI coding agent to perform the refactor, invoke the agent with:

```text
The Skipo folder in this repository has been updated with the latest architectural standards, UI components, and validation rules.

Perform a full codebase refactor to align the entire application to the updated Skipo standards.
Strictly adhere to the protocol attached below.

---
[PASTE CONTENTS OF TASK_UPDATE_TO_SKIPO_STANDARDS.md HERE]
```
