import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ColorPalette } from './types';
import { BUILTIN_PALETTES } from './palettes';
import { applyPaletteToDocument } from './domThemeInjector';

export const THEME_STORAGE_KEY = 'floks_color_palette_v1';
export const DEFAULT_PALETTE_ID = 'black_and_gold';

let currentActivePalette: ColorPalette = BUILTIN_PALETTES[DEFAULT_PALETTE_ID];
const paletteListeners = new Set<(palette: ColorPalette) => void>();

export function getActivePalette(): ColorPalette {
  return currentActivePalette;
}

export function subscribeToPalette(callback: (palette: ColorPalette) => void): () => void {
  paletteListeners.add(callback);
  return () => paletteListeners.delete(callback);
}

export interface ThemeContextValue {
  palette: ColorPalette;
  paletteId: string;
  setPaletteId: (id: string) => void;
  updateCustomColors: (colors: Partial<ColorPalette>) => void;
  allPalettes: ColorPalette[];
  isLightMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  initialPaletteId?: string;
  children: React.ReactNode;
}

export function ThemeProvider({ initialPaletteId, children }: ThemeProviderProps) {
  const [paletteId, setPaletteIdState] = useState<string>(() => {
    if (initialPaletteId && BUILTIN_PALETTES[initialPaletteId]) {
      return initialPaletteId;
    }
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && (BUILTIN_PALETTES[stored] || stored === 'custom')) {
        return stored;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PALETTE_ID;
  });

  const [customPalette, setCustomPalette] = useState<ColorPalette>(() => ({
    ...BUILTIN_PALETTES[DEFAULT_PALETTE_ID],
    id: 'custom',
    name: 'Custom User Palette',
    description: 'User-customized dynamic color palette',
  }));

  const activePalette = useMemo(() => {
    if (paletteId === 'custom') return customPalette;
    return BUILTIN_PALETTES[paletteId] || BUILTIN_PALETTES[DEFAULT_PALETTE_ID];
  }, [paletteId, customPalette]);

  useEffect(() => {
    currentActivePalette = activePalette;
    applyPaletteToDocument(activePalette);
    paletteListeners.forEach((cb) => cb(activePalette));
  }, [activePalette]);

  const setPaletteId = useCallback((id: string) => {
    setPaletteIdState(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const updateCustomColors = useCallback((partial: Partial<ColorPalette>) => {
    setCustomPalette((prev) => {
      const updated: ColorPalette = { ...prev, ...partial, id: 'custom' };
      setPaletteIdState('custom');
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'custom');
        localStorage.setItem(`${THEME_STORAGE_KEY}_custom_data`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const allPalettes = useMemo(() => Object.values(BUILTIN_PALETTES), []);

  const value = useMemo<ThemeContextValue>(() => ({
    palette: activePalette,
    paletteId,
    setPaletteId,
    updateCustomColors,
    allPalettes,
    isLightMode: activePalette.mode === 'light',
  }), [activePalette, paletteId, setPaletteId, updateCustomColors, allPalettes]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      palette: currentActivePalette,
      paletteId: currentActivePalette.id,
      setPaletteId: () => {},
      updateCustomColors: () => {},
      allPalettes: Object.values(BUILTIN_PALETTES),
      isLightMode: currentActivePalette.mode === 'light',
    };
  }
  return ctx;
}

export function usePalette(): ColorPalette {
  return useTheme().palette;
}
