/**
 * ASCII Architecture Flowchart: KeyGalaxyVisualizer
 *
 *   ┌──────────────────────────────────────┐
 *   │    Initialize KeyGalaxyVisualizer    │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │  Execute Component / Pipeline Logic  │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │    Return State / Result Payload     │
 *   └──────────────────────────────────────┘
 */

// ════ KEYGALAXYVISUALIZER BACKWARD-COMPATIBLE BARREL FACADE ═══════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export * from './KeyGalaxyVisualizer/KeyGalaxyVisualizer.js';
export { KeyGalaxyVisualizer as default } from './KeyGalaxyVisualizer/KeyGalaxyVisualizer.js';