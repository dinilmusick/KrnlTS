/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * AudioConcepts: Universal Timing, Quantization, Note, Frequency & Gain Utilities
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * @role component
 */

import { QuantizeDivision } from './types/legacyTypes';

export function getDivisionBeatLength(division: QuantizeDivision): number {
  switch (division) {
    case 'none':
      return 0;
    case '1/16':
      return 0.25;
    case '1/8':
      return 0.5;
    case '1/4':
      return 1.0;
    case '1/2':
      return 2.0;
    case '1_bar':
      return 4.0;
    case '2_bars':
      return 8.0;
    case '4_bars':
      return 16.0;
    default:
      return 4.0;
  }
}

export function calculateNextQuantizeBeat(
  currentBeat: number,
  division: QuantizeDivision,
  beatsPerBar = 4
): number {
  const divBeats = getDivisionBeatLength(division);
  if (divBeats <= 0) {
    return currentBeat;
  }
  const epsilon = 0.001;
  const nextDivisionIndex = Math.floor((currentBeat + epsilon) / divBeats) + 1;
  return nextDivisionIndex * divBeats;
}

export function formatBeatToBarBeat(beat: number, beatsPerBar = 4): string {
  const safeBeat = Math.max(0, beat);
  const bar = Math.floor(safeBeat / beatsPerBar) + 1;
  const beatInBar = (safeBeat % beatsPerBar) + 1;
  return `Bar ${bar}, Beat ${beatInBar.toFixed(1)}`;
}

export function formatQuantizeDivisionLabel(division: QuantizeDivision): string {
  switch (division) {
    case 'none':
      return 'Off (Instant)';
    case '1/16':
      return '1/16 (16th Note)';
    case '1/8':
      return '1/8 (8th Note)';
    case '1/4':
      return '1/4 (1 Beat)';
    case '1/2':
      return '1/2 (2 Beats)';
    case '1_bar':
      return '1 Bar (Downbeat)';
    case '2_bars':
      return '2 Bars';
    case '4_bars':
      return '4 Bars';
    default:
      return '1 Bar';
  }
}

export function linearToDb(gain: number): number {
  if (gain <= 0.0001) return -96;
  return 20 * Math.log10(gain);
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export const AudioConcepts = {
  getDivisionBeatLength,
  calculateNextQuantizeBeat,
  formatBeatToBarBeat,
  formatQuantizeDivisionLabel,
  linearToDb,
  dbToLinear,
  midiToFrequency,
};
