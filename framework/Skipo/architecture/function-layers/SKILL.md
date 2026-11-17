---
name: function-layers-guidelines
description: Directives for the 4-layer function purity hierarchy and layer isolation rules.
---

# FUNCTION PURITY & LAYER ISOLATION

## 1. LAYER HIERARCHY & INVOCATION DIRECTED ACYCLIC GRAPH

$$\mathcal{L}_{0A} \text{ (Pure)} \cup \mathcal{L}_{0B} \text{ (State/Event)} \longrightarrow \mathcal{L}_1 \text{ (Impure Step)} \longrightarrow \mathcal{L}_2 \text{ (Orchestrator)} \longrightarrow \mathcal{L}_3 \text{ (API Ingress)}$$

$$\text{ValidCall}(L_i, L_j) \iff (i = 1 \wedge j = 0) \vee (i = 2 \wedge j = 1) \vee (i = 3 \wedge j \in \{1, 2\})$$

| Caller \ Callee | $\mathcal{L}_0$ (Pure/State) | $\mathcal{L}_1$ (Step) | $\mathcal{L}_2$ (Flow) | $\mathcal{L}_3$ (API) |
| :--- | :--- | :--- | :--- | :--- |
| $\mathcal{L}_0$ (`helper_functions/`, `state_data/`) | ❌ | ❌ | ❌ | ❌ |
| $\mathcal{L}_1$ (`main_function/logic.ts`) | ✅ | ❌ | ❌ | ❌ |
| $\mathcal{L}_2$ (FlowBuilder / Workflows) | ❌ | ✅ | ❌ | ❌ |
| $\mathcal{L}_3$ (`entities/*.ts`, HTTP/RPC/MCP) | ❌ | ✅ | ✅ | ❌ |

## 2. LAYER INVARIANTS

```typescript
// L0A: Pure (No I/O, no imports, deterministic math/parsing, <=30L)
export const calculateTax = (amt: number, rate: number): number => amt * rate;

// L0B: State Accessor (Atomic get/set/emit only, no business logic)
export const getBalance = (s: AppState): number => s.balance;
export const setBalance = (s: AppState, v: number): void => { s.balance = v; };

// L1: Impure Step (Combines L0A + L0B, zero inline math/parsing)
const applyTax = (s: AppState, rate: number): void => {
  setBalance(s, getBalance(s) - calculateTax(getBalance(s), rate));
};

// L2: Skeleton Orchestrator (Composes L1, <=20L sequential)
export const main = async (in: { rate: number }, { state, entity }: Ctx) => {
  applyTax(state, in.rate);
  entity.emitEvent("billing:tax_applied", { bal: state.balance });
  return { success: true, balance: state.balance };
};

// L3: Ingress Handler (/call/:fid, WS, MCP -> invokes L2/L1)
```
