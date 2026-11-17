/**
 * Saturation & Distortion Non-Linear Transfer Curves for Web Audio WaveShaperNode
 */

export function generateSaturationCurve(
  type: 'tape' | 'tube' | 'soft_clip' | 'hard_clip' | 'foldback',
  drive: number = 1.5,
  samples: number = 4096
): Float32Array {
  const curve = new Float32Array(samples);
  const k = Math.max(0.1, drive);
  const deg = Math.PI / 180;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1; // -1 to +1

    let y = x;
    switch (type) {
      case 'soft_clip': {
        // Smooth cubic soft clipping
        const absX = Math.abs(x * k);
        if (absX < 1) {
          y = (x * k) - ((x * k) ** 3) / 3;
        } else {
          y = x > 0 ? 2 / 3 : -2 / 3;
        }
        y *= 1.2;
        break;
      }
      case 'tube': {
        // Asymmetrical soft tube saturation (even harmonics)
        const inVal = x * k;
        if (inVal > 0) {
          y = 1 - Math.exp(-inVal);
        } else {
          y = -(1 - Math.exp(inVal * 0.8));
        }
        y *= 1.1;
        break;
      }
      case 'hard_clip': {
        // Hard threshold ceiling
        const threshold = 1.0 / Math.max(1, k);
        y = Math.max(-threshold, Math.min(threshold, x)) * k;
        break;
      }
      case 'foldback': {
        // Sine wave wavefolding distortion
        y = Math.sin(x * k * Math.PI * 0.5);
        break;
      }
      case 'tape':
      default: {
        // Sigmoidal hyperbolic tangent (warm analog tape compression)
        y = Math.tanh(x * k * 1.2);
        break;
      }
    }

    curve[i] = Math.max(-1, Math.min(1, y));
  }

  return curve;
}
