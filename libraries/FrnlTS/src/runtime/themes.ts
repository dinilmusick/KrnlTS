import type { FrnlComponentDefinition } from './component-definition.js';
import type { FrnlState } from './store.js';

export type FrnlThemeState = {
  readonly visualParameters?: Readonly<Record<string, unknown>>;
};

export type FrnlThemeComponent = {
  readonly states?: Readonly<Record<string, FrnlThemeState>>;
};

export type FrnlThemeDefinition = Readonly<Record<string, FrnlThemeComponent>>;

export type FrnlThemeRegistry = Readonly<Record<string, FrnlThemeDefinition>>;

export function registerFrnlTheme(
  store: { getState(): FrnlState },
  name: string,
  theme: FrnlThemeDefinition,
): void {
  store.getState().registerTheme(name, theme);
}

export function applyFrnlTheme(
  store: { getState(): FrnlState },
  componentId: string,
  themeName: string,
): void {
  const current = store.getState();
  if (!current.themes[themeName]) {
    throw new Error(`Unknown Frnl theme: ${themeName}`);
  }
  if (!current.entities[componentId]) {
    throw new Error(`Unknown Frnl component: ${componentId}`);
  }
  current.applyTheme(componentId, themeName);
}

export function resolveFrnlVisualParameters(
  store: { getState(): FrnlState },
  componentId: string,
): Record<string, unknown> {
  const current = store.getState();
  const entity = current.entities[componentId];
  const definition = current.componentDefinitions[componentId];
  if (!entity || !definition) return {};

  const state = definition.states[entity.state];
  if (!state) return {};

  const themeName = current.componentThemes[componentId];
  const themeState = themeName
    ? current.themes[themeName]?.[definition.name]?.states?.[entity.state]
    : undefined;

  return {
    ...state.visualParameters,
    ...(themeState?.visualParameters ?? {}),
    ...(current.visualOverrides[componentId] ?? {}),
  };
}

export function getFrnlComponentTheme(
  store: { getState(): FrnlState },
  componentId: string,
): string | undefined {
  return store.getState().componentThemes[componentId];
}

export function validateFrnlThemeAgainstDefinition(
  theme: FrnlThemeDefinition,
  definition: FrnlComponentDefinition,
): void {
  for (const [stateName, stateTheme] of Object.entries(theme[definition.name]?.states ?? {})) {
    if (!definition.states[stateName]) {
      throw new Error(
        `Frnl theme component "${definition.name}" references unknown state "${stateName}"`,
      );
    }
    void stateTheme;
  }
}
