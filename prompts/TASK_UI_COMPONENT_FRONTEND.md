# TASK: UI_COMPONENT_AND_FRONTEND_PROTOCOL

$$\text{INVARIANT}: \text{UI\_SYSTEM} \equiv \text{SkipoPrimitives} \wedge \text{ThemeTokens}_{\text{var(--skipo-*)}} \wedge \text{BottomStripInspection} \wedge \text{FloatingDetailsPanel} \wedge \text{ZeroLegacy}(\mathcal{P})$$
$$\text{LAWS}: \mathbf{L_1}, \mathbf{L_2}, \mathbf{L_9}, \mathbf{L_{12}}, \mathbf{L_{14}}, \mathbf{L_{18}}, \mathbf{L_{19}}, \mathbf{L_{21}} \in \text{AGENTS.md}$$

> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY UI & THEME PURGE ($\mathbf{L_{21}}$)**:
> Completely purge any competing legacy UI systems found in the codebase: bespoke raw buttons/inputs, ad-hoc dialogs, custom tab bars, floating tooltips/popovers, and custom color presets/pickers. Leave zero trace or commented-out remnants. The app must exclusively use `@skipo/ui` primitives and the canonical Theme Engine.

---

## 0. INVIOLABLE STRUCTURAL LAWS (FRONTEND)

### Law 1: Component Inheritance & Zero-Custom-UI Mandate
- **BANNED**: Raw HTML `<button>`, `<input>`, `<select>`, `<textarea>`, or custom unstyled `<div>` buttons.
- **MANDATORY**: Always compose or extend `@skipo/ui` base primitives:
  - Buttons: `BaseButton`, `IconOnlyButton`
  - Inputs & Controls: `BaseInput`, `CredentialField`, `BaseTextarea`, `BaseSelect`, `BaseToggle`
  - Structural Cards & Badges: `BaseCard`, `BaseBadge`
  - Containers: `PageContainer`, `SectionContainer`, `SidebarContainer`, `ModalContainer`, `AppShell`

### Law 2: Single TopToolbar & Anti-Nested-Tabs Law
- Unified `TopToolbar` (height: 44px) contains the branding and primary view tabs in a single flat list.
- **Zero nested tabs**: Creating secondary or nested tab bars inside drawers, views, or child panels is strictly forbidden.

### Law 3: Dedicated Thin BottomStrip & Zero Floating Popovers
- **BANNED**: Floating text bubbles, floating balloon popovers, and custom tooltip popups.
- **MANDATORY**: Dynamic hover inspection via the thin anchored `BottomStrip` (height: 30px):
  - Elements publish dynamic hover descriptions to `BottomStripContext` (`setInspectionText`).
  - Center strip smoothly displays inspection text on hover/focus.
  - Left strip displays operational status (`StatusLight`).
  - Right strip displays active network indicators (`ApiCallIndicator`).

### Law 4: Strict Icon-Only Action Buttons & Label Limits
- Action buttons in toolbars, headers, and docks MUST feature monochromatic vector icons.
- Label texts must strictly adhere to the 4-word limit ($\mathbf{L_{18}}$). Longer descriptions appear in the bottom strip on hover ($\mathbf{L_{19}}$).

### Law 5: 100% Theme Token Semantics
- **BANNED**: Hardcoded `#hex`, `rgb()`, or ad-hoc Tailwind colors.
- **MANDATORY**: Consume standardized `--skipo-*` CSS design tokens:
  ```css
  var(--skipo-bg)
  var(--skipo-surface)
  var(--skipo-matte-bg)
  var(--skipo-border)
  var(--skipo-accent)
  var(--skipo-accent-fg)
  var(--skipo-accent-glow)
  var(--skipo-text)
  var(--skipo-text-muted)
  var(--skipo-radius)
  var(--skipo-shadow)
  ```

### Law 6: Code Limits & Decomposition
- Maximum 200 lines per file ($\le 200\text{L}$).
- Exactly one exported component per `.tsx` file.
- Top-level files (`App.tsx`, `page.tsx`) must be clean, import-only wrappers.

---

## 1. CANONICAL REACT ATOMIC COMPONENT TEMPLATE

```tsx
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import React from "react";
import { IconOnlyButton } from "@skipo/ui";
import { useBottomStrip } from "@skipo/ui/context";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & COMPONENT PROP INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════
export interface DiagnosticsActionButtonProps {
  workspaceIdentifier: string;
  onTriggerDiagnosticsAction?: (workspaceId: string) => void;
  isDisabled?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. REACT ATOM COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: DiagnosticsActionButton
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Icon-only control button triggering system health diagnostics, routing
 *          human-readable hover inspection copy to the centralized bottom strip.
 *
 * Flow Chart:
 *   [Idle State: SVG Icon] ───► [User Hover: Emit copy to BottomStripContext]
 *                                         │ (Click)
 *                                         ▼
 *                              [Dispatch Diagnostics Handler]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export const DiagnosticsActionButton: React.FC<DiagnosticsActionButtonProps> = ({
  workspaceIdentifier,
  onTriggerDiagnosticsAction,
  isDisabled = false
}) => {
  const { setInspectionText } = useBottomStrip();

  const handleMouseEnter = () => {
    setInspectionText("Run diagnostic health check");
  };

  const handleMouseLeave = () => {
    setInspectionText("");
  };

  return (
    <IconOnlyButton
      ariaLabel="Run Diagnostics"
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onTriggerDiagnosticsAction?.(workspaceIdentifier)}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </IconOnlyButton>
  );
};
```

---

## 2. VERIFICATION PROTOCOL

1. **Aspect 02: UI Primitives & Themes Validator**:
   ```bash
   python3 checklists/02_ui_primitives_themes.py .
   ```
2. **Aspect 03: Layout Shell Invariants Validator**:
   ```bash
   python3 checklists/03_layout_shell_invariants.py .
   ```
3. **Aspect 04: Code Limits & Purity Validator**:
   ```bash
   python3 checklists/04_code_limits_purity.py .
   ```
