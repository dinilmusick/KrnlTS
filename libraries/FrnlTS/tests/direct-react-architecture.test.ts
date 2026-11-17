import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as RootExports from '../src/index.js';
import * as RuntimeExports from '../src/runtime/index.js';
import * as ReactExports from '../src/react/index.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('direct React component architecture', () => {
  it('has no legacy wrapper asset directories or documentation', () => {
    for (const path of [
      '../src/elements',
      '../docs/element-architecture.md',
      '../docs/ui-primitive.md',
      '../docs/concepts/ui-primitives.md',
      '../docs/concepts/ui-composites.md',
      '../tests/ui-composite-invariants.md',
      '../tests/fixtures/elements',
    ]) {
      expect(existsSync(resolve(here, path))).toBe(false);
    }
  });

  it('exposes the component definition contract without wrapper component classes', () => {
    expect(typeof RootExports.defineFrnlComponent).toBe('function');
    expect(typeof RuntimeExports.defineFrnlComponent).toBe('function');
    expect(ReactExports.useFrnlComponent).toBeDefined();
    expect('FrnlSlot' in ReactExports).toBe(false);
    expect('FrnlPrimitive' in ReactExports).toBe(false);
    expect('FrnlComposite' in ReactExports).toBe(false);
    expect('FrnlPrimitive' in RuntimeExports).toBe(false);
    expect('FrnlComposite' in RuntimeExports).toBe(false);
  });

  it('has no legacy Bounds or Slot runtime concepts', () => {
    const store = RuntimeExports.createFrnlStore();
    const state = store.getState();

    expect('componentDefinitions' in state).toBe(true);
    expect('slots' in state).toBe(false);
    expect('slotCollections' in state).toBe(false);
    expect('setEntityBounds' in state).toBe(false);
    expect('registerSlot' in state).toBe(false);
    expect('replaceSlotOccupant' in state).toBe(false);
    expect('bounds' in RuntimeExports).toBe(false);
    expect('slotStateSchema' in RuntimeExports).toBe(false);
    expect('slotCollectionSchema' in RuntimeExports).toBe(false);
    expect('visualAssetSchema' in RuntimeExports).toBe(false);

    for (const path of [
      '../src/react/FrnlSlot.tsx',
      '../docs/concepts/bounds.md',
      '../docs/concepts/slots.md',
    ]) {
      expect(existsSync(resolve(here, path))).toBe(false);
    }
  });

  it('keeps component state free of layout ownership', () => {
    const parsed = RuntimeExports.entityStateSchema.parse({
      state: 'idle',
      properties: {},
    });

    expect('bounds' in parsed).toBe(false);
    expect('slots' in parsed).toBe(false);
    expect('children' in parsed).toBe(false);
    expect('assets' in parsed).toBe(false);
  });
});
