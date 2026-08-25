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
```
