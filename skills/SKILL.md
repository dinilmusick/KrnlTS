---
name: skipo-agent-router
description: Master router and deterministic dispatcher directing the AI agent to modular sub-skills across UI, API, Data, Database, Architecture, Features, and Docs.
---

# AGENT MASTER ROUTER & DISPATCH DIRECTORY

## 1. MANDATORY PRE-ACTION ROUTING PROTOCOL
```
∀ task ∈ Agent_Actions:
  1. Inspect workspace to detect Runtime Extensions:
     if (has_dependency("@dinilmusick/krnlts") ∨ file_exists("krnl.json") ∨ has_import("@dinilmusick/krnlts")):
         load_skill("./krnlts/SKILL.md")  # Load KrnlTS Runtime Subsystem Extensions
  2. Classify task intent(s) into Domain(s).
  3. Consult corresponding leaf SKILL.md before proposing or writing code.
  4. If task spans multiple domains, load all relevant skills in dependency order:
     [ Backend / Database -> Architecture -> KrnlTS -> Data -> API -> UI -> Features -> Docs ]
  5. Abide strictly by the loaded skill constraints.
```

---

## 2. DOMAIN ROUTING & INTENT MATRIX

| Task Intent / Keywords | Target Skill / Sub-Router | Core Directives & Constraints |
| :--- | :--- | :--- |
| `universal_backend`, `control_plane`, `data_plane`, `workspace_storage`, `local_fs`, `local_hosted`, `remote_backend`, `admin_auth`, `vercel_backend`, `decoupled_storage` | [`backend/SKILL.md`](./backend/SKILL.md) | Universal Backend Architecture: Control Plane vs Data Plane separation, 3 Storage Modes (Local FS, Local-Hosted, Remote BaaS), Decoupled Data/Storage providers, Admin authorization, Vercel/Desktop readiness |
| `theme`, `colors`, `biome`, `parallax`, `particles`, `scrollbars`, `dropdowns` | [`ui/styling/SKILL.md`](./ui/styling/SKILL.md) | Neo-brutalism 2.5D biome, locked coffee/black-gold palettes, custom scrollbars, top-edge downward tooltips |
| `dock_toolbar`, `window_switcher`, `auto_hide`, `dock_position`, `main_toolbar` | [`ui/dock-toolbar/SKILL.md`](./ui/dock-toolbar/SKILL.md) | macOS-style main window switcher dock, 4-edge positioning (top/bottom/left/right), auto-hide trigger zone, icon-only |
| `tiled_menu`, `dnd_kit`, `tile_grid`, `icon_only`, `hover_tooltip` | [`ui/tiled-menus/SKILL.md`](./ui/tiled-menus/SKILL.md) | `@dnd-kit` sortable tiles, icon-only (zero persistent text), hover tooltips (top-edge elements pop downward) |
| `button_logic`, `form_submit`, `input_wiring`, `input_empty_state`, `form_validation`, `ui_stub` | [`ui/wiring/SKILL.md`](./ui/wiring/SKILL.md) | Mandatory backend wiring, zero unlinked UI stubs, anti-polling reactivity, input empty-state buffering & blur validation |
| `tag_canvas`, `force_graph`, `simulation_physics`, `vsync_scheduler`, `dpr_cap` | [`ui/force-graph/SKILL.md`](./ui/force-graph/SKILL.md) | Physics optimizations (alphaDecay 0.08, charge -70), single-frame VSync, 2x DPR |
| `node_graph`, `react_flow`, `connect_nodes`, `wire_drag`, `auto_spawn`, `context_menu` | [`ui/react-flow/SKILL.md`](./ui/react-flow/SKILL.md) | Middle-mouse pan, box select, scroll zoom, wire drag auto-spawn, full hotkeys, context menu only (zero tutorial/button clutter) |
| `pure_function`, `state_accessor`, `impure_function`, `complex_impure`, `layer_flow` | [`architecture/function-layers/SKILL.md`](./architecture/function-layers/SKILL.md) | 4-layer purity flow (Pure/State -> Impure -> Complex Impure -> API), zero layer bypassing |
| `create_feature`, `entity_structure`, `quad_unit`, `system_entity`, `helpers_events` | [`architecture/entity-functionality/SKILL.md`](./architecture/entity-functionality/SKILL.md) | KrnlTS quad-units, recursive Entity tree, strict event-driven communication (zero onTick/polling loops) |
| `shared_utils`, `canonical_structs`, `concept_file`, `libraries_folder` | [`architecture/libraries-concepts/SKILL.md`](./architecture/libraries-concepts/SKILL.md) | `libraries/{Domain}Concepts.ts` at system root level with uniform polymorphic generic templates |
| `5_turn_audit`, `deduplicate_structs`, `unify_functions`, `remediate_deviations` | [`architecture/deduplication/SKILL.md`](./architecture/deduplication/SKILL.md) | 5-turn periodic audit: KrnlTS quad-unit compliance, deduplication, 4-layer purity, anti-polling audit |
| `skeleton`, `structural_entity`, `component_composition`, `behavioral_unit` | [`architecture/skeleton-components/SKILL.md`](./architecture/skeleton-components/SKILL.md) | `Entity<TState, TEvents>` Skeletons = Impure Orchestrators (`@role skeleton`), Components = Pure/Atomic (`@role component`) |
| `file_length`, `line_limit`, `split_file`, `atomic_sizing`, `200_lines` | [`architecture/code-limits/SKILL.md`](./architecture/code-limits/SKILL.md) | 200 lines/file max, $\le 30$ lines in helpers before concept delegation, $\le 20$ lines in main before helper delegation |
| `subapp_engine`, `subapp_authoring`, `drag_and_drop_app`, `engine_wrapper`, `subapp_json` | [`architecture/sub-app-engine/SKILL.md`](./architecture/sub-app-engine/SKILL.md) | 100% drag-and-drop KrnlTS sub-app compatibility, zero-server rule, `subapp.json`, `register.ts`, pure operations |
| `krnlts`, `krnl_entity`, `magnetic_loader`, `flow_builder`, `krnl_tools`, `krnlts_validate`, `subapp_worker` | [`krnlts/SKILL.md`](./krnlts/SKILL.md) | KrnlTS runtime library extensions (`loadAll`, `Entity<TState, TEvents>`, flows, port gateway, `KrnlFS`, `krnlts-validate`) |
| `create_endpoint`, `expose_api`, `rpc_surface`, `external_trigger_ui_sync` | [`api/SKILL.md`](./api/SKILL.md) | Feature-to-API parity, external calls trigger visible UI state, zero phantom calls |
| `fetch_data`, `zero_mock`, `real_backend`, `error_state_render`, `ai_provider` | [`data/SKILL.md`](./data/SKILL.md) | Zero fake/mock data, explicit error states, user-specified AI providers only |
| `configure_db`, `sqlite_wal`, `postgres_supabase_ssl`, `firebase_mongo`, `test_db` | [`database/SKILL.md`](./database/SKILL.md) | Settings modal database tab, multi-engine support, `/api/database/test` latency ping |
| `major_change`, `refactor_feature`, `delete_feature`, `purge_pipeline`, `deprecate_flow` | [`features/SKILL.md`](./features/SKILL.md) | Incremental evolution (never nuke/rewrite from scratch on big changes), 100% complete zero-trace feature purge (zero zombie/commented code) |
| `update_docs`, `document_endpoint`, `sync_skills`, `project_history`, `pre_refactor_memory` | [`docs/SKILL.md`](./docs/SKILL.md) | Chronological user intent tracking in `docs/HISTORY.md`, pre-refactor memory refresh, continuous skill/API sync |

---

## 3. DETERMINISTIC AGENT DISPATCH PIPELINE
```python
def resolve_and_execute(task_intent: str, modified_domains: list[str]):
    # Step 1: Detect KrnlTS library presence
    is_krnlts = has_dependency("@dinilmusick/krnlts") or file_exists("krnl.json") or has_import("@dinilmusick/krnlts")

    # Step 2: Resolve all required leaf skills
    leaf_skills = []
    if is_krnlts:
        leaf_skills.append(resolve_krnlts_subskill(task_intent))

    for domain in modified_domains:
        if domain == "BACKEND":
            leaf_skills.append(resolve_backend_subskill(task_intent))
        elif domain == "UI":
            leaf_skills.append(resolve_ui_subskill(task_intent))
        elif domain == "ARCHITECTURE":
            leaf_skills.append(resolve_architecture_subskill(task_intent))
        elif domain in ["API", "DATA", "DATABASE", "FEATURES", "DOCS"]:
            leaf_skills.append(f"./{domain.lower()}/SKILL.md")

    # Step 3: Enforce dependency-ordered skill inspection
    order = ["backend", "database", "architecture", "krnlts", "data", "api", "ui", "features", "docs"]
    ordered_skills = sorted(leaf_skills, key=lambda path: next((i for i, k in enumerate(order) if k in path), 99))

    # Step 4: Load constraints and execute
    for skill_path in ordered_skills:
        load_directives(skill_path)

    execute_code_generation_under_constraints()
```

---

## 4. GLOBAL OUTPUT PREFERENCES
- **Style**: Minimal natural language. Prefer mathematics, pseudocode, graphs, flowcharts, and vector-space representations.
- **Acronyms**: Fully expand all acronyms on first reference.
- **Veracity**: Science-based and empirically verifiable claims only.
- **Summaries**: Provide a formal summarizing function per phenomenon or complex architecture discussed.
- **Code**: Terse, direct to the point, zero fluff.
