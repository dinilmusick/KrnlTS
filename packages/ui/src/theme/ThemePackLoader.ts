import type { SkipoThemePack, SkipoSemanticTokens } from './types.js';
export { DEFAULT_DARK_THEME_PACK, DEFAULT_LIGHT_THEME_PACK } from './defaultPacks.js';

function mapTypographyAndBg(tokens: SkipoSemanticTokens): Record<string, string> {
  return {
    '--skipo-font': tokens.font.sans,
    '--skipo-font-mono': tokens.font.mono,
    '--skipo-bg': tokens.bg.canvas,
    '--skipo-surface': tokens.bg.surface,
    '--skipo-matte-bg': tokens.bg.surface,
    '--skipo-matte-bg-hover': tokens.bg.surfaceHover,
    '--skipo-matte-blur': tokens.bg.blur,
    '--skipo-text': tokens.text.primary,
    '--skipo-text-muted': tokens.text.muted,
    '--skipo-text-inverse': tokens.text.inverse,
  };
}

function mapAccentAndBorders(tokens: SkipoSemanticTokens): Record<string, string> {
  return {
    '--skipo-accent': tokens.accent.primary,
    '--skipo-accent-fg': tokens.accent.fg,
    '--skipo-accent-glow': tokens.accent.glow,
    '--skipo-border-color': tokens.border.color,
    '--skipo-border': tokens.border.style,
    '--skipo-border-input': `2px solid ${tokens.border.input}`,
    '--skipo-radius': tokens.radius.base,
    '--skipo-radius-sm': tokens.radius.sm,
  };
}

function mapShadowsAndStatus(tokens: SkipoSemanticTokens): Record<string, string> {
  return {
    '--skipo-shadow': tokens.shadow.card,
    '--skipo-shadow-hover': tokens.shadow.cardHover,
    '--skipo-shadow-btn': tokens.shadow.btn,
    '--skipo-shadow-btn-hover': tokens.shadow.btnHover,
    '--skipo-shadow-btn-active': tokens.shadow.btnActive,
    '--skipo-success': tokens.status.success,
    '--skipo-success-fg': tokens.status.successFg,
    '--skipo-warning': tokens.status.warning,
    '--skipo-warning-fg': tokens.status.warningFg,
    '--skipo-danger': tokens.status.danger,
    '--skipo-danger-fg': tokens.status.dangerFg,
    '--skipo-info': tokens.status.info,
    '--skipo-info-fg': tokens.status.infoFg,
    '--skipo-top-toolbar-height': tokens.shell.topToolbarHeight,
    '--skipo-top-toolbar-bg': tokens.shell.topToolbarBg,
    '--skipo-bottom-strip-height': tokens.shell.bottomStripHeight,
    '--skipo-bottom-strip-bg': tokens.shell.bottomStripBg,
    '--skipo-inspection-text-color': tokens.shell.inspectionTextTranslucent
  };
}

export function tokensToCssVariables(tokens: SkipoSemanticTokens): Record<string, string> {
  return {
    ...mapTypographyAndBg(tokens),
    ...mapAccentAndBorders(tokens),
    ...mapShadowsAndStatus(tokens)
  };
}

export function applyThemePack(themePack: SkipoThemePack, target?: HTMLElement): void {
  const vars = tokensToCssVariables(themePack.tokens);
  const el = target || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!el) return;

  for (const [prop, val] of Object.entries(vars)) {
    el.style.setProperty(prop, val);
  }
  el.setAttribute('data-skipo-theme', themePack.metadata.mode);
  el.setAttribute('data-skipo-theme-id', themePack.metadata.id);
}

export function validateThemePack(raw: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Theme pack must be an object'] };
  }
  const pack = raw as Partial<SkipoThemePack>;
  if (!pack.metadata?.id) errors.push('Missing metadata.id');
  if (!pack.metadata?.mode) errors.push('Missing metadata.mode');
  if (!pack.tokens?.bg?.canvas) errors.push('Missing tokens.bg.canvas');
  if (!pack.tokens?.text?.primary) errors.push('Missing tokens.text.primary');
  if (!pack.tokens?.accent?.primary) errors.push('Missing tokens.accent.primary');
  if (!pack.tokens?.border?.style) errors.push('Missing tokens.border.style');
  if (!pack.tokens?.shell?.bottomStripBg) errors.push('Missing tokens.shell.bottomStripBg');

  return { valid: errors.length === 0, errors };
}
