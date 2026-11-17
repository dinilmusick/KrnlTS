import type { ThemeTypographyDefinition } from './schema/typography.schema.js';
import type { SkipoSemanticTokens } from './schema/tokens.schema.js';
import type { ModularThemePack, ThemeVariantDefinition } from './schema/themePack.schema.js';

export type {
  ThemeTypographyDefinition,
  SkipoSemanticTokens,
  ModularThemePack,
  ThemeVariantDefinition
};

export interface SkipoThemeMetadata {
  id: string;
  name: string;
  version: string;
  mode: 'dark' | 'light';
  author?: string;
  description?: string;
}

export interface SkipoThemePack {
  metadata: SkipoThemeMetadata;
  tokens: SkipoSemanticTokens;
  customCss?: string;
}

export type UIElementCategory =
  | 'layout'
  | 'navigation'
  | 'surface'
  | 'control'
  | 'typography'
  | 'feedback'
  | 'graph'
  | 'media'
  | 'specialized';

export interface UIElementDefinition {
  id: string;
  name: string;
  category: UIElementCategory;
  description: string;
  cssVariables?: string[];
  supportedStyles?: string[];
  supportedEffects?: string[];
  supportedAssets?: string[];
  firstDefinedByApp: string;
}

export interface UIElementThemeValue {
  cssVars?: Record<string, string>;
  styles?: Record<string, string | number>;
  effects?: {
    animation?: string;
    transition?: string;
    glow?: string;
    filter?: string;
    transformHover?: string;
  };
  assets?: {
    wallpaper?: string;
    overlayImage?: string;
    texture?: string;
    iconGlyph?: string;
    mediaUrl?: string;
  };
}

export interface AppThemeSocket {
  appId: string;
  appName: string;
  version: string;
  elementIds: string[];
  defaultThemePackId?: string;
  elementDefaults?: Record<string, Partial<UIElementThemeValue>>;
}

export interface ThemeApplicationState {
  activeBasePackId: string;
  activeMode: 'dark' | 'light';
  elementOverrides: Record<string, string>;
}

export interface ElementStatusReport {
  elementId: string;
  name: string;
  category: UIElementCategory;
  appliedThemePackId: string;
  appliedVariant: 'dark' | 'light';
  isOverridden: boolean;
  isFallback: boolean;
  effectiveCssVars: Record<string, string>;
  effectiveStyles: Record<string, string | number>;
  effectiveEffects: Record<string, string>;
  effectiveAssets: Record<string, string>;
}

export interface ThemeEngineStatus {
  appId: string;
  socketVersion: string;
  registeredElementsCount: number;
  activeBasePackId: string;
  activeBasePackName: string;
  activeMode: 'dark' | 'light';
  elementOverridesCount: number;
  elementOverrides: Record<string, string>;
  elements: Record<string, ElementStatusReport>;
  uncoveredElements: string[];
  ignoredElements: string[];
  timestamp: number;
  isValid: boolean;
}
