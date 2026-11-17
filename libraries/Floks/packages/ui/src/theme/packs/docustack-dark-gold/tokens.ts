import type { SkipoSemanticTokens } from '../../types.js';

export const darkTokens: SkipoSemanticTokens = {
  bg: { canvas: '#121214', surface: '#1E1E24', surfaceHover: '#26262E', blur: 'blur(16px)' },
  text: { primary: '#F3EDE0', muted: '#A0A0B0', inverse: '#121214' },
  accent: { primary: '#D4AF37', fg: '#000000', glow: '0 0 16px rgba(212, 175, 55, 0.45)', hover: '#B59443' },
  border: { color: '#000000', input: '#D4AF37', style: '2px solid #000000' },
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
    topToolbarHeight: '44px', topToolbarBg: 'rgba(18, 18, 20, 0.95)',
    bottomStripHeight: '30px', bottomStripBg: 'rgba(18, 18, 20, 0.95)',
    inspectionTextTranslucent: 'rgba(243, 237, 224, 0.85)'
  }
};

export const lightTokens: SkipoSemanticTokens = {
  bg: { canvas: '#F8F6F0', surface: '#EDE8DC', surfaceHover: '#E4DEC0', blur: 'blur(16px)' },
  text: { primary: '#18181A', muted: '#6E6B65', inverse: '#F8F6F0' },
  accent: { primary: '#B58900', fg: '#FFFFFF', glow: '0 0 14px rgba(181, 137, 0, 0.35)', hover: '#997400' },
  border: { color: '#2A2518', input: '#B58900', style: '2px solid #2A2518' },
  radius: { base: '0px', sm: '0px', lg: '0px' },
  shadow: {
    card: '4px 4px 0px #2A2518', cardHover: '6px 6px 0px #2A2518',
    btn: '2px 2px 0px #2A2518', btnHover: '3px 3px 0px #2A2518', btnActive: '1px 1px 0px #2A2518'
  },
  font: { sans: "'Courier Prime', monospace", mono: "'JetBrains Mono', monospace" },
  status: {
    success: '#059669', successFg: '#FFFFFF', warning: '#D97706', warningFg: '#FFFFFF',
    danger: '#DC2626', dangerFg: '#FFFFFF', info: '#2563EB', infoFg: '#FFFFFF'
  },
  shell: {
    topToolbarHeight: '44px', topToolbarBg: '#EDE8DC',
    bottomStripHeight: '30px', bottomStripBg: '#E4DEC0',
    inspectionTextTranslucent: 'rgba(24, 24, 26, 0.85)'
  }
};
