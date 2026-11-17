---
name: omni-canvas-paradigm
description: Complete specification for the Omni Canvas Paradigm in application design, featuring unified infinite 4-quadrant canvas, Viewer Nodes, monochromatic SVG icons, 'Views' socket handles, and canvas window management.
---

# OMNI CANVAS PARADIGM (DENSE)

$$\text{CanvasPlane} \equiv \mathbb{R}^2 \quad \wedge \quad \text{Icons} \equiv \text{MonochromaticSVG} \wedge \text{Emojis} = \emptyset$$

## 1. 4-QUADRANT INFINITE PLANE
1. Negative & positive coordinates ($-\infty \dots +\infty$). Zero wire clipping past $(0,0)$.
2. Concept nodes and interactive Viewer Nodes coexist on the single unified plane.

## 2. 'VIEWS' SOCKET HANDLE & AUTO-SPAWN

```
[Node Body] ──(socket-views)──► Wire ──► [Viewer Node (Widget Window)]
```

- Every node exposes a `.socket-views` handle (purple circular badge).
- Dragging wire from `.socket-views` opens contextual **View Selector**:
  - `UI View & Atom Builder`: Live rendered component + drag-and-drop palette
  - `Monaco Source Viewer`: Full TypeScript source code inspection & editing
  - `Sandboxed Test Bench`: Interactive JSON execution sandbox with latency metrics
  - `Reactive State Inspector`: Real-time reactive state JSON inspector

## 3. VIEWER WIDGET WINDOW INVARIANTS
1. **Draggable**: Drag window titlebar.
2. **Resizable**: Drag corner handle with auto-reflow (`editor.layout()`).
3. **Controls**: `✕ Close` unmounts node and removes tethering wire.
4. **Z-Index**: Click brings to top of canvas focus stack.

## 4. CHECKLIST GATE
`python3 checklists/02_ui_primitives_themes.py .` && `python3 checklists/03_layout_shell_invariants.py .`
