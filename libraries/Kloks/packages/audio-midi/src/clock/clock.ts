import { systemClockScheduler, type ClockScheduler } from './scheduler.js';

export type ClockRunState = 'stopped' | 'running' | 'paused';
export type MissedTickPolicy = 'catch-up' | 'skip';

export interface ClockPosition {
  state: ClockRunState;
  tempo: number;
  resolution: number;
  beat: number;
  bar: number;
  beatInBar: number;
  tick: number;
  subdivision: number;
  elapsedMs: number;
  timeSignature: readonly [number, number];
}

export interface ClockTick extends ClockPosition {
  scheduledBeat: number;
  emittedAt: number;
  missedTicks: number;
}

export interface ClockOptions {
  tempo?: number;
  resolution?: number;
  timeSignature?: readonly [number, number];
  scheduler?: ClockScheduler;
  missedTickPolicy?: MissedTickPolicy;
  maxCatchUpTicks?: number;
}

export type ClockListener = (position: ClockPosition) => void;
export type ClockTickListener = (event: ClockTick) => void;

export class ClockService {
  private readonly scheduler: ClockScheduler;
  private readonly missedTickPolicy: MissedTickPolicy;
  private readonly maxCatchUpTicks: number;
  private state: ClockRunState = 'stopped';
  private tempo: number;
  private resolution: number;
  private signature: readonly [number, number];
  private anchorTime = 0;
  private anchorBeat = 0;
  private elapsedAtAnchor = 0;
  private lastTick = 0;
  private timer: unknown = null;
  private disposed = false;
  private readonly listeners = new Set<ClockListener>();
  private readonly tickListeners = new Set<ClockTickListener>();

  constructor(options: ClockOptions = {}) {
    this.scheduler = options.scheduler ?? systemClockScheduler;
    this.missedTickPolicy = options.missedTickPolicy ?? 'catch-up';
    this.maxCatchUpTicks = options.maxCatchUpTicks ?? 1024;
    if (!Number.isInteger(this.maxCatchUpTicks) || this.maxCatchUpTicks < 1) throw new RangeError('maxCatchUpTicks must be a positive integer');
    this.tempo = this.validateTempo(options.tempo ?? 120);
    this.resolution = this.validateResolution(options.resolution ?? 24);
    this.signature = options.timeSignature ?? [4, 4];
    this.validateSignature(this.signature);
  }

  getSnapshot(): ClockPosition {
    const now = this.scheduler.now();
    const elapsedMs = this.state === 'running'
      ? this.elapsedAtAnchor + Math.max(0, now - this.anchorTime)
      : this.elapsedAtAnchor;
    const beat = this.state === 'running'
      ? this.anchorBeat + (Math.max(0, now - this.anchorTime) * this.tempo) / 60000
      : this.anchorBeat;
    const beatsPerBar = this.signature[0] * (4 / this.signature[1]);
    const absoluteBeat = Math.max(0, beat);
    const bar = Math.floor(absoluteBeat / beatsPerBar) + 1;
    const beatInBar = (absoluteBeat % beatsPerBar) + 1;
    const tick = Math.floor(absoluteBeat * this.resolution + 1e-9);
    return {
      state: this.state, tempo: this.tempo, resolution: this.resolution,
      beat: absoluteBeat, bar, beatInBar, tick,
      subdivision: tick % this.resolution,
      elapsedMs, timeSignature: this.signature,
    };
  }

  start(): void {
    this.assertActive();
    if (this.state === 'running') return;
    this.anchorTime = this.scheduler.now();
    this.state = 'running';
    this.lastTick = Math.floor(this.anchorBeat * this.resolution + 1e-9);
    this.publish();
    this.scheduleNext();
  }

  stop(): void {
    this.assertActive();
    if (this.state === 'running') this.captureRunningPosition();
    this.cancelTimer();
    this.state = 'stopped';
    this.publish();
  }

  pause(): void {
    this.assertActive();
    if (this.state !== 'running') return;
    this.captureRunningPosition();
    this.cancelTimer();
    this.state = 'paused';
    this.publish();
  }

  resume(): void {
    this.assertActive();
    if (this.state === 'paused') this.start();
  }

  reset(): void {
    this.assertActive();
    this.cancelTimer();
    this.state = 'stopped';
    this.anchorBeat = 0;
    this.elapsedAtAnchor = 0;
    this.lastTick = 0;
    this.publish();
  }

  setTempo(tempo: number): void {
    this.assertActive();
    const next = this.validateTempo(tempo);
    if (next === this.tempo) return;
    if (this.state === 'running') this.captureRunningPosition();
    this.tempo = next;
    if (this.state === 'running') {
      this.anchorTime = this.scheduler.now();
      this.scheduleNext();
    }
    this.publish();
  }

  setResolution(resolution: number): void {
    this.assertActive();
    this.resolution = this.validateResolution(resolution);
    this.lastTick = Math.floor(this.getSnapshot().beat * this.resolution + 1e-9);
    if (this.state === 'running') this.scheduleNext();
    this.publish();
  }

  setTimeSignature(numerator: number, denominator: number): void {
    this.assertActive();
    const next = [numerator, denominator] as const;
    this.validateSignature(next);
    this.signature = next;
    this.publish();
  }

  subscribe(listener: ClockListener): () => void {
    this.assertActive();
    this.listeners.add(listener);
    try { listener(this.getSnapshot()); } catch { /* isolate subscriber failures */ }
    return () => this.listeners.delete(listener);
  }

  onTick(listener: ClockTickListener): () => void {
    this.assertActive();
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancelTimer();
    this.listeners.clear();
    this.tickListeners.clear();
    this.state = 'stopped';
    this.disposed = true;
  }

  private captureRunningPosition(): void {
    const now = this.scheduler.now();
    const delta = Math.max(0, now - this.anchorTime);
    this.anchorBeat += (delta * this.tempo) / 60000;
    this.elapsedAtAnchor += delta;
    this.anchorTime = now;
    this.emitDueTicks(now);
  }

  private scheduleNext(): void {
    this.cancelTimer();
    if (this.state !== 'running' || this.disposed) return;
    const beat = this.getSnapshot().beat;
    const nextTick = Math.floor(beat * this.resolution + 1e-9) + 1;
    const nextBeat = nextTick / this.resolution;
    const delay = Math.max(0, ((nextBeat - beat) * 60000) / this.tempo);
    this.timer = this.scheduler.setTimeout(() => {
      this.timer = null;
      this.emitDueTicks(this.scheduler.now());
      this.scheduleNext();
    }, Math.max(1, delay));
  }

  private emitDueTicks(now: number): void {
    const position = this.getSnapshot();
    const due = position.tick - this.lastTick;
    if (due <= 0) return;
    const count = this.missedTickPolicy === 'skip'
      ? 1
      : Math.min(due, this.maxCatchUpTicks);
    const first = this.missedTickPolicy === 'skip'
      ? position.tick
      : Math.max(this.lastTick + 1, position.tick - count + 1);
    for (let tick = first; tick <= position.tick; tick += 1) {
      const scheduledBeat = tick / this.resolution;
      const missedTicks = tick === position.tick ? Math.max(0, due - count) : 0;
      const event = { ...position, tick, subdivision: tick % this.resolution, scheduledBeat, emittedAt: now, missedTicks };
      this.tickListeners.forEach((listener) => {
        try { listener(event); } catch { /* isolate subscriber failures */ }
      });
    }
    this.lastTick = position.tick;
  }

  private publish(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => {
      try { listener(snapshot); } catch { /* isolate subscriber failures */ }
    });
  }

  private cancelTimer(): void {
    if (this.timer !== null) this.scheduler.clearTimeout(this.timer);
    this.timer = null;
  }

  private validateTempo(value: number): number {
    if (!Number.isFinite(value) || value <= 0 || value > 1000) throw new RangeError('Tempo must be > 0 and <= 1000 BPM');
    return value;
  }

  private validateResolution(value: number): number {
    if (!Number.isInteger(value) || value < 1 || value > 960) throw new RangeError('Resolution must be an integer from 1 to 960');
    return value;
  }

  private validateSignature(value: readonly [number, number]): void {
    if (!Number.isInteger(value[0]) || value[0] < 1 || value[0] > 32 ||
        ![1, 2, 4, 8, 16, 32].includes(value[1])) throw new RangeError('Invalid time signature');
  }

  private assertActive(): void {
    if (this.disposed) throw new Error('ClockService has been disposed');
  }
}
