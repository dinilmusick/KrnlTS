---
name: architecture-5turn-audit-guidelines
description: Mandatory 5-turn periodic audit to identify and remediate deviations in Entity-Functionality structures, deduplication, and 4-layer function isolation.
---

# 5-TURN PERIODIC ARCHITECTURAL AUDIT & CONVERGENCE

## 1. 5-TURN AUDIT CADENCE TRIGGER
```
CADENCE_TRIGGER:
  ∀ turn_count ≡ 0 (mod 5):
    executeFullArchitecturalAudit(scope = ALL_PROJECT_FILES)
```
- **Mandate**: Every 5 turns of active editing, the AI agent MUST perform an automated review across the codebase and automatically refactor any architectural deviations back into full compliance.

---

## 2. 4-PILLAR ARCHITECTURAL AUDIT CHECKLIST

### Pillar I: Entity & Functionality Quad-Unit Structure Audit
- [ ] Every entity resides in `entities/<EntityName>/` with `<EntityName>.ts` (`@role skeleton`).
- [ ] Every feature resides in `entities/<EntityName>/functionalities/<FeatureName>/`.
- [ ] Each functionality contains:
  - `main_function/logic.ts` (`@role skeleton`, receiving `(input, { state, entity })`)
  - `state_data/state.ts` (`@role component`)
  - `helper_functions/` (`@role component`)
  - `events/` (`@role component`)
  - `manifest.json` (declared dependencies)
- [ ] Public features are exposed at the System Entity entrypoint (`assembler.ts` / `index.ts`).
- **Action on Deviation**: Reorganize loose files into KrnlTS quad-unit folders and register them in the entity orchestrator.

### Pillar II: Data Struct & Signature Deduplication Audit
- [ ] Data structures with overlap $S_{\text{struct}}(A, B) \ge 0.65$ folded into a base parent in `libraries/{Domain}Concepts.ts`.
- [ ] Functions with identical input/output signatures unified into polymorphic generic template functions (`<TIn, TOut>`).
- **Action on Deviation**: Extract common parents to `libraries/{Domain}Concepts.ts`.

### Pillar III: Function Layer Purity & Intermixing Audit
- [ ] Strict unidirectional flow: $\text{Layer 0 (Pure/State)} \to \text{Layer 1 (Impure)} \to \text{Layer 2 (Complex Impure)} \to \text{Layer 3 (API)}$.
- [ ] Zero inline pure calculations or complex regex inside Impure functions (Layer 1).
- [ ] Zero calls from Complex Impure (Layer 2) or Top-Level API (Layer 3) to Pure Functions (Layer 0) or State Accessors directly.
- **Action on Deviation**: Extract inline math to `helper_functions/` (Layer 0A); replace skipped layer calls with intermediate Layer 1 step functions.

### Pillar IV: Skeletons, Components & Multi-Tier Line Limits Audit
- [ ] All files comply with the 200-line strict limit (`lines(f) <= 200`).
- [ ] Helper functions in `helper_functions/` do not exceed 30 lines without calling `libraries/{Domain}Concepts.ts`.
- [ ] Main functions in `main_function/logic.ts` do not exceed 20 lines without delegating to `helpers/` or state accessors.
- [ ] Files tagged `@role skeleton` are impure orchestrators; files tagged `@role component` are pure or atomic accessors.
- **Action on Deviation**: Split bloated files ($> 200$ lines), extract helper logic, and enforce role purity.

### Pillar V: Event-Driven vs. Polling/onTick Audit
- [ ] Zero `onTick()`, `tick()`, or continuous RAF loops running while idle.
- [ ] Zero `setInterval()` / `setTimeout()` busy polling loops for state, IPC, or database checks.
- [ ] State changes communicate reactively via `entity.emitEvent()`, `entity.on()`, `state:changed`, or WebSocket/SSE streams.
- **Action on Deviation**: Refactor polling loops into reactive event subscriptions or push listeners.

---

## 3. AUDIT & REMEDIATION ALGORITHM
```python
def run_5_turn_architectural_audit():
    """
    Automated 5-Turn Self-Correction Loop
    """
    # 1. Audit Structure
    for feature in scan_features():
        if not is_krnlts_quad_unit_structured(feature):
            remediate_to_krnlts_quad_unit(feature)
            
    # 2. Audit Deduplication
    struct_pairs = find_similar_structs(threshold=0.65)
    for A, B in struct_pairs:
        extract_to_concept_library(A, B)
        
    fn_clusters = cluster_by_signature_similarity()
    for cluster in fn_clusters:
        unify_into_generic_template_function(cluster)
        
    # 3. Audit Layer Intermixing
    for fn in scan_all_functions():
        if fn.is_impure and has_inline_pure_calculations(fn):
            extract_to_helper_functions_layer_0(fn)
        if fn.is_complex_impure_or_api and calls_layer_0_directly(fn):
            route_through_intermediate_layer_1(fn)
            
    # 4. Audit Line Limits & Delegation Thresholds
    for f in scan_modified_files():
        if line_count(f) > 200:
            split_into_atomic_modules(f)
        for helper in get_helpers(f):
            if line_count(helper) > 30:
                delegate_to_concept_library(helper)
        for main_fn in get_main_logics(f):
            if line_count(main_fn) > 20:
                delegate_to_helpers(main_fn)

    # 5. Audit Polling & onTick Violations
    for f in scan_all_files():
        if has_polling_or_ontick_loop(f):
            refactor_to_event_driven_subscription(f)
```
