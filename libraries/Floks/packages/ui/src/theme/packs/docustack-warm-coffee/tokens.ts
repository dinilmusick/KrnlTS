import type { SkipoSemanticTokens } from '../../types.js';

export const lightTokens: SkipoSemanticTokens = {
  bg: { canvas: '#F5EDE4', surface: '#E8DCC4', surfaceHover: '#DFCFB9', blur: 'blur(12px)' },
  text: { primary: '#21140E', muted: '#7A6B5D', inverse: '#F5EDE4' },
  accent: { primary: '#C87D32', fg: '#FFFFFF', glow: '0 0 12px rgba(200, 125, 50, 0.35)', hover: '#C25E45' },
  border: { color: '#2C1810', input: '#C87D32', style: '2px solid #2C1810' },
  radius: { base: '0px', sm: '0px', lg: '0px' },
  shadow: {
    card: '4px 4px 0px #2C1810', cardHover: '6px 6px 0px #2C1810',
    btn: '2px 2px 0px #2C1810', btnHover: '3px 3px 0px #2C1810', btnActive: '1px 1px 0px #2C1810'
  },
  font: { sans: "'Courier Prime', monospace", mono: "'JetBrains Mono', monospace" },
  status: {
    success: '#059669', successFg: '#FFFFFF', warning: '#D97706', warningFg: '#FFFFFF',
    danger: '#DC2626', dangerFg: '#FFFFFF', info: '#2563EB', infoFg: '#FFFFFF'
  },
  shell: {
    topToolbarHeight: '44px', topToolbarBg: '#DFCFB9',
    bottomStripHeight: '30px', bottomStripBg: '#E8DCC4',
    inspectionTextTranslucent: 'rgba(33, 20, 14, 0.85)'
  }
};

export const darkTokens: SkipoSemanticTokens = {
  bg: { canvas: '#1A120E', surface: '#281D17', surfaceHover: '#362720', blur: 'blur(14px)' },
  text: { primary: '#F5EDE4', muted: '#A8988B', inverse: '#1A120E' },
  accent: { primary: '#E08A3C', fg: '#000000', glow: '0 0 14px rgba(224, 138, 60, 0.4)', hover: '#C87D32' },
  border: { color: '#3D2C22', input: '#E08A3C', style: '2px solid #3D2C22' },
  radius: { base: '0px', sm: '0px', lg: '0px' },
  shadow: {
    card: '4px 4px 0px #000000', cardHover: '6px 6px 0px #000000',
    btn: '2px 2px 0px #000000', btnHover: '3px 3px 0px #000000', btnActive: '1px 1px 0px #000000'
  },
  font: { sans: "'Courier Prime', monospace", mono: "'JetBrains Mono', monospace" },
  status: {
    success: '#10B981', successFg: '#000000', warning: '#F59E0B', warningFg: '#000000',
    danger: '#EF4444', dangerFg: '#FFFFFF', info: '#3B82F6', infoFg: '#FFFFFF'
  },
  shell: {
    topToolbarHeight: '44px', topToolbarBg: '#1A120E',
    bottomStripHeight: '30px', bottomStripBg: '#281D17',
    inspectionTextTranslucent: 'rgba(245, 237, 228, 0.85)'
  }
};
