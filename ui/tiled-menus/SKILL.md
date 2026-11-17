---
name: tiled-menus-guidelines
description: Directives for dnd-kit tiled menus, sortable grids, icon-only tiles, and collision-aware tooltips.
---

# TILED MENUS & DND-KIT GUIDELINES

## 1. FORMAL TILED SPECIFICATIONS

$$\forall t \in \text{Tiles}: \text{Label}(t) = \emptyset \wedge \text{Content}(t) \in \text{SVG}_{\text{mono}} \wedge \text{Hover}(t) \implies \text{RevealTooltip}(t)$$

$$\text{Placement}(el) = \begin{cases} \text{"bottom"}, & \text{rect}(el).\text{top} < 80\text{px} \\ \text{"top"}, & \text{otherwise} \end{cases} \quad (\text{Prevents Viewport Clipping})$$

## 2. INTEGRATION MATRIX

- **Framework**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- **Styling**: Hard-edged brutalist shadows (`box-shadow: 4px 4px 0 var(--skipo-border)`), themed scrollbars ($\le 6\text{px}$).
- **Triggers**: Icon-only buttons with bottom strip or collision-aware popover.

## 3. DYNAMIC CONTAINER-REACTIVE GRID LAW

$$\forall m \in \text{TileMenus}: \text{Resize}(m) \implies \Delta(\text{Columns}(m)) \wedge \Delta(\text{Rows}(m)) \wedge \Delta(\text{TileDimensions}(m))$$

1. **Dual Reconfiguration on Resize**: When any tile menu container resizes, it MUST NOT merely shrink or expand individual tile items. It must recompute:
   - **Column Count**: Dynamically calibrate columns based on container width breakpoints (e.g. $\ge 1200\text{px} \to 4\text{ cols}$, $\ge 860\text{px} \to 3\text{ cols}$, $\ge 540\text{px} \to 2\text{ cols}$, $< 540\text{px} \to 1\text{ col}$).
   - **Row Distribution**: Recompute available row budget based on container height to prevent clipped overflow.
   - **Tile Scaling**: Proportional scaling of tile padding, icon sizes, and card min-heights via container observation (`ResizeObserver`).

