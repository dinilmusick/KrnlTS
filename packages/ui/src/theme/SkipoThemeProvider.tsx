'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { SkipoThemePack, ThemeEngineStatus } from './types.js';
import { DEFAULT_DARK_THEME_PACK, DEFAULT_LIGHT_THEME_PACK, applyThemePack } from './ThemePackLoader.js';

import { ThemeEngine } from './engine.js';
import { getThemeEngineStatus } from './status.js';

type SkipoThemeMode = 'dark' | 'light';

export interface SkipoThemeContextValue {
  theme: SkipoThemeMode;
  themePack: SkipoThemePack;
  engine?: ThemeEngine;
  status?: ThemeEngineStatus;
  elementOverrides: Record<string, string>;
  setTheme: (theme: SkipoThemeMode) => void;
  setThemePack: (pack: SkipoThemePack) => void;
  toggleTheme: () => void;
  setElementOverride: (elementId: string, packId: string) => void;
  clearElementOverride: (elementId: string) => void;
}

const SkipoThemeContext = createContext<SkipoThemeContextValue | null>(null);

export interface SkipoThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: SkipoThemeMode;
  initialThemePack?: SkipoThemePack;
  engine?: ThemeEngine;
}

export function SkipoThemeProvider({
  children,
  defaultTheme = 'dark',
  initialThemePack,
  engine
}: SkipoThemeProviderProps) {
  const [theme, setThemeState] = useState<SkipoThemeMode>(
    engine ? engine.getMode() : defaultTheme
  );
  const [themePack, setThemePackState] = useState<SkipoThemePack>(
    initialThemePack || (defaultTheme === 'dark' ? DEFAULT_DARK_THEME_PACK : DEFAULT_LIGHT_THEME_PACK)
  );
  const [elementOverrides, setElementOverrides] = useState<Record<string, string>>(
    engine ? engine.getElementOverrides() : {}
  );
  const [status, setStatus] = useState<ThemeEngineStatus | undefined>(
    engine ? getThemeEngineStatus(engine) : undefined
  );

  const applyPack = useCallback((pack: SkipoThemePack) => {
    setThemePackState(pack);
    setThemeState(pack.metadata.mode);
    if (typeof document !== 'undefined') {
      applyThemePack(pack);
    }
  }, []);

  const setTheme = useCallback((mode: SkipoThemeMode) => {
    if (engine) {
      engine.setMode(mode);
      setThemeState(mode);
    } else {
      applyPack(mode === 'dark' ? DEFAULT_DARK_THEME_PACK : DEFAULT_LIGHT_THEME_PACK);
    }
  }, [engine, applyPack]);

  const toggleTheme = useCallback(() => {
    if (engine) {
      const next = engine.toggleMode();
      setThemeState(next);
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [engine, theme, setTheme]);

  const setElementOverride = useCallback((elementId: string, packId: string) => {
    if (engine) {
      engine.setElementOverride(elementId, packId);
      setElementOverrides(engine.getElementOverrides());
      setStatus(getThemeEngineStatus(engine));
    }
  }, [engine]);

  const clearElementOverride = useCallback((elementId: string) => {
    if (engine) {
      engine.clearElementOverride(elementId);
      setElementOverrides(engine.getElementOverrides());
      setStatus(getThemeEngineStatus(engine));
    }
  }, [engine]);

  useEffect(() => {
    if (engine) {
      engine.applyToDOM();
      setThemeState(engine.getMode());
      setElementOverrides(engine.getElementOverrides());
      setStatus(getThemeEngineStatus(engine));
      const unsub = engine.subscribe((state) => {
        setThemeState(state.activeMode);
        setElementOverrides(state.elementOverrides);
        setStatus(getThemeEngineStatus(engine));
      });
      return unsub;
    } else {
      applyPack(initialThemePack || (defaultTheme === 'dark' ? DEFAULT_DARK_THEME_PACK : DEFAULT_LIGHT_THEME_PACK));
    }
  }, [engine, applyPack, defaultTheme, initialThemePack]);

  const value: SkipoThemeContextValue = useMemo(() => ({
    theme,
    themePack,
    engine,
    status,
    elementOverrides,
    setTheme,
    setThemePack: applyPack,
    toggleTheme,
    setElementOverride,
    clearElementOverride
  }), [theme, themePack, engine, status, elementOverrides, setTheme, applyPack, toggleTheme, setElementOverride, clearElementOverride]);

  return (
    <SkipoThemeContext.Provider value={value}>
      <div data-skipo-theme={theme} className="skipo-root">
        {children}
      </div>
    </SkipoThemeContext.Provider>
  );
}

export function useSkipoTheme(): SkipoThemeContextValue {
  const ctx = useContext(SkipoThemeContext);
  if (!ctx) throw new Error('useSkipoTheme must be used within <SkipoThemeProvider>');
  return ctx;
}
