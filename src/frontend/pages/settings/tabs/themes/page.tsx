/**
 * Canonical Skipo Settings > Themes tab.
 * Theme state remains application-owned; generic theme UI is rendered here.
 */
import React from 'react';
import { BaseButton, BaseCard } from '@ultrst-armada/floks';
import { Moon, Sun } from 'lucide-react';

export interface ThemesPageProps {
  theme: string;
  onToggleTheme: () => void;
}

export function ThemesPage({ theme, onToggleTheme }: ThemesPageProps) {
  const isDark = theme === 'dark';
  return (
    <BaseCard className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2 font-bold uppercase text-sm tracking-wide">
        {isDark ? <Moon size={18} /> : <Sun size={18} />}
        Themes
      </div>
      <p className="text-xs text-[var(--skipo-text-muted,#94a3b8)]">
        Select the application theme. The application currently uses {theme || 'unknown'} mode.
      </p>
      <BaseButton onClick={onToggleTheme} variant="secondary">
        Switch to {isDark ? 'Light' : 'Dark'} Theme
      </BaseButton>
    </BaseCard>
  );
}

export default ThemesPage;
