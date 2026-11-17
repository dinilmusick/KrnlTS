export function calculateCompressionCurve(
  thresholdDb: number,
  ratio: number,
  kneeDb: number = 5,
  makeupDb: number = 0,
  minInDb: number = -60,
  maxInDb: number = 0,
  pointsCount: number = 40
): { inDb: number; outDb: number }[] {
  const points: { inDb: number; outDb: number }[] = [];
  const step = (maxInDb - minInDb) / (pointsCount - 1);

  for (let i = 0; i < pointsCount; i++) {
    const inDb = minInDb + i * step;
    let outDb = inDb;

    if (inDb > thresholdDb + kneeDb / 2) {
      outDb = thresholdDb + (inDb - thresholdDb) / Math.max(1, ratio);
    } else if (inDb > thresholdDb - kneeDb / 2 && kneeDb > 0) {
      // Soft knee interpolation
      const x = inDb - thresholdDb + kneeDb / 2;
      outDb = inDb + ((1 / Math.max(1, ratio) - 1) * (x * x)) / (2 * kneeDb);
    }

    points.push({ inDb, outDb: Math.min(0, outDb + makeupDb) });
  }

  return points;
}
