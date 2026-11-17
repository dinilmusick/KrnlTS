import { createClockService, type ClockOptions, type ClockPosition } from '@ultrst-armada/kloks/clock';

export type KoneTransportSignal = 'play' | 'pause' | 'stop' | 'reset';

export interface KoneTransportState extends ClockPosition {
  transport: 'stopped' | 'running' | 'paused';
}

export type KoneTransportListener = (state: KoneTransportState) => void;

export interface KoneTransport {
  readonly clock: ReturnType<typeof createClockService>;
  getState(): KoneTransportState;
  dispatch(signal: KoneTransportSignal): void;
  subscribe(listener: KoneTransportListener): () => void;
  setTempo(tempo: number): void;
  setResolution(resolution: number): void;
  setTimeSignature(numerator: number, denominator: number): void;
  dispose(): void;
}

export function createKoneTransport(options: ClockOptions = {}): KoneTransport {
  const clock = createClockService(options);
  const listeners = new Set<KoneTransportListener>();
  let unsubscribe: (() => void) | undefined;

  const publish = (position: ClockPosition) => {
    const state: KoneTransportState = { ...position, transport: position.state };
    listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Isolate UI/execution subscribers from the musical clock.
      }
    });
  };

  unsubscribe = clock.subscribe(publish);

  return {
    clock,
    getState: () => {
      const position = clock.getSnapshot();
      return { ...position, transport: position.state };
    },
    dispatch: (signal) => {
      switch (signal) {
        case 'play':
          clock.start();
          break;
        case 'pause':
          clock.pause();
          break;
        case 'stop':
          clock.stop();
          break;
        case 'reset':
          clock.reset();
          break;
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener({ ...clock.getSnapshot(), transport: clock.getSnapshot().state });
      return () => listeners.delete(listener);
    },
    setTempo: (tempo) => clock.setTempo(tempo),
    setResolution: (resolution) => clock.setResolution(resolution),
    setTimeSignature: (numerator, denominator) => clock.setTimeSignature(numerator, denominator),
    dispose: () => {
      unsubscribe?.();
      unsubscribe = undefined;
      listeners.clear();
      clock.dispose();
    },
  };
}
