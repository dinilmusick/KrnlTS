---
name: react-flow-guidelines
description: Directives for react-flow node graph interaction controls, mouse button mappings, hotkeys, wire drag auto-spawn, edge delete gizmo z-index layering below node bodies, and visual differentiation across node categories.
---

# REACT FLOW INTERACTION & VISUAL RULES (DENSE)

$$\text{ZIndex}(\text{wires: 5}) < \text{ZIndex}(\text{gizmos: 7}) < \text{ZIndex}(\text{nodes: 10}) < \text{ZIndex}(\text{panels: 50})$$
$$\text{CanvasUI}: \text{FloatingButtons} = \emptyset \wedge \text{Actions} \subseteq \text{ContextMenu} \oplus \text{BottomDock}$$

## 1. INPUT BINDINGS & HOTKEY MATRIX

| Input | Target | Action |
| :--- | :--- | :--- |
| `LeftClick` | Node | Select node |
| `LeftDrag` | Node / Marquee | Move nodes / Box multi-select |
| `MiddleDrag` | Canvas | Pan canvas |
| `Wheel` | Canvas | Zoom centered on cursor |
| `N / n` | Canvas | Open Spawn Node Search Palette at cursor |
| `Del / Backspace` | Selection | Delete selected nodes & edges |
| `Cmd/Ctrl + C / V`| Selection | Copy / Paste topology at cursor |
| `Cmd/Ctrl + Z / Y`| History | Undo / Redo graph mutations |

## 2. SEARCH & KEYBOARD NAVIGATION INVARIANTS
All search palettes, compatible node pickers, and searchable lists MUST implement deterministic keyboard navigation:
1. **Auto-Highlight (Index 0)**: When search palette opens or search query changes, item 0 MUST be automatically highlighted (`highlightedIndex = 0`).
2. **Arrow Key Navigation**: `ArrowDown` increments highlighted index, `ArrowUp` decrements (with bounded or wrapping navigation).
3. **Immediate Enter-to-Spawn**: Pressing `Enter` immediately spawns the highlighted node at the targeted canvas/drop coordinates without requiring mouse clicks.
4. **Escape Dismissal**: `Escape` key dismisses any active search palette or context menu.

## 2. WIRE DRAG, MAGNETIC SNAPPING & AUTO-SPAWN ALGORITHM

$$\begin{array}{ll}
\mathbf{W_1} \text{ (Handle Drag Drop)} & \text{DropOnCanvas}(\text{wire}) \implies \text{OpenCompatibleNodePicker}(\text{compatibleTypes}(\text{sourceHandle})) \\
\mathbf{W_2} \text{ (Selection Auto-Spawn)} & \text{SelectNodeType}(T) \implies \text{Spawn}(T) \wedge \text{AutoWire}(\text{sourceHandle}, T.\text{matchingHandle}) \\
\mathbf{W_3} \text{ (Magnetic Snapping)} & \text{Distance}(\text{cursor}, \text{targetHandle}) \le 28\text{px} \implies \text{Snap}(\text{wireHead}, \text{targetHandle})
\end{array}$$

```python
def on_connect_end(event, source_handle):
    target = get_drop_target(event)
    if is_handle(target) and can_connect(source_handle, target):
        connect(source_handle, target)
    elif is_canvas(target):
        pos = screen_to_flow(event.clientX, event.clientY)
        compatible = ConnectionRuleStore.get_compatible_node_types(source_handle)
        open_compatible_node_picker(
            at=pos,
            candidates=compatible,
            on_select=lambda selected_types: [
                node := spawn_node(t, at=offset_pos(pos, idx)),
                auto_wire(source_handle, node.get_compatible_handle(source_handle))
                for idx, t in enumerate(selected_types)
            ]
        )
```

## 3. Z-INDEX & OCCLUSION LAW
Wire delete gizmos (`z=7`) and `SolidifyWidget` (`z=7`) **MUST ALWAYS render below node cards (`z=10`)**.
- `SolidifyWidget` must be **strictly icon-only** (SVG checkmark, zero text labels).
- All connection rules, handle types, wire types, and node types MUST be centrally registered in `ConnectionRuleStore`.

## 4. DETERMINISTIC GENERATION
Scaffold turnkey node graph suites inherently compliant with these invariants:
```bash
python3 assistant.py generate nodegraph src/frontend/components/[Name] --name [Name]
```

## 5. CHECKLIST GATE
`python3 checklists/02_ui_primitives_themes.py .` && `python3 checklists/03_layout_shell_invariants.py .`

