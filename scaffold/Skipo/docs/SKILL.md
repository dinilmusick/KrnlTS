---
name: docs-guidelines
description: Directives for project history tracking (docs/HISTORY.md), pre-refactor memory refresh protocols, skill synchronization, and API endpoint registry.
---

# DOCUMENTATION & PROJECT HISTORY (DENSE)

$$\forall f \in \text{CodeAssets}: \text{DocblockWithFlowchart}(f) \wedge \text{UnicodeBorders}(f) \wedge \text{SyncHistory}(\text{docs/HISTORY.md})$$

## 1. PROJECT HISTORY TIMELINE (`docs/HISTORY.md`)
On major feature, refactor, or 5-turn cadence, append:
```markdown
## [YYYY-MM-DD] - <Milestone Name>
- **Intent**: <User goal>
- **Decisions**: <Entities / Functionalities / Schemas added or modified>
- **Invariants**: <Purity L0-L3, lines <= 200, anti-stub compliance verified>
```

## 2. CANONICAL IN-CODE DOCBLOCK & FLOWCHART
```typescript
/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ASSET: ProcessPaymentFunctionality
 * Purpose: Validates charge token, queries payment gateway, updates user ledger.
 *
 * Flowchart:
 *   [Input Payload] -> [L1: Zod Validation] -> [L2: Gateway Fetch] -> [L3: Commit Ledger]
 *
 * Example:
 *   const result = await processPayment.execute({ amount: 100, currency: "USD" });
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */
```

## 3. BOLD SECTION DEMARCATION (Files > 60L)
Use bold unicode dividers:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
```

## 4. CHECKLIST GATE
`python3 checklists/04_code_limits_purity.py .`
