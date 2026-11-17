/**
 * @role component
 * ColorPalette definition and theme tokens for central palette management
 */

export type ThemePresetId =
  | 'black_and_gold'
  | 'coffee_theme'
  | 'cyber_neon'
  | 'emerald_synth'
  | 'crimson_forge'
  | 'amethyst_mystic'
  | 'arctic_frost'
  | 'solar_flare'
  | 'custom';

export interface ColorPalette {
  id: ThemePresetId | string;
  name: string;
  description: string;
  mode: 'dark' | 'light';

  // Core Surface Tones
  bgPrimary: string;
  bgSecondary: string;
  bgSurface: string;
  bgElevated: string;
  bgInput: string;
  bgModalOverlay: string;

  // Borders & Dividers
  borderSubtle: string;
  borderMedium: string;
  borderBold: string;
  borderAccent: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textAccent: string;

  // Brand & Accent Colors
  accentPrimary: string;
  accentSecondary: string;
  accentHover: string;
  accentGlow: string;
  accentMuted: string;

  // Semantic Status
  success: string;
  warning: string;
  danger: string;
  info: string;

  // Scrollbar
  scrollbarThumb: string;
  scrollbarTrack: string;

  // Workspace & Canvas
  nodeSelected: string;
  wireDefault: string;
  swatches: string[];
}
