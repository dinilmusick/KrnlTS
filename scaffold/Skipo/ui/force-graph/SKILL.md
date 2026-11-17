---
name: force-graph-guidelines
description: Directives for force-graph physics parameters, RAF batch scheduler, and DPR capping.
---

# FORCE GRAPH OPTIMIZATION GUIDELINES (`force-graph`)

## 1. LOCKED PHYSICS CONFIGURATION

$$\begin{array}{llll}
\alpha_{\text{decay}} = 0.08 & \alpha_{\text{min}} = 0.005 & v_{\text{decay}} = 0.45 & F_{\text{charge}} = -70 \\
d_{\text{max}} = 220 & \theta_{\text{BH}} = 0.9 & \text{DPR} = \min(\text{devicePixelRatio}, 2) & \text{IdleCPU} = 0\%
\end{array}$$

## 2. VSYNC BATCH SCHEDULER

```typescript
let isPending = false;
export const scheduleGraphDraw = (draw: () => void) => {
  if (isPending) return;
  isPending = true;
  requestAnimationFrame(() => {
    draw();
    isPending = false;
  });
};
```
