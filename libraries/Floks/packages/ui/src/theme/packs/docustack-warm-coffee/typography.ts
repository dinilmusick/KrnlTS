import type { ThemeTypographyDefinition } from '../../schema/typography.schema.js';

export const lightTypography: ThemeTypographyDefinition = {
  globalFont: "'Courier Prime', monospace",
  globalMonoFont: "'JetBrains Mono', monospace",
  globalColor: '#21140E',
  globalAccentColor: '#C87D32',
  headingFont: "'Courier Prime', monospace",
  bodyFont: "'Courier Prime', monospace",
  codeFont: "'JetBrains Mono', monospace",
  sections: {
    h1: { fontSize: '28px', fontWeight: '800', lineHeight: '1.2', color: '#C87D32', borderBottom: '2px solid rgba(200, 125, 50, 0.35)' },
    h2: { fontSize: '22px', fontWeight: '700', lineHeight: '1.3', color: '#21140E', borderBottom: '1px solid rgba(200, 125, 50, 0.2)' },
    h3: { fontSize: '18px', fontWeight: '700', lineHeight: '1.4', color: '#21140E' },
    h4: { fontSize: '16px', fontWeight: '600', lineHeight: '1.4', color: '#C87D32' },
    h5: { fontSize: '14px', fontWeight: '600', lineHeight: '1.4', color: '#21140E' },
    h6: { fontSize: '13px', fontWeight: '600', lineHeight: '1.4', color: '#7A6B5D' },
    p: { fontSize: '15px', lineHeight: '1.6', color: '#21140E' },
    blockquote: { fontStyle: 'italic', color: '#9E5B1E', bg: 'rgba(200, 125, 50, 0.08)', borderLeftColor: '#C87D32', borderLeftWidth: '4px' },
    ul: { markerColor: '#C87D32', spacing: '6px' },
    ol: { markerColor: '#C87D32', spacing: '6px' },
    inlineCode: { fontSize: '13px', color: '#9E5B1E', bg: 'rgba(200, 125, 50, 0.12)', border: '1px solid rgba(200, 125, 50, 0.25)', radius: '3px' },
    codeBlock: { fontSize: '13px', color: '#21140E', bg: '#E8DCC4', border: '1px solid #DFCFB9', radius: '4px' },
    table: { headerBg: '#C87D32', headerColor: '#FFFFFF', border: '1px solid #DFCFB9', cellBg: '#F5EDE4' },
    link: { color: '#C87D32', textDecoration: 'none', hoverColor: '#C25E45', hoverUnderline: true },
    hr: { color: '#C87D32', borderStyle: 'solid', height: '2px' }
  }
};

export const darkTypography: ThemeTypographyDefinition = {
  globalFont: "'Courier Prime', monospace",
  globalMonoFont: "'JetBrains Mono', monospace",
  globalColor: '#F5EDE4',
  globalAccentColor: '#E08A3C',
  headingFont: "'Courier Prime', monospace",
  bodyFont: "'Courier Prime', monospace",
  codeFont: "'JetBrains Mono', monospace",
  sections: {
    h1: { fontSize: '28px', fontWeight: '800', lineHeight: '1.2', color: '#E08A3C', borderBottom: '2px solid rgba(224, 138, 60, 0.4)' },
    h2: { fontSize: '22px', fontWeight: '700', lineHeight: '1.3', color: '#F5EDE4', borderBottom: '1px solid rgba(224, 138, 60, 0.2)' },
    h3: { fontSize: '18px', fontWeight: '700', lineHeight: '1.4', color: '#F5EDE4' },
    h4: { fontSize: '16px', fontWeight: '600', lineHeight: '1.4', color: '#E08A3C' },
    h5: { fontSize: '14px', fontWeight: '600', lineHeight: '1.4', color: '#F5EDE4' },
    h6: { fontSize: '13px', fontWeight: '600', lineHeight: '1.4', color: '#A8988B' },
    p: { fontSize: '15px', lineHeight: '1.6', color: '#F5EDE4' },
    blockquote: { fontStyle: 'italic', color: '#E08A3C', bg: 'rgba(224, 138, 60, 0.08)', borderLeftColor: '#E08A3C', borderLeftWidth: '4px' },
    ul: { markerColor: '#E08A3C', spacing: '6px' },
    ol: { markerColor: '#E08A3C', spacing: '6px' },
    inlineCode: { fontSize: '13px', color: '#E08A3C', bg: 'rgba(224, 138, 60, 0.15)', border: '1px solid rgba(224, 138, 60, 0.3)', radius: '3px' },
    codeBlock: { fontSize: '13px', color: '#F5EDE4', bg: '#281D17', border: '1px solid #3D2C22', radius: '4px' },
    table: { headerBg: '#E08A3C', headerColor: '#000000', border: '1px solid #3D2C22', cellBg: '#1A120E' },
    link: { color: '#E08A3C', textDecoration: 'none', hoverColor: '#FFFFFF', hoverUnderline: true },
    hr: { color: '#E08A3C', borderStyle: 'solid', height: '2px' }
  }
};
