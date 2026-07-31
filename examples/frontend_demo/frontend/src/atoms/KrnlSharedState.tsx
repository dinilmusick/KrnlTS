import React, { createContext, useContext, useState } from 'react';

export interface SharedSlot {
  options: any[];
  value: any;
}

export const SharedComponentContext = createContext<Map<string, SharedSlot>>(new Map());
export const SharedComponentSetContext = createContext<(id: string, patch: Partial<SharedSlot>) => void>(() => {});

export function SharedComponentProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Map<string, SharedSlot>>(new Map());

  const update = (id: string, patch: Partial<SharedSlot>) => {
    setStore((prev) => {
      const m = new Map(prev);
      const existing = m.get(id) || { options: [], value: null };
      m.set(id, { ...existing, ...patch });
      return m;
    });
  };

  return (
    <SharedComponentContext.Provider value={store}>
      <SharedComponentSetContext.Provider value={update}>
        {children}
      </SharedComponentSetContext.Provider>
    </SharedComponentContext.Provider>
  );
}

export function useSharedSlot(id?: string) {
  const store = useContext(SharedComponentContext);
  const update = useContext(SharedComponentSetContext);

  if (!id) {
    return {
      options: [],
      value: null,
      setOptions: () => {},
      setValue: () => {},
    };
  }

  const slot = store.get(id) || { options: [], value: null };

  return {
    options: slot.options,
    value: slot.value,
    setOptions: (opts: any[]) => update(id, { options: opts }),
    setValue: (v: any) => update(id, { value: v }),
  };
}