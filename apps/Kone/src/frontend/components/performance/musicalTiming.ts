export const BEAT_FRACTIONS_PER_BEAT = 64;
export const BEATS_PER_BAR = 4;
export const BEAT_FRACTIONS_PER_BAR = BEAT_FRACTIONS_PER_BEAT * BEATS_PER_BAR;

export interface MusicalDuration {
  bars: number;
  beats: number;
  beatFractions: number;
}

export function durationFromBars(bars: number): MusicalDuration {
  const normalizedBars = Math.max(0, bars);
  return {
    bars: normalizedBars,
    beats: normalizedBars * BEATS_PER_BAR,
    beatFractions: normalizedBars * BEAT_FRACTIONS_PER_BAR,
  };
}

export function durationFromBeatFractions(beatFractions: number): MusicalDuration {
  const fractions = Math.max(0, Math.round(beatFractions));
  return {
    bars: fractions / BEAT_FRACTIONS_PER_BAR,
    beats: fractions / BEAT_FRACTIONS_PER_BEAT,
    beatFractions: fractions,
  };
}

export function snapBeatFraction(value: number): number {
  return Math.max(0, Math.round(value));
}
