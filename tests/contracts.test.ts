/**
 * @file contracts.test.ts
 * @description Comprehensive Invariant & Semantic Verification Suite for Floks Component Contracts:
 * F1 → component registry
 * F2 → visual contracts
 * F3 → visual slots
 * F4 → visual states
 * F5 → visual parameters
 * F6 → asset types
 * F7 → ThemePack targets
 * F8 → Zod schemas
 * F9 → compatibility validation
 */

import { describe, it, expect } from 'vitest';
import {
  FLOKS_COMPONENT_REGISTRY,
  getComponentContract,
  listComponentContracts,
  validateThemePackAgainstContract,
  ComponentThemeContractSchema,
  VisualSlotSchema,
  VisualStateSchema,
  VisualParameterSchema,
  ThemeTargetSchema,
  ThemePackSchema,
  type ThemePack,
  createFloksSnapshot,
  diffContractSnapshots,
  FLOKS_CANONICAL_CONTRACT,
} from '@floks/contracts';

describe('Floks 04 — Component Contracts & Theta Compatibility Suite', () => {
  // ── F1: Component Registry ──
  it('F1: exposes canonical registry of themeable UI components', () => {
    const contracts = listComponentContracts();
    expect(contracts.length).toBeGreaterThanOrEqual(7);

    const ids = new Set(contracts.map((c) => c.componentId));
    expect(ids.has('floks.button')).toBe(true);
    expect(ids.has('floks.panel')).toBe(true);
    expect(ids.has('floks.input.slider')).toBe(true);
    expect(ids.has('floks.badge')).toBe(true);
    expect(ids.has('floks.socket2d')).toBe(true);
    expect(ids.has('floks.wire2d')).toBe(true);
    expect(ids.has('floks.node2d')).toBe(true);
  });

  // ── F2 - F6: Visual Slots, States, Parameters & Assets ──
  it('F2-F6: verifies explicit slots, states, parameters, and asset types on button contract', () => {
    const btn = getComponentContract('floks.button');
    expect(btn).toBeDefined();
    if (!btn) return;

    expect(btn.slots.some((s) => s.id === 'container' && s.required)).toBe(true);
    expect(btn.slots.some((s) => s.id === 'label' && s.required)).toBe(true);
    expect(btn.states.some((s) => s.id === 'idle')).toBe(true);
    expect(btn.states.some((s) => s.id === 'hover')).toBe(true);
    expect(btn.states.some((s) => s.id === 'active')).toBe(true);
    expect(btn.parameters.some((p) => p.id === 'background' && p.type === 'color')).toBe(true);
    expect(btn.assets).toContain('svg');
    expect(btn.assets).toContain('bitmap');
  });

  // ── F7 & F8: Zod Schemas & ThemeTarget ──
  it('F7-F8: verifies ThemeTarget and ThemePack Zod schemas enforce library boundary', () => {
    // Valid target
    const validTarget = {
      library: '@ultrst-armada/floks',
      componentId: 'floks.button',
      componentVersion: '1.0.0',
      contractVersion: '1.0.0',
    };
    expect(ThemeTargetSchema.safeParse(validTarget).success).toBe(true);

    // Foreign library target must be rejected
    const foreignTarget = {
      library: '@other-org/some-lib',
      componentId: 'floks.button',
      componentVersion: '1.0.0',
    };
    expect(ThemeTargetSchema.safeParse(foreignTarget).success).toBe(false);
  });

  // ── F9: Deterministic Compatibility Validation ──
  it('F9: successfully validates compatible ThemePack against Floks contract', () => {
    const validThemePack: ThemePack = {
      themeId: 'theme.neon.button',
      name: 'Cyberpunk Neon Button',
      version: '1.0.0',
      target: {
        library: '@ultrst-armada/floks',
        componentId: 'floks.button',
        componentVersion: '1.0.0',
        contractVersion: '1.0.0',
      },
      slots: [
        { slotId: 'container', elementType: 'frame', styles: { backgroundColor: '#111122' } },
        { slotId: 'label', elementType: 'text', styles: { color: '#00ffff' } },
        { slotId: 'icon', elementType: 'svg', assetRef: 'icons/bolt.svg' },
      ],
      states: [
        { stateId: 'idle', parameterOverrides: { background: '#111122' } },
        { stateId: 'hover', parameterOverrides: { background: '#222244' } },
      ],
      parameters: {
        background: '#111122',
        textColor: '#00ffff',
      },
      assetTypes: ['svg'],
    };

    const res = validateThemePackAgainstContract(validThemePack);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('F9: rejects ThemePack with unknown slots, unauthorized states, or invalid assets', () => {
    const invalidThemePack: ThemePack = {
      themeId: 'theme.bad.button',
      name: 'Corrupted Button Theme',
      version: '1.0.0',
      target: {
        library: '@ultrst-armada/floks',
        componentId: 'floks.button',
        componentVersion: '1.0.0',
        contractVersion: '1.0.0',
      },
      slots: [
        // slot 'unknown-slot-xyz' is not in Button contract
        { slotId: 'unknown-slot-xyz', elementType: 'frame' },
        // element type 'video' is not accepted by slot 'container' (only ['shape', 'frame', 'mesh'])
        { slotId: 'container', elementType: 'video' },
      ],
      states: [
        // state 'non-existent-state' is not in Button contract
        { stateId: 'non-existent-state', parameterOverrides: {} },
      ],
      parameters: {
        background: '#000000',
      },
      // asset type '3d-mesh' is not accepted by button (only ['svg', 'bitmap'])
      assetTypes: ['3d-mesh'],
    };

    const res = validateThemePackAgainstContract(invalidThemePack);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(4);
    expect(res.errors.some((e) => e.includes('unknown-slot-xyz'))).toBe(true);
    expect(res.errors.some((e) => e.includes('video'))).toBe(true);
    expect(res.errors.some((e) => e.includes('non-existent-state'))).toBe(true);
    expect(res.errors.some((e) => e.includes('3d-mesh'))).toBe(true);
  });

  // ── F10: Contract Snapshot & Semantic Diff Engine ──
  it('F10: generates deterministic contract snapshot and detects changes via semantic diff', () => {
    const snap1 = createFloksSnapshot('1.1.1');
    expect(snap1.package).toBe('@ultrst-armada/floks');
    expect(snap1.version).toBe('1.1.1');
    expect(snap1.publicSymbols.length).toBeGreaterThanOrEqual(20);
    expect(snap1.checksum).toMatch(/^sha256-/);
    expect(Object.keys(snap1.components).length).toBeGreaterThanOrEqual(7);

    // Identical snapshot => PATCH
    const diffIdentical = diffContractSnapshots(snap1, snap1);
    expect(diffIdentical.isIdentical).toBe(true);
    expect(diffIdentical.hasBreakingChanges).toBe(false);
    expect(diffIdentical.versionRecommendation).toBe('PATCH');

    // Additive snapshot => MINOR
    const snapAdditive = {
      ...snap1,
      publicSymbols: [...snap1.publicSymbols, 'NewThemeUtility'],
      components: {
        ...snap1.components,
        'floks.modal': {
          componentId: 'floks.modal',
          componentVersion: '1.0.0',
          slots: ['backdrop', 'dialog'],
          states: ['open', 'closing'],
          parameters: ['opacity'],
          assets: ['svg'],
        },
      },
    };
    const diffAdditive = diffContractSnapshots(snap1, snapAdditive);
    expect(diffAdditive.hasAdditiveChanges).toBe(true);
    expect(diffAdditive.hasBreakingChanges).toBe(false);
    expect(diffAdditive.versionRecommendation).toBe('MINOR');
    expect(diffAdditive.addedSymbols).toContain('NewThemeUtility');
    expect(diffAdditive.addedComponents).toContain('floks.modal');

    // Breaking snapshot (removed symbol or slot) => MAJOR
    const snapBreaking = {
      ...snap1,
      publicSymbols: snap1.publicSymbols.filter((s) => s !== 'BaseButton'),
    };
    const diffBreaking = diffContractSnapshots(snap1, snapBreaking);
    expect(diffBreaking.hasBreakingChanges).toBe(true);
    expect(diffBreaking.versionRecommendation).toBe('MAJOR');
    expect(diffBreaking.removedSymbols).toContain('BaseButton');

    // Canonical contract object
    expect(FLOKS_CANONICAL_CONTRACT.package).toBe('@ultrst-armada/floks');
    const runtimeSnap = FLOKS_CANONICAL_CONTRACT.getSnapshot();
    expect(runtimeSnap.version).toBe('1.1.1');
  });
});

