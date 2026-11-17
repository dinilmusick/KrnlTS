/**
 * @file events.ts
 * @description Skipo Universal Real-Time Event Bus. Facilitates real-time event broadcasting and streaming.
 */

export interface RealtimeWorkspaceEvent {
  id: string;
  timestamp: number;
  userId?: string;
  workspaceId?: string;
  source: 'api' | 'ui';
  method?: string;
  endpoint?: string;
  action:
    | 'DOCUMENT_CREATED'
    | 'DOCUMENT_UPDATED'
    | 'DOCUMENT_DELETED'
    | 'CATEGORY_CREATED'
    | 'CATEGORY_UPDATED'
    | 'CATEGORY_DELETED'
    | 'GRAPH_UPDATED'
    | 'BIOME_CHANGED'
    | 'WORKSPACE_UPDATED'
    | 'WORKSPACE_SWITCHED'
    | 'GENERIC_ACTION'
    | string;
  details?: string;
  payload?: any;
}

export type EventListener = (event: RealtimeWorkspaceEvent) => void;

interface RealtimeBusStore {
  buffer: RealtimeWorkspaceEvent[];
  listeners: Set<EventListener>;
}

// Preserve state across HMR reloads in development
const globalStore = globalThis as unknown as {
  __skipo_realtime_store?: RealtimeBusStore;
};

if (!globalStore.__skipo_realtime_store) {
  globalStore.__skipo_realtime_store = {
    buffer: [],
    listeners: new Set(),
  };
}

const store = globalStore.__skipo_realtime_store;
const MAX_BUFFER_SIZE = 200;

/**
 * Publish a new event to all active real-time subscribers and store in buffer.
 */
export function publishRealtimeEvent(
  eventInput: Omit<RealtimeWorkspaceEvent, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: number;
  }
): RealtimeWorkspaceEvent {
  const event: RealtimeWorkspaceEvent = {
    ...eventInput,
    id: eventInput.id || `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: eventInput.timestamp || Date.now(),
    source: eventInput.source || 'api',
  };

  // Keep a rolling buffer of events for catchup polling
  store.buffer.push(event);
  if (store.buffer.length > MAX_BUFFER_SIZE) {
    store.buffer.splice(0, store.buffer.length - MAX_BUFFER_SIZE);
  }

  // Notify active listeners (e.g. SSE connections)
  for (const listener of store.listeners) {
    try {
      listener(event);
    } catch (err) {
      console.error('[RealtimeBus] Listener invocation error:', err);
    }
  }

  return event;
}

/**
 * Subscribe to real-time events. Returns an unsubscribe function.
 */
export function subscribeRealtimeEvents(listener: EventListener): () => void {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

/**
 * Retrieve recent events since a specified timestamp, optionally filtered by workspaceId or userId.
 */
export function getRecentEvents(
  sinceTimestamp?: number,
  workspaceId?: string,
  userId?: string
): RealtimeWorkspaceEvent[] {
  const since = typeof sinceTimestamp === 'number' && !isNaN(sinceTimestamp) ? sinceTimestamp : 0;
  return store.buffer.filter((e) => {
    if (e.timestamp <= since) return false;
    if (workspaceId && e.workspaceId && e.workspaceId !== workspaceId) return false;
    if (userId && e.userId && e.userId !== userId) return false;
    return true;
  });
}
