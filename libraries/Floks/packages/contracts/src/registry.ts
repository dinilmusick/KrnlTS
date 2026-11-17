/**
 * @file registry.ts
 * @description Canonical Floks Component Theme Contract Registry.
 * Supplies explicit visual contracts for Button, Panel, SliderInput, Badge, Socket2D, Wire2D, Node2DBase.
 */

import { ComponentThemeContract, ComponentThemeContractSchema } from './schemas.js';

export const FLOKS_COMPONENT_REGISTRY: Record<string, ComponentThemeContract> = {
  // 1. Button Parent
  'floks.button': ComponentThemeContractSchema.parse({
    componentId: 'floks.button',
    componentVersion: '1.0.0',
    displayName: 'Button Component',
    slots: [
      { id: 'container', acceptedElementTypes: ['shape', 'frame', 'mesh'], required: true },
      { id: 'icon', acceptedElementTypes: ['icon', 'svg', 'glyph'], required: false },
      { id: 'label', acceptedElementTypes: ['text', 'typography'], required: true },
      { id: 'indicator', acceptedElementTypes: ['badge', 'dot', 'counter'], required: false },
    ],
    states: [
      { id: 'idle', parameters: [] },
      { id: 'hover', parameters: [] },
      { id: 'active', parameters: [] },
      { id: 'disabled', parameters: [] },
      { id: 'focus', parameters: [] },
    ],
    parameters: [
      { id: 'background', type: 'color', default: 'var(--skipo-surface-2)' },
      { id: 'textColor', type: 'color', default: 'var(--skipo-text-primary)' },
      { id: 'borderColor', type: 'color', default: 'var(--skipo-border)' },
      { id: 'borderWidth', type: 'dimension', default: '1px' },
      { id: 'borderRadius', type: 'dimension', default: '6px' },
      { id: 'padding', type: 'dimension', default: '8px 16px' },
      { id: 'fontSize', type: 'dimension', default: '13px' },
    ],
    assets: ['svg', 'bitmap'],
  }),

  // 2. Panel Parent
  'floks.panel': ComponentThemeContractSchema.parse({
    componentId: 'floks.panel',
    componentVersion: '1.0.0',
    displayName: 'Panel Component',
    slots: [
      { id: 'header', acceptedElementTypes: ['frame', 'strip'], required: false },
      { id: 'content', acceptedElementTypes: ['container', 'layout'], required: true },
      { id: 'footer', acceptedElementTypes: ['strip', 'action-bar'], required: false },
      { id: 'border-frame', acceptedElementTypes: ['frame', 'shape'], required: false },
    ],
    states: [
      { id: 'default', parameters: [] },
      { id: 'expanded', parameters: [] },
      { id: 'collapsed', parameters: [] },
      { id: 'minimized', parameters: [] },
    ],
    parameters: [
      { id: 'background', type: 'color', default: 'var(--skipo-surface-1)' },
      { id: 'borderColor', type: 'color', default: 'var(--skipo-border)' },
      { id: 'borderRadius', type: 'dimension', default: '8px' },
      { id: 'elevation', type: 'shadow', default: '0 4px 12px rgba(0,0,0,0.4)' },
      { id: 'padding', type: 'dimension', default: '12px' },
    ],
    assets: ['svg', 'bitmap', 'shader'],
  }),

  // 3. Slider Input
  'floks.input.slider': ComponentThemeContractSchema.parse({
    componentId: 'floks.input.slider',
    componentVersion: '1.0.0',
    displayName: 'Slider Input Component',
    slots: [
      { id: 'track', acceptedElementTypes: ['bar', 'curve'], required: true },
      { id: 'fill', acceptedElementTypes: ['bar', 'gradient'], required: true },
      { id: 'thumb', acceptedElementTypes: ['handle', 'circle', 'icon'], required: true },
      { id: 'value-label', acceptedElementTypes: ['text', 'bubble'], required: false },
    ],
    states: [
      { id: 'idle', parameters: [] },
      { id: 'hover', parameters: [] },
      { id: 'dragging', parameters: [] },
      { id: 'disabled', parameters: [] },
    ],
    parameters: [
      { id: 'trackColor', type: 'color', default: 'var(--skipo-surface-3)' },
      { id: 'fillColor', type: 'color', default: 'var(--skipo-accent)' },
      { id: 'thumbColor', type: 'color', default: 'var(--skipo-surface-1)' },
      { id: 'thumbSize', type: 'dimension', default: '14px' },
      { id: 'height', type: 'dimension', default: '6px' },
    ],
    assets: ['svg', 'bitmap'],
  }),

  // 4. Badge
  'floks.badge': ComponentThemeContractSchema.parse({
    componentId: 'floks.badge',
    componentVersion: '1.0.0',
    displayName: 'Badge Component',
    slots: [
      { id: 'pill', acceptedElementTypes: ['shape', 'pill'], required: true },
      { id: 'indicator-dot', acceptedElementTypes: ['dot', 'icon'], required: false },
      { id: 'text', acceptedElementTypes: ['typography'], required: true },
    ],
    states: [
      { id: 'default', parameters: [] },
      { id: 'pulse', parameters: [] },
    ],
    parameters: [
      { id: 'background', type: 'color', default: 'var(--skipo-surface-2)' },
      { id: 'textColor', type: 'color', default: 'var(--skipo-text-secondary)' },
      { id: 'dotColor', type: 'color', default: 'var(--skipo-accent)' },
    ],
    assets: ['svg'],
  }),

  // 5. 2D Graph Socket
  'floks.socket2d': ComponentThemeContractSchema.parse({
    componentId: 'floks.socket2d',
    componentVersion: '1.0.0',
    displayName: '2D Graph Socket',
    slots: [
      { id: 'ring', acceptedElementTypes: ['circle', 'ring'], required: true },
      { id: 'indicator-dot', acceptedElementTypes: ['circle', 'dot'], required: false },
      { id: 'glow', acceptedElementTypes: ['radial-glow'], required: false },
    ],
    states: [
      { id: 'idle', parameters: [] },
      { id: 'hover', parameters: [] },
      { id: 'connected', parameters: [] },
      { id: 'compatible-hover', parameters: [] },
    ],
    parameters: [
      { id: 'color', type: 'color', default: '#ffaa00' },
      { id: 'radius', type: 'dimension', default: '6px' },
      { id: 'glowRadius', type: 'dimension', default: '12px' },
    ],
    assets: ['svg'],
  }),

  // 6. 2D Graph Wire
  'floks.wire2d': ComponentThemeContractSchema.parse({
    componentId: 'floks.wire2d',
    componentVersion: '1.0.0',
    displayName: '2D Graph Wire',
    slots: [
      { id: 'trace', acceptedElementTypes: ['path', 'spline'], required: true },
      { id: 'pulse-particle', acceptedElementTypes: ['particle', 'pulse'], required: false },
      { id: 'endpoint', acceptedElementTypes: ['handle', 'arrow'], required: false },
    ],
    states: [
      { id: 'idle', parameters: [] },
      { id: 'active', parameters: [] },
      { id: 'selected', parameters: [] },
      { id: 'error', parameters: [] },
    ],
    parameters: [
      { id: 'strokeColor', type: 'color', default: '#00ffff' },
      { id: 'strokeWidth', type: 'dimension', default: '2px' },
      { id: 'opacity', type: 'number', default: 1 },
    ],
    assets: ['svg', 'particle'],
  }),

  // 7. 2D Node Base
  'floks.node2d': ComponentThemeContractSchema.parse({
    componentId: 'floks.node2d',
    componentVersion: '1.0.0',
    displayName: '2D Graph Node Card',
    slots: [
      { id: 'header', acceptedElementTypes: ['strip', 'banner'], required: true },
      { id: 'body', acceptedElementTypes: ['container', 'surface'], required: true },
      { id: 'footer', acceptedElementTypes: ['strip'], required: false },
      { id: 'socket-strip', acceptedElementTypes: ['column', 'row'], required: true },
    ],
    states: [
      { id: 'idle', parameters: [] },
      { id: 'selected', parameters: [] },
      { id: 'running', parameters: [] },
      { id: 'bypassed', parameters: [] },
      { id: 'minimized', parameters: [] },
    ],
    parameters: [
      { id: 'headerColor', type: 'color', default: 'var(--skipo-surface-2)' },
      { id: 'bodyColor', type: 'color', default: 'var(--skipo-surface-1)' },
      { id: 'borderColor', type: 'color', default: 'var(--skipo-border)' },
      { id: 'cornerRadius', type: 'dimension', default: '8px' },
    ],
    assets: ['svg', 'bitmap'],
  }),
};

export function getComponentContract(componentId: string): ComponentThemeContract | undefined {
  return FLOKS_COMPONENT_REGISTRY[componentId];
}

export function listComponentContracts(): ComponentThemeContract[] {
  return Object.values(FLOKS_COMPONENT_REGISTRY);
}
