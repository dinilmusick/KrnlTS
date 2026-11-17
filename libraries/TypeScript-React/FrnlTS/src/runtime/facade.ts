import type { StoreApi } from 'zustand/vanilla';
import type { FrnlState } from './store.js';
import { getFrnlComponentHandle, getFrnlEvent, setFrnlVisualParameter, type FrnlComponentHandle, type FrnlEventHandler, type FrnlEventTrigger } from './events.js';
import { getFrnlLibrary } from './libraries.js';
import { applyFrnlTheme, registerFrnlTheme, type FrnlThemeDefinition } from './themes.js';

export class FrnlFacade {
  constructor(readonly store: StoreApi<FrnlState>) {}

  component(componentId: string): FrnlComponentHandle {
    return getFrnlComponentHandle(this.store, componentId);
  }

  event(componentId: string, eventName: string): FrnlEventTrigger {
    return getFrnlEvent(this.store, componentId, eventName);
  }

  library<T = unknown>(address: string): T {
    return getFrnlLibrary<T>(this.store, address);
  }

  setVisualParameter(address: string, value: unknown): void {
    setFrnlVisualParameter(this.store, address, value);
  }

  registerTheme(name: string, theme: FrnlThemeDefinition): void {
    registerFrnlTheme(this.store, name, theme);
  }

  applyThemeToAllComponents(themeName: string): void {
    if (!this.store.getState().themes[themeName]) {
      throw new Error(`Unknown Frnl theme: ${themeName}`);
    }
    for (const componentId of Object.keys(this.store.getState().entities)) {
      applyFrnlTheme(this.store, componentId, themeName);
    }
  }
}

export function createFrnlFacade(store: StoreApi<FrnlState>): FrnlFacade {
  return new FrnlFacade(store);
}
