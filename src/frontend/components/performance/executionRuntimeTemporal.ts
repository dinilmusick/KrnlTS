import type { ExecutionNodeHandler, ExecutionPayload } from './executionRuntimeTypes.js';

export function createClockDurationHandler(durationMs: number): ExecutionNodeHandler {
  return (context) => {
    if (!Number.isFinite(durationMs) || durationMs < 0) return { status: 'FAILED', error: new Error('Duration must be a non-negative finite number') };
    const transport = context.transport;
    if (!transport) return { status: 'FAILED', error: new Error(`Temporal node ${context.node.id} requires a Kone transport`) };

    const start = transport.getState().elapsedMs;
    let unsubscribe: (() => void) | undefined;
    let resolveCompletion!: (payload?: ExecutionPayload) => void;
    const completion = new Promise<ExecutionPayload | void>((resolve) => { resolveCompletion = resolve; });
    const finish = () => { unsubscribe?.(); unsubscribe = undefined; resolveCompletion(context.payload); };

    if (durationMs === 0) finish();
    else {
      unsubscribe = transport.subscribe((state) => { if (state.elapsedMs - start >= durationMs) finish(); });
      if (transport.getState().transport === 'stopped') transport.dispatch('play');
    }

    return {
      status: 'WAITING',
      controller: {
        pause: () => transport.dispatch('pause'),
        resume: () => transport.dispatch('play'),
        stop: () => { unsubscribe?.(); unsubscribe = undefined; transport.dispatch('stop'); transport.dispatch('reset'); },
      },
      completion,
    };
  };
}

export function createMusicalDurationHandler(durationBeats: number): ExecutionNodeHandler {
  return (context) => {
    if (!Number.isFinite(durationBeats) || durationBeats < 0) return { status: 'FAILED', error: new Error('Musical duration must be a non-negative finite number') };
    const transport = context.transport;
    if (!transport) return { status: 'FAILED', error: new Error(`Musical node ${context.node.id} requires a Section transport`) };

    const startBeat = transport.getState().beat;
    let unsubscribe: (() => void) | undefined;
    let resolveCompletion!: (payload?: ExecutionPayload) => void;
    const completion = new Promise<ExecutionPayload | void>((resolve) => { resolveCompletion = resolve; });
    const finish = () => { unsubscribe?.(); unsubscribe = undefined; resolveCompletion(context.payload); };

    if (durationBeats === 0) finish();
    else {
      unsubscribe = transport.subscribe((state) => { if (state.beat - startBeat >= durationBeats) finish(); });
      if (transport.getState().transport === 'stopped') transport.dispatch('play');
    }

    return {
      status: 'WAITING',
      controller: {
        pause: () => transport.dispatch('pause'),
        resume: () => transport.dispatch('play'),
        stop: () => { unsubscribe?.(); unsubscribe = undefined; transport.dispatch('stop'); transport.dispatch('reset'); },
      },
      completion,
    };
  };
}

export function registerDefaultTemporalHandlers(runtime: import('./executionRuntime.js').ExecutionRuntime): void {
  runtime.registerNodeHandler('interlude', (context) => {
    const data = context.node.data as { execution?: { durationMs?: unknown }; durationMs?: unknown } | undefined;
    const durationMs = Number(data?.execution?.durationMs ?? data?.durationMs ?? 0);
    return createClockDurationHandler(durationMs)(context);
  });
  runtime.registerNodeHandler('midi-sample', (context) => {
    const data = context.node.data as {
      midiSample?: { duration?: { beats?: unknown } };
      execution?: { duration?: { beats?: unknown } };
    } | undefined;
    const duration = data?.midiSample?.duration ?? data?.execution?.duration;
    const beats = Number(duration?.beats ?? 0);
    return createMusicalDurationHandler(beats)(context);
  });
}
