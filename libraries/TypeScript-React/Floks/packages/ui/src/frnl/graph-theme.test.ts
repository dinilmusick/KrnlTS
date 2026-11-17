import { describe, expect, it } from 'vitest';
import { createFrnlStore, registerFrnlTheme, applyFrnlTheme } from '@ultrst-armada/frnlts';
import { frnlNodeGraphDefinition } from './frnlNodeGraph.js';
import { frnlForceGraphDefinition } from './frnlForceGraph.js';

describe('FRNL graph theme compatibility', () => {
  it('accepts themes targeting graph component states', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('graph', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('graph', frnlNodeGraphDefinition);
    store.getState().registerEntity('force', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('force', frnlForceGraphDefinition);
    registerFrnlTheme(store, 'DarkGraph', {
      frnlNodeGraph: { states: { idle: { visualParameters: { canvasBackground: '#111' } } } },
      frnlForceGraph: { states: { idle: { visualParameters: { edgeOpacity: 0.8 } } } },
    });
    applyFrnlTheme(store, 'graph', 'DarkGraph');
    applyFrnlTheme(store, 'force', 'DarkGraph');
    expect(store.getState().componentThemes.graph).toBe('DarkGraph');
    expect(store.getState().componentThemes.force).toBe('DarkGraph');
  });
});
