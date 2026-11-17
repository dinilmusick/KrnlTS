import type { StoreApi } from 'zustand/vanilla';
import type { FrnlState } from './store.js';

export function registerFrnlLibrary(store: StoreApi<FrnlState>, address: string, library: unknown): void {
  store.getState().registerLibrary(address, library);
}

export function getFrnlLibrary<T = unknown>(store: StoreApi<FrnlState>, address: string): T {
  const library = store.getState().libraries[address];
  if (library === undefined) throw new Error('Unknown Frnl library: ' + address);
  return library as T;
}

export function unregisterFrnlLibrary(store: StoreApi<FrnlState>, address: string): void {
  store.getState().unregisterLibrary(address);
}
