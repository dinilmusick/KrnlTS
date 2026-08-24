---
name: skeleton-components-architecture
description: Directives for Skeleton + Components architecture, using inheritance for structural entity shape and composition for atomic behavior.
---

# SKELETON + COMPONENTS ARCHITECTURE GUIDELINES

## 1. CORE ARCHITECTURAL AXIOM
```
Inheritance defines WHAT AN ENTITY IS   (Structural Shape / Skeleton)
Composition defines WHAT AN ENTITY DOES (Atomic Behavior / Component)
```

---

## 2. CODE TAXONOMY & CLASSIFICATION

Every file in the codebase belongs strictly to one of two categories:

### A. Skeletons (Orchestrators — Always Impure)
- **Role Tag**: `/** @role skeleton */`
- **Definition**: Define structural shape, lifecycle, and data backbone.
- **Classes & Files**:
  - `Entity<TState, TEvents>` subclasses (e.g. `class BillingEntity extends Entity<BillingState, BillingEvents>`).
  - Functionality entrypoints (`main_function/logic.ts`).
  - Execution Flows (`KrnlFlowBuilder`).
- **Inheritance Constraint**: Shallow inheritance ($\text{depth} \le 3$: `krnlEntityBase` $\to$ `Entity<TState, TEvents>` $\to$ `DomainEntity`).
- **Impurity Invariant**: Skeletons MUST be impure orchestrators coordinating underlying components, updating state, and emitting events. Pure skeletons are strictly forbidden.

### B. Components (Atomic Behavioral Units — Pure or State Accessors)
- **Role Tag**: `/** @role component */`
- **Definition**: Small, atomic, single-purpose units of behavior, calculations, or schemas.
- **Classes & Files**:
  - `helper_functions/*.ts` (Layer 0A pure calculations).
  - `libraries/{Domain}Concepts.ts` (Universal polymorphic template algorithms).
  - `state_data/state.ts` (Layer 0B state accessors).
  - `events/*.ts` (Event emitters).
- **Purity Invariant**: Helper components MUST be 100% pure and stateless.

---

## 3. PRE-IMPLEMENTATION DECISION FLOW
```python
def classify_implementation(task_feature):
    if task_feature.is_structural_entity_shape:
        # What the entity IS -> Skeleton
        create_or_extend_skeleton(
            base_class="Entity<TState, TEvents>",
            pattern="inheritance",
            max_hierarchy_depth=3,
            focus="lifecycle_and_core_schema"
        )
    elif task_feature.is_atomic_behavior_or_action:
        # What the entity CAN DO -> Component
        check_existing_concept_libraries_for_duplicates()
        create_or_reuse_component(
            pattern="composition",
            focus="single_responsibility_atomic_behavior"
        )
```

---

## 4. DESIGN ENFORCEMENT RULES
- **Continuous Reuse**: Check `libraries/{Domain}Concepts.ts` before authoring new logic units.
- **Separation of Concerns**: Skeletons must remain clean orchestrators without raw inline math or regex clutter.
- **Zero Duplication**: Shared behaviors across divergent skeletons must be factored into isolated concept functions.
