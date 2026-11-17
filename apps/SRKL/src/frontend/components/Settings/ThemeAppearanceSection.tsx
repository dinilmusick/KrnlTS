'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { Palette, Sun, Moon } from 'lucide-react';
import { useSkipoTheme, BaseButton } from '@skipo/ui';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface ThemeAppearanceSectionProps {
  onThemeChanged: (themeKey: 'black_and_gold' | 'coffee_theme') => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export function ThemeAppearanceSection({ onThemeChanged }: ThemeAppearanceSectionProps): React.ReactElement {
  const { theme, setTheme } = useSkipoTheme();

  const handleSelect = (mode: 'dark' | 'light') => {
    setTheme(mode);
    onThemeChanged(mode === 'dark' ? 'black_and_gold' : 'coffee_theme');
  };

  return (
    <div
      className="p-4 border-2 space-y-3"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        boxShadow: 'var(--skipo-shadow)',
        borderRadius: 'var(--skipo-radius)',
      }}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: 'var(--skipo-text)' }}>
        <Palette className="w-4 h-4" style={{ color: 'var(--skipo-accent)' }} />
        <span>Skipo Theme & Appearance System</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Dark Neo Option */}
        <BaseButton
          variant="ghost"
          onClick={() => handleSelect('dark')}
          className="p-3 border-2 cursor-pointer transition-all flex items-center gap-3 select-none text-left w-full h-auto"
          style={{
            backgroundColor: theme === 'dark' ? 'var(--skipo-matte-bg)' : 'var(--skipo-surface)',
            borderColor: theme === 'dark' ? 'var(--skipo-accent)' : 'var(--skipo-border-color)',
            boxShadow: theme === 'dark' ? 'var(--skipo-shadow-btn-active)' : 'none',
            borderRadius: 'var(--skipo-radius-sm)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: 'var(--skipo-matte-bg)',
              borderColor: 'var(--skipo-accent)',
              color: 'var(--skipo-accent)',
            }}
          >
            <Moon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black uppercase text-xs truncate" style={{ color: 'var(--skipo-text)' }}>
              Neo Dark (Black & Gold)
            </div>
            <div className="text-[10px] opacity-70 truncate">
              Charcoal panels with high-contrast gold accents.
            </div>
          </div>
        </BaseButton>

        {/* Coffee Light Option */}
        <BaseButton
          variant="ghost"
          onClick={() => handleSelect('light')}
          className="p-3 border-2 cursor-pointer transition-all flex items-center gap-3 select-none text-left w-full h-auto"
          style={{
            backgroundColor: theme === 'light' ? 'var(--skipo-matte-bg)' : 'var(--skipo-surface)',
            borderColor: theme === 'light' ? 'var(--skipo-accent)' : 'var(--skipo-border-color)',
            boxShadow: theme === 'light' ? 'var(--skipo-shadow-btn-active)' : 'none',
            borderRadius: 'var(--skipo-radius-sm)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: 'var(--skipo-surface)',
              borderColor: 'var(--skipo-accent)',
              color: 'var(--skipo-accent)',
            }}
          >
            <Sun className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black uppercase text-xs truncate" style={{ color: 'var(--skipo-text)' }}>
              Coffee Light (Cream & Mocha)
            </div>
            <div className="text-[10px] opacity-70 truncate">
              Warm cream canvas with rich roasted coffee accents.
            </div>
          </div>
        </BaseButton>
      </div>
    </div>
  );
}
