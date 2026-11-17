import { ColorPalette } from './types';
import type { SkipoThemePack } from '../theme/index.js';

const DYNAMIC_STYLE_TAG_ID = 'floks-central-palette-styles';

export function paletteToSkipoThemePack(palette: ColorPalette): SkipoThemePack {
  return {
    metadata: {
      id: palette.id,
      name: palette.name,
      version: '1.0.0',
      mode: palette.mode,
      description: palette.description,
    },
    tokens: {
      bg: {
        canvas: palette.bgPrimary,
        surface: palette.bgSurface,
        surfaceHover: palette.bgElevated,
        blur: 'blur(16px)',
      },
      text: {
        primary: palette.textPrimary,
        muted: palette.textMuted,
        inverse: palette.textInverse,
      },
      accent: {
        primary: palette.accentPrimary,
        fg: palette.textInverse,
        glow: palette.accentGlow,
        hover: palette.accentHover,
      },
      border: {
        color: palette.borderMedium,
        input: palette.borderSubtle,
        style: `1px solid ${palette.borderMedium}`,
      },
      radius: {
        base: '6px',
        sm: '4px',
        lg: '8px',
      },
      shadow: {
        card: '0 4px 16px rgba(0,0,0,0.5)',
        cardHover: '0 6px 20px rgba(0,0,0,0.7)',
        btn: '0 2px 4px rgba(0,0,0,0.3)',
        btnHover: '0 3px 6px rgba(0,0,0,0.4)',
        btnActive: '0 1px 2px rgba(0,0,0,0.2)',
      },
      font: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        mono: 'JetBrains Mono, Menlo, monospace',
      },
      status: {
        success: palette.success,
        successFg: palette.textInverse,
        warning: palette.warning,
        warningFg: palette.textInverse,
        danger: palette.danger,
        dangerFg: palette.textInverse,
        info: palette.info,
        infoFg: palette.textInverse,
      },
      shell: {
        topToolbarHeight: '44px',
        topToolbarBg: palette.bgSecondary,
        bottomStripHeight: '30px',
        bottomStripBg: palette.bgPrimary,
        inspectionTextTranslucent: palette.textAccent || palette.accentHover,
      },
    },
  };
}

export function applyPaletteToDocument(palette: ColorPalette): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Core Surface Tokens
  root.style.setProperty('--krnl-bg-primary', palette.bgPrimary);
  root.style.setProperty('--krnl-bg-secondary', palette.bgSecondary);
  root.style.setProperty('--krnl-bg-surface', palette.bgSurface);
  root.style.setProperty('--krnl-bg-elevated', palette.bgElevated);
  root.style.setProperty('--krnl-bg-input', palette.bgInput);
  root.style.setProperty('--krnl-modal-overlay', palette.bgModalOverlay);

  // 2. Borders
  root.style.setProperty('--krnl-border-subtle', palette.borderSubtle);
  root.style.setProperty('--krnl-border-medium', palette.borderMedium);
  root.style.setProperty('--krnl-border-bold', palette.borderBold);
  root.style.setProperty('--krnl-border-accent', palette.borderAccent);
  root.style.setProperty('--krnl-border', palette.borderMedium);

  // 3. Text
  root.style.setProperty('--krnl-text-primary', palette.textPrimary);
  root.style.setProperty('--krnl-text-secondary', palette.textSecondary);
  root.style.setProperty('--krnl-text-muted', palette.textMuted);
  root.style.setProperty('--krnl-text-inverse', palette.textInverse);
  root.style.setProperty('--krnl-text-accent', palette.textAccent);

  // 4. Accent & Glow
  root.style.setProperty('--krnl-accent', palette.accentPrimary);
  root.style.setProperty('--krnl-accent-secondary', palette.accentSecondary);
  root.style.setProperty('--krnl-accent-hover', palette.accentHover);
  root.style.setProperty('--krnl-accent-glow', palette.accentGlow);
  root.style.setProperty('--krnl-accent-muted', palette.accentMuted);

  // 5. Semantics
  root.style.setProperty('--krnl-success', palette.success);
  root.style.setProperty('--krnl-warning', palette.warning);
  root.style.setProperty('--krnl-danger', palette.danger);
  root.style.setProperty('--krnl-info', palette.info);

  // 6. Scrollbars & Elements
  root.style.setProperty('--krnl-scrollbar-thumb', palette.scrollbarThumb);
  root.style.setProperty('--krnl-scrollbar-track', palette.scrollbarTrack);
  root.style.setProperty('--krnl-node-selected', palette.nodeSelected);
  root.style.setProperty('--krnl-wire-default', palette.wireDefault);

  // 7. Skipo System Tokens (Unified Single Theme Entry Point)
  root.style.setProperty('--skipo-bg', palette.bgPrimary);
  root.style.setProperty('--skipo-surface', palette.bgSurface);
  root.style.setProperty('--skipo-matte-bg', palette.bgSurface);
  root.style.setProperty('--skipo-matte-bg-hover', palette.bgElevated);
  root.style.setProperty('--skipo-top-toolbar-bg', palette.bgSecondary);
  root.style.setProperty('--skipo-bottom-strip-bg', palette.bgPrimary);
  root.style.setProperty('--skipo-border-color', palette.borderMedium);
  root.style.setProperty('--skipo-border', `1px solid ${palette.borderMedium}`);
  root.style.setProperty('--skipo-border-input', `1px solid ${palette.borderSubtle}`);
  root.style.setProperty('--skipo-text', palette.textPrimary);
  root.style.setProperty('--skipo-text-muted', palette.textMuted);
  root.style.setProperty('--skipo-text-inverse', palette.textInverse);
  root.style.setProperty('--skipo-accent', palette.accentPrimary);
  root.style.setProperty('--skipo-accent-fg', palette.textInverse);
  root.style.setProperty('--skipo-accent-glow', palette.accentGlow);
  root.style.setProperty('--skipo-success', palette.success);
  root.style.setProperty('--skipo-warning', palette.warning);
  root.style.setProperty('--skipo-danger', palette.danger);
  root.style.setProperty('--skipo-info', palette.info);
  root.style.setProperty('--skipo-inspection-text-color', palette.textAccent || palette.accentHover);

  // Set HTML root attributes for instant class/mode toggling
  root.setAttribute('data-theme', palette.id);
  root.setAttribute('data-theme-mode', palette.mode);
  root.setAttribute('data-skipo-theme', palette.mode);
  root.setAttribute('data-skipo-theme-id', palette.id);
  if (palette.mode === 'light') {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light');
  }

  // Inject or update dynamic style element for scrollbar and selection colors
  let styleTag = document.getElementById(DYNAMIC_STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = DYNAMIC_STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: ${palette.scrollbarTrack};
      border: 1px solid ${palette.borderSubtle};
    }
    ::-webkit-scrollbar-thumb {
      background: ${palette.scrollbarThumb};
      border: 1px solid ${palette.borderMedium};
      border-radius: 0px !important;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${palette.accentHover};
      box-shadow: 0 0 8px ${palette.accentGlow};
    }
    * {
      scrollbar-width: thin;
      scrollbar-color: ${palette.scrollbarThumb} ${palette.scrollbarTrack};
    }
    ::selection {
      background: ${palette.accentPrimary};
      color: ${palette.textInverse};
    }
  `;
}
