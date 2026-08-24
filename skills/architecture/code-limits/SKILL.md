---
name: code-limits-guidelines
description: Directives for file length limits (200 lines max), component atomicity, modularity, and deduplication.
---

# CODE LIMITS & MODULARITY GUIDELINES

## 1. MULTI-TIER LINE LIMITS & DELEGATION THRESHOLDS
```
GLOBAL FILE LIMIT:
  file_length_limit = 200 lines (strict maximum on new/edited files)

FUNCTION DELEGATION THRESHOLDS:
  1. main_function/logic.ts (Skeleton Threshold):
     - Max 20 lines of sequential code before MUST delegate to a helper function or state accessor.
     - Inline complex regex/math > 5 lines is FORBIDDEN.
  2. helper_functions/*.ts (Component Threshold):
     - Max 30 lines in any helper function before MUST delegate to a universal libraries/{Domain}Concepts.ts template function.

ENFORCEMENT:
  Enforced automatically by 'krnlts-validate' AST validator during build and 5-turn audits.
```

---

## 2. MODULARITY & ATOMIC SIZING
- Functions, classes, and UI components must be small and single-responsibility.
- Build complex workflows by composing small independent modules, never via monolithic files.
- **FORBID**: Monolithic files, god classes, giant switch statements, multi-hundred-line React components.

---

## 3. DEDUPLICATION
```
function onSimilarClassesDetected(class_A, class_B):
    common_abstraction = extractCommonParent(class_A, class_B)
    class_A = extend(common_abstraction, variant_A_logic)
    class_B = extend(common_abstraction, variant_B_logic)
    return [class_A, class_B]

FORBID: Copy-pasted boilerplate or parallel implementations of identical behavioral patterns.
```
