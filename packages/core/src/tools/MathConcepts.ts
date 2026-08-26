/**
 * @file MathConcepts.ts
 * @role component
 * @description Polymorphic generic templates for vector math, statistics, range mapping, and clamping.
 */

/**
 * Clamps a numeric value between min and max bounds.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Linear interpolation between start and end by factor t (0 <= t <= 1).
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Maps a number from an input range [inMin, inMax] to an output range [outMin, outMax].
 */
export function mapRange(
  val: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return outMin;
  const normalized = (val - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

/**
 * Rounds a number to a specified number of decimal places.
 */
export function roundTo(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Applies an element-wise arithmetic operation between two numeric vectors.
 */
export function vectorOp<T extends number[]>(
  a: T,
  b: T,
  op: (x: number, y: number) => number
): T {
  const len = Math.min(a.length, b.length);
  const result: number[] = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = op(a[i], b[i]);
  }
  return result as T;
}

/**
 * Calculates summary statistics for an array of numbers.
 */
export function stats(values: number[]): {
  count: number;
  min: number;
  max: number;
  sum: number;
  mean: number;
  median: number;
  stdDev: number;
} {
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, sum: 0, mean: 0, median: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  let median = 0;
  if (count % 2 === 1) {
    median = sorted[Math.floor(count / 2)];
  } else {
    const mid = count / 2;
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  }

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    count,
    min,
    max,
    sum,
    mean: roundTo(mean, 4),
    median: roundTo(median, 4),
    stdDev: roundTo(stdDev, 4)
  };
}
