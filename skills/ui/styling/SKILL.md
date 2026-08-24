---
name: ui-styling-guidelines
description: Directives for neo-brutalism 2.5D biome styling, locked coffee and black-and-gold palettes, custom styled scrollbars, themed dropdowns, and regression guards.
---

# UI STYLING & 2.5D BIOME GUIDELINES

## 1. THEME & VISUAL IDENTITY
- **Core Paradigm**: `neo-brutalism_2.5D_biome`
- **Shapes & Typography**: Brutalist (bold, blocky, direct-to-face, geometric).
- **Fonts**: Locked set (1 Display + 1 Body font defined at project inception; no ad-hoc additions).
- **Icons**: Monochromatic only. Zero multi-color icons.
- **Labels & Titles**: Icon-only on default display; titles/text revealed strictly on hover (tooltip); zero persistent title text on tiles/cards/buttons; no descriptions directly on UI.

---

## 2. COLOR PALETTES (LOCKED)
```
Light Mode (coffee_theme):
  base    : #F5EDE4 (Warm cream / off-white)
  surface : Latte / Tan tones
  accent  : Espresso brown, Caramel, Muted terracotta
  text    : Dark roast brown (≠ #000000)

Dark Mode (black_and_gold):
  base    : Near-black / Charcoal (≠ #000000)
  surface : Deep charcoal panels
  accent  : Muted gold, Brass
  text    : Warm off-white / Soft gold-white (≠ #FFFFFF)
```

### Complementary Layering Rule
```
function getLayerAccentColor(layer_depth, base_layer_hue):
    assert base_layer_hue ∈ LOCKED_PALETTE
    accent_complement = OppositeHue(base_layer_hue, within = LOCKED_PALETTE)
    return accent_complement
```

---

## 3. THEMED CONTROLS & HOVER TOOLTIPS (ZERO UNSTYLED ELEMENTS)
```
FORBID: Default OS/browser unstyled elements (<select>, default webkit scrollbars).

REQUIRE:
  - Scrollbars:
      width: 4px - 6px
      track: transparent / subtle surface tone
      thumb: solid accent color with brutalist square edges (no bubbly border-radius)
  - Dropdowns & Menus:
      surface: locked panel background with hard-edged brutalist drop-shadow
      borders: 1px - 2px solid locked accent / border tone
      options: monochromatic icons + hover highlight from complementary palette
  - Hover Tooltips & Text Bubbles:
      surface: locked theme background with crisp 1px solid border and subtle brutalist shadow
      typography: display/body font matching theme, high contrast
      boundary_rule: Elements located close to the top edge of the app window/viewport MUST spawn
                     hover text bubbles popping DOWNWARDS (placement: "bottom").
      forbid: NEVER spawn tooltips upwards when near the top window boundary (prevents text getting pushed out of view).
```

---

## 4. 2.5D BIOME & DEPTH SYSTEM
- **World Concept**: Each UI window = stylized nature biome (forest, desert, tundra, ocean, volcanic, mountain).
- **Camera Projection**: Isometric game view (fixed-angle projected perspective, flat layers).
- **Renderer Restriction**: 2.5D layered flats / SVGs / canvas ONLY (no full 3D engines, no WebGL physics).
- **Layering Plane**:
  - `Background`: Slow ambient biome motion (drifting leaves/sand/snow/spores, distant fauna/dust motes).
  - `Midground`: Subtle cursor/scroll parallax (low amplitude).
  - `Foreground`: Static brutalist UI panels with crisp hard-edged drop-shadows.
- **Particles & Rune Glow**:
  - Biome-matched particles (embers=volcanic, pollen=forest, snow=tundra, bubbles=ocean) at low opacity.
  - Accent glow: Rune/sigil-like glow (Viking/Vedic-Gothic flavor) on active nodes/edges from locked accent palette.
  - Window transitions: Particle burst or rune flicker + depth fade (<300ms, non-blocking).
- **Overlay Windows**: Semi-transparent glass panels + depth shadow.
- **Perf Guard**: Ambient motion must be toggle-able and respect `prefers-reduced-motion`. Zero input latency degradation.

---

## 5. STYLE REGRESSION GUARD
- Never restyle or refactor existing working UI components unless explicitly requested by user.
- Leave existing UI as-is unless restyle requested -> then apply `neo-brutalism_2.5D_biome` specs strictly.
