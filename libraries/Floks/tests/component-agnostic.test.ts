/**
 * @file component-agnostic.test.ts
 * @description Verifies that Floks components remain backend-agnostic and emit declarative events.
 */

import { describe, it, expect } from 'vitest';
import {
  FLOKS_CANONICAL_CONTRACT,
  FLOKS_PUBLIC_SYMBOLS,
  FLOKS_COMPONENT_REGISTRY,
  createFloksSnapshot,
  diffContractSnapshots,
} from '../packages/contracts/src/index.js';

describe('Floks Component Agnostic Architecture', () => {
  it('Component Contract exposes declarative events and actions without backend dispatch', () => {
    expect(FLOKS_CANONICAL_CONTRACT).toBeDefined();
    expect(FLOKS_CANONICAL_CONTRACT.package).toBe('@ultrst-armada/floks');
    expect(Array.isArray(FLOKS_PUBLIC_SYMBOLS)).toBe(true);

    // Floks surface contains zero backend service executors or server infrastructure
    for (const symbol of FLOKS_PUBLIC_SYMBOLS) {
      expect(symbol).not.toMatch(/ServiceDispatcher|BackendFacade|WorkerExecution|BullMQ|Redis|Database/);
    }
  });

  it('All components in registry declare slots, states, and parameters for declarative UI styling', () => {
    const components = Object.values(FLOKS_COMPONENT_REGISTRY);
    expect(components.length).toBeGreaterThan(0);

    for (const comp of components) {
      expect(comp.componentId).toBeDefined();
      expect(comp.displayName).toBeDefined();
      expect(Array.isArray(comp.slots)).toBe(true);
      expect(Array.isArray(comp.states)).toBe(true);
      expect(Array.isArray(comp.parameters)).toBe(true);
    }
  });

  it('Contract snapshot generates clean contract diffs', () => {
    const snap1 = createFloksSnapshot('1.2.0');
    expect(snap1.package).toBe('@ultrst-armada/floks');
    expect(snap1.version).toBe('1.2.0');

    const diff = diffContractSnapshots(snap1, snap1);
    expect(diff.isIdentical).toBe(true);
    expect(diff.hasBreakingChanges).toBe(false);
  });
});
