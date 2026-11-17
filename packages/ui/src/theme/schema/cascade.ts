import type { ThemeTypographyDefinition } from './typography.schema.js';

export interface ResolvedTypographyCascade {
  globalFont: string;
  globalMonoFont: string;
  globalColor: string;
  globalAccentColor: string;
  headingFont: string;
  bodyFont: string;
  codeFont: string;
  cssVars: Record<string, string>;
}

export function resolveTypographyCascade(
  typo?: ThemeTypographyDefinition,
  fallbackAccent: string = '#D4AF37'
): ResolvedTypographyCascade {
  const globalFont = typo?.globalFont || "'Courier Prime', monospace";
  const globalMonoFont = typo?.globalMonoFont || "'JetBrains Mono', monospace";
  const globalColor = typo?.globalColor || '#F3EDE0';
  const globalAccentColor = typo?.globalAccentColor || fallbackAccent;

  const headingFont = typo?.headingFont || globalFont;
  const bodyFont = typo?.bodyFont || globalFont;
  const codeFont = typo?.codeFont || globalMonoFont;

  const sec = typo?.sections || {};

  const cssVars: Record<string, string> = {
    '--skipo-font-global': globalFont,
    '--skipo-font-mono': globalMonoFont,
    '--skipo-color-global': globalColor,
    '--skipo-color-accent': globalAccentColor,
    '--skipo-font-heading': headingFont,
    '--skipo-font-body': bodyFont,
    '--skipo-font-code': codeFont,

    // H1
    '--skipo-font-h1': sec.h1?.font || headingFont,
    '--skipo-h1-size': sec.h1?.fontSize || '28px',
    '--skipo-h1-weight': String(sec.h1?.fontWeight || '800'),
    '--skipo-h1-color': sec.h1?.color || globalAccentColor,
    '--skipo-h1-border': sec.h1?.borderBottom || `2px solid ${globalAccentColor}40`,

    // H2
    '--skipo-font-h2': sec.h2?.font || headingFont,
    '--skipo-h2-size': sec.h2?.fontSize || '22px',
    '--skipo-h2-weight': String(sec.h2?.fontWeight || '700'),
    '--skipo-h2-color': sec.h2?.color || globalColor,
    '--skipo-h2-border': sec.h2?.borderBottom || '1px solid rgba(0,0,0,0.15)',

    // H3
    '--skipo-font-h3': sec.h3?.font || headingFont,
    '--skipo-h3-size': sec.h3?.fontSize || '18px',
    '--skipo-h3-weight': String(sec.h3?.fontWeight || '700'),
    '--skipo-h3-color': sec.h3?.color || globalColor,

    // Paragraph / Body
    '--skipo-font-p': sec.p?.font || bodyFont,
    '--skipo-p-size': sec.p?.fontSize || '15px',
    '--skipo-p-line-height': sec.p?.lineHeight || '1.6',
    '--skipo-p-color': sec.p?.color || globalColor,

    // Blockquote
    '--skipo-blockquote-font': sec.blockquote?.font || bodyFont,
    '--skipo-blockquote-color': sec.blockquote?.color || globalColor,
    '--skipo-blockquote-bg': sec.blockquote?.bg || 'rgba(0,0,0,0.2)',
    '--skipo-blockquote-border': sec.blockquote?.borderLeftColor || globalAccentColor,

    // Lists
    '--skipo-list-marker-color': sec.ul?.markerColor || globalAccentColor,

    // Code
    '--skipo-code-font': sec.inlineCode?.font || codeFont,
    '--skipo-code-color': sec.inlineCode?.color || globalAccentColor,
    '--skipo-code-bg': sec.inlineCode?.bg || `${globalAccentColor}20`,
    '--skipo-code-border': sec.inlineCode?.border || `1px solid ${globalAccentColor}40`,

    // Code Block
    '--skipo-codeblock-font': sec.codeBlock?.font || codeFont,
    '--skipo-codeblock-bg': sec.codeBlock?.bg || '#121214',

    // Table
    '--skipo-table-header-bg': sec.table?.headerBg || globalAccentColor,
    '--skipo-table-header-color': sec.table?.headerColor || '#000000',

    // Link
    '--skipo-link-color': sec.link?.color || globalAccentColor
  };

  return {
    globalFont,
    globalMonoFont,
    globalColor,
    globalAccentColor,
    headingFont,
    bodyFont,
    codeFont,
    cssVars
  };
}
