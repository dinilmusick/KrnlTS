/**
 * ASCII Architecture Flowchart: appSocket
 *
 *   ┌──────────────────────────────────────────────┐
 *   │         Initialize App Theme Socket          │
 *   └──────────────────────────────────────────────┘
 *                          │
 *                          ▼
 *   ┌──────────────────────────────────────────────┐
 *   │         Validate Elements in Ledger          │
 *   └──────────────────────────────────────────────┘
 *                          │
 *                          ▼
 *   ┌──────────────────────────────────────────────┐
 *   │      Instantiate Singleton ThemeEngine       │
 *   └──────────────────────────────────────────────┘
 */

import { createAppThemeSocket } from './socket.js';
import { ThemeEngine } from './engine.js';
import {
  DOCUSTACK_DARK_GOLD_PACK,
  DOCUSTACK_WARM_COFFEE_PACK,
  DOCUSTACK_CYBERPUNK_PACK
} from './packs/index.js';
import type { AppThemeSocket, ModularThemePack } from './types.js';

export const DEPM_THEME_PACKS: ModularThemePack[] = [
  DOCUSTACK_DARK_GOLD_PACK,
  DOCUSTACK_WARM_COFFEE_PACK,
  DOCUSTACK_CYBERPUNK_PACK
];

export const depmThemeSocket: AppThemeSocket = createAppThemeSocket({
  appId: 'depm',
  appName: 'DEPM Multi-Cloud Ecosystem Platform',
  version: '1.0.0',
  defaultThemePackId: 'docustack-dark-gold',
  elementIds: [
    'canvas',
    'topToolbar',
    'bottomStrip',
    'headerBar',
    'workspaceTabBar',
    'card',
    'modalDialog',
    'floatingPanel',
    'buttonPrimary',
    'buttonSecondary',
    'buttonGhost',
    'inputField',
    'selectDropdown',
    'badge',
    'kanbanBoard',
    'documentCard',
    'graphCanvas',
    'graphNodeRoot',
    'graphNodeLeaf',
    'graphEdge',
    'codeEditor'
  ],
  elementDefaults: {
    canvas: {
      cssVars: {
        '--skipo-bg': '#121214',
        '--color-base': '#121214'
      }
    },
    topToolbar: {
      cssVars: {
        '--skipo-top-toolbar-height': '44px',
        '--skipo-top-toolbar-bg': 'rgba(18, 18, 20, 0.95)'
      }
    },
    bottomStrip: {
      cssVars: {
        '--skipo-bottom-strip-height': '30px',
        '--skipo-bottom-strip-bg': 'rgba(18, 18, 20, 0.95)'
      }
    }
  }
});

export const appThemeEngine = new ThemeEngine(
  depmThemeSocket,
  DEPM_THEME_PACKS,
  'dark'
);
