import { validateModularThemePack, type ModularThemePack } from '../../schema/themePack.schema.js';
import { darkTokens, lightTokens } from './tokens.js';
import { darkTypography, lightTypography } from './typography.js';
import { darkElements, lightElements } from './elements.js';
import manifest from './manifest.json' with { type: 'json' };

export const DOCUSTACK_WARM_COFFEE_PACK: ModularThemePack = validateModularThemePack({
  metadata: manifest,
  variants: {
    dark: {
      mode: 'dark',
      tokens: darkTokens,
      typography: darkTypography,
      elementStyles: darkElements
    },
    light: {
      mode: 'light',
      tokens: lightTokens,
      typography: lightTypography,
      elementStyles: lightElements
    }
  },
  typography: lightTypography,
  tokens: lightTokens,
  elementStyles: lightElements
});

export * from './tokens.js';
export * from './typography.js';
export * from './elements.js';
export { manifest };
export default DOCUSTACK_WARM_COFFEE_PACK;
