/**
 * @file useServiceUIStore.ts
 * @description UI State Manager for Service Hub views.
 * Conforms to APP_ARCHITECTURE_SPEC Section 22 & < 200 lines.
 */

import { useState, useCallback } from 'react';

export interface ServiceUIState {
  selectedServiceId: string | null;
  activeFilter: string;
  isAddModalOpen: boolean;
  isDetailModalOpen: boolean;
  searchTerm: string;
}

const initialUIState: ServiceUIState = {
  selectedServiceId: null,
  activeFilter: 'ALL',
  isAddModalOpen: false,
  isDetailModalOpen: false,
  searchTerm: '',
};

let globalState = { ...initialUIState };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function useServiceUIStore() {
  const [, setTick] = useState(0);

  const subscribe = useCallback(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const selectService = useCallback((id: string | null) => {
    globalState.selectedServiceId = id;
    notify();
  }, []);

  const setFilter = useCallback((filter: string) => {
    globalState.activeFilter = filter;
    notify();
  }, []);

  const setAddModalOpen = useCallback((open: boolean) => {
    globalState.isAddModalOpen = open;
    notify();
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    globalState.searchTerm = term;
    notify();
  }, []);

  return {
    state: globalState,
    subscribe,
    selectService,
    setFilter,
    setAddModalOpen,
    setSearchTerm,
  };
}
