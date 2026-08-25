# TASK: REFACTOR_AND_CLEANUP_PROTOCOL
$GOAL := \text{RefactorCodebase}(\mathcal{C}) \to \mathcal{C}_{\text{krnl}} \quad \text{s.t.} \quad \text{Behavior}(\mathcal{C}_{\text{krnl}}) \equiv \text{Behavior}(\mathcal{C})
CRITICAL_INVARIANT: \Delta(\text{BusinessLogic}) = 0 \quad (\text{ZERO LOGIC DELETION - RESTRUCTURE ONLY})

## 1. COMPLEXITY, NAMING & CODE LIMITS (ENFORCED)
$$\begin{array}{ll}
\text{Max File Length} & \le 150 \text{ lines} \\
\text{Max Function Length} & \le 40 \text{ lines} \\
\text{Max Cyclomatic Complexity} & \le 10 \\
\text{Naming Convention} & \text{Use long, descriptive names for all files, classes, and methods (Zero Cryptic Abbreviations)} \\
\text{File Decomposition} & \text{If } | \text{Lines}(file) | > 150 \implies \text{Decompose into } L_0/L_1 \text{ helpers or sub-functionalities}
\end{array}$$

## 2. IN-CODE DOCUMENTATION & FLOWCHART MANDATE
Every refactored function, class, and data structure MUST include a docblock containing:
1. **Utility & Role**: Clear purpose statement.
2. **Usage Example**: Concrete code snippet.
3. **ASCII Flow Chart**: Illustrating data transformations or execution sequence.

## 3. BOLD SECTION DEMARCATION (MANDATORY FILE STRUCTURE)
Refactored files MUST partition logic with bold visual demarcation lines:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS, INTERFACES & TYPES
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. PURE MATHEMATICAL & TRANSFORMATION LOGIC (L0 / L1)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. IMPURE IO, STORAGE & DATABASE OPERATIONS (L2)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 5. ATOMIC FUNCTIONALITY / ENTITY ORCHESTRATION (L3)
// ══════════════════════════════════════════════════════════════════════════════════════════
```

## 4. DEDUPLICATION & TEMPLATING RULES
- **Similarity Threshold**: If 2 or more classes/methods share $\ge 80\%$ structure $\implies$ abstract into a shared `BaseEntity`, `PocerBlock`, or utility helper in `src/krnl/tools/`.
- **Credential & Backend DRY**: Never re-instantiate ad-hoc database connections. Use `entity.configureBackend(...)` and cascade down.
- **Shared State**: Move ad-hoc global variables into reactive entity state (`state:changed` emitter).

## 5. REFACTORING WORKFLOW
$$\text{Scan}(\mathcal{C}) \xrightarrow{\text{AST/Tokens}} \text{Extract } L_0/L_1 \xrightarrow{\text{Isolate}} \text{Wrap } L_2 \text{ in Providers} \xrightarrow{\text{Assemble}} \text{Map to Functionalities} \xrightarrow{\text{Verify}} \text{Zero Regression}$$
```
