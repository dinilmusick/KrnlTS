# TASK: UI_COMPONENT_AND_FRONTEND_PROTOCOL
$UI := \text{IconOnlyControls} \otimes \text{TooltipOnHover} \otimes \text{NeoBrutalistGlow} \otimes \text{CentralStyleAuthority}

## 0. INVIOLABLE STRUCTURAL LAWS (FRONTEND — CHECK BEFORE WRITING ANY FILE)

### LAW 1: Top-Level File Purity
```
App.tsx / index.tsx / main.tsx / _app.tsx MUST contain ONLY:
  ✓ import statements
  ✓ A single root export: export default function App() { return <AppShell /> }

NEVER put in top-level files:
  ✗ <div>, <span>, <button>, <section>, or ANY JSX/HTML
  ✗ useState, useEffect, useRef, or ANY React hook
  ✗ Inline styles, className logic, or layout code
  ✗ Data fetching, API calls, business logic
  ✗ Conditional rendering that produces markup

VIOLATION → MANDATORY REFACTOR:
  Extract all offending content into a named component file, then import it.
```

### LAW 2: One Component Per File
```
Each .tsx file = ONE exported React component (plus its Props type, nothing else major).

If a component's JSX body exceeds ~50 lines OR the file approaches 150 lines:
  SPLIT into a folder:
    MyComponent/
      MyComponent.tsx          ← orchestrator: renders sub-components only
      MyComponentHeader.tsx    ← sub-component
      MyComponentBody.tsx      ← sub-component
      MyComponentFooter.tsx    ← sub-component
      useMyComponentLogic.ts   ← stateful logic hook
      MyComponent.types.ts     ← shared interfaces/types

Two React components in a single file = IMMEDIATE VIOLATION.
```

### LAW 3: 200-Line Maximum
```
HARD LIMIT: 200 lines per .tsx / .ts file, no exceptions.
At 180 lines → begin extraction.
```

## 1. STRICT DESIGN & INTERACTION INVARIANTS (MANDATORY)
1. **Zero On-Screen Explanatory/Marketing Text**:
   - FORBID direct text descriptions, tutorials, promotional copy, or verbose "how-to" guidance rendered into the UI view.
   - All explanations and control functions MUST appear **exclusively on hover** via tooltips (`data-tooltip` or hover popover).
2. **Strict Icon-Only Buttons (Zero Text Labels)**:
   - Buttons MUST NOT render text labels directly on their surface.
   - Buttons contain strictly monochromatic vector/SVG icons.
   - Label text and shortcut hints appear **exclusively on hover** via a styled tooltip.
3. **Subtle Neo-Brutalist Tactile Glow**:
   - Apply subtle ambient neon/rune glow (`box-shadow: 0 0 10px var(--krnl-accent-glow)` or `0 0 14px rgba(212, 163, 89, 0.22)`) on hover, active borders, and selected nodes.
   - Preserves crisp Neo-Brutalist 1px-2px solid borders while giving a lively, tactile, responsive feel.
4. **Central Style Authority (No Hardcoded CSS)**:
   - All components MUST consume CSS design tokens:
     ```css
     var(--krnl-bg-primary)
     var(--krnl-bg-surface)
     var(--krnl-border)
     var(--krnl-accent)
     var(--krnl-accent-glow)
     var(--krnl-text-primary)
     var(--krnl-text-muted)
     var(--krnl-radius)
     var(--krnl-shadow)
     ```

## 2. CANONICAL ATOMIC REACT COMPONENT TEMPLATE
```tsx
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import React, { useState } from "react";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & COMPONENT PROP INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════
export interface DiagnosticsControlButtonProps {
  targetEntityIdentifier: string;
  onTriggerDiagnosticsAction?: (entityIdentifier: string) => void;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. REACT ATOM COMPONENT IMPLEMENTATION (ICON-ONLY + HOVER TOOLTIP + SUBTLE GLOW)
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: DiagnosticsControlButton
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Icon-only Neo-Brutalist control button with subtle ambient glow on hover,
 *          triggering diagnostic routines while revealing action descriptions strictly via tooltip.
 *
 * Flow Chart:
 *   [Default State: Icon Only] ───► [User Hover: Reveal Tooltip + Ambient Glow]
 *                                              │ (Click)
 *                                              ▼
 *                                   [Dispatch Diagnostics RPC]
 *
 * Example:
 *   <DiagnosticsControlButton 
 *     targetEntityIdentifier="PaymentCoordinator" 
 *     onTriggerDiagnosticsAction={(id) => console.log("Run diagnostics for", id)} 
 *   />
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export const DiagnosticsControlButton: React.FC<DiagnosticsControlButtonProps> = ({
  targetEntityIdentifier,
  onTriggerDiagnosticsAction
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Icon-Only Button with Subtle Neo-Brutal Glow on Hover */}
      <button
        className="krnl-btn-icon-only"
        aria-label="Run Diagnostics Routine"
        style={{
          background: isHovered ? "var(--krnl-bg-surface)" : "var(--krnl-bg-primary)",
          border: "1px solid var(--krnl-border)",
          borderRadius: "var(--krnl-radius)",
          padding: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          boxShadow: isHovered 
            ? "0 0 12px var(--krnl-accent-glow), 2px 2px 0px var(--krnl-border)" 
            : "2px 2px 0px var(--krnl-border)"
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onTriggerDiagnosticsAction?.(targetEntityIdentifier)}
      >
        {/* Monochromatic Vector Icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </button>

      {/* Text description revealed STRICTLY ON HOVER via Tooltip */}
      {isHovered && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--krnl-bg-surface)",
            border: "1px solid var(--krnl-border)",
            borderRadius: "var(--krnl-radius)",
            padding: "4px 8px",
            fontSize: "12px",
            color: "var(--krnl-text-primary)",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            pointerEvents: "none"
          }}
        >
          Run System Diagnostics ({targetEntityIdentifier})
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. BACKEND CONNECTION WIZARD & WORKSPACE STORAGE UX STANDARD
// ══════════════════════════════════════════════════════════════════════════════════════════
/**
 * Invariants for Backend Connection UX:
 * 1. Prompt "Where should your data live?" with Tri-Choice Storage (Local, BYOB Connect, Managed).
 * 2. Driven dynamically via ProviderRegistry (supportsOAuth, supportsAutoProvisioning, supportsManual).
 * 3. Connection State Machine:
 *    DISCONNECTED ──► SELECT_PROVIDER ──► AUTHENTICATING ──► VERIFYING ──► INITIALIZING ──► READY
 * 4. Zero Secrets Exposure: service_role / master keys strictly prohibited client-side.
 * 5. Action controls (Test, Reconfigure, Disconnect) rendered strictly as icon-only with hover tooltips.
 */

```
