import type { ThemeTypographyDefinition } from '../../schema/typography.schema.js';

export const darkTypography: ThemeTypographyDefinition = {
  globalFont: "'Space Grotesk', sans-serif",
  globalMonoFont: "'JetBrains Mono', monospace",
  globalColor: '#E0F7FC',
  globalAccentColor: '#00F0FF',
  headingFont: "'Space Grotesk', sans-serif",
  bodyFont: "'Space Grotesk', sans-serif",
  codeFont: "'JetBrains Mono', monospace",
  sections: {
    h1: { fontSize: '28px', fontWeight: '800', lineHeight: '1.2', color: '#00F0FF', borderBottom: '2px solid rgba(0, 240, 255, 0.4)' },
    h2: { fontSize: '22px', fontWeight: '700', lineHeight: '1.3', color: '#FF0055', borderBottom: '1px solid rgba(255, 0, 85, 0.3)' },
    h3: { fontSize: '18px', fontWeight: '700', lineHeight: '1.4', color: '#00F0FF' },
    h4: { fontSize: '16px', fontWeight: '600', lineHeight: '1.4', color: '#00FF9D' },
    h5: { fontSize: '14px', fontWeight: '600', lineHeight: '1.4', color: '#E0F7FC' },
    h6: { fontSize: '13px', fontWeight: '600', lineHeight: '1.4', color: '#708A9E' },
    p: { fontSize: '15px', lineHeight: '1.6', color: '#E0F7FC' },
    blockquote: { fontStyle: 'italic', color: '#00F0FF', bg: 'rgba(0, 240, 255, 0.08)', borderLeftColor: '#FF0055', borderLeftWidth: '4px' },
    ul: { markerColor: '#00F0FF', spacing: '6px' },
    ol: { markerColor: '#FF0055', spacing: '6px' },
    inlineCode: { fontSize: '13px', color: '#00F0FF', bg: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)', radius: '3px' },
    codeBlock: { fontSize: '13px', color: '#00FF9D', bg: '#080A10', border: '1px solid rgba(0, 240, 255, 0.25)', radius: '4px' },
    table: { headerBg: '#00F0FF', headerColor: '#000000', border: '1px solid rgba(0, 240, 255, 0.25)', cellBg: '#121520' },
    link: { color: '#00F0FF', textDecoration: 'none', hoverColor: '#FF0055', hoverUnderline: true },
    hr: { color: '#00F0FF', borderStyle: 'solid', height: '2px' }
  }
};

export const lightTypography: ThemeTypographyDefinition = {
  globalFont: "'Space Grotesk', sans-serif",
  globalMonoFont: "'JetBrains Mono', monospace",
  globalColor: '#0B1920',
  globalAccentColor: '#008C99',
  headingFont: "'Space Grotesk', sans-serif",
  bodyFont: "'Space Grotesk', sans-serif",
  codeFont: "'JetBrains Mono', monospace",
  sections: {
    h1: { fontSize: '28px', fontWeight: '800', lineHeight: '1.2', color: '#008C99', borderBottom: '2px solid rgba(0, 140, 153, 0.35)' },
    h2: { fontSize: '22px', fontWeight: '700', lineHeight: '1.3', color: '#D6004C', borderBottom: '1px solid rgba(214, 0, 76, 0.25)' },
    h3: { fontSize: '18px', fontWeight: '700', lineHeight: '1.4', color: '#008C99' },
    h4: { fontSize: '16px', fontWeight: '600', lineHeight: '1.4', color: '#059669' },
    h5: { fontSize: '14px', fontWeight: '600', lineHeight: '1.4', color: '#0B1920' },
    h6: { fontSize: '13px', fontWeight: '600', lineHeight: '1.4', color: '#536D7A' },
    p: { fontSize: '15px', lineHeight: '1.6', color: '#0B1920' },
    blockquote: { fontStyle: 'italic', color: '#008C99', bg: 'rgba(0, 140, 153, 0.08)', borderLeftColor: '#D6004C', borderLeftWidth: '4px' },
    ul: { markerColor: '#008C99', spacing: '6px' },
    ol: { markerColor: '#D6004C', spacing: '6px' },
    inlineCode: { fontSize: '13px', color: '#008C99', bg: 'rgba(0, 140, 153, 0.12)', border: '1px solid rgba(0, 140, 153, 0.25)', radius: '3px' },
    codeBlock: { fontSize: '13px', color: '#0B1920', bg: '#D4E5ED', border: '1px solid #C2D9E4', radius: '4px' },
    table: { headerBg: '#008C99', headerColor: '#FFFFFF', border: '1px solid #C2D9E4', cellBg: '#EBF4F7' },
    link: { color: '#008C99', textDecoration: 'none', hoverColor: '#D6004C', hoverUnderline: true },
    hr: { color: '#008C99', borderStyle: 'solid', height: '2px' }
  }
};
