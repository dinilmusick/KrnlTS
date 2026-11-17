import type { StoreApi } from 'zustand/vanilla';
import type { FrnlComponentDefinition } from './component-definition.js';
import { getFrnlVisualParameters, invokeFrnlEvent } from './events.js';
import type { FrnlState, FrnlEvent } from './store.js';

export type FrnlGeometry = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type FrnlRealizedState = {
  readonly mounted: boolean;
  readonly visible: boolean;
  readonly geometry?: FrnlGeometry;
};

/** Supplies realized browser/React facts without becoming the semantic source of truth. */
export interface FrnlMeasurementAdapter {
  measure(componentId: string): FrnlRealizedState | undefined;
}

export type FrnlFrontendApiOptions = {
  readonly applicationId?: string;
  readonly route?: string;
  readonly measurementAdapter?: FrnlMeasurementAdapter;
};

export type FrnlComponentControl = {
  readonly id: string;
  readonly kind: 'event' | 'setState' | 'setVisualParameter' | 'applyTheme';
  readonly available: boolean;
  readonly invoke: (payload?: unknown) => unknown | Promise<unknown>;
};

export type FrnlComponentSnapshot = {
  readonly id: string;
  readonly type: string;
  readonly path: readonly string[];
  readonly parentId?: string;
  readonly rendered: boolean;
  readonly lifecycle: {
    readonly mounted: boolean;
    readonly rendered: boolean;
    readonly mountedAt?: number;
    readonly renderedAt?: number;
  };
  readonly state: string;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly visualParameters: Readonly<Record<string, unknown>>;
  readonly controls: Readonly<Record<string, FrnlComponentControl>>;
  readonly events: readonly string[];
  readonly children: readonly string[];
  readonly realized: FrnlRealizedState;
};

export type FrnlFrontendSnapshot = {
  readonly apiVersion: 1;
  readonly application: {
    readonly id?: string;
    readonly route?: string;
  };
  readonly componentCount: number;
  readonly components: readonly FrnlComponentSnapshot[];
  readonly tree: readonly FrnlComponentSnapshot[];
  readonly events: readonly FrnlEvent[];
  readonly libraries: readonly string[];
};

export type FrnlFrontendApi = {
  readonly inspect: () => FrnlFrontendSnapshot;
  readonly inspectComponent: (componentId: string) => FrnlComponentSnapshot;
  readonly component: (componentId: string) => {
    readonly inspect: () => FrnlComponentSnapshot;
    readonly invoke: (controlId: string, payload?: unknown) => unknown | Promise<unknown>;
  };
  readonly invoke: (componentId: string, controlId: string, payload?: unknown) => unknown | Promise<unknown>;
  readonly subscribe: (listener: (snapshot: FrnlFrontendSnapshot) => void) => () => void;
  readonly dispose: () => void;
};

function componentPath(store: StoreApi<FrnlState>, componentId: string): string[] {
  const current = store.getState();
  const path: string[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined = componentId;

  while (cursor) {
    if (seen.has(cursor)) throw new Error(`Circular Frnl component scope detected at: ${cursor}`);
    seen.add(cursor);
    path.unshift(cursor);
    cursor = current.componentParents[cursor];
  }

  return path;
}

function eventNames(definition: FrnlComponentDefinition): string[] {
  const names = new Set<string>();
  for (const state of Object.values(definition.states)) {
    for (const name of Object.keys(state.events)) names.add(name);
  }
  return [...names].sort();
}

function childrenOf(store: StoreApi<FrnlState>, componentId: string): string[] {
  return Object.entries(store.getState().componentParents)
    .filter(([, parentId]) => parentId === componentId)
    .map(([id]) => id)
    .sort();
}

function snapshotFor(
  store: StoreApi<FrnlState>,
  componentId: string,
  mountedAt: number | undefined,
  measurementAdapter: FrnlMeasurementAdapter | undefined,
): FrnlComponentSnapshot {
  const current = store.getState();
  const entity = current.entities[componentId];
  const explicitDefinition = current.componentDefinitions[componentId];

  if (!entity && !explicitDefinition) {
    throw new Error(`Unknown Frnl component: ${componentId}`);
  }

  const isMounted = Boolean(entity);
  const definition: FrnlComponentDefinition = explicitDefinition ?? {
    name: typeof entity?.properties?.type === 'string' ? (entity.properties.type as string) : 'Component',
    states: {
      [entity?.state ?? 'default']: {
        visualDefinition: { parameters: {} },
        events: {},
        phases: {
          sustainPhase: { visualDefinition: { parameters: {} } },
        },
        visualParameters: {},
      },
    },
  };

  const names = eventNames(definition);
  const controls: Record<string, FrnlComponentControl> = {};
  const currentStateName = entity?.state ?? Object.keys(definition.states)[0] ?? 'default';

  for (const name of names) {
    const eventDefinition = definition.states[currentStateName]?.events[name];
    const hasHandler = Boolean(eventDefinition && current.eventHandlers[componentId]?.[eventDefinition.functionId]);
    controls[name] = {
      id: name,
      kind: 'event',
      available: isMounted && hasHandler,
      invoke: (payload) => {
        if (!isMounted) throw new Error(`Frnl control unavailable: ${componentId}.${name} (component not mounted)`);
        return invokeFrnlEvent(store, componentId, name, payload);
      },
    };
  }

  controls.setState = {
    id: 'setState',
    kind: 'setState',
    available: isMounted,
    invoke: (payload) => {
      if (!isMounted) throw new Error(`Frnl control unavailable: ${componentId}.setState (component not mounted)`);
      if (typeof payload !== 'string') throw new TypeError('setState expects a string payload');
      current.setEntityState(componentId, payload);
    },
  };

  controls.setVisualParameter = {
    id: 'setVisualParameter',
    kind: 'setVisualParameter',
    available: isMounted,
    invoke: (payload) => {
      if (!isMounted) throw new Error(`Frnl control unavailable: ${componentId}.setVisualParameter (component not mounted)`);
      if (!payload || typeof payload !== 'object') {
        throw new TypeError('setVisualParameter expects { parameter, value }');
      }
      const input = payload as { parameter?: unknown; value?: unknown };
      if (typeof input.parameter !== 'string' || !input.parameter) {
        throw new TypeError('setVisualParameter.parameter must be a non-empty string');
      }
      current.setVisualOverride(componentId, input.parameter, input.value);
    },
  };

  controls.applyTheme = {
    id: 'applyTheme',
    kind: 'applyTheme',
    available: isMounted && Object.keys(current.themes).length > 0,
    invoke: (payload) => {
      if (!isMounted) throw new Error(`Frnl control unavailable: ${componentId}.applyTheme (component not mounted)`);
      if (typeof payload !== 'string') throw new TypeError('applyTheme expects a theme name');
      current.applyTheme(componentId, payload);
    },
  };

  return {
    id: componentId,
    type: definition.name,
    path: Object.freeze(componentPath(store, componentId)),
    parentId: current.componentParents[componentId],
    rendered: isMounted,
    lifecycle: {
      mounted: isMounted,
      rendered: isMounted,
      mountedAt: isMounted ? mountedAt : undefined,
      renderedAt: isMounted ? mountedAt : undefined,
    },
    state: currentStateName,
    properties: Object.freeze({ ...(entity?.properties ?? {}) }),
    visualParameters: Object.freeze({ ...(isMounted ? getFrnlVisualParameters(store, componentId) : {}) }),
    controls: Object.freeze(controls),
    events: Object.freeze(names),
    children: Object.freeze(childrenOf(store, componentId)),
    realized: Object.freeze(measurementAdapter?.measure(componentId) ?? {
      mounted: isMounted,
      visible: isMounted,
    }),
  };
}

export function createFrnlFrontendApi(
  store: StoreApi<FrnlState>,
  options: FrnlFrontendApiOptions = {},
): FrnlFrontendApi {
  const mountedAt = new Map<string, number>();
  for (const id of Object.keys(store.getState().entities)) mountedAt.set(id, Date.now());

  const unsubscribe = store.subscribe((state) => {
    const now = Date.now();
    for (const id of Object.keys(state.entities)) {
      if (!mountedAt.has(id)) mountedAt.set(id, now);
    }
    for (const id of [...mountedAt.keys()]) {
      if (!state.entities[id]) mountedAt.delete(id);
    }
  });

  const inspectComponent = (componentId: string) => snapshotFor(
    store,
    componentId,
    mountedAt.get(componentId),
    options.measurementAdapter,
  );

  const inspect = (): FrnlFrontendSnapshot => {
    const current = store.getState();
    const allIds = new Set<string>([
      ...Object.keys(current.entities),
      ...Object.keys(current.componentDefinitions),
    ]);
    const components = [...allIds]
      .sort()
.map((id) => snapshotFor(store, id, mountedAt.get(id), options.measurementAdapter));

    return {
      apiVersion: 1,
      application: {
        id: options.applicationId,
        route: options.route ?? (typeof window === 'undefined' ? undefined : window.location.pathname),
      },
      componentCount: components.length,
      components: Object.freeze(components),
      tree: Object.freeze(components.filter((component) => !component.parentId)),
      events: Object.freeze([...current.events]),
      libraries: Object.freeze(Object.keys(current.libraries).sort()),
    };
  };

  const listeners = new Set<(snapshot: FrnlFrontendSnapshot) => void>();
  let disposed = false;
  const emitSnapshot = () => {
    if (disposed) return;
    const snapshot = inspect();
    for (const listener of [...listeners]) listener(snapshot);
  };
  const storeUnsubscribe = store.subscribe(emitSnapshot);

  const invoke = (componentId: string, controlId: string, payload?: unknown) => {
    const control = inspectComponent(componentId).controls[controlId];
    if (!control) throw new Error(`Frnl control not found: ${componentId}.${controlId}`);
    if (!control.available) throw new Error(`Frnl control unavailable: ${componentId}.${controlId}`);
    return control.invoke(payload);
  };

  return Object.freeze({
    inspect,
    inspectComponent,
    component: (componentId) => Object.freeze({
      inspect: () => inspectComponent(componentId),
      invoke: (controlId, payload) => invoke(componentId, controlId, payload),
    }),
    invoke,
    subscribe: (listener) => {
      if (disposed) throw new Error('Frnl frontend API has been disposed');
      listeners.add(listener);
      listener(inspect());
      return () => listeners.delete(listener);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      storeUnsubscribe();
      unsubscribe();
    },
  });
}

export function installFrnlFrontendApi(
  api: FrnlFrontendApi,
  globalKey = '__FRNL_FRONTEND_API__',
): void {
  if (typeof globalThis === 'undefined') return;
  try {
    Object.defineProperty(globalThis, globalKey, {
      configurable: true,
      enumerable: false,
      get: () => api,
    });
  } catch {
    (globalThis as Record<string, unknown>)[globalKey] = api;
  }
}
