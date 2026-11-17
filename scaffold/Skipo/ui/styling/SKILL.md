---
name: ui-styling-guidelines
description: Directives for neo-brutalism 2.5D biome styling, monochromatic SVG icons, portable theme packs, and bottom strip inspection.
---

# UI STYLING & 2.5D BIOME GUIDELINES

## 1. VISUAL INVARIANTS & FORMAL PREDICATES

$$\begin{array}{ll}
\mathbf{P_1} \text{ (Icon-Only Buttons)} & \forall b \in \text{ActionButtons}: \text{Children}(b) \subset \text{SVG}_{\text{mono}} \wedge \text{Text}(b) = \emptyset \\
\mathbf{P_2} \text{ (Zero Emojis)} & \text{UI} \cap \{\text{OS Emojis}\} = \emptyset \quad (\text{Use monochromatic single-tone SVG glyphs}) \\
\mathbf{P_3} \text{ (Zero Floating Tooltips)} & \text{Elements} \cap \{\text{TooltipBubbles}, \text{Balloons}\} = \emptyset \\
\mathbf{P_4} \text{ (Hover Routing)} & \forall el \in \text{Interactive}: \text{Hover}(el) \implies \text{BottomStrip.CenterSlot.render}(\text{Desc}(el)) \\
\mathbf{P_5} \text{ (100% Theme Tokens)} & \forall c \in \text{Styles}: c \cap \{\text{HEX}, \text{RGB}, \text{HSL}\} = \emptyset \wedge c \subset \{\text{var}(--\text{skipo}-*)\} \\
\mathbf{P_6} \text{ (Overlay Event Trapping)} & \forall o \in \text{Overlays}: \text{Traps}(o, \{\text{Wheel}, \text{Pointer}, \text{Key}\}) \wedge \neg\text{Leaks}(o, \text{Canvas}) \\
\mathbf{P_7} \text{ (Custom Scrollbars \& Controls)} & \forall c \in \{\text{Scrollbars}, \text{SelectDropdowns}\}: \text{Styles}(c) \subset \{\text{var}(--\text{skipo}-*)\} \wedge \text{Appearance}(c) = \text{Custom} \\
\mathbf{P_8} \text{ (Progressive Disclosure Dialogues)} & \forall d \in \text{Dialogues}: \text{Count}(\text{Sections}(d)) \ge 2 \implies \text{State}(\text{SecondarySections}(d)) = \text{CompressedByDefault} \\
\mathbf{P_9} \text{ (Icon Purity \& Zero Double-Icons)} & \forall b \in \text{Buttons}: \text{Count}(\text{Icons}(b)) \le 1 \wedge \neg(\text{HasIcon}(b) \wedge \text{SymbolGlyph}(\text{Label}(b)))
\end{array}$$

## 2. PORTABLE THEME PACK & CANVAS SPECS

```
theme-pack/
├── theme.json      # Metadata (id, name, version, mode: 'dark' | 'light')
├── tokens.json     # Semantic token dictionary (bg, text, accent, border, shadow)
└── styles.css      # Generated CSS variables (--skipo-*)
```

- **Infinite Canvas 4-Quadrant Bounds**:
  $$\text{viewBox} = -50000 \ -50000 \ 100000 \ 100000 \quad \wedge \quad \text{overflow: visible}$$
- **Vite/Tailwind CSS Ingress**: Anchor `@import '@skipo/ui/dist/index.css';` in root `src/index.css`. Anchored `.gitignore` (`/dist/`).
