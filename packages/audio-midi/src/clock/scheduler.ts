export interface ClockScheduler {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export const systemClockScheduler: ClockScheduler = {
  now: () => typeof performance !== 'undefined' ? performance.now() : Date.now(),
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};
