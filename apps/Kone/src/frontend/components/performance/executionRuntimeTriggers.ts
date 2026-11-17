import type { MidiMessage } from '@ultrst-armada/kloks/midi';
import type { OscMessage } from '@ultrst-armada/kloks/osc';
import type { ExecutionPayload } from './executionRuntimeTypes.js';
import type { ExecutionRuntime } from './executionRuntime.js';

export interface ExecutionTriggerBus {
  trigger(nodeId: string, payload?: ExecutionPayload): Promise<void>;
  subscribe(nodeId: string, listener: (payload: ExecutionPayload) => void): () => void;
}

export function createExecutionTriggerBus(): ExecutionTriggerBus {
  const listeners = new Map<string, Set<(payload: ExecutionPayload) => void>>();
  return {
    async trigger(nodeId, payload = {}) {
      listeners.get(nodeId)?.forEach((listener) => listener(payload));
    },
    subscribe(nodeId, listener) {
      const set = listeners.get(nodeId) ?? new Set<(payload: ExecutionPayload) => void>();
      set.add(listener); listeners.set(nodeId, set);
      return () => { set.delete(listener); if (!set.size) listeners.delete(nodeId); };
    },
  };
}

export function connectMidiTrigger(
  service: { subscribe(listener: (message: MidiMessage, deviceId: string) => void): () => void },
  bus: ExecutionTriggerBus,
  nodeId: string,
  predicate: (message: MidiMessage, deviceId: string) => boolean = () => true,
): () => void {
  return service.subscribe((message, deviceId) => {
    if (predicate(message, deviceId)) void bus.trigger(nodeId, { source: 'midi', value: message, deviceId });
  });
}

export function connectOscTrigger(
  service: { subscribe(pattern: string, listener: (message: OscMessage, endpointId: string) => void): () => void },
  bus: ExecutionTriggerBus,
  nodeId: string,
  pattern: string,
): () => void {
  return service.subscribe(pattern, (message, endpointId) => {
    void bus.trigger(nodeId, { source: 'osc', value: message, endpointId });
  });
}


export function bindTriggerToExecution(
  runtime: ExecutionRuntime,
  bus: ExecutionTriggerBus,
  graphId: string,
  nodeId: string,
): () => void {
  return bus.subscribe(nodeId, (payload) => {
    void runtime.trigger(graphId, [nodeId], payload);
  });
}
