```markdown
# TASK: CODE_DOCUMENTATION_FORMATTING_AND_NAMING_STANDARDS
$RULES := \text{DocblocksWithFlowcharts} \otimes \text{BoldSectionDemarcation} \otimes \text{LongDescriptiveNames}

## 1. IN-CODE UTILITY DOCUMENTATION & FLOWCHART REQUIREMENT
Every function, class, type, interface, and data structure MUST include a comprehensive docblock with:
1. **Utility & Role**: What the asset does and why it exists.
2. **Parameters & Return Types**: Explanation of inputs and outputs.
3. **Usage Example**: Practical, copy-pasteable execution example.
4. **ASCII / Text Flow Chart**: Step-by-step pipeline showing where the function is called or how data passes through it.

### Required Docblock Pattern:
```typescript
/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * UTILITY: CalculateDiscountedCartSubtotalWithTax
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Computes final billing total applying item-level discounts, customer tier coupons,
 *          and regional tax rates in a pure deterministic calculation (L0).
 *
 * Flow Chart:
 *   [Raw Cart Items] ───► [Calculate Base Subtotal]
 *                                 │
 *                                 ▼
 *                        [Apply Coupon Discount]
 *                                 │
 *                                 ▼
 *                        [Apply Regional Tax Rate] ───► [Return Final Subtotal]
 *
 * Example:
 *   const total = CalculateDiscountedCartSubtotalWithTax(cartItems, couponCode, 0.08);
 *   // Returns: { subtotal: 100, discount: 10, tax: 7.2, grandTotal: 97.2 }
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */
```

## 2. BOLD SECTION DEMARCATION (MANDATORY IN ALL CODE FILES)
Use bold unicode comment borders (`═` or `─`) to clearly segment code into standard functional sections:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// SECTION 1: EXTERNAL DEPENDENCIES & IMPORTS
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// SECTION 2: DATA SCHEMAS, INTERFACES & TYPES
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// SECTION 3: PURE MATHEMATICAL & TRANSFORMATION LOGIC (L0 / L1)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// SECTION 4: IMPURE IO, STORAGE & DATABASE OPERATIONS (L2)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// SECTION 5: ATOMIC FUNCTIONALITY / ENTITY ORCHESTRATION (L3)
// ══════════════════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════════════════
// SECTION 6: EXPORTS & PUBLIC INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════
```

## 3. DESCRIPTIVE & LONG NAMING CONVENTIONS
- **Filenames**: Must be completely descriptive, matching the primary class/entity/feature name (e.g., `UserAccountAuthenticationManager.ts`, `FilesystemWorkspaceStorageProvider.ts`).
- **Function & Variable Names**: Must explicitly declare intent without cryptic abbreviations (e.g., `validateAndNormalizeIncomingUserRegistrationPayload`, `calculateTotalActiveWorkspaceConnections`).
- **Code Block / Functionality IDs**: Use snake_case or camelCase matching the file name (e.g., `id: "user_account_authentication_manager"`).

## 4. MANDATORY FOLDER MARKDOWN EXPLANATION DIRECTIVE
Every folder created or maintained in the codebase MUST contain a `README.md` (or `SKILL.md`) describing:
1. **Folder Role & Purpose**: What logical domain or subsystem this folder encapsulates.
2. **Layer Classification**: The architectural layer ($L_0 \dots L_3$, Control Plane, Data Plane, Protocol Adapters, Frontend, Tools).
3. **File Manifest**: Table of files with 1-line explanations of their utility.
4. **Data Flow & Cross-Folder Interactivity**: How components in this folder receive data and dispatch events to sibling systems.

## 5. ZERO-LEAK UI & ANTI-COPY INVARIANTS (MANDATORY IN ALL FRONTEND CODE)
1. **Zero Leakage of Backend / System Jargon in UI**:
   $$\text{RenderedUI} \cap \{ \text{"Control Plane"}, \text{"Data Plane"}, \text{"RBAC"}, \text{"Storage Adapter"}, \text{"SyncEngine"}, \text{"WorkspaceFS"}, \text{"Cluster"}, \text{"Endpoint ID"}, \text{"Cascade"} \} = \emptyset$$
   - Technical concepts belong exclusively in backend architecture and in-code comments.
   - User-facing UI MUST render ONLY high-level, human-friendly terms (e.g., "Account", "Workspaces", "Storage", "Google Drive", "Local", "Replicas").
2. **Zero On-Screen Instructional / Promotional Text**:
   - FORBID direct text descriptions, tutorial paragraphs, marketing copy, or "how-to" guidance rendered into the UI viewport.
   - The UI must be quiet, minimal, and unobtrusive.
3. **Strict Icon-Only Buttons (Zero Text Labels on Buttons)**:
   - Buttons MUST NOT render text labels directly on their surface.
   - Buttons contain strictly monochromatic vector/SVG icons.
   - All button labels, action descriptions, and keyboard shortcuts appear **exclusively on hover tooltips**.
4. **Subtle Neo-Brutalist Tactile Glow**:
   - Apply subtle ambient glow (`box-shadow: 0 0 10px var(--krnl-accent-glow)` or `0 0 12px rgba(212, 163, 89, 0.22)`) on hover and active borders, preserving crisp Neo-Brutalist borders.
```
