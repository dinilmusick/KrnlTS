# TASK: NODE_GRAPH_IMPLEMENTATION_ENFORCEMENT

$$\text{Valid}(\mathcal{G}) \iff \text{Controls}(\mathcal{G}) \wedge \text{Layout}(\mathcal{G}) \wedge \text{Wiring}(\mathcal{G}) \wedge \text{Sockets}(\mathcal{G}) \wedge \text{ExitCode}(\text{Validator}) = 0$$

You are a coding agent operating inside the **Skipo** codebase. Your sole job on this turn is to audit the node graph subsystem — located at `packages/systems/src/node-graph/` — against every specification below and implement every missing or incomplete behaviour. Do not stop until all controls work, no clipping occurs, and `python3 assistant.py validate .` exits with code 0.

> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY GRAPH PURGE ($\mathbf{L_{21}}$)**:
> Completely purge any competing legacy node-graph implementations, unvetted SVG canvas wrappers, canvas-leaking event listeners, or deprecated wire drawing routines. Leave zero trace behind. The app must exclusively use the canonical Skipo node graph subsystem.

---

## 0. MANDATORY FIRST STEP — READ THE SPECIFICATION

Before touching any file, read these files in full:

```
packages/systems/src/node-graph/types.ts
packages/systems/src/node-graph/NodeCard.tsx
packages/systems/src/node-graph/NodeGraphCanvas.tsx
packages/systems/src/node-graph/MovableSocketView.tsx
packages/systems/src/node-graph/WireRenderer.tsx
packages/systems/src/node-graph/spatial/socketCoordinates.ts
packages/systems/src/node-graph/spatial/SpatialEngine.ts
packages/systems/src/node-graph/spatial/TraceEngine.ts
packages/systems/src/node-graph/spatial/AutoSolidify.ts
AGENTS.md
```

Then run the validator to see the current violation list:

```bash
python3 assistant.py validate .
pnpm test
```

---

## 1. NODE BODY — NATURAL CONTENT-DRIVEN EXPANSION (No Clipping)

**VIOLATION**: Node body has a fixed `height` or `overflow: hidden`, causing child content to be clipped.

**MANDATORY LAYOUT INVARIANT** — the outer wrapper and node body must use:

```tsx
// Outer wrapper (position: absolute on the canvas)
style={{
  position: 'absolute',
  left: node.position.x,
  top: node.position.y,
  minWidth: node.width ?? 130,
  width: node.width ? `${node.width}px` : 'max-content',
  minHeight: node.height ?? 130,
  height: 'auto',        // ← NEVER a fixed pixel height
  userSelect: 'none',
}}

// Inner node body (the styled card)
style={{
  width: '100%',
  minHeight: node.height ?? 130,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'visible',   // ← NEVER 'hidden'
  boxSizing: 'border-box',
  // ... border, background, etc.
}}
```

**Top emblem area** (icon section):
```tsx
style={{
  flex: '1 0 auto',     // ← NOT a fixed height fraction
  minHeight: '84px',
  // ... center align, padding
}}
```

**Bottom label area** (text section):
```tsx
style={{
  flex: '0 0 auto',     // ← NOT a fixed height fraction
  minHeight: '38px',
  // ... padding, border-top
}}
```

**LIVE HEIGHT MEASUREMENT** — socket `topOffset` must be computed from the actual rendered height, not from a hardcoded guess:

```tsx
const cardRef = useRef<HTMLDivElement>(null);
const [measuredHeight, setMeasuredHeight] = useState<number>(node.height ?? 130);

useLayoutEffect(() => {
  if (cardRef.current) {
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.height && Math.abs(rect.height - measuredHeight) > 1) {
      setMeasuredHeight(rect.height);
    }
  }
});
```

Then use `measuredHeight` for socket offsets:

```tsx
const topOffset = total === 1
  ? measuredHeight * 0.5
  : (measuredHeight * 0.25) + idx * 24;
```

---

## 2. MOUSE CONTROLS ON THE CANVAS

`NodeGraphCanvas.tsx` must implement **all** of the following mouse interactions. Verify each one exists and is wired to the container's event handlers:

### 2.1 Pan (Middle Mouse Button or Space+Drag)

```
Middle click + drag → pans the viewport (panX, panY)
```

Implementation check — `handleMouseDown` must detect `e.button === 1`:

```tsx
if (e.button === 1) {
  setIsPanning(true);
  return;
}
```

`handleMouseMove` must apply `e.movementX / e.movementY` to viewport pan when `isPanning` is true.

### 2.2 Zoom (Mouse Wheel)

```
Scroll wheel → zooms centred on the cursor position
```

Zoom formula must maintain cursor position as the invariant point:

```tsx
const graphX = (mouseX - viewport.panX) / viewport.zoom;
const graphY = (mouseY - viewport.panY) / viewport.zoom;
onViewportChange({
  zoom: newZoom,
  panX: mouseX - graphX * newZoom,
  panY: mouseY - graphY * newZoom,
});
```

Clamp zoom between `config?.minZoom ?? 0.25` and `config?.maxZoom ?? 2.5`.

### 2.3 Node Drag

```
Left click on a node + drag → moves the node in canvas space
```

- Mouse-down on a node: store `nodeMouseDownPos`, start `dragNodeId`.
- Mouse-move: only start moving after cursor has exceeded 4px threshold (`hasDraggedNode.current`).
- Apply delta divided by `viewport.zoom` to translate correctly at any zoom level:
  ```tsx
  const dx = e.movementX / viewport.zoom;
  const dy = e.movementY / viewport.zoom;
  ```
- Mouse-up: clear `dragNodeId`. If drag threshold was NOT crossed, treat as a click (select + optional smooth-pan).

### 2.4 Box Selection

```
Left click on empty canvas + drag → draws a selection rectangle
Releasing → selects all nodes whose bounding boxes intersect the rectangle
```

- Start box on `e.target === containerRef.current` (bare canvas surface).
- Render the live rectangle as an overlay div with `pointerEvents: 'none'`.
- On mouse-up: call `getNodesInSelection(...)` and pass result to `onSelectionChange`.

### 2.5 Wire Drawing (Rubber-Band)

```
Mouse-down on a socket → begins wire
Mouse-move → rubber-band wire follows cursor
Mouse-up on compatible socket → commits edge
Mouse-up on empty canvas → opens CompatibleNodePicker
```

Implementation requirements:
- `handleSocketMouseDown` sets `connecting` state with `{ nodeId, socketId, type, dataType, startX, startY, endX, endY }`.
- `handleMouseMove` updates `connecting.endX / endY` while `connecting` is non-null.
- `handleSocketMouseUp` validates compatibility via `ConnectionRuleStore.canConnect(...)` before creating an edge.
- Incompatible sockets must silently cancel — no error thrown.

### 2.6 Auto-Pan to Node on Click-Select

```
Clicking a node (without dragging) → smoothly pans camera to centre the node
   → ONLY if the node is outside the centre dead zone
```

Use `isNodeInCenterDeadZone(node, viewport, w, h)` from `Viewport.ts`. If outside the dead zone, call `smoothPanTo(targetPan.panX, targetPan.panY)`. Never auto-pan when the user has actually dragged the node.

### 2.7 Right-Click Context Menu

```
Right-click on canvas → opens CanvasContextMenu at cursor position
```

`handleContextMenu` must call `e.preventDefault()` and open `CanvasContextMenu` with `{ x, y, graphX, graphY }`.

---

## 3. KEYBOARD SHORTCUTS

All keyboard shortcuts must be implemented via a `window.addEventListener('keydown', ...)` effect in `NodeGraphCanvas.tsx`, and cleaned up via the returned teardown function. Required shortcuts:

| Key | Behaviour |
|:----|:----------|
| `N` (when not in an input) | Open `NodeSearchPalette` at last known mouse position |
| `Cmd/Ctrl + A` | Select all nodes |
| `Delete` or `Backspace` | Delete all currently selected nodes and their connected edges |
| `Escape` | Close all open overlays (`contextMenu`, `pickerState`, `spawnMenuState`, `connecting`) |

---

## 4. SOCKET SYSTEM

### 4.1 Socket Spatial Clearance Invariant

Every socket handle must be pushed **outward** from the node body edge by at least **12px** so it is never obscured by the border. Use `calculateSocketCoordinates(...)` from `spatial/socketCoordinates.ts`:

```ts
const { effectiveX, effectiveY } = calculateSocketCoordinates(baseY, {
  cardWidth,
  isOutput: socket.type === 'output',
  clearance: 12,
  nudge: socket.offset ?? { x: 0, y: 0 },
});
```

### 4.2 Socket Nudge Gizmo

Each socket must support a **drag-to-nudge** gizmo that lets the user fine-position the socket handle independently of the node body. The nudge offset is stored in `socket.offset: { x: number; y: number }` on the `Socket` interface and persisted back through `onSocketNudgeChange`.

Implementation inside `MovableSocketView.tsx`:
- Mouse-down on the gizmo starts nudge drag.
- Mouse-move updates `localNudge` state.
- Mouse-up commits via `onSocketNudgeChange(nodeId, socketId, localNudge)`.

### 4.3 Beam Tether Rendering

When a socket has a non-zero nudge offset, render a **tapered SVG polygon beam** connecting the node body to the displaced socket handle. Use `getBeamPoints(nudge, baseW=5, headW=1.2)` from `spatial/socketCoordinates.ts`.

The beam must be rendered as an SVG `<polygon>` overlaid on the socket gizmo, with a subtle translucent fill using `var(--skipo-accent)`.

### 4.4 Connection Validation

Before committing a new edge, ALWAYS validate via `ConnectionRuleStore`:

```ts
const canConnect = ConnectionRuleStore.canConnect(
  { handleCategory: 'DATA', dataType: sourceSocket.dataType || 'ANY', direction: 'OUTPUT' },
  { handleCategory: 'DATA', dataType: targetSocket.dataType || 'ANY', direction: 'INPUT' }
);
```

Rules:
- Output → Input connections only (never Input → Input or Output → Output).
- Self-connections (same node) are forbidden.
- Type incompatibility silently cancels the connection.

---

## 5. WIRE RENDERING

`WireRenderer.tsx` must render:

### 5.1 Committed Edges

For every `GraphEdge` in `edges`, draw a **cubic bezier SVG path** between the source output socket and the target input socket. The control point offset should be proportional to the horizontal distance between nodes (typically `Math.abs(dx) * 0.4` with a minimum of 60px):

```tsx
const cp1x = x1 + cpOffset;
const cp1y = y1;
const cp2x = x2 - cpOffset;
const cp2y = y2;
const d = `M ${x1},${y1} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
```

### 5.2 Live Rubber-Band Wire

While `connecting` is non-null, draw a dashed bezier from `connecting.startX/Y` to `connecting.endX/Y` in accent color with `strokeDasharray="6 4"` to visually distinguish it from committed wires.

### 5.3 Wire Appearance

- Committed wires: `stroke: var(--skipo-accent, #61afef)`, `strokeWidth: 2`, `fill: none`, `opacity: 0.85`
- Live rubber-band: same stroke, `strokeDasharray: "6 4"`, `opacity: 0.65`
- Hover effect: increase `strokeWidth` to 3 and `opacity` to 1 on hover.

---

## 6. NODE SPAWNING

### 6.1 Context Menu Spawn

Right-click → `CanvasContextMenu` → "Add Node" → spawn at `(contextMenu.graphX, contextMenu.graphY)` in graph space.

### 6.2 N-Key Search Palette

Press `N` → `NodeSearchPalette` opens at last cursor position. User types to filter available node types. Selecting a type spawns the node at the palette's graph position.

### 6.3 Compatible Node Picker (Wire-to-Canvas Drop)

Dragging a wire and releasing on empty canvas → `CompatibleNodePicker` opens. It shows only node types with a compatible socket for the dragged wire's `dataType`. Selecting spawns the node and immediately solidifies the connection.

### 6.4 Multi-Spawn Offset

When spawning multiple nodes simultaneously (e.g., from picker multi-select), offset each subsequent node:
```ts
posX = graphX + idx * 200;
posY = graphY + idx * 40;
```

---

## 7. SELECTION SYSTEM

| Interaction | Behaviour |
|:------------|:----------|
| Left-click node | Select that node, deselect all others |
| Cmd/Ctrl + click node | Toggle node in/out of selection |
| Box drag on canvas | Select all nodes whose bounding box intersects |
| Cmd/Ctrl + A | Select all nodes |
| Click empty canvas | Deselect all |
| Delete/Backspace | Delete selected nodes + their edges |

Selected nodes must visually indicate selection: `border: 2px solid var(--skipo-accent)` and `boxShadow: '0 0 16px rgba(212, 175, 55, 0.45)'` (or equivalent accent glow).

---

## 8. VIEWPORT SMOOTH PAN

The `smoothPanTo(targetX, targetY)` function must use a cubic ease-out animation over **220ms** via `requestAnimationFrame`:

```ts
const ease = 1 - Math.pow(1 - progress, 3);
```

Always cancel any in-flight animation frame before starting a new one. Clean up the animation frame ref on component unmount.

---

## 9. NODE GRAPH FILE STRUCTURE COMPLIANCE

Each file in `packages/systems/src/node-graph/` must comply with Law L9 (≤ 200 lines). The current known oversized file is `NodeGraphCanvas.tsx` (447 lines). It MUST be split:

**Suggested decomposition** (each file ≤ 200 lines):

| New File | Responsibility |
|:---------|:--------------|
| `NodeGraphCanvas.tsx` | Root composition only — renders the container, nodes, overlays |
| `useNodeGraphControls.ts` | All mouse/keyboard event handler logic |
| `useNodeGraphConnections.ts` | Wire drawing state, socket connect/disconnect logic |
| `useNodeGraphPicker.ts` | Picker/context menu/spawn menu state |
| `NodeGraphOverlays.tsx` | BoxSelection, CompatibleNodePicker, ContextMenu, SearchPalette renders |

After splitting, verify all imports resolve and `pnpm typecheck` exits 0.

---

## 10. SPATIAL ENGINE — TRACE & AUTO-SOLIDIFY

When `config.tracingEnabled` is true:
- `TraceEngine.ts` computes proximity traces between unconnected handles.
- `AutoSolidify.ts` promotes traces to `SolidConnection` objects when within `config.traceCutoffDistance ?? 80` px.

Ensure neither file has been stubbed out. Each must contain real computational logic (minimum 5 meaningful statements per exported function). Verify with:

```bash
python3 checklists/06_anti_stub_asset_depth.py .
```

---

## 11. EXIT GATE — MANDATORY BEFORE DECLARING DONE

All of the following must pass before you declare this task complete:

```bash
# 1. Full system validation (must exit 0)
python3 assistant.py validate .

# 2. All tests passing
pnpm test

# 3. TypeScript clean
pnpm typecheck

# 4. Build clean
pnpm --filter @skipo/systems build
```

Output the validator scorecard and test results as evidence. If any step fails, debug and fix before declaring done.

---

## HOW TO USE THIS PROMPT

Paste the full contents of this file as the opening message to any coding agent working on the node graph inside the Skipo codebase. The agent should:

1. Read all node graph files listed in Section 0.
2. Audit each section (1–10) in order and implement every missing behaviour.
3. Re-run `pnpm test` and `python3 assistant.py validate .` after each section.
4. Finish only when all exit gates in Section 11 pass with code 0.
