import type { UIElementDefinition } from './types.js';

export const CANONICAL_ELEMENTS_BASE: UIElementDefinition[] = [
  // Layout & Wallpaper
  {
    id: 'canvas',
    name: 'Workspace Canvas',
    category: 'layout',
    description: 'Main background workspace canvas hosting views and nodes.',
    cssVariables: ['--skipo-bg', '--color-base'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'canvasGrid',
    name: 'Canvas Grid System',
    category: 'layout',
    description: 'Background geometric grid dots or lines on canvas.',
    cssVariables: ['--skipo-grid-dot'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'wallpaperOverlay',
    name: 'Wallpaper Backdrop Overlay',
    category: 'layout',
    description: 'Translucent or blurred tint overlay above canvas wallpapers.',
    cssVariables: ['--wallpaper-overlay-color', '--wallpaper-overlay-opacity'],
    firstDefinedByApp: 'docustack'
  },
  // App Shell & Bars
  {
    id: 'topToolbar',
    name: 'Top Navigation Toolbar',
    category: 'navigation',
    description: '44px application header toolbar with flat tabs.',
    cssVariables: ['--skipo-top-toolbar-height', '--skipo-top-toolbar-bg'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'bottomStrip',
    name: 'Bottom Inspection Strip',
    category: 'navigation',
    description: '30px persistent inspection strip for system hover telemetry.',
    cssVariables: ['--skipo-bottom-strip-height', '--skipo-bottom-strip-bg'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'headerBar',
    name: 'Workspace Header Bar',
    category: 'navigation',
    description: 'App brand header with breadcrumbs and workspace switches.',
    cssVariables: ['--color-surface-subtle', '--color-border'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'workspaceTabBar',
    name: 'Workspace Tab Bar',
    category: 'navigation',
    description: 'Tab selector for switching open vaults or documents.',
    cssVariables: ['--color-surface', '--color-accent'],
    firstDefinedByApp: 'docustack'
  },
  // Surfaces & Containers
  {
    id: 'card',
    name: 'Tactile Content Card',
    category: 'surface',
    description: '2.5D container card for list items and metrics.',
    cssVariables: ['--skipo-surface', '--skipo-shadow', '--skipo-border'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'modalDialog',
    name: 'Modal Dialog Overlay',
    category: 'surface',
    description: 'Centered modal container for forms and confirmations.',
    cssVariables: ['--skipo-surface', '--skipo-border', '--skipo-matte-blur'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'contextMenu',
    name: 'Floating Context Menu',
    category: 'surface',
    description: 'Right-click popover action menu with keyboard navigation.',
    cssVariables: ['--skipo-surface', '--skipo-border'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'floatingPanel',
    name: 'Floating Inspector Panel',
    category: 'surface',
    description: 'Floating detail panel with 8-way resize and pinning.',
    cssVariables: ['--skipo-surface', '--skipo-border'],
    firstDefinedByApp: 'skipo'
  },
  // Controls
  {
    id: 'buttonPrimary',
    name: 'Primary Action Button',
    category: 'control',
    description: 'Main interactive call-to-action button.',
    cssVariables: ['--skipo-accent', '--skipo-accent-fg', '--skipo-shadow-btn'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'buttonSecondary',
    name: 'Secondary Action Button',
    category: 'control',
    description: 'Alternative action button with subtle outline.',
    cssVariables: ['--color-surface', '--color-text', '--skipo-border'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'buttonGhost',
    name: 'Ghost Action Button',
    category: 'control',
    description: 'Transparent button used in toolbars.',
    cssVariables: ['--color-text'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'inputField',
    name: 'Text Input Field',
    category: 'control',
    description: 'Text and search inputs with brutalist focus borders.',
    cssVariables: ['--skipo-border-input', '--skipo-surface'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'selectDropdown',
    name: 'Select Dropdown',
    category: 'control',
    description: 'Themed custom dropdown for options.',
    cssVariables: ['--color-surface', '--color-text', '--color-border'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'badge',
    name: 'Status Badge',
    category: 'feedback',
    description: 'Compact tag for metadata, state, and status counts.',
    cssVariables: ['--skipo-accent', '--skipo-accent-fg'],
    firstDefinedByApp: 'skipo'
  }
];
