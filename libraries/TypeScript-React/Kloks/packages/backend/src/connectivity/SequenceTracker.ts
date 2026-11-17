/**
 * @file SequenceTracker.ts
 * @description Monotonic sequence ordering detector identifying duplicates, out-of-order items, and sequence gaps.
 */

export interface SequenceCheckResult {
  valid: boolean;
  isDuplicate: boolean;
  isOutOfOrder: boolean;
  hasGap: boolean;
  expected: number;
  received: number;
}

export type GapHandler = (streamKey: string, expected: number, received: number) => Promise<void> | void;

export class SequenceTracker {
  private lastSequences = new Map<string, number>();
  private pausedStreams = new Set<string>();
  private gapHandlers: GapHandler[] = [];

  record(streamKey: string, sequence: number): SequenceCheckResult {
    const last = this.lastSequences.get(streamKey) ?? 0;
    const expected = last + 1;

    if (sequence <= last) {
      return {
        valid: false,
        isDuplicate: sequence === last,
        isOutOfOrder: sequence < last,
        hasGap: false,
        expected,
        received: sequence,
      };
    }

    if (sequence > expected) {
      this.pause(streamKey);
      this.triggerGap(streamKey, expected, sequence);
      return {
        valid: false,
        isDuplicate: false,
        isOutOfOrder: false,
        hasGap: true,
        expected,
        received: sequence,
      };
    }

    this.lastSequences.set(streamKey, sequence);
    return {
      valid: true,
      isDuplicate: false,
      isOutOfOrder: false,
      hasGap: false,
      expected,
      received: sequence,
    };
  }

  onGap(handler: GapHandler): () => void {
    this.gapHandlers.push(handler);
    return () => {
      const idx = this.gapHandlers.indexOf(handler);
      if (idx !== -1) this.gapHandlers.splice(idx, 1);
    };
  }

  private triggerGap(streamKey: string, expected: number, received: number): void {
    for (const h of this.gapHandlers) {
      try {
        h(streamKey, expected, received);
      } catch (err) {
        console.error(`[SequenceTracker] Error in gap handler for ${streamKey}:`, err);
      }
    }
  }

  pause(streamKey: string): void {
    this.pausedStreams.add(streamKey);
  }

  resume(streamKey: string, authoritativeSequence?: number): void {
    this.pausedStreams.delete(streamKey);
    if (authoritativeSequence !== undefined) {
      this.lastSequences.set(streamKey, authoritativeSequence);
    }
  }

  isPaused(streamKey: string): boolean {
    return this.pausedStreams.has(streamKey);
  }

  getLastSequence(streamKey: string): number {
    return this.lastSequences.get(streamKey) ?? 0;
  }

  reset(streamKey?: string): void {
    if (streamKey) {
      this.lastSequences.delete(streamKey);
      this.pausedStreams.delete(streamKey);
    } else {
      this.lastSequences.clear();
      this.pausedStreams.clear();
    }
  }
}
