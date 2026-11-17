import type { ModularThemePack } from './types.js';

const coffeeLightTokens = {
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

const coffeeDarkTokens = {
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

const coffeeLightElements = {
  canvas: { cssVars: { '--color-base': '#F5EDE4', '--skipo-bg': '#F5EDE4' }, styles: { backgroundColor: '#F5EDE4', color: '#21140E' } },
  wallpaperOverlay: { cssVars: { '--wallpaper-overlay-color': '#F5EDE4', '--wallpaper-overlay-opacity': '0.60' } },
  buttonPrimary: { cssVars: { '--color-accent': '#C87D32' }, styles: { backgroundColor: '#C87D32', color: '#FFFFFF', border: '2px solid #2C1810' } },
  kanbanColumn: { cssVars: { '--color-surface': '#E8DCC4', '--color-border': '#2C1810' } },
  card: { cssVars: { '--color-surface': '#E8DCC4', '--color-border': '#2C1810' } }
};

const coffeeDarkElements = {
  canvas: { cssVars: { '--color-base': '#1A120E', '--skipo-bg': '#1A120E' }, styles: { backgroundColor: '#1A120E', color: '#F5EDE4' } },
  wallpaperOverlay: { cssVars: { '--wallpaper-overlay-color': '#1A120E', '--wallpaper-overlay-opacity': '0.75' } },
  buttonPrimary: { cssVars: { '--color-accent': '#E08A3C' }, styles: { backgroundColor: '#E08A3C', color: '#000000', border: '2px solid #3D2C22' } },
  kanbanColumn: { cssVars: { '--color-surface': '#281D17', '--color-border': '#3D2C22' } },
  card: { cssVars: { '--color-surface': '#281D17', '--color-border': '#3D2C22' } }
};

export const DOCUSTACK_WARM_COFFEE_PACK: ModularThemePack = {
  metadata: {
    id: 'docustack-warm-coffee', name: 'DocuStack Warm Coffee', version: '1.0.0',
    mode: 'light', author: 'DocuStack Team', description: 'Warm espresso and caramel dual-variant palette.'
  },
  variants: {
    dark: { mode: 'dark', tokens: coffeeDarkTokens, elementStyles: coffeeDarkElements },
    light: { mode: 'light', tokens: coffeeLightTokens, elementStyles: coffeeLightElements }
  },
  tokens: coffeeLightTokens,
  elementStyles: coffeeLightElements
};

const cyberDarkTokens = {
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

const cyberLightTokens = {
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

const cyberDarkElements = {
  canvas: { cssVars: { '--color-base': '#0A0B10', '--skipo-bg': '#0A0B10' } },
  buttonPrimary: {
    cssVars: { '--color-accent': '#00F0FF' },
    styles: { backgroundColor: '#00F0FF', color: '#000000', border: '2px solid #000000' },
    effects: { glow: '0 0 15px rgba(0, 240, 255, 0.8)' }
  },
  graphNodeRoot: {
    cssVars: { '--color-accent': '#00F0FF' },
    effects: { glow: '0 0 20px rgba(0, 240, 255, 0.9)' }
  }
};

const cyberLightElements = {
  canvas: { cssVars: { '--color-base': '#EBF4F7', '--skipo-bg': '#EBF4F7' } },
  buttonPrimary: {
    cssVars: { '--color-accent': '#008C99' },
    styles: { backgroundColor: '#008C99', color: '#FFFFFF', border: '2px solid #008C99' },
    effects: { glow: '0 0 12px rgba(0, 140, 153, 0.5)' }
  },
  graphNodeRoot: {
    cssVars: { '--color-accent': '#008C99' },
    effects: { glow: '0 0 16px rgba(0, 140, 153, 0.6)' }
  }
};

export const DOCUSTACK_CYBERPUNK_PACK: ModularThemePack = {
  metadata: {
    id: 'docustack-cyberpunk-neon', name: 'DocuStack Cyberpunk Neon', version: '1.0.0',
    mode: 'dark', author: 'DocuStack Team', description: 'High-contrast cyberpunk cyan and magenta dual-variant glow.'
  },
  variants: {
    dark: { mode: 'dark', tokens: cyberDarkTokens, elementStyles: cyberDarkElements },
    light: { mode: 'light', tokens: cyberLightTokens, elementStyles: cyberLightElements }
  },
  tokens: cyberDarkTokens,
  elementStyles: cyberDarkElements
};
