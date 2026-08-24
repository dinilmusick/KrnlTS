---
name: architecture-sub-router
description: Sub-router directing agents deterministically to modular architecture sub-skills for 5-turn architectural audits, 4-layer function purity, Entity-Functionality hierarchies, {Name}Concepts libraries, and deduplication.
---

# ARCHITECTURE AGENT SUB-ROUTER

## 1. ARCHITECTURE DOMAIN ROUTING TABLE
When designing, structuring, or refactoring codebase modules, consult the specific sub-skill:

| Architecture Domain | Target Sub-Skill File | Key Directives Covered | Trigger Keywords |
| :--- | :--- | :--- | :--- |
| **5-Turn Architectural Audit** | [`deduplication/SKILL.md`](./deduplication/SKILL.md) | Mandatory 5-turn review & auto-remediation: Entity-Functionality compliance, struct/function deduplication, 4-layer purity & zero-intermixing enforcement | `5_turn_audit`, `audit_remediation`, `fix_deviations`, `every_5_turns`, `deduplicate_structs`, `unify_functions` |
| **Function Purity & 4-Layer Flow** | [`function-layers/SKILL.md`](./function-layers/SKILL.md) | Pure functions (no imports/state), State accessors, Simple impure, Complex impure, Top-level API; zero layer bypassing | `pure_function`, `state_accessor`, `impure_function`, `complex_impure`, `api_wrapper`, `function_layering` |
| **Entity & Functionality Structure** | [`entity-functionality/SKILL.md`](./entity-functionality/SKILL.md) | KrnlTS-compatible quad-units (`main_function/`, `state_data/`, `helper_functions/`, `events/`, `manifest.json`), recursive Entity tree, System Entity | `create_feature`, `structural_change`, `entity_hierarchy`, `system_entity`, `helpers_events_state` |
| **Libraries & Concepts** | [`libraries-concepts/SKILL.md`](./libraries-concepts/SKILL.md) | `libraries/` directory at System Entity level, `{Name}Concepts` naming convention, universal shared data structs & utilities | `shared_utilities`, `common_structs`, `libraries_folder`, `concept_file` |
| **Skeleton + Components** | [`skeleton-components/SKILL.md`](./skeleton-components/SKILL.md) | `Entity<TState, TEvents>` Skeletons = Impure Orchestrators (`@role skeleton`), Components = Pure/Atomic (`@role component`) | `define_entity`, `add_behavior`, `skeleton`, `component_composition`, `design_pattern` |
| **Code Limits & Sizing** | [`code-limits/SKILL.md`](./code-limits/SKILL.md) | 200 lines/file max, $\le 30$ lines in helpers before concept delegation, $\le 20$ lines in main before helper delegation | `file_size`, `line_limit`, `refactor_monolith`, `200_lines` |
| **Sub-App Engine Authoring** | [`sub-app-engine/SKILL.md`](./sub-app-engine/SKILL.md) | 100% drag-and-drop KrnlTS sub-app compatibility, zero-server rule, `subapp.json`, `register.ts`, pure operations | `subapp_engine`, `subapp_authoring`, `drag_and_drop_app`, `engine_wrapper`, `subapp_json`, `register_entry` |

---

## 2. DETERMINISTIC ARCHITECTURE DISPATCH LOGIC
```python
def dispatch_architecture_task(task_type: str) -> str:
    mapping = {
        "deduplication": ["5_turn_audit", "audit_remediation", "fix_deviations", "every_5_turns", "deduplicate_structs", "unify_functions"],
        "function-layers": ["pure_function", "state_accessor", "impure_function", "complex_impure", "api_wrapper", "function_layering"],
        "entity-functionality": ["create_feature", "structural_change", "entity_hierarchy", "system_entity", "helpers_events_state"],
        "libraries-concepts": ["shared_utilities", "common_structs", "libraries_folder", "concept_file"],
        "skeleton-components": ["define_entity", "add_behavior", "skeleton", "component_composition", "design_pattern"],
        "code-limits": ["file_size", "line_limit", "refactor_monolith", "200_lines"],
        "sub-app-engine": ["subapp_engine", "subapp_authoring", "drag_and_drop_app", "engine_wrapper", "subapp_json", "register_entry"]
    }
    for subskill, keywords in mapping.items():
        if any(kw in task_type.lower() for kw in keywords):
            return f"./{subskill}/SKILL.md"
    return "./entity-functionality/SKILL.md"  # Default fallback for new structures
```
