---
name: docs-guidelines
description: Directives for project history tracking (docs/HISTORY.md), pre-refactor memory refresh protocols, skill synchronization, and API endpoint registry.
---

# DOCUMENTATION & PROJECT HISTORY GUIDELINES

## 1. CHRONOLOGICAL PROJECT HISTORY TIMELINE (`docs/HISTORY.md`)
Whenever big changes, new features, or architectural refactors are requested by the user, the AI agent MUST record the change in `docs/HISTORY.md` (or root `HISTORY.md`) using structured bulleted lists.

### Entry Format Template:
```markdown
## [YYYY-MM-DD] - <Milestone / Feature Name>

### User Intent & Rationale:
- **Goal**: <High-level intent requested by the user>
- **Rationale**: <Why this change was made and the core motivation behind it>

### Architectural Decisions & Changes:
- **Entities & Quad-Units**: <Entities and functionalities added/modified/purged>
- **Concept Libraries**: <Polymorphic templates introduced or modified in libraries/>
- **State & Ingress**: <State models updated, protocol adapter routes added/removed>
- **UI & Controls**: <UI views, modals, and event bindings created/updated>

### Invariants & Constraints Maintained:
- <e.g., Preserved 4-layer purity, event-driven subscriptions (zero onTick/polling), line limits>
```

---

## 2. PRE-REFACTOR MEMORY REFRESH PROTOCOL
```
∀ task ∈ Major_Refactor ∨ Significant_Architecture_Change:
  1. Read docs/HISTORY.md to refresh memory on past user intents.
  2. Identify historical constraints, design rationales, and past decisions.
  3. Formulate implementation plan respecting historical context (FORBID reverting intentional user decisions).
```
- **Context Preservation**: Agents must never refactor blindly. Reading the history timeline prevents accidental regression of previously solved issues and maintains architectural continuity.

---

## 3. CONTINUOUS SKILL & ENDPOINT REGISTRY SYNCHRONIZATION
- **Skills**: Keep all local and root `SKILL.md` files synchronized whenever system invariants, routing, or folder structures evolve.
- **API Registry**: Maintain up-to-date documentation of all active HTTP (`/call/{fid}`), WebSocket RPC, and MCP tool signatures with input/output schemas.
