import type { ThemePack } from './schemas.js';

export interface FrnlThemeState {
  visualParameters: Record<string, string | number | boolean>;
}

export interface FrnlThemeDefinition {
  themeId: string;
  name: string;
  target: {
    componentId: string;
    componentVersion: string;
    contractVersion: string;
  };
  states: Record<string, FrnlThemeState>;
  baseVisualParameters: Record<string, string | number | boolean>;
}

/** Convert a validated Floks ThemePack to FrnlTS component/state visual parameters. */
export function themePackToFrnlTheme(themePack: ThemePack): FrnlThemeDefinition {
  const states: Record<string, FrnlThemeState> = {};

  for (const mapping of themePack.states) {
    states[mapping.stateId] = {
      visualParameters: {
        ...themePack.parameters,
        ...mapping.parameterOverrides,
      },
    };
  }

  return {
    themeId: themePack.themeId,
    name: themePack.name,
    target: {
      componentId: themePack.target.componentId,
      componentVersion: themePack.target.componentVersion,
      contractVersion: themePack.target.contractVersion,
    },
    states,
    baseVisualParameters: { ...themePack.parameters },
  };
}
