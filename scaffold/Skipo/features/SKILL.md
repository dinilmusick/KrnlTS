---
name: feature-lifecycle-guidelines
description: Directives for incremental evolution (anti-nuke), zero-trace feature purges, and orphan elimination.
---

# FEATURE LIFECYCLE, EVOLUTION & PURGE GUIDELINES

## 1. INVARIANTS

$$\begin{array}{ll}
\mathbf{F_1} \text{ (Anti-Nuke Law)} & \forall \tau \in \text{MajorChanges}: \text{Strategy}(\tau) = \text{SurgicalInPlace}(\tau) \wedge \text{NukeEntireProject} = \text{FORBIDDEN} \\
\mathbf{F_2} \text{ (History Audit)} & \text{PreModify} \implies \text{Read}(\text{docs/HISTORY.md}) \quad \wedge \quad \text{PostModify} \implies \text{AppendEntry}(\text{docs/HISTORY.md}) \\
\mathbf{F_3} \text{ (Zero-Trace Purge)} & \text{DeleteFeature}(f) \implies \text{EradicateAllLayers}(f) \wedge (\text{ZombieCode} \cup \text{CommentedOutBlocks} = \emptyset)
\end{array}$$

## 2. ATOMIC 8-LAYER PURGE SEQUENCE

$$\text{Eradicate}(f) = \bigcup_{k=1}^8 \text{Layer}_k(f)$$

```python
def purge_feature(name: str):
    delete_directory(f"src/functionalities/{name}/")
    remove_entity_references(name)
    remove_ingress_routes(name)
    remove_ui_components(name)
    remove_exclusive_state_and_tables(name)
    remove_exclusive_concept_helpers(name)
    delete_companion_tests(name)
    remove_exclusive_packages(name)
    assert grep_search(name) == [] # 0 residual traces
```
