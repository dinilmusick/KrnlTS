---
name: function-layers-guidelines
description: Directives for the 4-layer function purity hierarchy (Pure/State Accessors -> Impure -> Complex Impure -> Top-Level API) and layer isolation rules.
---

# FUNCTION PURITY & LAYER ISOLATION GUIDELINES

## 1. 4-LAYER UNIDIRECTIONAL FUNCTION HIERARCHY
```
Layer 0A: [ Pure Functions ]  &  Layer 0B: [ State Accessors ]
    (helper_functions/ & libraries/)         (state_data/state.ts)
                │                                    │
                ▼                                    ▼
Layer 1: [ Simple Impure Step Functions ] (main_function/logic.ts)
                │
                ▼
Layer 2: [ Complex Impure Orchestrator / Flows ] (main_function/logic.ts & FlowBuilder)
                │
                ▼
Layer 3: [ Top-Level API / Ingress Surface ] (services/*.ts, orchestrations/ & adapters/)
```
- **Strict Flow Law**: Invocations must flow unidirectionally from Layer 0 $\to$ Layer 1 $\to$ Layer 2 $\to$ Layer 3.
- **Intermixing Prohibition**: Crossing boundaries or bypassing intermediate layers is strictly FORBIDDEN.

---

## 2. LAYER DEFINITIONS & CONSTRAINTS

### Layer 0A: Pure Functions (`helper_functions/*.ts` & `libraries/{Domain}Concepts.ts`)
- **Role Tag**: `/** @role component */`
- **Definition**: Self-contained, deterministic functions with zero side effects.
- **Rules**:
  - MUST NOT import other functions, state, or I/O modules.
  - Max 30 lines per helper before delegating to `libraries/{Domain}Concepts.ts`.
  - All raw calculations, mathematical formulas, string formatting, and parsing MUST live here.

### Layer 0B: State Accessors (`state_data/state.ts` & `events/*.ts`)
- **Role Tag**: `/** @role component */`
- **Definition**: Atomic getters/setters for state variables and event emitters.
- **Rules**:
  - Sole responsibility: Access or mutate a single state field or emit an event.
  - No complex business logic or multi-step validation.

### Layer 1: Simple Impure Functions (`main_function/logic.ts`)
- **Definition**: Atomic step functions that combine Pure Functions (Layer 0A) with State Accessors (Layer 0B).
- **Rules**:
  - **FORBID RAW PURE CODE**: Never write inline calculations, complex math, or parsing logic directly inside impure functions.
  - Pure operations MUST be delegated to Layer 0A Pure Functions.

### Layer 2: Complex Impure Functions (`main_function/logic.ts` & Execution Flows)
- **Role Tag**: `/** @role skeleton */`
- **Definition**: Higher-order workflows coordinating multiple Layer 1 Simple Impure Functions.
- **Rules**:
  - MUST ONLY call Layer 1 Simple Impure Functions.
  - Max 20 lines of sequential logic without delegating.
  - **FORBID**: Never call Layer 0A Pure Functions or Layer 0B State Accessors directly.

### Layer 3: Top-Level API Functions (`services/*.ts`, `orchestrations/*.ts` & `adapters/*.ts`)
- **Definition**: Root entry point handlers orchestrating Layer 2 / Layer 1 logic and exposing application capabilities over HTTP `/call/{fid}`, WebSocket RPC, or MCP.
- **Rules**:
  - MUST ONLY call Layer 2 Complex Impure Functions or Layer 1 Impure Functions.
  - **FORBID**: Never call Layer 0 Pure Functions directly.
  - **API Parity**: Ensure all underlying workflows are exposed as callable API endpoints.

---

## 3. FORMAL INVOCATION MATRIX
```
Caller Layer \ Callee Layer | Layer 0 (Pure/State) | Layer 1 (Impure) | Layer 2 (Complex Impure) | Layer 3 (API)
----------------------------+----------------------+------------------+--------------------------+--------------
Layer 0 (Pure/State)        | ❌ FORBIDDEN         | ❌ FORBIDDEN     | ❌ FORBIDDEN             | ❌ FORBIDDEN
Layer 1 (Simple Impure)     | ✅ ALLOWED           | ❌ FORBIDDEN     | ❌ FORBIDDEN             | ❌ FORBIDDEN
Layer 2 (Complex Impure)    | ❌ FORBIDDEN         | ✅ ALLOWED       | ❌ FORBIDDEN             | ❌ FORBIDDEN
Layer 3 (Top-Level API)     | ❌ FORBIDDEN         | ✅ ALLOWED       | ✅ ALLOWED               | ❌ FORBIDDEN
```

---

## 4. CODE STRUCTURAL TEMPLATE (KRNLTS FUNCTIONALITY PATTERN)
```typescript
// --- helper_functions/taxHelpers.ts (LAYER 0A: PURE FUNCTIONS) ---
/** @role component */
export function calculateTax(amount: number, rate: number): number {
  return amount * rate;
}

// --- state_data/state.ts (LAYER 0B: STATE ACCESSORS) ---
/** @role component */
export function getAccountBalance(state: AppState): number {
  return state.balance;
}
export function setAccountBalance(state: AppState, val: number): void {
  state.balance = val;
}

// --- main_function/logic.ts (LAYER 1 & 2: SKELETON ORCHESTRATOR) ---
/** @role skeleton */
// Layer 1: Simple impure step
function applyTaxToBalance(state: AppState, rate: number): void {
  const current = getAccountBalance(state);        // Layer 0B
  const tax = calculateTax(current, rate);         // Layer 0A (No inline math in Layer 1!)
  setAccountBalance(state, current - tax);         // Layer 0B
}

// Layer 2: Main functionality orchestrator (receives { state, facade })
export const main = async (input: { rate: number }, { state, facade }: { state: AppState; facade: any }) => {
  applyTaxToBalance(state, input.rate);           // Layer 1 Only
  facade.emitEvent("billing:tax_applied", { rate: input.rate, balance: state.balance });
  return { success: true, balance: state.balance };
};
```
