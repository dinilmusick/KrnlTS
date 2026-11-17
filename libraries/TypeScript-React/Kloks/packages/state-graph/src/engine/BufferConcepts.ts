/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * BufferConcepts: Rolling Ring Buffer Window Math & Retrospective Cycle Tolerances
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * @role component
 */

export interface BufferCycleCalculation {
  bufferBeats: number;
  bufferBars: number;
  currentCycleIndex: number;
  beatInCurrentCycle: number;
  cycleProgress: number;
  isInPostToleranceZone: boolean;
  isInPreToleranceZone: boolean;
  targetedCycleIndex: number;
}

export const BufferConcepts = {
  /**
   * Calculates current rolling cycle metrics, progress, and tolerance target cycle index.
   */
  calculateCycleMetrics(
    currentBeat: number,
    bufferBars = 4,
    beatsPerBar = 4,
    tolBeforeBeats = 2.0,
    tolAfterBeats = 2.0
  ): BufferCycleCalculation {
    const bufferBeats = bufferBars * beatsPerBar;
    const currentCycleIndex = Math.floor(currentBeat / bufferBeats);
    const beatInCurrentCycle = currentBeat % bufferBeats;
    const cycleProgress = Math.min(1, Math.max(0, beatInCurrentCycle / bufferBeats));

    const isInPostToleranceZone = beatInCurrentCycle <= tolAfterBeats && currentCycleIndex > 0;
    const isInPreToleranceZone = beatInCurrentCycle >= (bufferBeats - tolBeforeBeats);

    let targetedCycleIndex = currentCycleIndex;
    if (isInPostToleranceZone) {
      targetedCycleIndex = currentCycleIndex - 1;
    }

    return {
      bufferBeats,
      bufferBars,
      currentCycleIndex,
      beatInCurrentCycle,
      cycleProgress,
      isInPostToleranceZone,
      isInPreToleranceZone,
      targetedCycleIndex,
    };
  },

  /**
   * Derives cycle start and end beat boundaries for a given cycle index.
   */
  getCycleBoundaries(cycleIndex: number, bufferBars = 4, beatsPerBar = 4): { startBeat: number; endBeat: number } {
    const bufferBeats = bufferBars * beatsPerBar;
    const startBeat = cycleIndex * bufferBeats;
    const endBeat = startBeat + bufferBeats;
    return { startBeat, endBeat };
  },
};
