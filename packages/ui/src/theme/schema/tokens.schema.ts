import { z } from 'zod';

export const SkipoSemanticTokensSchema = z.object({
  bg: z.object({
    canvas: z.string(),
    surface: z.string(),
    surfaceHover: z.string(),
    blur: z.string()
  }),
  text: z.object({
    primary: z.string(),
    muted: z.string(),
    inverse: z.string()
  }),
  accent: z.object({
    primary: z.string(),
    fg: z.string(),
    glow: z.string(),
    hover: z.string().optional()
  }),
  border: z.object({
    color: z.string(),
    input: z.string(),
    style: z.string()
  }),
  radius: z.object({
    base: z.string(),
    sm: z.string(),
    lg: z.string().optional()
  }),
  shadow: z.object({
    card: z.string(),
    cardHover: z.string(),
    btn: z.string(),
    btnHover: z.string(),
    btnActive: z.string()
  }),
  font: z.object({
    sans: z.string(),
    mono: z.string()
  }),
  status: z.object({
    success: z.string(),
    successFg: z.string(),
    warning: z.string(),
    warningFg: z.string(),
    danger: z.string(),
    dangerFg: z.string(),
    info: z.string(),
    infoFg: z.string()
  }),
  shell: z.object({
    topToolbarHeight: z.string(),
    topToolbarBg: z.string(),
    bottomStripHeight: z.string(),
    bottomStripBg: z.string(),
    inspectionTextTranslucent: z.string()
  })
});

export type SkipoSemanticTokens = z.infer<typeof SkipoSemanticTokensSchema>;
