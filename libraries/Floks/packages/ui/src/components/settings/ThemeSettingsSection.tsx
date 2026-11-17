'use client';
import React from 'react';
import { useSkipoTheme } from '../../theme/SkipoThemeProvider.js';
import { DEFAULT_DARK_THEME_PACK, DEFAULT_LIGHT_THEME_PACK } from '../../theme/defaultPacks.js';
import { BaseCard } from '../base/BaseCard.js';
import { BaseButton } from '../base/BaseButton.js';
import { BaseBadge } from '../base/BaseBadge.js';

const AVAILABLE_PACKS = [
  { id: 'skipo-dark-neo', name: 'Dark Neo', mode: 'dark' as const, pack: DEFAULT_DARK_THEME_PACK },
  { id: 'skipo-light-neo', name: 'Light Neo', mode: 'light' as const, pack: DEFAULT_LIGHT_THEME_PACK },
];

const ACCENT_COLORS = [
  { name: 'Gold', value: '#d4af37' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#00d9ff' },
  { name: 'Purple', value: '#a855f7' },
];

export const ThemeSettingsSection: React.FC = () => {
  const { theme, themePack, setTheme, setThemePack } = useSkipoTheme();

  const handleAccentChange = (hex: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--skipo-accent', hex);
      document.documentElement.style.setProperty('--skipo-accent-glow', `0 0 14px ${hex}66`);
    }
  };

  return (
    <BaseCard
      variant="surface"
      depth="sm"
      style={{
        padding: '16px',
        border: '1px solid var(--skipo-border-color, #333)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--skipo-text)' }}>
            Appearance & Theming
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--skipo-text-muted)' }}>
            Configure theme packs, display mode, and custom accent highlights.
          </p>
        </div>
        <BaseBadge variant="neutral" style={{ fontSize: '10px' }}>
          {theme.toUpperCase()} MODE
        </BaseBadge>
      </div>

      {/* Mode Switcher */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: 'var(--skipo-text)' }}>
          Color Mode
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <BaseButton
            size="sm"
            variant={theme === 'dark' ? 'accent' : 'secondary'}
            onClick={() => setTheme('dark')}
            type="button"
          >
            Dark Mode
          </BaseButton>
          <BaseButton
            size="sm"
            variant={theme === 'light' ? 'accent' : 'secondary'}
            onClick={() => setTheme('light')}
            type="button"
          >
            Light Mode
          </BaseButton>
        </div>
      </div>

      {/* Theme Packs */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: 'var(--skipo-text)' }}>
          Theme Pack Preset
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
          {AVAILABLE_PACKS.map(p => {
            const isSelected = themePack?.metadata?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setThemePack(p.pack)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid var(--skipo-accent, #d4af37)' : '1px solid var(--skipo-border-color, #444)',
                  backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'var(--skipo-bg, #16181d)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--skipo-accent)' : 'var(--skipo-text)' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--skipo-text-muted)', textTransform: 'capitalize' }}>
                  {p.mode} Preset
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accent Colors */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: 'var(--skipo-text)' }}>
          Accent Highlight
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {ACCENT_COLORS.map(c => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              onClick={() => handleAccentChange(c.value)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: c.value,
                border: '2px solid rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                transition: 'transform 0.1s ease'
              }}
            />
          ))}
        </div>
      </div>
    </BaseCard>
  );
};
ThemeSettingsSection.displayName = 'ThemeSettingsSection';
