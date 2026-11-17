import { EqBandConfig } from '@kloks/state-graph';

export function calculateEqCurvePoints(bands: EqBandConfig[], numPoints: number = 60): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const minF = 20;
  const maxF = 20000;

  for (let i = 0; i < numPoints; i++) {
    const frac = i / (numPoints - 1);
    // Logarithmic frequency scale
    const freq = minF * Math.pow(maxF / minF, frac);

    let totalGainDb = 0;
    bands.forEach((b) => {
      if (!b.enabled) return;
      const ratio = freq / b.frequency;
      if (b.type === 'peaking') {
        const bandwidth = 1 / Math.max(0.1, b.q);
        const dist = Math.abs(Math.log2(ratio));
        const factor = Math.exp(-0.5 * Math.pow(dist / (bandwidth * 0.5), 2));
        totalGainDb += b.gain * factor;
      } else if (b.type === 'lowshelf') {
        if (freq < b.frequency) {
          totalGainDb += b.gain;
        } else if (freq < b.frequency * 2) {
          const t = (b.frequency * 2 - freq) / b.frequency;
          totalGainDb += b.gain * t;
        }
      } else if (b.type === 'highshelf') {
        if (freq > b.frequency) {
          totalGainDb += b.gain;
        } else if (freq > b.frequency * 0.5) {
          const t = (freq - b.frequency * 0.5) / (b.frequency * 0.5);
          totalGainDb += b.gain * t;
        }
      }
    });

    points.push({ x: frac, y: Math.max(-18, Math.min(18, totalGainDb)) });
  }

  return points;
}
