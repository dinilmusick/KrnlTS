---
name: skeleton-components-architecture
description: Directives for Skeleton + Components architecture, using inheritance for structural entity shape and composition for atomic behavior.
---

# SKELETON + COMPONENTS ARCHITECTURE

## 1. FORMAL AXIOMS

$$\text{Shape}(\text{Entity}) \xrightarrow{\text{Inheritance}} \text{Skeleton} \quad \wedge \quad \text{Behavior}(\text{Entity}) \xrightarrow{\text{Composition}} \text{Component}$$

$$\forall c \in \text{Codebase}: \text{Role}(c) \in \{\text{Skeleton}, \text{Component}\} \quad (\text{Mutually Exclusive})$$

| Attribute | Skeleton (`/** @role skeleton */`) | Component (`/** @role component */`) |
| :--- | :--- | :--- |
| **Purity** | Always Impure (Orchestrator, side effects) | Pure (0A) or Atomic Accessor (0B) |
| **Files** | `src/<Entity>.ts`, `main_function/logic.ts`, Flows | `helper_functions/*`, `libraries/*`, `state_data/*` |
| **Mechanisms** | Shallow Inheritance ($\text{Depth} \le 3$) | Pure Functional Composition |
| **Banned** | Inline math, parsing, pure utility bodies | Impure orchestration, side effects, loops |

## 2. DECISION LOGIC

```python
def classify_unit(feature):
    if feature.is_structural_entity_or_workflow:
        return Skeleton(base="Entity<TState, TEvents>", depth_limit=3, role="orchestrator")
    return Component(purity=True, reuse_check="src/libraries/", role="atomic_behavior")
```
