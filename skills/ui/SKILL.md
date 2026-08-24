---
name: ui-sub-router
description: Sub-router directing agents deterministically to modular UI sub-skills for styling, backend wiring, dnd-kit tiled menus, force-graph canvas optimization, and react-flow node graphs.
---

# UI AGENT SUB-ROUTER

## 1. UI DOMAIN ROUTING TABLE
When developing or modifying any UI layer components, consult the specific sub-skill:

| UI Domain | Target Sub-Skill File | Key Directives Covered | Trigger Keywords |
| :--- | :--- | :--- | :--- |
| **Visual Styling & Theme** | [`styling/SKILL.md`](./styling/SKILL.md) | Neo-brutalism 2.5D biome, locked palettes, custom scrollbars/dropdowns, top-edge downward tooltips, regression guard | `theme`, `colors`, `biome`, `parallax`, `particles`, `scrollbars`, `dropdowns` |
| **Dock Toolbar & Window Switcher** | [`dock-toolbar/SKILL.md`](./dock-toolbar/SKILL.md) | macOS-style main window switcher dock, 4-edge positioning (top/bottom/left/right), auto-hide trigger zone, icon-only | `dock_toolbar`, `window_switcher`, `auto_hide`, `dock_position`, `main_toolbar`, `view_switcher` |
| **Tiled Menus & Drag-and-Drop** | [`tiled-menus/SKILL.md`](./tiled-menus/SKILL.md) | `@dnd-kit` sortable tiled menus, icon-only tiles, zero persistent text titles, hover tooltips (top-edge elements pop downward) | `tiled_menu`, `dnd_kit`, `tile_grid`, `icon_only`, `hover_tooltip` |
| **Wiring & Logic Binding** | [`wiring/SKILL.md`](./wiring/SKILL.md) | Mandatory backend wiring, zero UI stubs, anti-polling reactivity, input empty-state buffering & blur validation | `button_logic`, `form_submit`, `input_wiring`, `input_empty_state`, `form_validation`, `ui_stub` |
| **Tag Force Graph** | [`force-graph/SKILL.md`](./force-graph/SKILL.md) | Physics simulation optimizations (alphaDecay 0.08, charge -70, theta 0.9), single-frame VSync scheduler, DPR 2x cap | `tag_canvas`, `force_graph`, `simulation_physics`, `vsync_scheduler`, `dpr_cap` |
| **Connectable Node Graph** | [`react-flow/SKILL.md`](./react-flow/SKILL.md) | Middle-mouse pan, box select, scroll zoom, wire drag auto-spawn, centered wire delete gizmo (deletable edges only), full hotkeys, context menu only | `node_graph`, `react_flow`, `connect_nodes`, `wire_drag`, `auto_spawn`, `delete_gizmo`, `box_selection`, `context_menu` |

---

## 2. DETERMINISTIC UI DISPATCH LOGIC
```python
def dispatch_ui_task(task_type: str) -> str:
    mapping = {
        "styling": ["theme", "colors", "biome", "particles", "scrollbars", "dropdown_styles", "parallax"],
        "dock-toolbar": ["dock_toolbar", "window_switcher", "auto_hide", "dock_position", "main_toolbar", "view_switcher"],
        "tiled-menus": ["tiled_menu", "dnd_kit", "drag_drop_grid", "menu_tile", "hover_tooltip", "icon_only"],
        "wiring": ["button_click", "form_submit", "input_wiring", "input_empty_state", "form_validation", "ui_stub"],
        "force-graph": ["tag_canvas", "force_simulation", "physics_layout", "fps_optimization", "dpr_cap"],
        "react-flow": ["node_graph", "connect_nodes", "box_selection", "graph_context_menu", "react_flow"]
    }
    for subskill, keywords in mapping.items():
        if any(kw in task_type.lower() for kw in keywords):
            return f"./{subskill}/SKILL.md"
    return "./styling/SKILL.md"  # Default fallback
```
