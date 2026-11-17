// ══════════════════════════════════════════════════════════════════════════════════════════
// QUANTIZE & LAUNCH TIMING ENGINE (Ableton / Bitwig style)
// ══════════════════════════════════════════════════════════════════════════════════════════
import { QuantizeDivision } from "../types/index.js";
import { AudioConcepts } from '../AudioConcepts';

export function getDivisionBeatLength(division: QuantizeDivision): number {
  return AudioConcepts.getDivisionBeatLength(division);
}

export function calculateNextQuantizeBeat(
  currentBeat: number,
  division: QuantizeDivision,
  beatsPerBar = 4
): number {
  return AudioConcepts.calculateNextQuantizeBeat(currentBeat, division, beatsPerBar);
}

export function formatBeatToBarBeat(beat: number, beatsPerBar = 4): string {
  return AudioConcepts.formatBeatToBarBeat(beat, beatsPerBar);
}

export function formatQuantizeDivisionLabel(division: QuantizeDivision): string {
  return AudioConcepts.formatQuantizeDivisionLabel(division);
}
