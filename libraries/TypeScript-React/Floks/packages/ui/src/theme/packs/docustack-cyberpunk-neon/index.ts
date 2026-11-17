import { validateModularThemePack, type ModularThemePack } from '../../schema/themePack.schema.js';
import { darkTokens, lightTokens } from './tokens.js';
import { darkTypography, lightTypography } from './typography.js';
import { darkElements, lightElements } from './elements.js';
import manifest from './manifest.json' with { type: 'json' };

export const DOCUSTACK_CYBERPUNK_PACK: ModularThemePack = validateModularThemePack({
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
  typography: darkTypography,
  tokens: darkTokens,
  elementStyles: darkElements
});

export * from './tokens.js';
export * from './typography.js';
export * from './elements.js';
export { manifest };
export default DOCUSTACK_CYBERPUNK_PACK;
