---
name: code-limits-guidelines
description: Directives for file length limits (200 lines max), top-level file purity, one-component-per-file, and modularity across frontend and backend.
---

# CODE LIMITS & MODULARITY GUIDELINES

## 0. INVIOLABLE TOP-LEVEL FILE PURITY LAW (CRITICAL — NEVER VIOLATE)
```
TOP-LEVEL FILES = { App.tsx, main.ts, index.ts, server.ts, app.ts, index.tsx, _app.tsx }

ABSOLUTE RULE:
  Top-level files MUST contain ONLY:
    1. Import statements (components, modules, providers, configuration).
    2. A single default export that composes imported components.

TOP-LEVEL FILES MUST NEVER CONTAIN:
  ✗ Raw JSX markup (div, span, button, section, any HTML tag, any SVG)
  ✗ Inline styles or CSS objects
  ✗ useState / useEffect / useRef or any React hook logic
  ✗ Business logic, data fetching, calculations, conditionals rendering markup
  ✗ Event handlers defined inline
  ✗ Backend route definitions, middleware, or handler logic

CANONICAL VALID App.tsx:
  import React from "react";
  import { AppShell } from "./components/AppShell/AppShell";
  export default function App() { return <AppShell />; }

CANONICAL VALID server.ts / index.ts (backend):
  import { createApp } from "./app/AppFactory";
  const app = createApp();
  app.listen(3000);

ANY violation of this law in a generated or edited file = MANDATORY IMMEDIATE REFACTOR.
Agent MUST extract all raw content into appropriately named component or module files.
```

---

## 1. MULTI-TIER LINE LIMITS & DELEGATION THRESHOLDS
```
GLOBAL FILE LIMIT:
  file_length_limit = 200 lines (strict maximum on ALL new or edited files — frontend AND backend)

APPLIES TO:
  ✓ React components (.tsx / .jsx)
  ✓ TypeScript modules (.ts)
  ✓ Backend route handlers, controllers, services
  ✓ Utility helpers, schemas, concept libraries
  ✓ Configuration files (unless auto-generated)

WHEN A FILE APPROACHES 200 LINES:
  1. Identify logical sub-sections within the file.
  2. Extract each sub-section into a new, dedicated file.
  3. Import and compose extracted pieces in the original file.
  4. If the original file still exceeds 200 lines after extraction → repeat.

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

## 2. ONE COMPONENT / ONE MODULE PER FILE (STRICT)
```
RULE: Every file exports exactly ONE primary component or module:
  - Frontend: ONE React component (named export or default export)
  - Backend:  ONE service class, ONE controller, ONE route group, or ONE utility

ALLOWED alongside the primary export:
  ✓ The Props interface / type for the primary component
  ✓ Local pure helper functions ONLY used by the component in that file (< 3 helpers, each < 20 lines)
  ✓ Local type aliases or enums exclusively consumed by the primary export

FORBIDDEN in a file with a primary component/module:
  ✗ A second React component definition (even if small or "private")
  ✗ A second service class or controller
  ✗ Unrelated types, schemas, or utility functions

SPLIT TRIGGER:
  If a component grows complex → decompose into:
    ParentComponent/
      ParentComponent.tsx          ← orchestrator, imports only sub-components
      ParentComponentHeader.tsx    ← sub-component
      ParentComponentBody.tsx      ← sub-component
      ParentComponentFooter.tsx    ← sub-component
      useParentComponentLogic.ts   ← custom hook (if stateful logic)
      ParentComponent.types.ts     ← shared types/interfaces for the group
```

---

## 3. MODULARITY & ATOMIC SIZING
- Functions, classes, and UI components must be small and single-responsibility.
- Build complex workflows by composing small independent modules, never via monolithic files.
- **FORBID**: Monolithic files, god classes, giant switch statements, multi-hundred-line React components.
- Applies equally to backend: no 500-line route files, no monolithic service classes.

---

## 4. DEDUPLICATION
```
function onSimilarClassesDetected(class_A, class_B):
    common_abstraction = extractCommonParent(class_A, class_B)
    class_A = extend(common_abstraction, variant_A_logic)
    class_B = extend(common_abstraction, variant_B_logic)
    return [class_A, class_B]

FORBID: Copy-pasted boilerplate or parallel implementations of identical behavioral patterns.
```
