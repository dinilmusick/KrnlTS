---
name: krnlts-validation-cli
description: Directives for KrnlTS AST validation engine (krnl validate, krnl watch), 4-layer purity compiler gates, orchestration rules, and line limits.
---

# KRNLTS AST VALIDATION ENGINE (`krnl validate`)

## 1. CLI INVOCATION & CONTINUOUS WATCH
```bash
# Run one-off project validation gate
krnl validate

# Run continuous file-watcher daemon with declaration updates
krnl watch --watch
```

---

## 2. AST COMPILER GATES & RULES ENFORCED
1. **File Line Limit**: Maximum 200 lines per file (`krnl/file-line-limit`).
2. **One Component Per File**: Exactly one React component or module per file (`krnl/one-component-per-file`).
3. **Top-Level File Purity**: App.tsx / index.ts contain only imports and single root export (`krnl/top-level-purity`).
4. **Helper Purity Gate**: Asserts helper functions do not import state or I/O modules directly (`krnl/helper-purity`).
5. **Orchestration Purity Rules**:
   - `krnl/orchestration-purity`: Asserts orchestrations do not define procedural logic or application leakage.
   - `krnl/orchestration-no-libraries`: Prohibits direct calls to Layer 0 libraries from orchestrations (`thenFunction()` forbidden; must use `thenFunctionality()` or `thenOrchestration()`).
6. **NodeNext Import Suffixes**: Enforces `.js` extensions on relative imports (`krnl/import-suffix`).
