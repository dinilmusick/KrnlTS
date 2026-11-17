'use client';
import { useState, useCallback, useEffect } from 'react';

export interface PanelGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_PANEL_GEOMETRY: PanelGeometry = {
  x: 24,
  y: 60,
  width: 340,
  height: 480
};

const memoryCache = new Map<string, PanelGeometry>();
type GeometryListener = (geometry: PanelGeometry) => void;
const subscribers = new Map<string, Set<GeometryListener>>();

function readPersistedGeometry(key: string, fallback: PanelGeometry): PanelGeometry {
  if (memoryCache.has(key)) return memoryCache.get(key)!;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          memoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage parse error
    }
  }
  return fallback;
}

function writePersistedGeometry(key: string, geometry: PanelGeometry): void {
  memoryCache.set(key, geometry);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(geometry));
    } catch {
      // Ignore localStorage quota errors
    }
  }
  subscribers.get(key)?.forEach(fn => fn(geometry));
}

function subscribeToGeometry(key: string, listener: GeometryListener): () => void {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(listener);
  return () => {
    subscribers.get(key)?.delete(listener);
  };
}

export function usePanelGeometry(
  storageKey = 'skipo:details-panel:geometry',
  defaultGeometry = DEFAULT_PANEL_GEOMETRY
) {
  const [geometry, setGeometryState] = useState<PanelGeometry>(() =>
    readPersistedGeometry(storageKey, defaultGeometry)
  );

  useEffect(() => {
    setGeometryState(readPersistedGeometry(storageKey, defaultGeometry));
    return subscribeToGeometry(storageKey, setGeometryState);
  }, [storageKey]);

  const updateGeometry = useCallback((next: Partial<PanelGeometry> | ((prev: PanelGeometry) => PanelGeometry)) => {
    setGeometryState(prev => {
      const updated = typeof next === 'function' ? next(prev) : { ...prev, ...next };
      writePersistedGeometry(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  return { geometry, updateGeometry };
}
