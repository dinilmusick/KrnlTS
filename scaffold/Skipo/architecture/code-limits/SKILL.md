---
name: code-limits-guidelines
description: Directives for file length limits (200 lines max), top-level file purity, one-component-per-file, and modularity across frontend and backend.
---

# CODE LIMITS & MODULARITY (DENSE)

$$\forall f \in \text{Files}: |\text{Lines}(f)| \le 200 \wedge \text{Components}(f) \le 1 \wedge \text{Purity}(\text{TopLevel})$$

## 1. TOP-LEVEL FILE PURITY LAW
Files: `App.tsx`, `index.tsx`, `main.ts`, `server.ts`.
- **ALLOWED**: Imports + Single default export composing root shell.
- **FORBIDDEN**: Inline JSX tags (`<div>`, `<button>`), inline styles, hooks (`useState`, `useEffect`), direct fetches, inline event handlers.

```tsx
// Canonical App.tsx
import React from "react";
import { AppShell } from "./components/AppShell/AppShell";
export default function App() { return <AppShell />; }
```

## 2. MULTI-TIER LINE LIMITS

```
Global File Limit     : <= 200 lines (hard limit, frontend & backend).
Helper Functions      : <= 150 lines per file (max 30 lines per individual helper).
Main Logic Skeletons  : <= 20 lines of sequential flow before delegating to helper.
```

## 3. ONE COMPONENT / ONE MODULE PER FILE
- Frontend: 1 React component per `.tsx` file (plus its Props interface).
- Backend: 1 service, 1 controller, or 1 route factory per `.ts` file.
- Multiple component exports in a single file are strictly prohibited.

## 4. CHECKLIST GATE
`python3 checklists/04_code_limits_purity.py .`

## 5. FILE PURITY CLASSIFICATION

$$\forall f \in \text{Files}: \text{Grade}(f) \in \{P_0, P_1, P_2, P_3\} \wedge \text{ImportDAG}(f) \text{ acyclic} \wedge \text{NameSuffix}(f) \equiv \text{Grade}(f)$$

| Grade | Name | Local Imports | External Imports | Inline Logic | Constraint |
|-------|------|---------------|------------------|--------------|------------|
| $P_0$ | **Pure** | ∅ | ∅ | Self-contained | `import type` exempt (compile-time erasure) |
| $P_1$ | **Impure** | $\subseteq P_0$ | ✔ (react, zustand, @aws-sdk…) | Composition only | No inline business logic beyond imports |
| $P_2$ | **Orchestrator** | $\subseteq P_0 \cup P_1$ | via $P_1$ | ∅ (orchestration only) | Chains/sequences calls, no direct ops |
| $P_3$ | **Facade** | $\subseteq P_2 \cup P_3$ | via transitive | ∅ (re-export only) | Groups exports, $\le 200$ lines |

$$P_0 \xrightarrow{\text{import}} \emptyset \quad P_1 \xrightarrow{\text{import}} P_0 \cup \text{Ext} \quad P_2 \xrightarrow{\text{import}} P_0 \cup P_1 \quad P_3 \xrightarrow{\text{import}} P_2 \cup P_3$$

**Key rules**: `import type` is always exempt. External library imports → $P_1$ minimum. Test files & scripts are NOT exempt from line limits or purity. All violations are blocking errors.

## 6. NAMING CONVENTION

$$\text{FileName}(f) = \text{ContextualName}(f) \circ \text{GradeSuffix}(\text{Grade}(f))$$

```
Grade   Suffix            Example
P0      _Pure.ts          mathHelpers_Pure.ts, constants_Pure.ts
P1      _Impure.tsx       authStore_Impure.tsx, apiClient_Impure.ts
P2      _Orchestrator.ts  loginFlow_Orchestrator.ts, dataPipeline_Orchestrator.ts
P3      _Facade.ts        userService_Facade.ts, backendRoot_Facade.ts
```

## 7. IMPORT DAG CONSTRAINTS

$$\text{DAG}(\text{Imports}) \text{ must be acyclic} \wedge \forall (a \xrightarrow{\text{import}} b): \text{Grade}(a) \ge \text{Grade}(b) \vee b \in \text{TypeOnly}$$

- Circular imports are **blocking errors** — no exceptions.
- A file may only import from **equal or lower** grade (except `import type`).
- Every service and backend module must have a $P_3$ Facade at the top level.

## 8. PURITY AUDIT GATE

```
python3 code-purity-audit.py <target>
  --json              Machine-readable JSON output
  --violations-only   Show only violations (skip passing files)
  --inspect <file>    Deep-inspect a single file's purity grade
```

$$\text{TurnDone} \implies \text{exitCode}(\texttt{code-purity-audit.py}) = 0$$

## 9. DIRECTORY PLACEMENT & ROOT PURITY INVARIANTS

$$\forall f \in \text{CodeFiles}: \text{Dir}(f) \neq \text{Root} \wedge \text{Plane}(f) \in \{\text{frontend}, \text{backend}, \text{libraries}, \text{packages}, \text{scripts}\}$$

- **Zero Root Code Files ($L_{16}$)**: Never place `.ts`, `.tsx`, `.js`, or `.jsx` files directly in repository root (only framework configs like `next.config.js`, `vite.config.ts` allowed).
- **Authorized Code Enclaves**: Code files must reside within explicit plane subdirectories:
  - `src/frontend/` or `components/` for UI components and views
  - `src/backend/` or `backend/` for services, routes, and drivers
  - `src/libraries/` or `lib/` for environment-neutral helpers
  - `packages/<pkg>/src/` for monorepo packages
  - `scripts/` for operational CLI utilities and automation

## 10. NAMING CONVENTIONS SPECIFICATION

$$\text{ValidName}(p) \iff p \in [a\text{-}zA\text{-}Z0\text{-}9\_\-\.\[\]@]+ \wedge \text{Space}(p) = \emptyset$$

- **Syntactic Formats**: Path segments must follow standard `kebab-case`, `camelCase`, or `PascalCase`.
- **Zero Spaces / Prohibited Glyphs**: Spaces and special control characters are strictly forbidden.
- **Purity Integration**: Feature files combine contextual domain naming with purity grade suffixes (`ContextName_Grade.ts`).
