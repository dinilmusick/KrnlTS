# TASK: UI_COMPONENT_AND_FRONTEND_PROTOCOL
$UI := \text{ReactiveAtoms} \otimes \text{StyleAuthority} \otimes \text{TopologicalVisualizers}

## 1. IN-CODE UTILITY DOCUMENTATION, SECTION DEMARCATION & NAMING RULES
- **Naming**: Use long, descriptive names for all UI atom components and props interfaces (e.g., `RealtimeSystemHealthMonitoringCard.tsx`, `RealtimeSystemHealthMonitoringCardProps`).
- **Docblocks**: Document the utility of all components, prop contracts, and event dispatchers with an ASCII component tree diagram.
- **Section Demarcation**: Partition imports, prop interfaces, styled containers, and React component definitions with `// ══════════════════════════════════════════════════════════════════════════════════════════`.

## 2. CENTRAL STYLE AUTHORITY (NO HARDCODED CSS)
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

## 3. CANONICAL ATOMIC REACT COMPONENT TEMPLATE
```tsx
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & COMPONENT PROP INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════
export interface RealtimeSystemHealthMonitoringCardProps {
  targetEntityIdentifier: string;
  initialHealthStatus?: "HEALTHY" | "DEGRADED" | "CRITICAL";
  onTriggerDiagnosticsAction?: (entityId: string, actionPayload: Record<string, any>) => void;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. REACT ATOM COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: RealtimeSystemHealthMonitoringCard
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Renders reactive health telemetry for an active system entity, listening for
 *          "state:changed" events and providing a direct trigger for diagnostic routines.
 *
 * Component Flow Chart:
 *   [Entity Telemetry Stream] ───► [Update Local State]
 *                                           │
 *                                           ▼
 *                                 [Render Status Card UI]
 *                                           │ (On Button Click)
 *                                           ▼
 *                              [Dispatch onTriggerDiagnosticsAction]
 *
 * Example:
 *   <RealtimeSystemHealthMonitoringCard 
 *     targetEntityIdentifier="DatabaseCoordinator"
 *     onTriggerDiagnosticsAction={(id, data) => console.log(id, data)}
 *   />
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export const RealtimeSystemHealthMonitoringCard: React.FC<RealtimeSystemHealthMonitoringCardProps> = ({
  targetEntityIdentifier,
  initialHealthStatus = "HEALTHY",
  onTriggerDiagnosticsAction
}) => {
  const [currentHealthStatus, setCurrentHealthStatus] = useState(initialHealthStatus);

  return (
    <div
      className="krnl-atom-monitoring-card"
      style={{
        background: "var(--krnl-bg-surface)",
        border: "1px solid var(--krnl-border)",
        borderRadius: "var(--krnl-radius)",
        padding: "20px",
        boxShadow: "var(--krnl-shadow)"
      }}
    >
      <h4 style={{ color: "var(--krnl-text-primary)", margin: "0 0 8px 0" }}>
        {targetEntityIdentifier}
      </h4>
      <p style={{ color: "var(--krnl-text-muted)", margin: "0 0 16px 0" }}>
        Status: <span style={{ color: "var(--krnl-accent)" }}>{currentHealthStatus}</span>
      </p>
      <button
        className="krnl-btn-accent"
        style={{
          background: "var(--krnl-accent)",
          color: "#ffffff",
          border: "none",
          borderRadius: "var(--krnl-radius)",
          padding: "8px 16px",
          cursor: "pointer"
        }}
        onClick={() => onTriggerDiagnosticsAction?.(targetEntityIdentifier, { initiatedAt: Date.now() })}
      >
        Run Diagnostics Routine
      </button>
    </div>
  );
};
```
