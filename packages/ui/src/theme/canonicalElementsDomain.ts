import type { UIElementDefinition } from './types.js';

export const CANONICAL_ELEMENTS_DOMAIN: UIElementDefinition[] = [
  // Specialized & Domain
  {
    id: 'kanbanBoard',
    name: 'Kanban Board Viewport',
    category: 'specialized',
    description: 'Multi-column drag-and-drop workflow canvas.',
    cssVariables: ['--color-base'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'kanbanColumn',
    name: 'Kanban Category Column',
    category: 'specialized',
    description: 'Vertical column container with optional column wallpaper.',
    cssVariables: ['--color-surface', '--color-border'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'kanbanColumnOverlay',
    name: 'Kanban Column Wallpaper Overlay',
    category: 'specialized',
    description: 'Tint overlay specific to category columns.',
    cssVariables: ['--column-overlay-color', '--column-overlay-opacity'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'documentCard',
    name: 'Document Kanban Card',
    category: 'specialized',
    description: 'Sortable document card with preview metadata.',
    cssVariables: ['--color-surface', '--color-border'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'graphCanvas',
    name: 'Force Graph Canvas',
    category: 'graph',
    description: 'Interactive D3 / force-directed node graph layout.',
    cssVariables: ['--color-base', '--color-border'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'graphNodeRoot',
    name: 'Graph Root Vault Node',
    category: 'graph',
    description: 'Central root node in graph topology.',
    cssVariables: ['--color-accent'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'graphNodeLeaf',
    name: 'Graph Document Leaf Node',
    category: 'graph',
    description: 'Standard document or tag node.',
    cssVariables: ['--color-surface', '--color-text'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'graphEdge',
    name: 'Graph Connection Wire',
    category: 'graph',
    description: 'Connecting bezier curve or wire between graph nodes.',
    cssVariables: ['--skipo-text-muted'],
    firstDefinedByApp: 'skipo'
  },
  {
    id: 'codeEditor',
    name: 'Brutalist Code & Markdown Editor',
    category: 'specialized',
    description: 'Monaco or brutalist code/document editor pane.',
    cssVariables: ['--font-mono', '--color-surface'],
    firstDefinedByApp: 'docustack'
  },
  {
    id: 'aiChatPanel',
    name: 'AI Document Chat Panel',
    category: 'specialized',
    description: 'Collapsible floating drawer for document intelligence chat.',
    cssVariables: ['--color-surface', '--color-border'],
    firstDefinedByApp: 'docustack'
  }
];
