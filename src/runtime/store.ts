import { createStore, type StoreApi } from 'zustand/vanilla';
import type { FrnlComponentDefinition } from './component-definition.js';
import { z } from 'zod';
import {
  entityIdSchema,
  entityPropertyChangedPayloadSchema,
  entityStateChangedPayloadSchema,
  entityStateSchema,
  propertyKeySchema,
  propertiesSchema,
  flowTriggeredPayloadSchema,
  stateNameSchema,
  frnlEventSchema,
  type EntityState,
  type FrnlEvent,
  frnlThemeDefinitionSchema,
} from './validation.js';
import { validateFrnlThemeAgainstDefinition, type FrnlThemeDefinition } from './themes.js';

export type {
  EntityState,
  FrnlEvent,
} from './validation.js';

export type FrnlStore = StoreApi<FrnlState>;

export interface FrnlState {
  entities: Record<string, EntityState>;
  events: FrnlEvent[];
  componentDefinitions: Record<string, FrnlComponentDefinition>;
  eventHandlers: Record<string, Record<string, (
    payload: unknown,
    context: { readonly componentId: string; readonly state: string; setState(state: string): void; setVisualParameter(parameter: string, value: unknown): void; getLibrary<T = unknown>(address: string): T }
  ) => unknown>>;
  componentParents: Record<string, string | undefined>;
  visualOverrides: Record<string, Record<string, unknown>>;
  themes: Record<string, FrnlThemeDefinition>;
  componentThemes: Record<string, string>;
  libraries: Record<string, unknown>;
  setEntityState: (entityId: string, state: string) => void;
  setEntityProperty: (entityId: string, key: string, value: unknown) => void;
  setEntityProperties: (entityId: string, properties: Record<string, unknown>) => void;
  registerEntity: (entityId: string, entity: EntityState) => void;
  triggerFlow: (flowId: string, componentId: string, trigger: string, payload?: unknown) => void;
  emit: (event: FrnlEvent) => void;
  registerComponentDefinition: (componentId: string, definition: FrnlComponentDefinition) => void;
  registerTheme: (name: string, theme: FrnlThemeDefinition) => void;
  applyTheme: (componentId: string, themeName: string) => void;
  registerEventHandlers: (componentId: string, handlers: Record<string, (
    payload: unknown,
    context: { readonly componentId: string; readonly state: string; setState(state: string): void; setVisualParameter(parameter: string, value: unknown): void; getLibrary<T = unknown>(address: string): T }
  ) => unknown>) => void;
  unregisterEventHandlers: (componentId: string) => void;
  registerComponentParent: (componentId: string, parentId?: string) => void;
  unregisterEntity: (entityId: string) => void;
  setVisualOverride: (componentId: string, parameter: string, value: unknown) => void;
  clearVisualOverrides: (componentId: string) => void;
  registerLibrary: (address: string, library: unknown) => void;
  unregisterLibrary: (address: string) => void;
}

export function createFrnlStore(
  initial?: Partial<Pick<FrnlState, 'entities'>>
): StoreApi<FrnlState> {
  const initialEntities = z.record(z.string(), entityStateSchema).parse(initial?.entities ?? {});

  return createStore<FrnlState>((set, get) => ({
    entities: initialEntities,
    events: [],
    componentDefinitions: {},
    eventHandlers: {},
    componentParents: {},
    visualOverrides: {},
    themes: {},
    componentThemes: {},
    libraries: {},

    registerComponentDefinition: (componentId, definition) => {
      const id = entityIdSchema.parse(componentId);
      for (const theme of Object.values(get().themes)) {
        validateFrnlThemeAgainstDefinition(theme, definition);
      }
      set((current) => ({ componentDefinitions: { ...current.componentDefinitions, [id]: definition } }));
    },

    registerTheme: (name, theme) => {
      const themeName = z.string().min(1).parse(name);
      const validatedTheme = frnlThemeDefinitionSchema.parse(theme) as FrnlThemeDefinition;
      for (const definition of Object.values(get().componentDefinitions)) {
        validateFrnlThemeAgainstDefinition(validatedTheme, definition);
      }
      set((current) => ({
        themes: { ...current.themes, [themeName]: validatedTheme },
      }));
    },

    applyTheme: (componentId, themeName) => {
      const id = entityIdSchema.parse(componentId);
      const name = z.string().min(1).parse(themeName);
      set((current) => {
        if (!current.entities[id]) {
          throw new Error(`Unknown Frnl component: ${id}`);
        }
        if (!current.themes[name]) {
          throw new Error(`Unknown Frnl theme: ${name}`);
        }
        const visualOverrides = { ...current.visualOverrides };
        delete visualOverrides[id];
        return {
          componentThemes: { ...current.componentThemes, [id]: name },
          visualOverrides,
        };
      });
    },

    registerEventHandlers: (componentId, handlers) => {
      const id = entityIdSchema.parse(componentId);
      set((current) => ({ eventHandlers: { ...current.eventHandlers, [id]: handlers } }));
    },

    unregisterEventHandlers: (componentId) => {
      const id = entityIdSchema.parse(componentId);
      set((current) => {
        const next = { ...current.eventHandlers };
        delete next[id];
        return { eventHandlers: next };
      });
    },

    unregisterEntity: (entityId) => {
      const id = entityIdSchema.parse(entityId);
      set((current) => {
        const entities = { ...current.entities };
        const componentDefinitions = { ...current.componentDefinitions };
        const eventHandlers = { ...current.eventHandlers };
        const componentParents = { ...current.componentParents };
        const visualOverrides = { ...current.visualOverrides };
        const componentThemes = { ...current.componentThemes };
        delete entities[id];
        delete componentDefinitions[id];
        delete eventHandlers[id];
        delete componentParents[id];
        delete visualOverrides[id];
        delete componentThemes[id];
        return { entities, componentDefinitions, eventHandlers, componentParents, visualOverrides, componentThemes };
      });
    },

    setVisualOverride: (componentId, parameter, value) => {
      const id = entityIdSchema.parse(componentId);
      const key = propertyKeySchema.parse(parameter);
      set((current) => ({
        visualOverrides: {
          ...current.visualOverrides,
          [id]: { ...(current.visualOverrides[id] ?? {}), [key]: value },
        },
      }));
    },

    clearVisualOverrides: (componentId) => {
      const id = entityIdSchema.parse(componentId);
      set((current) => {
        const visualOverrides = { ...current.visualOverrides };
        delete visualOverrides[id];
        return { visualOverrides };
      });
    },

    registerLibrary: (address, library) => {
      const key = z.string().min(1).parse(address);
      set((current) => ({ libraries: { ...current.libraries, [key]: library } }));
    },

    unregisterLibrary: (address) => {
      const key = z.string().min(1).parse(address);
      set((current) => {
        const libraries = { ...current.libraries };
        delete libraries[key];
        return { libraries };
      });
    },

    registerComponentParent: (componentId, parentId) => {
      const id = entityIdSchema.parse(componentId);
      const parent = parentId === undefined ? undefined : entityIdSchema.parse(parentId);
      if (parent === id) throw new Error(`Frnl component cannot be its own parent: ${id}`);
      set((current) => ({
        componentParents: { ...current.componentParents, [id]: parent },
      }));
    },

    emit: (event) => {
      const validated = frnlEventSchema.parse(event);
      set((current) => ({ events: [...current.events, validated] }));
    },

    /**
     * registerEntity performs an idempotent upsert of declarative metadata.
     *
     * Semantic Authority Model:
     * - Declarative Metadata (authoritative from registration / props):
     *   `properties`.
     * - Runtime State (authoritative from runtime / interactions):
     *   `state` (active state is preserved across re-registrations),
     *   `events` (event history is preserved).
     */
    registerEntity: (entityId, entity) => {
      const id = entityIdSchema.parse(entityId);
      const validated = entityStateSchema.parse(entity);
      set((current) => {
        const existing = current.entities[id];
        const nextEntity: EntityState = existing
          ? {
              // Runtime state is preserved if already set
              state: existing.state,
              // Declarative metadata is merged / updated
              properties: { ...existing.properties, ...validated.properties },
            }
          : validated;
        return {
          entities: { ...current.entities, [id]: nextEntity },
        };
      });
    },

    setEntityState: (entityId, state) => {
      const id = entityIdSchema.parse(entityId);
      const nextState = stateNameSchema.parse(state);
      set((current) => {
        const entity = current.entities[id];
        if (!entity) return current;
        if (entity.state === nextState) return current;

        const previousState = entity.state;
        const entityPayload = entityStateChangedPayloadSchema.parse({
          entityId: id,
          previousState,
          state: nextState,
        });

        const newEvents: FrnlEvent[] = [
          { type: 'entity.stateChanged' as const, payload: entityPayload },
        ];

        const visualOverrides = { ...current.visualOverrides };
        delete visualOverrides[id];
        return {
          entities: { ...current.entities, [id]: { ...entity, state: nextState } },
          visualOverrides,
          events: [...current.events, ...newEvents],
        };
      });
    },

    setEntityProperty: (entityId, key, value) => {
      const id = entityIdSchema.parse(entityId);
      const property = propertyKeySchema.parse(key);
      set((current) => {
        const entity = current.entities[id];
        if (!entity) return current;
        const payload = entityPropertyChangedPayloadSchema.parse({
          entityId: id,
          key: property,
          value,
        });
        return {
          entities: {
            ...current.entities,
            [id]: { ...entity, properties: { ...entity.properties, [property]: value } },
          },
          events: [...current.events, { type: 'entity.propertyChanged' as const, payload }],
        };
      });
    },

    setEntityProperties: (entityId, properties) => {
      const id = entityIdSchema.parse(entityId);
      const validated = propertiesSchema.parse(properties);
      set((current) => {
        const entity = current.entities[id];
        if (!entity) return current;
        const newEvents: FrnlEvent[] = [];
        for (const [key, value] of Object.entries(validated)) {
          if (entity.properties[key] !== value) {
            newEvents.push({
              type: 'entity.propertyChanged' as const,
              payload: entityPropertyChangedPayloadSchema.parse({
                entityId: id,
                key,
                value,
              }),
            });
          }
        }
        return {
          entities: {
            ...current.entities,
            [id]: {
              ...entity,
              properties: { ...entity.properties, ...validated },
            },
          },
          events: [...current.events, ...newEvents],
        };
      });
    },

    triggerFlow: (flowId, componentId, trigger, payload) => {
      const fId = z.string().min(1).parse(flowId);
      const cId = entityIdSchema.parse(componentId);
      const trig = z.string().min(1).parse(trigger);
      const eventPayload = flowTriggeredPayloadSchema.parse({
        flowId: fId,
        componentId: cId,
        trigger: trig,
        payload,
      });
      set((current) => ({
        events: [
          ...current.events,
          { type: 'flow.triggered' as const, payload: eventPayload },
        ],
      }));
    }
  }));
}
