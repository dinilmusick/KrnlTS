---
name: tiled-menus-guidelines
description: Directives for dnd-kit tiled menus, drag-and-drop sortable grids, icon-only tiles with hover tooltips, and themed menu components.
---

# TILED MENUS & DND-KIT GUIDELINES

## 1. DND-KIT TILED ARCHITECTURE
```
Menu Architecture:
  framework : @dnd-kit (core, sortable, utilities)
  layout    : Grid-based tiled menus for all primary navigation & toolboxes
  behavior  : Smooth drag-and-drop reordering with collision detection
```

---

## 2. STRICT ICON-ONLY TILE & HOVER REVEAL PROTOCOL
```
∀ tile ∈ Menu_Tiles:
  visual_content(tile) ≡ Monochromatic_Icon
  visible_title(tile, state = DEFAULT) ≡ ∅ (NO PERSISTENT TEXT TITLES)
  visible_title(tile, state = HOVER)   ≡ TooltipText(tile.name)
```
- **Prohibition of Text Titles on Tiles**: Do NOT render visible text titles/labels directly inside or below menu tiles.
- **Hover Reveal Only**: Text/labels must appear strictly via instant or low-latency hover tooltips styled with the locked theme palette.

### 2.1 TOP-EDGE VIEWPORT COLLISION & DOWNWARD POP INVARIANT
```
∀ tooltip ∈ Hover_Tooltips:
  bounding_rect = element.getBoundingClientRect()
  if bounding_rect.top < 80px (close to top edge of app window/viewport):
    tooltip.placement ≡ "bottom"  (MUST pop downwards toward the bottom)
  else:
    tooltip.placement ≡ "top" (or collision-aware auto-flip)

FORBID: Spawning tooltips/hover text bubbles towards the top when elements are near the top edge of the app window.
WHY: When hover bubbles spawn upwards near the top window boundary, they get pushed out of view or clipped by the viewport.
```

---

## 3. DROP-DOWN & POPOVER INTEGRATION
- **Menu Dropdowns**:
  - Must inherit brutalist hard-edge drop-shadows and locked color palette tokens.
  - Dropdown triggers must be icon-only controls.
  - Submenu lists must feature custom themed scrollbars (width $\le 6\,\text{px}$) and zero unstyled browser components.
