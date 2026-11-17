import type { SkipoSemanticTokens } from '../../types.js';

export const darkTokens: SkipoSemanticTokens = {
  bg: { canvas: '#0A0B10', surface: '#121520', surfaceHover: '#1A1F2C', blur: 'blur(20px)' },
  text: { primary: '#E0F7FC', muted: '#708A9E', inverse: '#0A0B10' },
  accent: { primary: '#00F0FF', fg: '#000000', glow: '0 0 18px rgba(0, 240, 255, 0.65)', hover: '#00D0E0' },
  border: { color: '#00F0FF', input: '#FF0055', style: '2px solid #00F0FF' },
  radius: { base: '0px', sm: '0px', lg: '0px' },
  shadow: {
    card: '4px 4px 0px #000000', cardHover: '6px 6px 0px rgba(0, 240, 255, 0.4)',
    btn: '2px 2px 0px #000000', btnHover: '3px 3px 0px #00F0FF', btnActive: '1px 1px 0px #000000'
  },
  font: { sans: "'Space Grotesk', sans-serif", mono: "'JetBrains Mono', monospace" },
  status: {
    success: '#00FF9D', successFg: '#000000', warning: '#FFE600', warningFg: '#000000',
    danger: '#FF0055', dangerFg: '#FFFFFF', info: '#00F0FF', infoFg: '#000000'
  },
  shell: {
    topToolbarHeight: '44px', topToolbarBg: '#0A0B10',
    bottomStripHeight: '30px', bottomStripBg: '#0A0B10',
    inspectionTextTranslucent: 'rgba(224, 247, 252, 0.85)'
  }
};

export const lightTokens: SkipoSemanticTokens = {
  bg: { canvas: '#EBF4F7', surface: '#D4E5ED', surfaceHover: '#C2D9E4', blur: 'blur(16px)' },
  text: { primary: '#0B1920', muted: '#536D7A', inverse: '#EBF4F7' },
  accent: { primary: '#008C99', fg: '#FFFFFF', glow: '0 0 14px rgba(0, 140, 153, 0.4)', hover: '#00727D' },
  border: { color: '#008C99', input: '#D6004C', style: '2px solid #008C99' },
  radius: { base: '0px', sm: '0px', lg: '0px' },
  shadow: {
    card: '4px 4px 0px #A0B4BE', cardHover: '6px 6px 0px rgba(0, 140, 153, 0.4)',
    btn: '2px 2px 0px #A0B4BE', btnHover: '3px 3px 0px #008C99', btnActive: '1px 1px 0px #A0B4BE'
  },
  font: { sans: "'Space Grotesk', sans-serif", mono: "'JetBrains Mono', monospace" },
  status: {
    success: '#059669', successFg: '#FFFFFF', warning: '#D97706', warningFg: '#FFFFFF',
    danger: '#DC2626', dangerFg: '#FFFFFF', info: '#0284C7', infoFg: '#FFFFFF'
  },
  shell: {
    topToolbarHeight: '44px', topToolbarBg: '#D4E5ED',
    bottomStripHeight: '30px', bottomStripBg: '#C2D9E4',
    inspectionTextTranslucent: 'rgba(11, 25, 32, 0.85)'
  }
};
