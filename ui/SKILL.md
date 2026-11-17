---
name: ui-sub-router
description: Sub-router directing agents deterministically to modular UI sub-skills.
---

# UI AGENT SUB-ROUTER

$$\text{Route}(\tau) = \arg\max_{s \in \mathcal{S}_{\text{ui}}} |\text{Keywords}(s) \cap \text{Tokens}(\tau)|$$

| Sub-Skill | Scope / Formal Directives |
| :--- | :--- |
| [`omni-canvas/SKILL.md`](./omni-canvas/SKILL.md) | Single canvas viewport, Viewer Nodes, 'Views' handle, wire drag |
| [`styling/SKILL.md`](./styling/SKILL.md) | Neo-brutalism 2.5D, icon-only buttons, zero tooltips, 100% theme tokens |
| [`code-editor/SKILL.md`](./code-editor/SKILL.md) | Monaco Editor, krnl-dark, bounded height, zero unstyled textareas |
| [`dock-toolbar/SKILL.md`](./dock-toolbar/SKILL.md) | 4-edge positioning, auto-hide trigger zones, icon-only switcher |
| [`tiled-menus/SKILL.md`](./tiled-menus/SKILL.md) | `@dnd-kit` sortable grid, collision-aware popovers ($\text{top} < 80\text{px}$) |
| [`wiring/SKILL.md`](./wiring/SKILL.md) | Real backend drivers, buffered empty input state, reactive push |
| [`force-graph/SKILL.md`](./force-graph/SKILL.md) | Physics decay, VSync RAF batch scheduler, DPR $\le 2$ cap |
| [`react-flow/SKILL.md`](./react-flow/SKILL.md) | 2.5D cards, edge delete gizmo, drag-wire auto-spawn, hotkeys |
| [`backend-connection/SKILL.md`](./backend-connection/SKILL.md) | Tri-choice storage, ProviderRegistry, Admin UI panel isolation |

```python
def route_ui(intent: str) -> str:
    routes = {
        "omni": "omni-canvas", "style": "styling", "monaco": "code-editor",
        "dock": "dock-toolbar", "tile": "tiled-menus", "wire": "wiring",
        "graph": "force-graph", "flow": "react-flow", "storage": "backend-connection"
    }
    return next((f"./{v}/SKILL.md" for k, v in routes.items() if k in intent.lower()), "./omni-canvas/SKILL.md")
```
