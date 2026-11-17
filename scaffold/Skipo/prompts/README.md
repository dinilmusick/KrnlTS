# Skipo Modular Prompts & Architectural Validators

This directory contains **copy-paste-ready prompt files** for AI coding agents. Each prompt targets a specific constraint domain. Spamming the agent with these prompts repeatedly pushes the codebase progressively into full Skipo compliance.

> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY SYSTEM PURGE ($\mathbf{L_{21}}$)**:
> In every task prompt and execution phase, any legacy, bespoke, or obsolete systems found in the target codebase that compete with, duplicate, or bypass Skipo systems (e.g. ad-hoc theming/color pickers, custom tabs/tooltips, local SQLite/JSON credentials, mock data generators, custom unstyled buttons/inputs, or old state managers) **MUST BE COMPLETELY AND UNCONDITIONALLY PURGED WITH ZERO TRACE LEFT BEHIND**. No commented-out legacy code, no deprecated adapters, and no dual-running systems are tolerated. The Skipo canonical implementation must be the sole mechanism.

All code generation and refactoring operations are verified by executable Python 3 validators in `checklists/` and run via `assistant.py validate .`.

---

## 1. Architectural Validator Map (`checklists/`)

Each validator enforces exactly one architectural pillar. Run them individually via `python3 assistant.py validate . --aspect <id>` or all at once via the master validator.

| Aspect ID | Validator Script | What It Enforces |
| :--- | :--- | :--- |
| `aspect_01` | `checklists/01_structure_governance.py` | Plane isolation (`src/frontend`, `src/backend`, `packages/*`), anchored `.gitignore` (`/dist/`, `/.next/`) |
| `aspect_02` | `checklists/02_ui_primitives_themes.py` | Zero raw `<button>`/`<input>`, 100% `@skipo/ui` primitives, 100% `var(--skipo-*)` tokens |
| `aspect_03` | `checklists/03_layout_shell_invariants.py` | Single flat `TopToolbar` (44px), `BottomStrip` (30px), zero floating tooltip bubbles |
| `aspect_04` | `checklists/04_code_limits_purity.py` | ≤200 lines/file, one component/file, wrapper-only `App.tsx`, ASCII flowchart docblocks |
| `aspect_05` | `checklists/05_real_data_anti_mock.py` | Zero fake arrays, zero `"placeholder"` tokens, real drivers or `<EmptyState>` |
| `aspect_06` | `checklists/06_anti_stub_asset_depth.py` | Zero empty functions/TODO stubs, ≥2 real statements/function, real SDK usage |
| `aspect_07` | `checklists/07_backend_storage_isolation.py` | Control Plane ∩ Data Plane = ∅, direct presigned uploads, zero `/tmp` proxying |
| `aspect_08` | `checklists/08_api_security_governance.py` | 8-gate `createSecureRoute` pipeline, sliding-window rate limits, anti-burst, sanitized errors |
| `aspect_09` | `checklists/09_test_coverage_integrity.py` | Companion `*.test.ts(x)` for every module, zero trivial `expect(true).toBe(true)` stubs |
| `aspect_10` | `checklists/10_app_architecture_spec_validator.py` | 4-plane structure (`src/{frontend,backend,libraries,frontend-state}`), single facade, root preservation |
| `aspect_11` | `checklists/11_multi_target_build_spec_validator.py` | `fullstack.json`, `api.json`, `httpsAdapter.ts`, environment-agnostic orchestrations |
| `aspect_12` | `checklists/12_serverless_deployment_limits.py` | `output: 'standalone'`, ≤50MB serverless functions, devDeps isolation, zero media in API routes |
| `aspect_13` | `checklists/13_state_execution_governance.py` | SKIPO_STATE (Zustand) explicit lifecycles, BullMQ command boundary, Worker-only facade |
| **MASTER** | `checklists/full_system_validator.py` | All 13 aspects in sequence → executive scorecard → exit code |

---

## 2. Spam Prompt Matrix — Full Coverage

Each row below is one prompt file that can be blindly copy-pasted to a coding agent. Together they cover **all 13 validator aspects with no gaps or overlaps**. The recommended spam order runs from most structural to most specific.

| Spam Order | Prompt File | Aspects Covered | Exclusive Scope |
| :---: | :--- | :---: | :--- |
| **0** (once only) | [`TASK_UPDATE_TO_SKIPO_STANDARDS.md`](./TASK_UPDATE_TO_SKIPO_STANDARDS.md) | 01–09 broad | **First-run onboarding only.** Runs all 7 phases end-to-end for a codebase being brought in for the first time. After this, use the domain prompts below. |
| **1** | [`TASK_CODEBASE_STRUCTURE_ENFORCEMENT.md`](./TASK_CODEBASE_STRUCTURE_ENFORCEMENT.md) | 01, 04, 06 | Plane isolation, ≤200-line limit, purity DAG, root isolation, design token purity, UI primitive purity, naming conventions, anti-stub, library isolation (L20). |
| **2** | [`TASK_UI_COMPONENT_FRONTEND.md`](./TASK_UI_COMPONENT_FRONTEND.md) | 02, 03, 04 | `@skipo/ui` primitive composition, `var(--skipo-*)` tokens, `TopToolbar`, `BottomStrip`, `FloatingDetailsPanel`, 4-word label cap, icon-only buttons. |
| **3** | [`TASK_BACKEND_STORAGE.md`](./TASK_BACKEND_STORAGE.md) | 07 | Workspace filesystem storage, `WorkspaceFS`, `SyncEngine`, multi-cloud adapters (Local FS, B2, R2, S3), Control Plane DB separation. |
| **4** | [`TASK_SECURITY_AND_SESSION_INFRASTRUCTURE.md`](./TASK_SECURITY_AND_SESSION_INFRASTRUCTURE.md) | 08 (auth) | Auth sessions, token rotation, theft detection, progressive trust tiers, 8-gate `createSecureRoute` wrapper **structure**. |
| **5** | [`TASK_USAGE_THROTTLING_AND_BURST_PROTECTION.md`](./TASK_USAGE_THROTTLING_AND_BURST_PROTECTION.md) | 08 (burst) | Client-side burst patterns, stream reconnection circuit-breakers, debounce invariants, visibility-pause, polling limits. |
| **6** | [`TASK_DATA_TESTS_AND_BUILD.md`](./TASK_DATA_TESTS_AND_BUILD.md) | 05, 09, 10, 11, 12 | Real data / anti-mock, companion test authoring, 4-plane app architecture spec, multi-target build (`fullstack.json`, `api.json`, `httpsAdapter.ts`), serverless size limits. |
| **7** | [`TASK_NODE_GRAPH_IMPLEMENTATION.md`](./TASK_NODE_GRAPH_IMPLEMENTATION.md) | Node graph | Content-driven node body (no clipping), all mouse controls (pan/zoom/drag/box-select/wire/context menu), keyboard shortcuts, socket system, bezier wire rendering, node spawning, selection, smooth pan, file decomposition. |
| **8** | [`TASK_ROUTINE_CLEANUP_AND_DEDUPLICATION.md`](./TASK_ROUTINE_CLEANUP_AND_DEDUPLICATION.md) | Dead Code & Clones | Routine cleanup: unimported orphaned file purge, zero-usage export elimination, multi-dimensional similarity analysis ($S \ge 0.80$), canonical asset consolidation, and global reference substitution. |
| **9** | [`TASK_STATE_EXECUTION_ARCHITECTURE.md`](./TASK_STATE_EXECUTION_ARCHITECTURE.md) | 13 | State & Execution governance: `SKIPO_STATE` (Zustand), explicit lifecycle DAG, `SKIPO_COMMAND` BullMQ boundary, Worker-only Backend Facade, and Operation Components. |
| **10** | [`TASK_THEME_SYSTEM_AND_THEME_BROWSER.md`](./TASK_THEME_SYSTEM_AND_THEME_BROWSER.md) | 02, Theme System | Plug & Socket Theme Architecture: System bucket theme packs, ThemeEngine runtime, AppThemeSocket, per-element overrides, Theme Browser UI & legacy purge. |


### How to Spam

For a codebase that still has gaps:

```bash
# Spam order: send prompt 1 first, wait for agent to finish, then send 2, etc.
# After each prompt, verify progress:
python3 assistant.py validate .

# Full compliance = all aspects pass + tests pass:
python3 assistant.py validate . && pnpm test && pnpm typecheck
```

Each prompt is fully self-contained — no external context needed. The agent reads the prompt, runs the validator for its aspect(s), fixes violations, and re-runs until clean.

---

## 3. Mutator Reference — Auto-Remediation

Mutators fix whole classes of violations automatically. Always run the corresponding validator after each mutator to confirm the fix.

| `assistant.py` Command | What It Fixes | Validator to Run After |
| :--- | :--- | :--- |
| `python3 assistant.py mutate planes <dir>` | Reorganizes flat `src/` into `src/frontend/`, `src/backend/` planes | `--aspect aspect_01` |
| `python3 assistant.py mutate sections <dir>` | Injects ASCII section banners (`// ═════`) into all files | `--aspect aspect_04` |
| `python3 assistant.py mutate tokens <dir>` | Replaces hardcoded hex/rgb colors with `var(--skipo-*)` tokens | `--aspect aspect_02` |
| `python3 assistant.py mutate split <file>` | Splits files >200 lines into compliant sub-files | `--aspect aspect_04` |
| `python3 assistant.py mutate naming <dir>` | Enforces naming conventions and purity suffixes | `--aspect aspect_04` |
| `python3 assistant.py mutate all <dir>` | Runs all four mutators in sequence | Full: `python3 assistant.py validate .` |
| `python3 assistant.py cleanup <dir>` | Scans for dead/unimported assets & redundant clones ($\ge 80\%$) | `--aspect aspect_04`, `pnpm test` |


---

## 4. Generator Reference — Scaffold Compliant Artifacts

Generators scaffold complete, validator-compliant multi-file suites. They auto-delete generated output if the post-generation validator fails.

| `assistant.py` Command | Generates | Validator Enforced |
| :--- | :--- | :--- |
| `generate structure <path>` | 4-plane directory tree + plane READMEs | aspect_01, aspect_10 |
| `generate component <path> --name <N>` | `<N>.tsx`, `<N>.types.ts`, `<N>.test.tsx` | aspect_02, aspect_04, aspect_09 |
| `generate shell <path>` | `TopToolbar`, `BottomStrip`, `AppShell` | aspect_03 |
| `generate entity <path> --name <N>` | Schema, types, store, EmptyState quad | aspect_05, aspect_06 |
| `generate service <name>` | 7-file service suite, auto-registers facade | aspect_06 |
| `generate storage <path>` | `WorkspaceFS`, adapters, `SyncEngine` | aspect_07 |
| `generate route <name>` | 8-gate secure route + Zod schemas + test | aspect_08, aspect_09 |
| `generate test <path> --name <N>` | Companion `*.test.ts` with real assertions | aspect_09 |
| `generate nodegraph <path> --name <N>` | Full node graph suite (canvas, cards, wires) | aspect_01, aspect_04 |
| `generate app-structure <path> --name <N>` | Full 4-plane app with facade + libraries | aspect_10 |
| `generate build <path> --name <N>` | `fullstack.json`, `api.json`, `httpsAdapter.ts` | aspect_11 |
| `generate subapp <path> --name <N>` | Complete sub-app directory tree | aspect_10, aspect_11 |

---

## 5. Master Gate — Run Before Every Commit

```bash
# Full system compliance verification (all 12 aspects)
python3 assistant.py validate .

# Purity & DAG audit
python3 assistant.py audit .

# Tests
pnpm test

# TypeScript
pnpm typecheck

# Library sync (if Skipo/ was updated)
python3 assistant.py sync-libraries . --auto-fix
```

Exit code 0 on `validate` + `pnpm test` passing = turn complete. No exceptions.
