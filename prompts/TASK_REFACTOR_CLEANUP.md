```markdown
# TASK: REFACTOR_AND_CLEANUP_PROTOCOL
$GOAL := \text{RefactorCodebase}(\mathcal{C}) \to \mathcal{C}_{\text{krnl}} \quad \text{s.t.} \quad \text{Behavior}(\mathcal{C}_{\text{krnl}}) \equiv \text{Behavior}(\mathcal{C})
CRITICAL_INVARIANT: \Delta(\text{BusinessLogic}) = 0 \quad (\text{ZERO LOGIC DELETION - RESTRUCTURE ONLY})

## 1. COMPLEXITY & CODE LIMITS (ENFORCED)
$$\begin{array}{ll}
\text{Max File Length} & \le 150 \text{ lines} \\
\text{Max Function Length} & \le 40 \text{ lines} \\
\text{Max Cyclomatic Complexity} & \le 10 \\
\text{File Decomposition} & \text{If } | \text{Lines}(file) | > 150 \implies \text{Decompose into } L_0/L_1 \text{ helpers or sub-functionalities}
\end{array}$$

## 2. 4-LAYER DISENTANGLEMENT MATRIX
For every messy/coupled file, partition all code into strict layers:
1. **$L_0$ Pure Math / Logic**: Isolate deterministic calculation routines. No IO, no state mutation, 0 external runtime dependencies.
2. **$L_1$ Pure Data Transformations**: Isolate schema validation, serialization, format parsing, and data mapping.
3. **$L_2$ Impure IO & Engines**: Route all network, DB queries, FS, and OS calls through `KrnlHTTP`, `KrnlFS`, or `IWorkspaceBackend`.
4. **$L_3$ Functionality Atoms**: Assemble $L_0 \dots L_2$ into `krnlLocalFunctionality`.

## 3. DEDUPLICATION & TEMPLATING RULES
- **Similarity Threshold**: If 2 or more classes/methods share $\ge 80\%$ structure $\implies$ abstract into a shared `BaseEntity`, `PocerBlock`, or utility helper in `src/krnl/tools/`.
- **Credential & Backend DRY**: Never re-instantiate ad-hoc database connections. Use `entity.configureBackend(...)` and cascade down.
- **Shared State**: Move ad-hoc global variables into reactive entity state (`state:changed` emitter).

## 4. EXECUTION STEPS FOR THE AGENT
1. **Inventory**: Map all exported symbols and runtime behaviors in target file.
2. **Extract Pure Layers**: Extract pure helper functions to `tools/` or `helpers/` ($L_0/L_1$).
3. **Wrap Business Functions**: Wrap each operation in a `krnlLocalFunctionality` with explicit input/output schema.
4. **Wire to Host Entity**: Attach functionalities to the appropriate `Entity` using `addLocal()`.
5. **Verify**: Ensure all existing imports, test suites, and APIs execute with identical input/output contracts.
```
