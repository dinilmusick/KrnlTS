import { z } from 'zod';
import { SkipoSemanticTokensSchema } from './tokens.schema.js';
import { ThemeTypographySchema } from './typography.schema.js';

export const SkipoThemeMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().default('1.0.0'),
  mode: z.enum(['dark', 'light']).default('dark'),
  author: z.string().optional(),
  description: z.string().optional()
});

export const UIElementThemeValueSchema = z.object({
  cssVars: z.record(z.string(), z.string()).optional(),
  styles: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  effects: z.object({
    animation: z.string().optional(),
    transition: z.string().optional(),
    glow: z.string().optional(),
    filter: z.string().optional(),
    transformHover: z.string().optional()
  }).optional(),
  assets: z.object({
    wallpaper: z.string().optional(),
    overlayImage: z.string().optional(),
    texture: z.string().optional(),
    iconGlyph: z.string().optional(),
    mediaUrl: z.string().optional()
  }).optional()
});

export const ThemeVariantDefinitionSchema = z.object({
  mode: z.enum(['dark', 'light']),
  tokens: SkipoSemanticTokensSchema.optional(),
  typography: ThemeTypographySchema.optional(),
  elementStyles: z.record(z.string(), UIElementThemeValueSchema).default({}),
  customCss: z.string().optional()
});

export const ModularThemePackSchema = z.object({
  metadata: SkipoThemeMetadataSchema,
  variants: z.object({
    dark: ThemeVariantDefinitionSchema,
    light: ThemeVariantDefinitionSchema
  }),
  typography: ThemeTypographySchema.optional(),
  tokens: SkipoSemanticTokensSchema.optional(),
  elementStyles: z.record(z.string(), UIElementThemeValueSchema).default({}),
  customCss: z.string().optional()
});

export type ModularThemePack = z.infer<typeof ModularThemePackSchema>;
export type ThemeVariantDefinition = z.infer<typeof ThemeVariantDefinitionSchema>;

export function validateModularThemePack(pack: unknown): ModularThemePack {
  return ModularThemePackSchema.parse(pack);
}

export function safeValidateModularThemePack(pack: unknown) {
  return ModularThemePackSchema.safeParse(pack);
}
