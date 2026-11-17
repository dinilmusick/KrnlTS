import { describe, expect, it } from 'vitest';
import { floksFrnlStore } from './store.js';

describe('Floks Frnl integration', () => {
  it('provides a shared FrnlTS store for UI assets', () => {
    floksFrnlStore.getState().registerEntity('test.button', {
      state: 'default', properties: { variant: 'primary' },
    });
    expect(floksFrnlStore.getState().entities['test.button']?.state).toBe('default');
    expect(floksFrnlStore.getState().entities['test.button']?.properties.variant).toBe('primary');
  });
});
