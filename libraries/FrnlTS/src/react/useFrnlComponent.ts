import { useEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { FrnlComponentDefinition } from '../runtime/component-definition.js';
import type { FrnlState } from '../runtime/store.js';
import { getFrnlComponentHandle, getFrnlEvent, getFrnlVisualParameters, type FrnlEventHandler, type FrnlEventContext } from '../runtime/events.js';

const EMPTY_PROPERTIES: Record<string, unknown> = Object.freeze({});

function arePropertiesEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export interface UseFrnlComponentOptions {
  id: string;
  parentId?: string;
  definition: FrnlComponentDefinition;
  store: StoreApi<FrnlState>;
  state?: string;
  properties?: Record<string, unknown>;
  handlers: Record<string, FrnlEventHandler>;
}

export function useFrnlComponent({
  id,
  parentId,
  definition,
  store,
  state,
  properties,
  handlers,
}: UseFrnlComponentOptions) {
  const resolvedProperties = properties ?? EMPTY_PROPERTIES;
  const initialState = state ?? Object.keys(definition.states)[0] ?? 'default';
  const previousProps = useRef({ state: initialState, properties: resolvedProperties });
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    store.getState().registerEntity(id, {
      state: initialState,
      properties: resolvedProperties,
    });
    store.getState().registerComponentDefinition(id, definition);
    store.getState().registerComponentParent(id, parentId);
    return () => store.getState().unregisterEntity(id);
  }, [id, parentId, definition, store]);

  useEffect(() => {
    const current = store.getState().entities[id];
    if (!current) return;

    const previous = previousProps.current;
    if (state !== undefined && state !== previous.state && current.state !== state) {
      store.getState().setEntityState(id, state);
    }

    const hasChangedProperties = !arePropertiesEqual(resolvedProperties, previous.properties);
    if (hasChangedProperties) {
      store.getState().setEntityProperties(id, resolvedProperties);
    }

    previousProps.current = { state: state ?? initialState, properties: resolvedProperties };
  }, [id, state, resolvedProperties, initialState, store]);

  const handlerKeys = useMemo(() => Object.keys(handlers).sort().join('\0'), [handlers]);

  useEffect(() => {
    const stableHandlers = Object.fromEntries(
      Object.keys(handlers).map((functionId) => [
        functionId,
        (payload: unknown, context: FrnlEventContext) => handlersRef.current[functionId]?.(payload, context),
      ]),
    );
    store.getState().registerEventHandlers(id, stableHandlers);
    return () => store.getState().unregisterEventHandlers(id);
  }, [id, store, handlerKeys]);


  const entity = useStoreState(store, id);
  const visualOverrides = useStore(store, (current: FrnlState) => current.visualOverrides[id]);
  useStore(store, (current: FrnlState) => current.componentThemes[id]);
  useStore(store, (current: FrnlState) => current.themes);
  const events = useMemo(() => {
    const names = new Set<string>();
    for (const stateDefinition of Object.values(definition.states)) {
      Object.keys(stateDefinition.events).forEach((name) => names.add(name));
    }

    return Object.fromEntries(
      [...names].map((name) => [name, getFrnlEvent(store, id, name)]),
    ) as Record<string, (payload: unknown) => unknown>;
  }, [definition, id, store]);

  return {
    state: entity?.state ?? initialState,
    properties: entity?.properties ?? resolvedProperties,
    visualParameters: {
      ...getFrnlVisualParameters(store, id),
      ...(visualOverrides ?? {}),
    },
    events,
    applyTheme: (themeName: string) => getFrnlComponentHandle(store, id).applyTheme(themeName),
  };
}

function useStoreState(store: StoreApi<FrnlState>, id: string) {
  // React's useSyncExternalStore is used through Zustand's vanilla-compatible hook.
  return useStore(store, (current: FrnlState) => current.entities[id]);
}
