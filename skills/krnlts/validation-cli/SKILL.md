---
name: krnlts-validation-cli
description: Directives for KrnlTS AST validation engine (krnlts-validate, krnlts-watch), 4-layer purity compiler gates, and multi-tier line limits.
---

# KRNLTS AST VALIDATION ENGINE (`krnlts-validate`)

## 1. CLI INVOCATION & CONTINUOUS WATCH
```bash
# Run one-off project validation gate
npx krnlts-validate

# Run continuous file-watcher daemon
npx krnlts-watch
```

---

## 2. AST COMPILER GATES & RULES ENFORCED
1. **File Line Limit**: Maximum 200 lines per file (`[ERR_FILE_LINE_LIMIT_EXCEEDED]`).
2. **Main Function Delegation Threshold**: Maximum 20 lines in `main_function/logic.ts` before delegating to `helpers/` pure functions or state accessors (`[ERR_MAIN_DELEGATION_THRESHOLD]`).
3. **Helper Function Delegation Threshold**: Maximum 30 lines in any helper before delegating to universal `libraries/{Domain}Concepts.ts` templates (`[ERR_HELPER_DELEGATION_THRESHOLD]`).
4. **Helper Purity Gate**: Asserts helper functions do not import state or I/O modules (`[ERR_HELPER_IMPURE]`).
5. **Context Destructuring Trap Guard**: Enforces `{ state, entity }` in main functions and flags `{ state, system }` (`[ERR_CONTEXT_SYSTEM_DESTRUCTURING]`).
6. **NodeNext Import Suffixes**: Enforces `.js` extensions on relative imports (`[ERR_MISSING_JS_EXTENSION]`).
7. **Boot Order Invariant**: Enforces that all `addLocal()` calls with `uiSpec` occur before `loadAll()` (`[ERR_BOOT_ORDER_VIOLATION]`).
