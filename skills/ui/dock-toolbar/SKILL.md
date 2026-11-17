---
name: dock-toolbar-guidelines
description: Directives for the main app window switcher dock toolbar, 4-edge user positioning (top/bottom/left/right), auto-hide trigger zones, icon-only window switching, and brutalist dock styling.
---

# MAIN WINDOW SWITCHER DOCK TOOLBAR GUIDELINES

## 1. DOCK ARCHITECTURE & WINDOW SWITCHING
```
Dock Purpose: Primary navigation bar switching between the main application windows / views.
Visual Model: Floating macOS-style Dock styled with Neo-Brutalist 2.5D / Glass aesthetics.
Item Content: Monochromatic icons representing each primary window (Graph, Dashboard, Settings, Database, Editor, etc.).
```

---

## 2. 4-EDGE CONFIGURABLE ALIGNMENT
The dock's screen alignment MUST be user-configurable and persisted in user settings:
```typescript
type DockPosition = "top" | "bottom" | "left" | "right";
```
- **Orientation Behavior**:
  - `top` / `bottom`: Horizontal layout (`flex-row`), centered along the top or bottom viewport edge.
  - `left` / `right`: Vertical layout (`flex-col`), centered along the left or right viewport edge.
- **Position-Aware Tooltip Placement**:
  - `position === "top"` $\to$ Tooltip placement MUST be `"bottom"` (pops downward into view).
  - `position === "bottom"` $\to$ Tooltip placement MUST be `"top"` (pops upward).
  - `position === "left"` $\to$ Tooltip placement MUST be `"right"` (pops rightward).
  - `position === "right"` $\to$ Tooltip placement MUST be `"left"` (pops leftward).

---

## 3. AUTO-HIDE BEHAVIOR & SENSING ZONES
The dock MUST support an optional user toggleable `autoHide: boolean` mode:
```
autoHide === true:
  1. Idle State: Dock retracts off-screen, leaving a subtle 4px - 6px trigger strip at the screen edge.
  2. Reveal State: Hovering over the edge trigger strip (or within 20px of the edge) smoothly slides the dock into view (< 200ms transition).
  3. Dismiss State: Moving cursor away from the dock area triggers a debounced collapse (300ms delay to prevent accidental dismissal).
```

---

## 4. STRICT ICON-ONLY & ACTIVE INDICATOR PROTOCOL
```
∀ window_icon ∈ Dock_Items:
  content(window_icon) ≡ Monochromatic_SVG_Icon
  label(window_icon, state = DEFAULT) ≡ ∅ (NO PERSISTENT TEXT)
  label(window_icon, state = HOVER)   ≡ Themed_Tooltip(window.title)
```
- **Active State Indicator**:
  - The active window icon features a subtle brutalist indicator block, pill highlight, or rune glow dot beneath/beside the active icon.
- **Click Behavior**:
  - Clicking an inactive window icon switches active view with a fast, non-blocking transition (<200ms).
  - Clicking the active window icon toggles minimize or focuses the view.

---

## 5. VISUAL STYLING (NEO-BRUTALIST GLASS PANEL)
- **Container**: Floating panel with `backdrop-filter: blur(12px)`, locked palette background with high transparency, and crisp 1px - 2px solid brutalist border.
- **Shadow**: Crisp, hard-edged offset shadow matching the 2.5D theme.
- **Icon Hover**: Subtle scale transform (`scale-110` / `scale-115`) with quick spring or ease-out timing.
