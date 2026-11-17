export function mapSemanticTokensToCssVars(tokens: any): Record<string, string> {
  if (!tokens) return {};
  return {
    '--skipo-font': tokens.font?.sans || '',
    '--skipo-font-mono': tokens.font?.mono || '',
    '--skipo-bg': tokens.bg?.canvas || '',
    '--skipo-surface': tokens.bg?.surface || '',
    '--skipo-text': tokens.text?.primary || '',
    '--skipo-text-muted': tokens.text?.muted || '',
    '--skipo-accent': tokens.accent?.primary || '',
    '--skipo-accent-fg': tokens.accent?.fg || '',
    '--skipo-border-color': tokens.border?.color || '',
    '--skipo-border': tokens.border?.style || '',
    '--skipo-radius': tokens.radius?.base || '',
    '--skipo-shadow': tokens.shadow?.card || ''
  };
}
