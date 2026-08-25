```markdown
# TASK: UI_COMPONENT_AND_FRONTEND_PROTOCOL
$UI := \text{ReactiveAtoms} \otimes \text{StyleAuthority} \otimes \text{TopologicalVisualizers}

## 1. CENTRAL STYLE AUTHORITY (NO HARDCODED CSS)
All UI atoms MUST consume design tokens via CSS custom properties:
```css
/* Central CSS Design Tokens */
var(--krnl-bg-primary)
var(--krnl-bg-surface)
var(--krnl-border)
var(--krnl-accent)
var(--krnl-text-primary)
var(--krnl-text-muted)
var(--krnl-radius)
var(--krnl-shadow)
```

## 2. ATOMIC REACT COMPONENT TEMPLATE
Atoms must be self-contained, typed, and resilient:
```tsx
import React, { useState, useEffect } from "react";

interface AtomProps {
  entityId: string;
  initialState?: Record<string, any>;
  onAction?: (actionId: string, payload: any) => void;
}

export const EntityStatusCard: React.FC<AtomProps> = ({ entityId, initialState = {}, onAction }) => {
  const [state, setState] = useState(initialState);

  return (
    <div className="krnl-atom-card" style={{
      background: "var(--krnl-bg-surface)",
      border: "1px solid var(--krnl-border)",
      borderRadius: "var(--krnl-radius)",
      padding: "16px"
    }}>
      <h4 style={{ color: "var(--krnl-text-primary)" }}>{entityId}</h4>
      <p style={{ color: "var(--krnl-text-muted)" }}>Status: {state.status || "IDLE"}</p>
      <button 
        className="krnl-btn-accent"
        onClick={() => onAction?.("trigger", { entityId })}
      >
        Execute Action
      </button>
    </div>
  );
};
```

## 3. UI GRAPH & TOPOLOGY WIDGETS
1. **Force Graph**: Visualizes entity/functionality trees, dependencies, and bubbling interfaces using D3/Canvas.
2. **React Flow Pipeline**: Renders flow-builder pipelines (`KrnlFlowBuilder`) with inputs, steps, and transitions.
3. **Dock & Toolbar**: Docked window trays, action palettes, and floating radial/tiled menus.

## 4. INVARIANTS
1. UI components must never communicate via side-channels; all IO flows through entity RPC, HTTP endpoints, or WebSocket streams.
2. UI specs on functionalities (`uiSpec: { component: "...", renderMode: "..." }`) auto-register in the frontend generator.
```
