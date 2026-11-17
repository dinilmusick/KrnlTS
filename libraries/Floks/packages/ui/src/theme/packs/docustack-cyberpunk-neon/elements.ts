import type { UIElementThemeValue } from '../../types.js';

export const darkElements: Record<string, UIElementThemeValue> = {
  canvas: { cssVars: { '--color-base': '#0A0B10', '--skipo-bg': '#0A0B10' }, styles: { backgroundColor: '#0A0B10', color: '#E0F7FC', fontFamily: 'var(--skipo-font-body)' } },
  buttonPrimary: {
    cssVars: { '--color-accent': '#00F0FF' },
    styles: { backgroundColor: '#00F0FF', color: '#000000', border: '2px solid #000000' },
    effects: { glow: '0 0 15px rgba(0, 240, 255, 0.8)' }
  },
  graphNodeRoot: {
    cssVars: { '--color-accent': '#00F0FF' },
    styles: { border: '2px solid #00F0FF' },
    effects: { glow: '0 0 20px rgba(0, 240, 255, 0.9)' }
  }
};

export const lightElements: Record<string, UIElementThemeValue> = {
  canvas: { cssVars: { '--color-base': '#EBF4F7', '--skipo-bg': '#EBF4F7' }, styles: { backgroundColor: '#EBF4F7', color: '#0B1920', fontFamily: 'var(--skipo-font-body)' } },
  buttonPrimary: {
    cssVars: { '--color-accent': '#008C99' },
    styles: { backgroundColor: '#008C99', color: '#FFFFFF', border: '2px solid #008C99' },
    effects: { glow: '0 0 12px rgba(0, 140, 153, 0.5)' }
  },
  graphNodeRoot: {
    cssVars: { '--color-accent': '#008C99' },
    styles: { border: '2px solid #008C99' },
    effects: { glow: '0 0 16px rgba(0, 140, 153, 0.6)' }
  }
};
