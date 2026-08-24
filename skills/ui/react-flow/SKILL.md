---
name: react-flow-guidelines
description: Directives for react-flow node graph interaction controls, mouse button mappings, hotkeys, wire drag auto-spawn, edge delete gizmos, and context menu actions with zero floating UI clutter.
---

# REACT FLOW NODE GRAPH INTERACTION GUIDELINES (`react-flow`)

## 1. MANDATORY MOUSE & CANVAS CONTROLS
```
Mouse Bindings:
  Left Click (on Node)        : Select single node
  Left Click + Drag (Canvas)  : Box selection (marquee multi-select)
  Middle Mouse + Drag         : Pan canvas (panOnDrag={[1]} or panOnScrollMode)
  Mouse Scroll Wheel          : Zoom in / Zoom out (zoomOnScroll={true})
```

---

## 2. WIRE DRAGGING & COMPATIBLE NODE AUTO-SPAWN
```
function onConnectEnd(event, sourceHandle):
    target = getDropTarget(event)
    if isHandle(target):
        establishConnection(sourceHandle, target)
    elif isCanvasBackground(target):
        dropPosition = screenToFlowPosition(event.clientX, event.clientY)
        compatibleTypes = getCompatibleNodeTypes(sourceHandle.dataType, sourceHandle.direction)
        
        openSpawnMenu(dropPosition, compatibleTypes, onSelect = (selectedNodeType) => {
            newNode = spawnNode(selectedNodeType, at = dropPosition)
            autoConnectHandle(sourceHandle, newNode.matchingHandle)
        })
```
- **Universal Wire Dragging**: Every handle (Input & Output) must support wire dragging.
- **Unconnected Drop Behavior**: Dropping a wire onto empty canvas space MUST trigger a contextual menu displaying compatible nodes.
- **Auto-Connection**: Selecting a node from the menu automatically instantiates the node at the drop coordinates and establishes the wire connection immediately.

---

## 3. WIRE DELETION GIZMO & CONNECTION MUTABILITY
```
∀ edge ∈ Graph_Edges:
  if edge.isDeletable == true:
      renderDeleteGizmo(position = edge.centerMidpoint, onClick = () => deleteEdge(edge.id))
  else:
      renderPlainWire(showDeleteGizmo = false) // Immutable / locked connection
```
- **Centered Delete Gizmo**: All deletable connections MUST render a centered delete gizmo (via `EdgeLabelRenderer` or midpoint SVG overlay) on the wire midpoint for instant deletion on click.
- **Immutable Connections**: Non-deletable / locked connections (e.g. system-mandatory schema links or fixed dependencies) MUST NOT render any delete gizmo.

---

## 4. FULL HOTKEY MATRIX
```
Key Combinations:
  Delete / Backspace  : Delete all currently selected nodes and edges (supports multi-selection)
  Ctrl+C / Cmd+C      : Copy selected nodes and internal edge topology
  Ctrl+V / Cmd+V      : Paste copied nodes at current cursor position
  Ctrl+X / Cmd+X      : Cut selected nodes
  Ctrl+A / Cmd+A      : Select all nodes and edges on canvas
  Ctrl+Z / Cmd+Z      : Undo previous graph mutation
  Ctrl+Y / Cmd+Shift+Z: Redo graph mutation
```

---

## 5. CONTEXT MENU ARCHITECTURE (ZERO FLOATING BUTTONS)
```
Location Separation:
  Canvas Right-Click (onPaneContextMenu) : Canvas options (Spawn New Node, Align Layout, Reset Zoom)
  Node Right-Click (onNodeContextMenu)   : Node-specific options (Edit Config, Duplicate, Disconnect, Delete)

FORBID:
  floating_canvas_buttons : ["+ Add Node", "Delete Selected", "Layout Toolbar", "Zoom Pills"]
  on_canvas_tutorials     : ["Drag to pan", "Scroll to zoom", control instruction watermarks, persistent help banners]
  canvas_descriptions     : [Text labels, descriptive overlays, usage guides rendered on canvas plane]

REQUIRE:
  All actions must reside EXCLUSIVELY in Right-Click Context Menus.
  Canvas viewport must remain clean, minimal, and free of persistent tutorial/instruction elements.
```
