---
name: skeleton-components-architecture
description: Directives for Skeleton + Components architecture, using ServiceFacade and Orchestration for structural shape and composition for atomic behavior.
---

# SKELETON + COMPONENTS ARCHITECTURE GUIDELINES

## 1. CORE ARCHITECTURAL AXIOM
```
Structure defines WHAT A SERVICE IS   (ServiceFacade / Orchestration / Skeleton)
Composition defines WHAT A SERVICE DOES (Atomic Behavior / Component / Functionality)
```

---

## 2. CODE TAXONOMY & CLASSIFICATION

Every file in the codebase belongs strictly to one of two categories:

### A. Skeletons (Orchestrators & Facades)
- **Role Tag**: `/** @role skeleton */`
- **Definition**: Define structural shape, lifecycle, and orchestration backbone.
- **Classes & Files**:
  - `ServiceFacade` boundaries (`services/<ServiceName>/<ServiceName>ServiceFacade.ts`).
  - Declarative flow compositions (`orchestrations/<FlowName>/<FlowName>.ts`).
  - Functionality entrypoints (`main_function/logic.ts`).
- **Composition Law**: ServiceFacades compose functionalities and orchestrations. Orchestrations sequence functionalities and peer orchestrations.
- **Purity Invariant**: Skeletons coordinate underlying functionalities and components, updating state and emitting events.

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
    if task_feature.is_structural_service_or_flow:
        # What the service or flow IS -> ServiceFacade / Orchestration Skeleton
        create_or_extend_skeleton(
            target="ServiceFacade | Orchestration",
            pattern="composition",
            focus="lifecycle_and_declarative_flow"
        )
    elif task_feature.is_atomic_behavior_or_action:
        # What the service CAN DO -> Component / Functionality
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
- **Zero Duplication**: Shared behaviors across divergent services must be factored into isolated concept functions.
