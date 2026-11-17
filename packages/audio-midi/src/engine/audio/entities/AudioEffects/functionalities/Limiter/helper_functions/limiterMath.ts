export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
  return linear > 0.00001 ? 20 * Math.log10(linear) : -100;
}
