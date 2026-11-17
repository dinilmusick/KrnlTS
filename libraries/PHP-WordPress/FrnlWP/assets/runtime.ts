import { createStore } from 'zustand/vanilla';

export type FrnlState = {
  state: string;
  data: Record<string, unknown>;
  setState: (state: string) => void;
  patch: (data: Record<string, unknown>) => void;
};

export const createFrnlStore = (initialState='idle', initialData: Record<string,unknown>={}) =>
  createStore<FrnlState>((set) => ({
    state: initialState,
    data: initialData,
    setState: (state) => set({state}),
    patch: (data) => set((current) => ({data:{...current.data,...data}})),
  }));

export function resolveEvent(
  store: ReturnType<typeof createFrnlStore>,
  event: string,
  handlers: Record<string, () => void>,
): void {
  const current=store.getState();
  (handlers[current.state+'.'+event] ?? handlers[event])?.();
}