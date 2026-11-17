import { describe, expect, it } from 'vitest';
import { themePackToFrnlTheme } from '../packages/contracts/src/frnlThemeAdapter.js';
import type { ThemePack } from '../packages/contracts/src/schemas.js';

const pack: ThemePack = {
  themeId: 'dark',
  name: 'Dark',
  version: '1.0.0',
  target: {
    library: '@ultrst-armada/floks',
    componentId: 'Button',
    componentVersion: '1.2.7',
    contractVersion: '1.0.0',
  },
  slots: [],
  states: [
    { stateId: 'idle', parameterOverrides: { color: '#111' } },
    { stateId: 'pressed', parameterOverrides: { color: '#fff' } },
  ],
  parameters: { color: '#000', radius: 4 },
  assetTypes: [],
};

describe('Floks ThemePack to Frnl theme adapter', () => {
  it('maps base parameters and per-state overrides', () => {
    const result = themePackToFrnlTheme(pack);
    expect(result.target.componentId).toBe('Button');
    expect(result.baseVisualParameters).toEqual({ color: '#000', radius: 4 });
    expect(result.states.idle.visualParameters).toEqual({ color: '#111', radius: 4 });
    expect(result.states.pressed.visualParameters).toEqual({ color: '#fff', radius: 4 });
  });

  it('does not mutate source parameters or leak state overrides between states', () => {
    const result = themePackToFrnlTheme(pack);
    result.states.pressed.visualParameters.radius = 9;
    expect(pack.parameters.radius).toBe(4);
    expect(result.states.idle.visualParameters.radius).toBe(4);
  });
});
