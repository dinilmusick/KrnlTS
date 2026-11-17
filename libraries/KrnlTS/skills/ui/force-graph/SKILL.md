---
name: force-graph-guidelines
description: Directives for force-graph library performance optimizations, low physics parameters, VSync single-frame scheduler, and DPR capping.
---

# FORCE GRAPH OPTIMIZATION GUIDELINES (`force-graph`)

## 1. PHYSICS SIMULATION PARAMETERS (LOCKED)
```
Simulation Settings:
  alphaDecay     : 0.08        // Rapid decay to prevent ongoing oscillation
  alphaMin       : 0.005       // High threshold to cut simulation early (~1.0s)
  velocityDecay  : 0.45        // High friction to stop node momentum quickly
  chargeForce    : -70         // Gentle repulsion
  distanceMax    : 220         // Short-range cutoff to bypass far-field calculations
  theta          : 0.9         // Barnes-Hut approximation threshold
  forceCollide   : single-pass check with compact radii
  linkDensity    : capped per tag node via generateTagLinks()
```

---

## 2. CANVAS & RENDERING PERFORMANCE
```
function onGraphStateMutation():
    if not isRenderPending:
        isRenderPending = true
        requestAnimationFrame(() => {
            batchDraw(linkStrokes, nodePasses)
            isRenderPending = false
        })
// FORBID: Runaway tick-triggered parallel recursive RAF loops.
// ENFORCE: 0% CPU consumption when graph reaches resting equilibrium.
```
- **Device Pixel Ratio (DPR)**: `Math.min(window.devicePixelRatio, 2)` (capped at 2x for smooth 60 FPS).
- **Navigation Controls**: Mouse-wheel zoom, click-drag background panning, Reheat simulation trigger, and instant zoom reset controls.
