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
- **Services & Quad-Units**: <Services, orchestrations, and functionalities added/modified/purged>
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

---

## 4. IN-CODE UTILITY DOCUMENTATION & FLOW CHART DIRECTIVE
Every function, class, data structure, type, and code asset MUST be thoroughly documented directly in the code itself:
1. **Utility & Purpose**: Clear explanation of what the asset does, why it exists, and when to use it.
2. **Usage Examples**: Concrete, runnable code examples demonstrating input and expected output.
3. **ASCII / Text Flow Chart**: Visual diagram illustrating where and how the asset fits into the lifecycle, data pipeline, or service orchestration.

### Canonical Docblock Template:
```typescript
/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * FUNCTION / ASSET UTILITY: UserRegistrationWorkflowManager
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Validates incoming registration requests, hashes passwords, persists account
 *          records to the Control Plane, and broadcasts the UserRegisteredEvent.
 *
 * Flow Chart & Lifecycle:
 *   [Raw Request] ───► [L1: Schema Validation (Zod)]
 *                              │
 *                              ▼ (If Valid)
 *                     [L0: Hash & Normalize Data]
 *                              │
 *                              ▼
 *                     [L2: Table CRUD Persistence] ───► [Database]
 *                              │
 *                              ▼
 *                     [L3: Emit Event & Return Session Token]
 *
 * Example Usage:
 *   const session = await registerUserAccountFunctionality.execute({
 *     email: "user@example.com",
 *     username: "alice_dev",
 *     password: "SecurePassword123!"
 *   });
 *   console.log(session.token); // "sess::alice_dev::178760...::abc12"
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */
```

---

## 5. BOLD CODE SECTION PARTITIONING
Every code file MUST use bold visual demarcation headers to partition distinct architectural layers:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA STRUCTURES, SCHEMAS & TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. PURE HELPER FUNCTIONS & TRANSFORMATIONS (L0 / L1)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. IMPURE IO, STORAGE & DATABASE OPERATIONS (L2)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 5. ATOMIC FUNCTIONALITY / SERVICE ORCHESTRATION (L3)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// 6. EXPORTS & PUBLIC INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════
```

---

## 6. DESCRIPTIVE & LONG NAMING CONVENTIONS
- **Filenames**: Always use full, unambiguous, descriptive names (e.g., `UserAuthenticationSessionManager.ts` instead of `auth.ts`, `FilesystemStorageMediaProvider.ts` instead of `fs.ts`).
- **Identifiers & Functions**: Use long, expressive names explicitly stating action and context (e.g., `calculateExponentialBackoffDelayMilliseconds`, `transformRawPayloadToValidatedUserRecord`).
- **Zero Cryptic Abbreviations**: Disallow single-letter or abbreviated names (except standard math indices $i, j, k$).

---

## 7. MANDATORY FOLDER MARKDOWN EXPLANATION DIRECTIVE
Every folder created or maintained by the agent in the codebase MUST contain a descriptive `README.md` (or `SKILL.md`) clearly explaining:
1. **Folder Role & Utility**: What this folder represents in the system architecture.
2. **Architectural Layer**: Which layer ($L_0 \dots L_3$, Control Plane, Data Plane, UI, etc.) it belongs to.
3. **Directory Contents**: Table or list of all files/subdirectories and their distinct responsibilities.
4. **Data Flow & Dependencies**: How assets in this folder interact with the rest of the codebase.

No folder may exist as an unexplained container. This guarantees zero ambiguity for developers and agents navigating the repository.


