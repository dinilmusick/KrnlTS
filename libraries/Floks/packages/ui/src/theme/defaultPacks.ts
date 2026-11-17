import type { SkipoThemePack } from './types.js';

export const DEFAULT_DARK_THEME_PACK: SkipoThemePack = {
  metadata: {
    id: 'skipo-dark-neo',
    name: 'Skipo Dark Neo',
    version: '1.0.0',
    mode: 'dark',
    author: 'Skipo Core Team',
    description: 'Default 2.5D Neo-Brutalism theme with charcoal panels and warm gold accents.'
  },
  tokens: {
    bg: {
      canvas: '#16181d',
      surface: 'rgba(26, 29, 36, 0.85)',
      surfaceHover: 'rgba(34, 38, 48, 0.92)',
      blur: 'blur(20px)'
    },
    text: {
      primary: '#f1f5f9',
      muted: '#8e95a5',
      inverse: '#0f172a'
    },
    accent: {
      primary: '#d4af37',
      fg: '#000000',
      glow: '0 0 14px rgba(212, 175, 55, 0.45)',
      hover: '#c59f2e'
    },
    border: {
      color: 'rgba(255, 255, 255, 0.85)',
      input: 'rgba(255, 255, 255, 0.85)',
      style: '2px solid rgba(255, 255, 255, 0.85)'
    },
    radius: {
      base: '10px',
      sm: '6px',
      lg: '14px'
    },
    shadow: {
      card: '5px 5px 0px rgba(0, 0, 0, 0.90)',
      cardHover: '8px 8px 0px rgba(0, 0, 0, 0.95)',
      btn: '3px 3px 0px rgba(0, 0, 0, 0.90)',
      btnHover: '5px 5px 0px rgba(0, 0, 0, 0.95)',
      btnActive: '1px 1px 0px rgba(0, 0, 0, 0.90)'
    },
    font: {
      sans: "'Inter', -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
      mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace"
    },
    status: {
      success: '#10b981',
      successFg: '#000000',
      warning: '#f59e0b',
      warningFg: '#000000',
      danger: '#ef4444',
      dangerFg: '#ffffff',
      info: '#3b82f6',
      infoFg: '#ffffff'
    },
    shell: {
      topToolbarHeight: '44px',
      topToolbarBg: 'rgba(18, 20, 25, 0.95)',
      bottomStripHeight: '30px',
      bottomStripBg: 'rgba(15, 17, 21, 0.95)',
      inspectionTextTranslucent: 'rgba(241, 245, 249, 0.80)'
    }
  }
};

export const DEFAULT_LIGHT_THEME_PACK: SkipoThemePack = {
  metadata: {
    id: 'skipo-light-coffee',
    name: 'Skipo Light Coffee',
    version: '1.0.0',
    mode: 'light',
    author: 'Skipo Core Team',
    description: 'Warm cream, espresso brown and subtle tan palette.'
  },
  tokens: {
    bg: {
      canvas: '#f5f0e8',
      surface: 'rgba(245, 240, 232, 0.90)',
      surfaceHover: 'rgba(238, 230, 218, 0.95)',
      blur: 'blur(16px)'
    },
    text: {
      primary: '#21140e',
      muted: '#6b5c52',
      inverse: '#f5f0e8'
    },
    accent: {
      primary: '#6f4e37',
      fg: '#ffffff',
      glow: '0 0 12px rgba(111, 78, 55, 0.35)',
      hover: '#5c3f2b'
    },
    border: {
      color: 'rgba(44, 24, 16, 0.85)',
      input: 'rgba(44, 24, 16, 0.85)',
      style: '2px solid rgba(44, 24, 16, 0.85)'
    },
    radius: {
      base: '10px',
      sm: '6px',
      lg: '14px'
    },
    shadow: {
      card: '5px 5px 0px rgba(44, 24, 16, 0.25)',
      cardHover: '8px 8px 0px rgba(44, 24, 16, 0.35)',
      btn: '3px 3px 0px rgba(44, 24, 16, 0.25)',
      btnHover: '5px 5px 0px rgba(44, 24, 16, 0.35)',
      btnActive: '1px 1px 0px rgba(44, 24, 16, 0.25)'
    },
    font: {
      sans: "'Inter', -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
      mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace"
    },
    status: {
      success: '#059669',
      successFg: '#ffffff',
      warning: '#d97706',
      warningFg: '#ffffff',
      danger: '#dc2626',
      dangerFg: '#ffffff',
      info: '#2563eb',
      infoFg: '#ffffff'
    },
    shell: {
      topToolbarHeight: '44px',
      topToolbarBg: 'rgba(240, 233, 222, 0.95)',
      bottomStripHeight: '30px',
      bottomStripBg: 'rgba(235, 226, 214, 0.95)',
      inspectionTextTranslucent: 'rgba(33, 20, 14, 0.80)'
    }
  }
};
