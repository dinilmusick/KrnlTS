/**
 * @file hooks.ts
 * @description React integration hooks for SKIPO_STATE.
 * Enforces component lifecycle binding, automatic unmount cleanup, and zero local useState.
 */

import { useEffect, useSyncExternalStore, useRef, useCallback } from 'react';
import { SKIPO_STATE } from './SkipoState.js';
import { LifecycleDescriptor, LifecycleScopeType, StateUpdater } from './types.js';

export function useSkipoState<T>(
  id: string,
  initialValue?: T | (() => T),
  lifecycle: LifecycleDescriptor = { type: 'APP' }
): [T, (valOrUpdater: T | StateUpdater<T>) => void] {
  const initializedRef = useRef(false);

  if (!initializedRef.current) {
    const existing = SKIPO_STATE.get<T>(id);
    if (existing === undefined && initialValue !== undefined) {
      const resolvedInitial =
        typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      SKIPO_STATE.create<T>(id, lifecycle, resolvedInitial, id);
    }
    initializedRef.current = true;
  }

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return SKIPO_STATE.subscribe(id, () => onStoreChange());
    },
    [id]
  );

  const getSnapshot = useCallback(() => {
    return SKIPO_STATE.get<T>(id) as T;
  }, [id]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    return () => {
      // Auto-cleanup if lifecycle scope is strictly COMPONENT bound
      if (lifecycle.type === 'COMPONENT') {
        SKIPO_STATE.destroy(id);
      }
    };
  }, [id, lifecycle.type]);

  const setValue = useCallback(
    (valOrUpdater: T | StateUpdater<T>) => {
      if (typeof valOrUpdater === 'function') {
        SKIPO_STATE.update<T>(id, valOrUpdater as StateUpdater<T>);
      } else {
        SKIPO_STATE.set<T>(id, valOrUpdater);
      }
    },
    [id]
  );

  return [value, setValue];
}

export function useLifecycleScope(
  scopeId: string,
  scopeType: LifecycleScopeType = 'COMPONENT'
): void {
  useEffect(() => {
    return () => {
      // Cascade destroys all dependent states when the scope unmounts
      SKIPO_STATE.destroy(scopeId);
    };
  }, [scopeId, scopeType]);
}

export function useSkipoBind(stateId: string, lifecycleTarget: string): void {
  useEffect(() => {
    SKIPO_STATE.bind(stateId, lifecycleTarget);
    return () => {
      SKIPO_STATE.unbind(stateId, lifecycleTarget);
    };
  }, [stateId, lifecycleTarget]);
}
